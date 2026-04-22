/**
 * Modbus Relay Server
 * Run this on any machine that can reach the OT devices (192.168.11.x).
 * It accepts HTTP POST requests from the Next.js app and performs the
 * actual TCP probe on behalf of the app.
 *
 * Usage: node relay-server.js
 * Default port: 4502
 */

const http = require("http");
const net = require("net");

const RELAY_PORT = process.env.RELAY_PORT || 4502;

function buildModbusRequest(unitId, fc, addr, qty) {
  const buf = Buffer.alloc(12);
  buf.writeUInt16BE(0x0001, 0);
  buf.writeUInt16BE(0x0000, 2);
  buf.writeUInt16BE(6, 4);
  buf.writeUInt8(unitId, 6);
  buf.writeUInt8(fc, 7);
  buf.writeUInt16BE(addr, 8);
  buf.writeUInt16BE(qty, 10);
  return buf;
}

function probeModbusTCP(ip, port) {
  const events = [];
  const result = {
    connected: false,
    holdingRegistersReadable: false,
    inputRegistersReadable: false,
    registerCount: 0,
    events,
  };

  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(5000);
    let resolved = false;

    const done = () => {
      if (!resolved) {
        resolved = true;
        socket.destroy();
        resolve(result);
      }
    };

    socket.on("error", done);
    socket.on("timeout", done);

    socket.connect(port, ip, () => {
      result.connected = true;
      events.push({
        ts: new Date().toISOString(),
        type: "connect",
        code: "TCP_OK",
        target: `${ip}:${port}`,
        message: `TCP connection established to ${ip}:${port}`,
      });

      socket.write(buildModbusRequest(1, 0x03, 0, 10));
      let buf = Buffer.alloc(0);

      socket.on("data", (chunk) => {
        buf = Buffer.concat([buf, chunk]);
        if (buf.length >= 8) {
          const funcCode = buf[7];
          if (funcCode === 0x03) {
            result.holdingRegistersReadable = true;
            const byteCount = buf.length > 8 ? buf[8] : 0;
            result.registerCount = Math.floor(byteCount / 2);
            events.push({
              ts: new Date().toISOString(),
              type: "probe",
              code: "FC03_READABLE",
              target: `${ip}:${port}`,
              message: `Holding registers accessible without auth — ${result.registerCount} register(s) exposed`,
            });
          } else if (funcCode === 0x04) {
            result.inputRegistersReadable = true;
            events.push({
              ts: new Date().toISOString(),
              type: "probe",
              code: "FC04_READABLE",
              target: `${ip}:${port}`,
              message: `Input registers readable without authentication`,
            });
          } else if (funcCode & 0x80) {
            const exCode = buf.length > 8 ? buf[8] : 0;
            events.push({
              ts: new Date().toISOString(),
              type: "exception",
              code: `MODBUS_EX_${exCode}`,
              target: `${ip}:${port}`,
              message: `Modbus slave responded — exception code ${exCode}`,
            });
          }
          done();
        }
      });

      setTimeout(done, 4000);
    });
  });
}

async function checkPortOpen(ip, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(3000);
    socket.on("connect", () => { socket.destroy(); resolve(true); });
    socket.on("error", () => resolve(false));
    socket.on("timeout", () => { socket.destroy(); resolve(false); });
    socket.connect(port, ip);
  });
}

async function probeNetwork(ip) {
  const ports = [21, 22, 23, 25, 80, 443, 502, 8080, 8443];
  const events = [];
  const results = await Promise.all(ports.map((p) => checkPortOpen(ip, p)));
  const openPorts = [];

  ports.forEach((port, i) => {
    if (results[i]) {
      openPorts.push(port);
      events.push({
        ts: new Date().toISOString(),
        type: "port_scan",
        code: `PORT_${port}_OPEN`,
        target: `${ip}:${port}`,
        message: `Port ${port} is open on ${ip}`,
      });
    }
  });

  return { openPorts, events };
}

const server = http.createServer(async (req, res) => {
  // Allow cross-origin requests from the Next.js app
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== "POST" || req.url !== "/scan") {
    res.writeHead(404);
    res.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", async () => {
    try {
      const { target_ip, scan_type, target_port } = JSON.parse(body);
      if (!target_ip) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "target_ip is required" }));
        return;
      }

      const port = Number(target_port) || 502;
      console.log(`[Relay] Scanning ${target_ip}:${port} type=${scan_type}`);

      let result;
      if (!scan_type || scan_type === "modbus") {
        const probe = await probeModbusTCP(target_ip, port);
        result = { probe, type: "modbus" };
      } else {
        const network = await probeNetwork(target_ip);
        result = { network, type: "network" };
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, ...result }));
    } catch (err) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: err.message }));
    }
  });
});

server.listen(RELAY_PORT, "0.0.0.0", () => {
  console.log(`✅ Modbus Relay Server running on port ${RELAY_PORT}`);
  console.log(`   Accepts: POST http://<VM_IP>:${RELAY_PORT}/scan`);
});

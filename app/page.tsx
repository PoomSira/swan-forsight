"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  AlertCircle,
  Battery,
  Zap,
  Thermometer,
  Gauge,
  Info,
} from "lucide-react";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";

interface EnergyReading {
  id: string;
  reading_number: number | null;
  device_id: string | null;
  total_pv_power_w: number | null;
  pv1_power_w: number | null;
  pv2_power_w: number | null;
  battery_power_w: number | null;
  load_power_w: number | null;
  battery_soc_pct: number | null;
  battery_soh_pct: number | null;
  grid_frequency_hz: number | null;
  inverter_temperature_c: number | null;
  created_at: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
    },
  },
};

const valueVariants = {
  initial: { opacity: 0.5 },
  animate: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
};

export default function EnergyDashboard() {
  const [readings, setReadings] = useState<EnergyReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const response = await fetch("/api/energy");
      if (!response.ok) throw new Error("Failed to fetch energy data");
      const data = await response.json();
      setReadings(data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const latest = readings[0];
  const chartData = readings
    .reverse()
    .slice(0, 10)
    .map((r) => ({
      time: new Date(r.created_at).toLocaleTimeString(),
      pv: r.total_pv_power_w || 0,
      battery: Math.abs(r.battery_power_w || 0),
      load: r.load_power_w || 0,
    }));

  const batteryData = latest
    ? [
        { name: "SOC", value: latest.battery_soc_pct || 0 },
        { name: "Empty", value: 100 - (latest.battery_soc_pct || 0) },
      ]
    : [];

  const pvData = latest
    ? [
        { name: "PV1", value: latest.pv1_power_w || 0 },
        { name: "PV2", value: latest.pv2_power_w || 0 },
      ]
    : [];

  const COLORS = ["#3b82f6", "#1e40af"];
  const PV_COLORS = ["#fbbf24", "#f59e0b"];

  return (
    <motion.div
      className="flex flex-1 flex-col gap-6 p-4 lg:p-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {error && (
        <motion.div variants={itemVariants}>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      {loading ? (
        <div className="flex h-96 items-center justify-center">
          <Spinner />
        </div>
      ) : latest ? (
        <>
          {/* Key Metrics */}
          <motion.div
            className="grid w-full gap-4 md:grid-cols-2 lg:grid-cols-4"
            variants={containerVariants}
          >
            {/* PV Power */}
            <motion.div variants={itemVariants} className="w-full">
              <UITooltip>
                <TooltipTrigger className="w-full">
                  <Card className="w-full h-full overflow-hidden cursor-help hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        PV Power
                      </CardTitle>
                      <div className="flex gap-1">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <motion.div
                        className="text-2xl font-bold"
                        key={latest.total_pv_power_w}
                        variants={valueVariants}
                        initial="initial"
                        animate="animate"
                      >
                        {(latest.total_pv_power_w || 0).toLocaleString()}W
                      </motion.div>
                      <p className="text-xs text-muted-foreground">
                        PV1: {(latest.pv1_power_w || 0).toLocaleString()}W |
                        PV2: {(latest.pv2_power_w || 0).toLocaleString()}W
                      </p>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <div className="space-y-2">
                    <p className="font-semibold">Total PV Power</p>
                    <p className="text-sm">
                      Energy currently being generated from your solar panels.
                      During the day, higher values indicate better sunlight. At
                      night, this should be near zero.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      <strong>PV1 & PV2:</strong> Your solar panel strings on
                      different sides of your roof. Different voltages are
                      normal.
                    </p>
                  </div>
                </TooltipContent>
              </UITooltip>
            </motion.div>

            {/* Battery Status */}
            <motion.div variants={itemVariants} className="w-full">
              <UITooltip>
                <TooltipTrigger className="w-full">
                  <Card className="w-full h-full overflow-hidden cursor-help hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Battery SOC
                      </CardTitle>
                      <div className="flex gap-1">
                        <Battery className="h-4 w-4 text-blue-500" />
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <motion.div
                        className="text-2xl font-bold"
                        key={latest.battery_soc_pct}
                        variants={valueVariants}
                        initial="initial"
                        animate="animate"
                      >
                        {(latest.battery_soc_pct || 0).toFixed(1)}%
                      </motion.div>
                      <p className="text-xs text-muted-foreground">
                        Health: {(latest.battery_soh_pct || 0).toFixed(1)}%
                      </p>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <div className="space-y-2">
                    <p className="font-semibold">
                      Battery State of Charge (SOC)
                    </p>
                    <p className="text-sm">
                      Percentage of battery remaining. Used to power your home
                      when solar panels aren&apos;t generating energy. Low
                      levels (&lt;20%) mean the system may soon switch to grid
                      power.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      <strong>Health (SoH):</strong> Long-term battery
                      condition. High values (90%+) indicate excellent battery
                      health with minimal wear.
                    </p>
                  </div>
                </TooltipContent>
              </UITooltip>
            </motion.div>

            {/* Load Power */}
            <motion.div variants={itemVariants} className="w-full">
              <UITooltip>
                <TooltipTrigger className="w-full">
                  <Card className="w-full h-full overflow-hidden cursor-help hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Load Power
                      </CardTitle>
                      <div className="flex gap-1">
                        <Gauge className="h-4 w-4 text-green-500" />
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <motion.div
                        className="text-2xl font-bold"
                        key={latest.load_power_w}
                        variants={valueVariants}
                        initial="initial"
                        animate="animate"
                      >
                        {(latest.load_power_w || 0).toLocaleString()}W
                      </motion.div>
                      <p className="text-xs text-muted-foreground">
                        Active consumption
                      </p>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <div className="space-y-2">
                    <p className="font-semibold">Load Power</p>
                    <p className="text-sm">
                      Total electricity your home is consuming right now. This
                      includes lights, appliances, HVAC, refrigerators, and all
                      devices running simultaneously.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Lower values at night indicate minimal power usage.
                      Compare this with battery discharge rate to estimate
                      battery runtime.
                    </p>
                  </div>
                </TooltipContent>
              </UITooltip>
            </motion.div>

            {/* Inverter Temperature */}
            <motion.div variants={itemVariants} className="w-full">
              <UITooltip>
                <TooltipTrigger className="w-full">
                  <Card className="w-full h-full overflow-hidden cursor-help hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Inverter Temp
                      </CardTitle>
                      <div className="flex gap-1">
                        <Thermometer className="h-4 w-4 text-red-500" />
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <motion.div
                        className="text-2xl font-bold"
                        key={latest.inverter_temperature_c}
                        variants={valueVariants}
                        initial="initial"
                        animate="animate"
                      >
                        {(latest.inverter_temperature_c || 0).toFixed(1)}
                        °C
                      </motion.div>
                      <p className="text-xs text-muted-foreground">
                        Grid: {(latest.grid_frequency_hz || 0).toFixed(2)} Hz
                      </p>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <div className="space-y-2">
                    <p className="font-semibold">
                      Inverter Temperature & Grid Frequency
                    </p>
                    <p className="text-sm">
                      <strong>Temperature:</strong> Operating temperature of
                      your inverter. Normal range is 20-40°C. Above 50-60°C may
                      indicate thermal stress. The inverter is the
                      &quot;brain&quot; converting DC solar power to AC home
                      power.
                    </p>
                    <p className="text-sm">
                      <strong>Grid Frequency:</strong> 50 Hz (Australia/Europe)
                      or 60 Hz (North America). Standard &quot;heartbeat&quot;
                      of the electricity grid. Indicates system synchronization.
                    </p>
                  </div>
                </TooltipContent>
              </UITooltip>
            </motion.div>
          </motion.div>

          {/* Charts */}
          <motion.div
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            variants={containerVariants}
          >
            {/* Power Flow Chart */}
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle>Power Flow</CardTitle>
                  <CardDescription>
                    Real-time energy generation and consumption
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => `${value.toLocaleString()}W`}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="pv"
                        stroke="#fbbf24"
                        name="PV Output"
                        isAnimationActive={true}
                        animationDuration={500}
                      />
                      <Line
                        type="monotone"
                        dataKey="load"
                        stroke="#22c55e"
                        name="Load"
                        isAnimationActive={true}
                        animationDuration={500}
                      />
                      <Line
                        type="monotone"
                        dataKey="battery"
                        stroke="#3b82f6"
                        name="Battery"
                        isAnimationActive={true}
                        animationDuration={500}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            {/* Battery State Chart */}
            <motion.div variants={itemVariants}>
              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle>Battery State</CardTitle>
                  <CardDescription>Current charge level</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={batteryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) =>
                          `${name}: ${value.toFixed(1)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        isAnimationActive={true}
                        animationDuration={500}
                      >
                        {batteryData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) =>
                          `${typeof value === "number" ? value.toFixed(1) : value}%`
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* PV Panels Comparison */}
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>PV Panel Output</CardTitle>
                <CardDescription>
                  Individual panel power generation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={pvData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => `${value.toLocaleString()}W`}
                    />
                    <Bar
                      dataKey="value"
                      fill="#fbbf24"
                      name="Power (W)"
                      isAnimationActive={true}
                      animationDuration={500}
                    >
                      {pvData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PV_COLORS[index % PV_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Readings Table */}
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Recent Readings</CardTitle>
                <CardDescription>
                  Last 10 energy readings from your FoxESS inverter
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2">Time</th>
                        <th className="text-right py-2 px-2">PV Power</th>
                        <th className="text-right py-2 px-2">Battery</th>
                        <th className="text-right py-2 px-2">Load</th>
                        <th className="text-right py-2 px-2">SOC</th>
                        <th className="text-right py-2 px-2">Temp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {readings.slice(0, 10).map((reading, idx) => (
                        <motion.tr
                          key={reading.id}
                          className="border-b hover:bg-muted/50"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.05 }}
                        >
                          <td className="py-2 px-2">
                            {new Date(reading.created_at).toLocaleTimeString()}
                          </td>
                          <td className="text-right py-2 px-2 font-medium">
                            {(reading.total_pv_power_w || 0).toLocaleString()}W
                          </td>
                          <td className="text-right py-2 px-2">
                            {(reading.battery_power_w || 0).toLocaleString()}W
                          </td>
                          <td className="text-right py-2 px-2">
                            {(reading.load_power_w || 0).toLocaleString()}W
                          </td>
                          <td className="text-right py-2 px-2">
                            <Badge
                              variant={
                                reading.battery_soc_pct! >= 50
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {(reading.battery_soc_pct || 0).toFixed(1)}%
                            </Badge>
                          </td>
                          <td className="text-right py-2 px-2">
                            {(reading.inverter_temperature_c || 0).toFixed(1)}
                            °C
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      ) : (
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="flex h-96 items-center justify-center">
              <p className="text-muted-foreground">No data available yet</p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}

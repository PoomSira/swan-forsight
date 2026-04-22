import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type AssetRecord = {
  id: string;
  name: string;
  ip: string;
  scannable: boolean;
  source: "assets" | "telemetry";
  test_default?: boolean;
};

type TelemetryRow = {
  device_ip: string | null;
};

export async function GET() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Supabase configuration missing" },
        { status: 500 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const assetsQuery = await supabase
      .from("assets")
      .select("id, name, ip, scannable, is_active")
      .eq("is_active", true)
      .order("name", { ascending: true });

    const normalizedAssets: AssetRecord[] =
      !assetsQuery.error && Array.isArray(assetsQuery.data)
        ? assetsQuery.data
            .filter((row) => row.scannable !== false)
            .map((row) => ({
              id: String(row.id),
              name: String(row.name || `Asset ${row.id}`),
              ip: String(row.ip || ""),
              scannable: row.scannable !== false,
              source: "assets" as const,
            }))
            .filter((row) => row.ip)
        : [];

    const telemetryQuery = await supabase
      .from("foxess_readings")
      .select("device_ip")
      .not("device_ip", "is", null)
      .order("created_at", { ascending: false })
      .limit(100);

    if (telemetryQuery.error && normalizedAssets.length === 0) {
      return NextResponse.json(
        {
          error: "Failed to fetch assets",
          details: telemetryQuery.error.message,
        },
        { status: 500 },
      );
    }

    const uniqueIps = Array.from(
      new Set(
        ((telemetryQuery.data as TelemetryRow[] | null) ?? [])
          .map((row) => row.device_ip)
          .filter((ip): ip is string => Boolean(ip)),
      ),
    );

    const telemetryData: AssetRecord[] = uniqueIps.map((ip, index) => ({
      id: `telemetry-${ip.replace(/\./g, "-")}`,
      name: `Telemetry Device ${index + 1}`,
      ip,
      scannable: true,
      source: "telemetry",
      test_default: true,
    }));

    const mergedByIp = new Map<string, AssetRecord>();
    for (const asset of normalizedAssets) {
      mergedByIp.set(asset.ip, asset);
    }
    for (const telemetry of telemetryData) {
      if (!mergedByIp.has(telemetry.ip)) {
        mergedByIp.set(telemetry.ip, telemetry);
      }
    }

    const merged = Array.from(mergedByIp.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );

    const sourceLabel =
      normalizedAssets.length > 0 && telemetryData.length > 0
        ? "assets+telemetry"
        : normalizedAssets.length > 0
          ? "assets"
          : "telemetry-fallback";

    return NextResponse.json({
      source: sourceLabel,
      data: merged,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown server error";

    return NextResponse.json(
      { error: "Failed to fetch assets", details: message },
      { status: 500 },
    );
  }
}

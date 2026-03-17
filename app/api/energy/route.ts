import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
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

    const apiKey = req.headers.get("x-api-key");
    if (apiKey !== process.env.FOXESS_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const summary = body?.summary ?? {};
    const device = body?.device ?? {};

    const { error } = await supabase.from("foxess_readings").insert({
      reading_number: body?.reading_number ?? null,
      device_ip: device?.ip ?? null,
      device_port: device?.port ?? null,
      device_id: device?.device_id ?? null,
      total_pv_power_w: summary?.total_pv_power_w ?? null,
      pv1_power_w: summary?.pv1_power_w ?? null,
      pv2_power_w: summary?.pv2_power_w ?? null,
      battery_power_w: summary?.battery_power_w ?? null,
      load_power_w: summary?.load_power_w ?? null,
      battery_soc_pct: summary?.battery_soc_pct ?? null,
      battery_soh_pct: summary?.battery_soh_pct ?? null,
      grid_frequency_hz: summary?.grid_frequency_hz ?? null,
      inverter_temperature_c: summary?.inverter_temperature_c ?? null,
      payload: body,
    });

    if (error) {
      return NextResponse.json(
        { error: "Database insert failed", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown server error";

    return NextResponse.json(
      { error: "Invalid request", details: message },
      { status: 400 },
    );
  }
}

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

    const { data, error } = await supabase
      .from("foxess_readings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch data", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown server error";

    return NextResponse.json(
      { error: "Failed to fetch readings", details: message },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const WEATHER_LAT = 13.7563;
const WEATHER_LON = 100.5018;
const CARBON_KG_PER_KWH = 0.5;

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

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [latestRes, historyRes, weeklyRes] = await Promise.all([
      supabase
        .from("foxess_readings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from("foxess_readings")
        .select("created_at,total_pv_power_w,battery_soc_pct,load_power_w,battery_power_w")
        .order("created_at", { ascending: false })
        .limit(48),
      supabase
        .from("foxess_readings")
        .select("total_pv_power_w,load_power_w,battery_soc_pct,battery_power_w")
        .gte("created_at", sevenDaysAgo),
    ]);

    const latest = latestRes.data ?? null;
    const history = (historyRes.data ?? []).reverse();

    const weekly = weeklyRes.data ?? [];
    const totalSolarKwh =
      weekly.reduce((s, r) => s + (r.total_pv_power_w ?? 0), 0) / 1000;
    const avgSoc =
      weekly.length > 0
        ? weekly.reduce((s, r) => s + (r.battery_soc_pct ?? 0), 0) / weekly.length
        : 0;
    const avgLoad =
      weekly.length > 0
        ? weekly.reduce((s, r) => s + (r.load_power_w ?? 0), 0) / weekly.length
        : 0;
    const carbonSavedKg = totalSolarKwh * CARBON_KG_PER_KWH;

    let weather = null;
    try {
      const weatherUrl =
        `https://api.open-meteo.com/v1/forecast?latitude=${WEATHER_LAT}&longitude=${WEATHER_LON}` +
        `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,cloud_cover` +
        `&hourly=direct_radiation&forecast_days=1&timezone=Asia%2FBangkok`;
      const wr = await fetch(weatherUrl, {
        next: { revalidate: 600 },
      });
      if (wr.ok) {
        const wj = await wr.json();
        const currentHourIndex = new Date().getHours();
        weather = {
          temperature: wj.current?.temperature_2m ?? null,
          humidity: wj.current?.relative_humidity_2m ?? null,
          weatherCode: wj.current?.weather_code ?? null,
          windSpeed: wj.current?.wind_speed_10m ?? null,
          cloudCover: wj.current?.cloud_cover ?? null,
          irradiance: wj.hourly?.direct_radiation?.[currentHourIndex] ?? null,
        };
      }
    } catch {
      // weather fetch is best-effort
    }

    return NextResponse.json({
      latest,
      history,
      weekly: {
        totalSolarKwh: Math.round(totalSolarKwh * 10) / 10,
        avgSocPct: Math.round(avgSoc),
        avgLoadW: Math.round(avgLoad),
        carbonSavedKg: Math.round(carbonSavedKg * 10) / 10,
        readingCount: weekly.length,
      },
      weather,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

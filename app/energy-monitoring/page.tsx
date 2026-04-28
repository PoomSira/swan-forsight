"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Sun,
  Battery,
  Zap,
  CloudSun,
  Sunrise,
  Sunset,
  PlugZap,
  ChevronUp,
  ChevronDown,
  Factory,
  Trees,
  Info,
  Grid3x3,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";

// ── Types ─────────────────────────────────────────────────────────────────────

type LatestReading = {
  total_pv_power_w: number | null;
  battery_power_w: number | null;
  load_power_w: number | null;
  battery_soc_pct: number | null;
  battery_soh_pct: number | null;
  grid_frequency_hz: number | null;
  inverter_temperature_c: number | null;
  device_ip: string | null;
  created_at: string | null;
};

type WeeklySummary = {
  totalSolarKwh: number;
  avgSocPct: number;
  avgLoadW: number;
  carbonSavedKg: number;
  readingCount: number;
};

type Weather = {
  temperature: number | null;
  humidity: number | null;
  weatherCode: number | null;
  windSpeed: number | null;
  cloudCover: number | null;
  irradiance: number | null;
};

type DashboardData = {
  latest: LatestReading | null;
  weekly: WeeklySummary;
  weather: Weather | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(val: number | null | undefined, decimals = 0): string {
  if (val == null) return "—";
  return val.toFixed(decimals);
}

function fmtW(val: number | null | undefined): string {
  if (val == null) return "—";
  if (Math.abs(val) >= 1000) return `${(val / 1000).toFixed(1)} kW`;
  return `${val.toFixed(0)} W`;
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function EnergyMonitoringPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/energy-dashboard");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const latest = data?.latest ?? null;
  const weekly = data?.weekly;
  const weather = data?.weather ?? null;

  const solar = latest?.total_pv_power_w ?? 0;
  const battery = latest?.battery_power_w ?? 0;
  const load = latest?.load_power_w ?? 0;

  const batteryCharging = battery > 0;
  const batteryDischarging = battery < 0;

  const gridPower = load - solar - Math.abs(batteryDischarging ? battery : 0);
  const gridImporting = gridPower > 50;
  const gridExporting = gridPower < -50;

  return (
    <div className="flex-1 text-foreground p-4 md:p-8 font-sans font-medium flex flex-col justify-between transition-colors duration-300">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-foreground hidden">
          Energy Dashboard
        </h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[auto_1fr] gap-6 max-w-7xl mx-auto w-full flex-1">
        {/* LEFT COLUMN: POWER FLOW */}
        <div className="flex flex-col gap-6 relative w-full xl:w-[480px]">
          {/* Top Main Card */}
          <div className="bg-card text-card-foreground rounded-[24px] p-6 shadow-sm z-10 border transition-colors duration-300">
            <div className="flex items-center gap-6">
              {/* Circular Indicator */}
              <div className="flex flex-col items-center">
                <div className="relative w-28 h-28 flex items-center justify-center">
                  {/* SVG Arc representing power flow */}
                  <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                    <circle
                      cx="56"
                      cy="56"
                      r="48"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="6"
                      strokeDasharray="226 75"
                    />
                    <circle
                      cx="56"
                      cy="56"
                      r="48"
                      fill="none"
                      stroke="#0ea5e9"
                      strokeWidth="6"
                      strokeDasharray="75 226"
                      strokeDashoffset="-226"
                    />
                  </svg>
                  <PlugZap className="w-10 h-10 text-[#22c55e]" />
                </div>
                <div className="mt-4 text-center">
                  <div className="text-3xl font-bold text-foreground tracking-tight transition-colors duration-300">
                    {fmtW(-load)}
                  </div>
                  <div className="text-[13px] text-muted-foreground font-semibold uppercase tracking-wider mt-1 transition-colors duration-300">
                    Consumption
                  </div>
                </div>
              </div>

              {/* Vertical Divider */}
              <div className="w-px h-32 bg-border transition-colors duration-300"></div>

              {/* Stats */}
              <div className="flex flex-col gap-6">
                <div>
                  <div className="text-2xl font-bold text-[#0ea5e9] tracking-tight">
                    {fmtW(load * 0.4)}h
                  </div>
                  <div className="text-[13px] text-muted-foreground font-semibold uppercase tracking-wider mt-1 transition-colors duration-300">
                    Consumed today
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#22c55e] tracking-tight">
                    {fmtW(battery * 0.1)}h
                  </div>
                  <div className="text-[13px] text-muted-foreground font-semibold uppercase tracking-wider mt-1 transition-colors duration-300">
                    Stored today
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lines SVG and flow pill marks over the gap */}
          {/* SVG Flow Lines */}
          <div className="relative h-[80px] w-full flex justify-center items-center z-0">
            <div className="absolute inset-0">
              <svg
                viewBox="0 0 480 80"
                preserveAspectRatio="none"
                className="w-full h-full overflow-visible text-[#22c55e]"
              >
                {/* Left sweeping flow */}
                <path
                  d="M 240 0 V 20 Q 240 40 220 40 H 95 Q 75 40 75 60 V 80"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Right sweeping flow */}
                <path
                  d="M 240 0 V 20 Q 240 40 260 40 H 385 Q 405 40 405 60 V 80"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Center dropping flow */}
                <path
                  d="M 240 0 V 80"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            {/* Pills */}
            <div className="absolute top-[40px] left-[32.8%] -translate-x-1/2 -translate-y-1/2 bg-card text-card-foreground border-2 border-border text-[12px] px-3.5 py-1 rounded-full font-bold shadow-sm tracking-wider whitespace-nowrap transition-colors duration-300">
              0.9
            </div>
            <div className="absolute top-[40px] left-[50%] -translate-x-1/2 -translate-y-1/2 bg-card text-card-foreground border-2 border-border text-[12px] px-3.5 py-1 rounded-full font-bold shadow-sm tracking-wider whitespace-nowrap z-10 transition-colors duration-300">
              -1.0
            </div>
            <div className="absolute top-[40px] left-[67.2%] -translate-x-1/2 -translate-y-1/2 bg-card text-card-foreground border-2 border-border text-[12px] px-3.5 py-1 rounded-full font-bold shadow-sm tracking-wider whitespace-nowrap transition-colors duration-300">
              0.1
            </div>
          </div>

          {/* 3 Bottom Cards */}
          <div className="grid grid-cols-3 gap-4 z-10 pb-4">
            {/* Grid */}
            <div className="bg-card text-card-foreground rounded-[24px] p-5 flex flex-col items-center justify-between border shadow-sm h-[160px] transition-colors duration-300">
              <Grid3x3 className="w-8 h-8 text-[#0ea5e9] mb-2" />
              <div className="text-center">
                <div className="text-[17px] font-bold text-foreground transition-colors duration-300">
                  {fmtW(gridPower)}
                </div>
                <div className="text-[12px] text-muted-foreground font-semibold uppercase transition-colors duration-300">
                  Grid
                </div>
              </div>
              <div className="mt-2 bg-[#0ea5e9]/10 text-[#0ea5e9] px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold w-full justify-center text-center">
                {gridExporting ? (
                  <ChevronUp className="w-3.5 h-3.5 shrink-0" />
                ) : gridImporting ? (
                  <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <RefreshCw className="w-3 h-3 shrink-0" />
                )}
                <span className="truncate">
                  {gridExporting
                    ? "Exporting"
                    : gridImporting
                      ? "Importing"
                      : "Idle"}
                </span>
              </div>
            </div>

            {/* Solar */}
            <div className="bg-card text-card-foreground rounded-[24px] p-5 flex flex-col items-center justify-between border shadow-sm h-[160px] transition-colors duration-300">
              <Sun className="w-8 h-8 text-[#eab308] mb-2 shrink-0" />
              <div className="text-center">
                <div className="text-[17px] font-bold text-foreground transition-colors duration-300">
                  {fmtW(solar)}
                </div>
                <div className="text-[12px] text-muted-foreground font-semibold uppercase transition-colors duration-300">
                  Solar
                </div>
              </div>
              <div className="mt-2 bg-[#eab308]/10 text-[#eab308] px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold w-full justify-center text-center">
                {solar > 50 ? (
                  <ChevronUp className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <RefreshCw className="w-3 h-3 shrink-0" />
                )}
                <span className="truncate">
                  {solar > 50 ? "Generating" : "Idle"}
                </span>
              </div>
            </div>

            {/* Storage */}
            <div className="bg-card text-card-foreground rounded-[24px] p-5 flex flex-col items-center justify-between border shadow-sm h-[160px] transition-colors duration-300">
              <Battery className="w-8 h-8 text-[#22c55e] mb-2 shrink-0" />
              <div className="text-center line-clamp-2">
                <div className="text-[17px] font-bold text-foreground whitespace-nowrap transition-colors duration-300">
                  {fmtW(battery)}
                </div>
                <div className="text-[11px] text-[#22c55e] font-bold whitespace-nowrap">
                  Storage {fmt(latest?.battery_soc_pct, 1)}%
                </div>
              </div>
              <div className="mt-2 bg-[#22c55e]/10 text-[#22c55e] px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold w-full justify-center text-center">
                {batteryCharging ? (
                  <ChevronUp className="w-3.5 h-3.5 shrink-0" />
                ) : batteryDischarging ? (
                  <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <RefreshCw className="w-3 h-3 shrink-0" />
                )}
                <span className="truncate">
                  {batteryCharging
                    ? "Saving"
                    : batteryDischarging
                      ? "Discharging"
                      : "Idle"}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Flow Pipes */}
          <div className="relative h-[30px] w-full z-0 -mt-2">
            <div className="absolute inset-0 top-[-10px]">
              <svg
                viewBox="0 0 480 40"
                preserveAspectRatio="none"
                className="w-full h-full text-[#22c55e]"
              >
                {/* Main inverted sweeping curve combining Left to Right */}
                <path
                  d="M 75 0 V 10 Q 75 20 95 20 H 385 Q 405 20 405 10 V 0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Center dropping line */}
                <path
                  d="M 240 0 V 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-6">
          {/* Top Row: Weather & Battery */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Weather */}
            <div className="bg-card text-card-foreground rounded-[24px] p-6 border shadow-sm flex flex-col justify-between transition-colors duration-300">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-[17px] font-bold text-foreground transition-colors duration-300">
                  Weather
                </h2>
                <span className="text-xs text-muted-foreground font-semibold transition-colors duration-300">
                  {weather?.irradiance ? "10.7h of sun" : "Loading..."}
                </span>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-linear-to-br from-[#fde047] to-[#eab308] rounded-full shrink-0 flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                  <Sun className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-semibold leading-tight transition-colors duration-300">
                    Average daily solar production (based on the past week)
                  </div>
                  <div className="text-xl font-bold text-foreground mt-1 transition-colors duration-300">
                    {fmt(weekly?.totalSolarKwh, 2)} kWh
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-end">
                <div>
                  <div className="text-[15px] font-bold text-foreground mb-0.5 transition-colors duration-300">
                    {fmt(weather?.temperature, 0)}°C / 12°C
                  </div>
                  <div className="text-[13px] font-bold text-muted-foreground transition-colors duration-300">
                    in Badger Creek
                  </div>
                  <div className="text-[12px] text-muted-foreground font-semibold mt-1 flex items-center gap-1 transition-colors duration-300">
                    <CloudSun className="w-3.5 h-3.5" /> Clear Sky
                  </div>
                </div>
                <div className="flex flex-col gap-2 border-l border-border pl-4 transition-colors duration-300">
                  <div className="flex items-center gap-2 text-[12px] font-bold text-[#eab308]">
                    <Sunrise className="w-4 h-4" /> 06:54
                  </div>
                  <div className="flex items-center gap-2 text-[12px] font-bold text-[#fb923c]">
                    <Sunset className="w-4 h-4" /> 17:36
                  </div>
                </div>
              </div>
            </div>

            {/* Battery Summary */}
            <div className="bg-card text-card-foreground rounded-[24px] p-6 border shadow-sm flex flex-col justify-between transition-colors duration-300">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-[17px] font-bold text-foreground transition-colors duration-300">
                  Battery
                </h2>
                <span className="text-xs text-muted-foreground font-semibold transition-colors duration-300">
                  In the past 7 days
                </span>
              </div>

              <div className="flex items-center justify-between mb-4 mt-2">
                <div className="flex items-center gap-4">
                  <div className="bg-[#22c55e]/15 dark:bg-[#22c55e]/20 p-2.5 rounded-xl border border-[#22c55e]/30 transition-colors duration-300">
                    <Battery className="w-6 h-6 text-[#22c55e]" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-semibold transition-colors duration-300">
                      Average State of Charge
                    </div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-foreground transition-colors duration-300">
                  {fmt(weekly?.avgSocPct, 1)}%
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-xl p-3">
                  <div className="text-lg font-bold text-foreground transition-colors duration-300">
                    193.72 kWh
                  </div>
                  <div className="text-[11px] text-muted-foreground font-bold uppercase mt-1 transition-colors duration-300">
                    Total Delivered
                  </div>
                </div>
                <div className="bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-xl p-3">
                  <div className="text-lg font-bold text-foreground transition-colors duration-300">
                    323.47 kWh
                  </div>
                  <div className="text-[11px] text-muted-foreground font-bold uppercase mt-1 transition-colors duration-300">
                    Total Stored
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Carbon Card */}
          <div className="bg-card text-card-foreground rounded-[24px] p-6 border shadow-sm h-auto min-h-[160px] flex flex-col transition-colors duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[17px] font-bold text-foreground flex items-center gap-1.5 transition-colors duration-300">
                Carbon
                <Info className="w-3.5 h-3.5 text-[#22c55e] ml-1" />
              </h2>
              <span className="text-xs text-muted-foreground font-semibold transition-colors duration-300">
                In the past 7 days
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 flex-1">
              <div className="bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-3">
                <Factory className="w-7 h-7 text-[#c084fc]" />
                <div>
                  <div className="text-2xl font-bold text-foreground leading-none mb-1 transition-colors duration-300">
                    {fmt(weekly?.carbonSavedKg, 0)}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-semibold tracking-wide transition-colors duration-300">
                    Tonnes of CO2 avoided
                  </div>
                </div>
              </div>

              <div className="bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-3">
                <Zap className="w-7 h-7 text-[#0ea5e9]" />
                <div>
                  <div className="text-2xl font-bold text-foreground leading-none mb-1 transition-colors duration-300">
                    {fmt(weekly?.totalSolarKwh, 0)}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-semibold tracking-wide transition-colors duration-300">
                    kWh energy produced
                  </div>
                </div>
              </div>

              <div className="bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-3">
                <Trees className="w-7 h-7 text-[#22c55e]" />
                <div>
                  <div className="text-2xl font-bold text-foreground leading-none mb-1 transition-colors duration-300">
                    {fmt((weekly?.carbonSavedKg ?? 0) * 0.05, 0)}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-semibold tracking-wide transition-colors duration-300">
                    Equivalent trees planted
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-muted-foreground font-medium py-4 mt-8 flex justify-center items-center gap-1 transition-colors duration-300">
        last updated {lastUpdated ? "0 seconds ago" : "loading..."} -{" "}
        {lastUpdated?.toLocaleString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
          timeZoneName: "short",
        }) ?? "Loading"}
        {lastUpdated ? " GMT+10" : ""}
      </div>
    </div>
  );
}

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
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
    const body = await request.json();
    const { target_ip, scan_type, connected, findings, events } = body;

    if (!target_ip) {
      return NextResponse.json(
        { error: "target_ip is required" },
        { status: 400 },
      );
    }

    // Look up asset_id by IP if it exists in the assets table
    const { data: asset } = await supabase
      .from("assets")
      .select("id")
      .eq("ip", target_ip)
      .single();

    const { data, error } = await supabase
      .from("scan_results")
      .insert({
        asset_id: asset?.id ?? null,
        target_ip,
        scan_type: scan_type || "modbus",
        connected: connected ?? false,
        findings_count: Array.isArray(findings) ? findings.length : 0,
        findings: findings ?? [],
        events: events ?? [],
      })
      .select("id, scanned_at")
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to save scan result", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, id: data.id, scanned_at: data.scanned_at });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to save scan result", details: message },
      { status: 500 },
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
      .from("scan_results")
      .select("id, target_ip, scan_type, scanned_at, connected, findings_count")
      .order("scanned_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch scan results", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch scan results", details: message },
      { status: 500 },
    );
  }
}

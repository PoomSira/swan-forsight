"use client";

import { useEffect, useRef } from "react";
import { ChartPieSimple } from "@/components/charts/chart-pie-simple";
import { ChartAreaInteractive } from "@/components/charts/chart-area-interactive";
import mapboxgl from "mapbox-gl";
import MapboxDirections from "@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions";
import "@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css";

mapboxgl.accessToken = process.env.MAPBOX_ACCESS_TOKEN || "";

export default function Page() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !mapboxgl.accessToken)
      return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [144.9631, -37.8136], // [lng, lat]
      zoom: 10,
    });

    mapRef.current.addControl(
      new MapboxDirections({
        accessToken: mapboxgl.accessToken,
        unit: "metric",
        profile: "mapbox/driving",
      }),
      "top-left",
    );

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="grid auto-rows-min gap-4 md:grid-cols-1">
        <ChartAreaInteractive />
      </div>
      <div className="grid auto-rows-min gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-muted/50">
          <ChartPieSimple />
        </div>
        <div className="rounded-xl bg-muted/50">
          <div ref={mapContainerRef} className="h-full w-full rounded-xl" />
        </div>
      </div>
      {/* <div className="min-h-screen flex-1 rounded-xl bg-muted/50 md:min-h-min" /> */}
      <div className="grid auto-rows-min gap-4 md:grid-cols-1"></div>
    </div>
  );
}

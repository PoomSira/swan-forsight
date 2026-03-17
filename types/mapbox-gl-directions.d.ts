declare module "@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions" {
  import { IControl } from "mapbox-gl";

  interface MapboxDirectionsOptions {
    accessToken: string;
    unit?: "imperial" | "metric";
    profile?: "mapbox/driving" | "mapbox/walking" | "mapbox/cycling" | "mapbox/driving-traffic";
    alternatives?: boolean;
    congestion?: boolean;
    language?: string;
    [key: string]: unknown;
  }

  class MapboxDirections implements IControl {
    constructor(options: MapboxDirectionsOptions);
    onAdd(map: mapboxgl.Map): HTMLElement;
    onRemove(map: mapboxgl.Map): void;
  }

  export default MapboxDirections;
}

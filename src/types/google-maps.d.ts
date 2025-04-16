declare global {
  interface Window {
    google: typeof google;
  }
}

declare namespace google.maps {
  class Map {
    constructor(element: HTMLElement, options?: MapOptions);
    setCenter(latLng: LatLng | LatLngLiteral): void;
    setZoom(zoom: number): void;
    fitBounds(bounds: LatLngBounds): void;
  }

  class Marker {
    constructor(options?: MarkerOptions);
    setMap(map: Map | null): void;
    addListener(eventName: string, handler: Function): MapsEventListener;
  }

  class InfoWindow {
    constructor(options?: InfoWindowOptions);
    setContent(content: string | HTMLElement): void;
    open(map?: Map | StreetViewPanorama, anchor?: MVCObject): void;
    close(): void;
  }

  interface InfoWindowOptions {
    content?: string | HTMLElement;
    maxWidth?: number;
    pixelOffset?: Size;
    position?: LatLng | LatLngLiteral;
    zIndex?: number;
  }

  class LatLngBounds {
    constructor(sw?: LatLng | LatLngLiteral, ne?: LatLng | LatLngLiteral);
    extend(point: LatLng | LatLngLiteral): void;
    getCenter(): LatLng;
    getNorthEast(): LatLng;
    getSouthWest(): LatLng;
    contains(latLng: LatLng | LatLngLiteral): boolean;
  }

  interface MapOptions {
    center?: LatLng | LatLngLiteral;
    zoom?: number;
    mapTypeControl?: boolean;
    streetViewControl?: boolean;
    fullscreenControl?: boolean;
  }

  interface MarkerOptions {
    position?: LatLng | LatLngLiteral;
    map?: Map;
    title?: string;
    animation?: Animation;
  }

  class LatLng {
    constructor(lat: number, lng: number);
    lat(): number;
    lng(): number;
  }

  interface LatLngLiteral {
    lat: number;
    lng: number;
  }

  interface Size {
    width: number;
    height: number;
    widthUnit?: string;
    heightUnit?: string;
  }

  enum Animation {
    BOUNCE = 1,
    DROP = 2
  }

  interface MapsEventListener {
    remove(): void;
  }

  class MVCObject {
    addListener(eventName: string, handler: Function): MapsEventListener;
  }

  class StreetViewPanorama extends MVCObject {
    // Add any specific StreetViewPanorama methods you need
  }
} 
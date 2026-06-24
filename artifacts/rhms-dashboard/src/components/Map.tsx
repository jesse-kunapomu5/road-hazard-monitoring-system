import { useEffect, useRef, useState } from "react";
import { useListDetections } from "@workspace/api-client-react";

declare global {
  interface Window {
    google: any;
    initRHMSMap: () => void;
  }
}

interface MapProps {
  onMarkerClick: (id: number) => void;
}

const MAP_STYLES = [
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry.fill", stylers: [{ color: "#d4e8f5" }] },
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.arterial", elementType: "geometry.fill", stylers: [{ color: "#f5f5f5" }] },
  { featureType: "landscape.man_made", elementType: "geometry.fill", stylers: [{ color: "#f7f4f0" }] },
  { featureType: "landscape.natural", elementType: "geometry.fill", stylers: [{ color: "#eef4e8" }] },
];

const SEVERITY_COLORS: Record<string, string> = {
  Low: "#22c55e",
  Medium: "#eab308",
  High: "#f97316",
  Critical: "#ef4444",
};

const SEVERITY_HALO: Record<string, string> = {
  Low: "rgba(34,197,94,0.15)",
  Medium: "rgba(234,179,8,0.18)",
  High: "rgba(249,115,22,0.2)",
  Critical: "rgba(239,68,68,0.22)",
};

export function Map({ onMarkerClick }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const circlesRef = useRef<any[]>([]);
  const [mapReady, setMapReady] = useState(false);

  const { data: detections } = useListDetections({ query: { refetchInterval: 30000 } });

  useEffect(() => {
    function initMap() {
      if (!mapRef.current || mapInstanceRef.current) return;
      try {
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: 17.385, lng: 78.4867 },
          zoom: 12,
          styles: MAP_STYLES,
          disableDefaultUI: true,
          zoomControl: true,
          zoomControlOptions: {
            position: window.google.maps.ControlPosition.RIGHT_CENTER,
          },
        });
        mapInstanceRef.current = map;
        setMapReady(true);
      } catch (e) {
        console.error("Map init error:", e);
      }
    }

    if (window.google?.maps) {
      initMap();
    } else {
      window.initRHMSMap = initMap;
      if (!document.getElementById("gmaps-script")) {
        const script = document.createElement("script");
        script.id = "gmaps-script";
        script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCpmj1Ab8XnpnXNPOLiT5EKnqf9AS5N4VQ&callback=initRHMSMap`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
    }

    return () => {
      markersRef.current.forEach((m) => m.setMap(null));
      circlesRef.current.forEach((c) => c.setMap(null));
      markersRef.current = [];
      circlesRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !detections) return;

    try {
      markersRef.current.forEach((m) => m.setMap(null));
      circlesRef.current.forEach((c) => c.setMap(null));
      markersRef.current = [];
      circlesRef.current = [];

      detections.forEach((d) => {
        const position = { lat: d.latitude, lng: d.longitude };
        const severity = d.severity as string;

        const haloRadius = severity === "Critical" ? 600
          : severity === "High" ? 450
          : severity === "Medium" ? 300 : 200;

        const circle = new window.google.maps.Circle({
          strokeColor: SEVERITY_COLORS[severity] ?? "#94a3b8",
          strokeOpacity: 0.4,
          strokeWeight: 1,
          fillColor: SEVERITY_HALO[severity] ?? "rgba(148,163,184,0.15)",
          fillOpacity: 1,
          map: mapInstanceRef.current,
          center: position,
          radius: haloRadius,
        });
        circlesRef.current.push(circle);

        const scale = severity === "Critical" ? 11
          : severity === "High" ? 9
          : severity === "Medium" ? 7 : 6;

        const marker = new window.google.maps.Marker({
          position,
          map: mapInstanceRef.current,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: SEVERITY_COLORS[severity] ?? "#94a3b8",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2.5,
            scale,
          },
          title: `${d.road_name} — ${d.pothole_count} potholes (${severity})`,
          cursor: "pointer",
          zIndex: severity === "Critical" ? 4 : severity === "High" ? 3 : 2,
        });

        marker.addListener("click", () => onMarkerClick(d.id));
        markersRef.current.push(marker);
      });
    } catch (e) {
      console.error("Map update error:", e);
    }
  }, [detections, mapReady, onMarkerClick]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden shadow-sm border border-border">
      <div ref={mapRef} className="w-full h-full bg-[#f0ede8]" />
      {!mapReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#f7f4f0] gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Loading map...</p>
        </div>
      )}
      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm border border-border flex items-center gap-3">
        {(["Low", "Medium", "High", "Critical"] as const).map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: SEVERITY_COLORS[s] }}
            />
            <span className="text-xs text-muted-foreground font-medium">{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

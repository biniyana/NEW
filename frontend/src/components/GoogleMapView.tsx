import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

// Declare Google Maps namespace
declare global {
  interface Window {
    google: any;
  }
}

interface MarkerItem {
  id: string;
  name?: string;
  address?: string;
  latitude: number;
  longitude: number;
}

interface GoogleMapViewProps {
  markers: MarkerItem[];
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string | number;
  onMarkerClick?: (marker: MarkerItem) => void;
}

export default function GoogleMapView({
  markers,
  center,
  zoom = 13,
  height = "300px",
  onMarkerClick,
}: GoogleMapViewProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setMapLoaded(true);
        return;
      }

      // Prefer Vite env var but fallback to an empty string (RecyclingMapSection uses a demo key)
      const apiKey = (import.meta.env as any).VITE_GOOGLE_MAPS_API_KEY || "";

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapLoaded(true);
      script.onerror = () => {
        console.warn("Google Maps API failed to load.");
        setMapLoaded(true); // allow fallback behavior in UI
      };
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    const mapCenter = center || (markers.length > 0 ? { lat: markers[0].latitude, lng: markers[0].longitude } : { lat: 16.4023, lng: 120.5960 });

    const options: any = {
      center: mapCenter,
      zoom,
      mapTypeId: "roadmap",
      disableDefaultUI: false,
    };

    try {
      mapInstance.current = new window.google.maps.Map(mapRef.current, options);
      infoWindowRef.current = new window.google.maps.InfoWindow();
    } catch (err) {
      console.error("Failed to initialize Google Map:", err);
      return;
    }
  }, [mapLoaded]);

  useEffect(() => {
    if (!mapInstance.current) return;

    // Clear previous markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();

    markers.forEach((m) => {
      const marker = new window.google.maps.Marker({
        position: { lat: m.latitude, lng: m.longitude },
        map: mapInstance.current,
        title: m.name || m.address || "Junkshop",
      });

      marker.addListener("click", () => {
        const content = `
          <div style="font-family: system-ui; max-width: 240px;">
            <div style="font-weight: 600; margin-bottom: 6px;">${m.name || "Junkshop"}</div>
            <div style="font-size:12px;color:#666;margin-bottom:8px;">${m.address || ""}</div>
            <div style="display:flex;gap:8px;">
              <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(m.latitude + ',' + m.longitude)}&destination_place=${encodeURIComponent(m.name || '')}" target="_blank" rel="noopener noreferrer" style="padding:6px 8px;background:#efefef;border-radius:6px;text-decoration:none;color:#111;font-size:13px;">Get Directions</a>
            </div>
          </div>
        `;

        infoWindowRef.current.setContent(content);
        infoWindowRef.current.open(mapInstance.current, marker);
        onMarkerClick?.(m);
      });

      markersRef.current.push(marker);
      bounds.extend(marker.getPosition());
    });

    if (markersRef.current.length > 1) {
      mapInstance.current.fitBounds(bounds);
    } else if (markersRef.current.length === 1) {
      mapInstance.current.setCenter(markersRef.current[0].getPosition());
      mapInstance.current.setZoom(Math.max(14, zoom));
    }
  }, [mapInstance.current, markers]);

  return (
    <Card>
      <CardContent className="p-0">
        <div ref={mapRef} style={{ width: "100%", height }} />
      </CardContent>
    </Card>
  );
}

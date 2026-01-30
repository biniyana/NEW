import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Fix for leaflet markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface MapPinnerProps {
  onLocationSelect: (latitude: number, longitude: number) => void;
  initialLatitude?: number;
  initialLongitude?: number;
  address?: string;
}

// Component to handle map clicks
function LocationMarker({
  position,
  setPosition,
}: {
  position: [number, number] | null;
  setPosition: (pos: [number, number]) => void;
}) {
  useMapEvents({
    click(e: any) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position === null ? null : (
    <Marker position={position}>
    </Marker>
  );
}

export default function MapPinner({
  onLocationSelect,
  initialLatitude,
  initialLongitude,
  address,
}: MapPinnerProps) {
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(
    initialLatitude && initialLongitude ? [initialLatitude, initialLongitude] : null
  );
  const [centerLat, setCenterLat] = useState(initialLatitude || 16.4023); // Baguio City default
  const [centerLng, setCenterLng] = useState(initialLongitude || 120.5960);
  const [displayLat, setDisplayLat] = useState(initialLatitude?.toString() || "");
  const [displayLng, setDisplayLng] = useState(initialLongitude?.toString() || "");

  // Update display when marker changes
  useEffect(() => {
    if (markerPosition) {
      setDisplayLat(markerPosition[0].toFixed(7));
      setDisplayLng(markerPosition[1].toFixed(7));
      onLocationSelect(markerPosition[0], markerPosition[1]);
    }
  }, [markerPosition]);

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCenterLat(latitude);
          setCenterLng(longitude);
          setMarkerPosition([latitude, longitude]);
        },
        (error) => {
          console.log("Geolocation error:", error);
        }
      );
    }
  };

  const handleManualEntry = (lat: string, lng: string) => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (!isNaN(latNum) && !isNaN(lngNum)) {
      setMarkerPosition([latNum, lngNum]);
      setCenterLat(latNum);
      setCenterLng(lngNum);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Pin Your Junkshop Location
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {address && (
          <div className="text-sm text-muted-foreground p-2 bg-accent rounded">
            📍 {address}
          </div>
        )}

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Click on the map to pin your junkshop location, or use your current GPS location.
          </AlertDescription>
        </Alert>

        {/* Map */}
        <div className="rounded-lg overflow-hidden border border-border">
          <MapContainer
            center={[centerLat, centerLng] as [number, number]}
            zoom={14}
            style={{ height: "400px", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <LocationMarker position={markerPosition} setPosition={setMarkerPosition} />
          </MapContainer>
        </div>

        {/* Current Location Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleUseCurrentLocation}
        >
          📍 Use Current GPS Location
        </Button>

        {/* Coordinates Display and Manual Entry */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              type="number"
              placeholder="0.0000000"
              value={displayLat}
              onChange={(e) => setDisplayLat(e.target.value)}
              step={0.0000001}
              readOnly
              className="text-xs"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              type="number"
              placeholder="0.0000000"
              value={displayLng}
              onChange={(e) => setDisplayLng(e.target.value)}
              step={0.0000001}
              readOnly
              className="text-xs"
            />
          </div>
        </div>

        {/* Manual Coordinate Entry */}
        <div className="space-y-2">
          <Label className="text-xs">Or enter coordinates manually:</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleManualEntry(displayLat, displayLng)}
              disabled={!displayLat || !displayLng}
            >
              Apply Coordinates
            </Button>
          </div>
        </div>

        {markerPosition && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-900">
            ✓ Location pinned: {markerPosition[0].toFixed(7)}, {markerPosition[1].toFixed(7)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

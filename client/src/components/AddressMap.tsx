import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MapPin, Search } from "lucide-react";

// Fix for leaflet markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface AddressMapProps {
  address: string;
  latitude?: number | string;
  longitude?: number | string;
  onLocationChange?: (lat: number, lng: number, address: string) => void;
  readOnly?: boolean;
}

function MapClickHandler({ onLocationChange }: { onLocationChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e: any) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function AddressMap({
  address,
  latitude,
  longitude,
  onLocationChange,
  readOnly = false,
}: AddressMapProps) {
  const [searchQuery, setSearchQuery] = useState(address);
  const [mapLat, setMapLat] = useState<number>(Number(latitude) || 16.4023); // Baguio City default
  const [mapLng, setMapLng] = useState<number>(Number(longitude) || 120.5960);

  // Update position when props change
  useEffect(() => {
    if (latitude && longitude) {
      setMapLat(Number(latitude));
      setMapLng(Number(longitude));
    }
  }, [latitude, longitude]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      // Using OpenStreetMap Nominatim API (free, no key needed)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const newLat = parseFloat(result.lat);
        const newLng = parseFloat(result.lon);
        setMapLat(newLat);
        setMapLng(newLng);
        if (onLocationChange) {
          onLocationChange(newLat, newLng, result.display_name);
        }
      }
    } catch (error) {
      console.error("Error searching address:", error);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    setMapLat(lat);
    setMapLng(lng);
    if (onLocationChange) {
      onLocationChange(lat, lng, searchQuery);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Address Location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!readOnly && (
            <div className="space-y-2">
              <Label htmlFor="address-search">Search Address</Label>
              <div className="flex gap-2">
                <Input
                  id="address-search"
                  placeholder="Enter address or location name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <Button onClick={handleSearch} size="sm" className="gap-2">
                  <Search className="w-4 h-4" />
                  Search
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Or click on the map to set location manually
              </p>
            </div>
          )}

          <div className="rounded-lg overflow-hidden border border-border h-96">
            <MapContainer {...({ center:[mapLat, mapLng], zoom:14, style:{ height: "100%", width: "100%" } } as any)}>
                <TileLayer {...({ url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' } as any)} />
              <Marker position={[mapLat, mapLng]}>
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">Latitude: {mapLat.toFixed(6)}</p>
                    <p className="font-semibold">Longitude: {mapLng.toFixed(6)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{address}</p>
                  </div>
                </Popup>
              </Marker>
              {!readOnly && <MapClickHandler onLocationChange={handleMapClick} />}
            </MapContainer>
          </div>

          <div className="bg-secondary p-3 rounded-lg">
            <p className="text-sm">
              <span className="font-semibold">Current Coordinates:</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Latitude: {mapLat.toFixed(6)} | Longitude: {mapLng.toFixed(6)}
            </p>
            <p className="text-xs text-muted-foreground mt-2 break-words">
              <span className="font-semibold">Address:</span> {searchQuery || address}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

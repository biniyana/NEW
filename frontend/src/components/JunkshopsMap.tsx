import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "@/models";
import { MapPin } from "lucide-react";

// Fix for leaflet markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface JunkshopsMapProps {
  userLocation?: { latitude: number; longitude: number };
  junkshops: User[];
  onJunkshopClick?: (junkshop: User) => void;
  radiusKm?: number;
  showAll?: boolean;
}

export default function JunkshopsMap({
  userLocation,
  junkshops,
  onJunkshopClick,
  radiusKm = 5,
  showAll = false,
}: JunkshopsMapProps) {
  const [centerLat, setCenterLat] = useState<number>(16.4023); // Baguio City default
  const [centerLng, setCenterLng] = useState<number>(120.5960);

  useEffect(() => {
    if (userLocation?.latitude && userLocation?.longitude) {
      setCenterLat(userLocation.latitude);
      setCenterLng(userLocation.longitude);
    }
  }, [userLocation]);

  // Filter junkshops within radius
  const nearbyJunkshops = junkshops.filter((junkshop) => {
    if (!junkshop.latitude || !junkshop.longitude) return false;

    // If showAll is true, return all valid junkshops without radius filtering
    if (showAll) return true;

    const lat2 = Number(junkshop.latitude);
    const lng2 = Number(junkshop.longitude);

    // Haversine formula to calculate distance
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - centerLat) * Math.PI) / 180;
    const dLng = ((lng2 - centerLng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((centerLat * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance <= radiusKm;
  });

  // Create custom markers
  const userMarkerIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const junkshopMarkerIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          {showAll ? "All Junkshops" : "Nearby Junkshops"} ({nearbyJunkshops.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg overflow-hidden border border-border h-96">
          <MapContainer center={[centerLat, centerLng]} zoom={13} style={{ height: "100%", width: "100%" }} className="relative z-10">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {/* Your location */}
            {userLocation && (
              <>
                <Marker position={[centerLat, centerLng]} icon={userMarkerIcon}>
                  <Popup>
                    <div className="text-sm font-semibold">Your Location</div>
                  </Popup>
                </Marker>
                {/* Radius circle */}
                <Circle center={[centerLat, centerLng]} radius={radiusKm * 1000} fillOpacity={0.1} />
              </>
            )}

            {/* Junkshops */}
            {nearbyJunkshops.map((junkshop) => (
              <Marker
                key={junkshop.id}
                position={[Number(junkshop.latitude), Number(junkshop.longitude)]}
                icon={junkshopMarkerIcon}
                eventHandlers={{ click: () => { if (onJunkshopClick) onJunkshopClick(junkshop); } }}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">{junkshop.name}</p>
                    <p className="text-xs text-muted-foreground">{junkshop.address}</p>
                    <p className="text-xs mt-1">📞 {junkshop.phone}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {nearbyJunkshops.map((junkshop) => {
            const lat = Number(junkshop.latitude);
            const lng = Number(junkshop.longitude);
            const dest = `${lat},${lng}`;
            const origin = userLocation ? `${userLocation.latitude},${userLocation.longitude}` : undefined;
            const directionsUrl = origin
              ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}`
              : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`;

            return (
              <div
                key={junkshop.id}
                className="p-3 border border-border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                onClick={() => onJunkshopClick?.(junkshop)}
              >
                <p className="font-semibold text-sm">{junkshop.name}</p>
                <p className="text-xs text-muted-foreground">{junkshop.address}</p>
                <p className="text-xs mt-1">📞 {junkshop.phone}</p>
                <a href={directionsUrl} target="_blank" rel="noreferrer" className="text-xs mt-2 inline-block px-2 py-1 bg-gray-100 rounded">Get Directions</a>
              </div>
            );
          })}
          {nearbyJunkshops.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground py-4">
              {showAll ? "No junkshops available" : `No junkshops found within ${radiusKm}km radius`}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User } from "@/models";
import { MapPin, Phone, Mail, Star, Clock, MessageCircle } from "lucide-react";
import GetDirectionsButton from "@/components/GetDirectionsButton";
import GoogleMapView from "@/components/GoogleMapView";
import { useLocation } from "wouter";

// Fix for leaflet markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface JunkshopProfileProps {
  junkshop: User;
  onCall?: (phone: string) => void;
  onEmail?: (email: string) => void;
}

export default function JunkshopProfile({ junkshop, onCall, onEmail }: JunkshopProfileProps) {
  const [, navigate] = useLocation();
  const hasLocation = junkshop.latitude && junkshop.longitude;
  const lat = hasLocation ? Number(junkshop.latitude) : 16.4023;
  const lng = hasLocation ? Number(junkshop.longitude) : 120.5960;

  const junkshopMarkerIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const handleCall = () => {
    if (onCall) {
      onCall(junkshop.phone);
    } else {
      window.location.href = `tel:${junkshop.phone}`;
    }
  };

  const handleEmail = () => {
    if (onEmail) {
      onEmail(junkshop.email);
    } else {
      window.location.href = `mailto:${junkshop.email}`;
    }
  };

  const handleContactSeller = () => {
    navigate(`/dashboard?tab=messages&userId=${junkshop.id}&userName=${encodeURIComponent(junkshop.name)}`);
  };

  return (
    <div className="space-y-4">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{junkshop.name}</CardTitle>
              <Badge className="mt-2">🏪 Junkshop</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Address</p>
                <p className="text-sm">{junkshop.address}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Phone</p>
                <p className="text-sm cursor-pointer hover:text-primary" onClick={handleCall}>
                  {junkshop.phone}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Email</p>
                <p className="text-sm cursor-pointer hover:text-primary" onClick={handleEmail}>
                  {junkshop.email}
                </p>
              </div>
            </div>


          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-4">
            <Button variant="outline" size="sm" onClick={handleCall}>
              <Phone className="w-4 h-4 mr-2" />
              Call
            </Button>
            <Button variant="outline" size="sm" onClick={handleEmail}>
              <Mail className="w-4 h-4 mr-2" />
              Email
            </Button>
            <Button variant="outline" size="sm" onClick={handleContactSeller}>
              <MessageCircle className="w-4 h-4 mr-2" />
              Contact Seller
            </Button>
            {hasLocation && (
              <GetDirectionsButton
                latitude={lat}
                longitude={lng}
                destinationName={junkshop.name}
                variant="outline"
                size="sm"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Location Map */}
      {hasLocation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg overflow-hidden border border-border">
              {/* Prefer Google Maps if API key available, otherwise fallback to Leaflet */}
              { (import.meta.env as any).VITE_GOOGLE_MAPS_API_KEY ? (
                <GoogleMapView
                  markers={[{ id: String(junkshop.id), name: junkshop.name, address: junkshop.address || "", latitude: lat, longitude: lng }]}
                  center={{ lat, lng }}
                  zoom={15}
                  height="300px"
                />
              ) : (
                <MapContainer {...({ center:[lat, lng] as [number, number], zoom:15, style:{ height: "300px", width: "100%" }, className:"relative z-10" } as any)}>
                  <TileLayer {...({ url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' } as any)} />
                  <Marker {...({ position:[lat, lng] as [number, number], icon: junkshopMarkerIcon } as any)}>
                    <Popup>
                      <div className="text-sm">
                        <p className="font-semibold">{junkshop.name}</p>
                        <p className="text-xs text-muted-foreground">{junkshop.address}</p>
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              )}
            </div>

            {/* Coordinates Display */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-muted rounded">
                <p className="text-muted-foreground">Latitude</p>
                <p className="font-mono font-semibold">{lat.toFixed(7)}</p>
              </div>
              <div className="p-2 bg-muted rounded">
                <p className="text-muted-foreground">Longitude</p>
                <p className="font-mono font-semibold">{lng.toFixed(7)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Location Warning */}
      {!hasLocation && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4 flex items-start gap-3">
            <MapPin className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-yellow-900">Location Not Set</p>
              <p className="text-sm text-yellow-800">This junkshop hasn't pinned their location yet. Customers cannot see their exact location on the map.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Clock, Navigation, Search, Mail, X, Satellite } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@/models";

interface Location {
  id: string;
  name: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  operatingHours?: string;
  description?: string;
  materials?: string[];
}

// Mock junkshop locations in Baguio City - KEPT AS FALLBACK
const MOCK_JUNKSHOP_LOCATIONS: Location[] = [];

// Custom professional marker icon
const createJunkshopIcon = () => {
  return L.divIcon({
    html: `
      <div style="
        background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        font-size: 20px;
        font-weight: bold;
      ">
        ♻️
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
    className: "junkshop-marker",
  });
};

// Map controller for auto-fit
function MapController({ filteredLocations }: { filteredLocations: Location[] }) {
  const map = useMap();

  useEffect(() => {
    if (filteredLocations.length === 0) {
      map.setView([16.4023, 120.5960], 13);
      return;
    }

    const bounds = L.latLngBounds(
      filteredLocations.map((loc) => [loc.latitude, loc.longitude])
    );

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [80, 80] });
    }
  }, [filteredLocations, map]);

  return null;
}

export default function RecyclingMap() {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [mapLayer, setMapLayer] = useState<"street" | "satellite" | "dark">("street");

  // Fetch real junkshop users from database
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      return await fetch("/api/users").then(res => res.json());
    },
  });

  // Convert junkshop users to location objects
  useEffect(() => {
    const junkshops = users
      .filter(user => {
        // Must be junkshop with valid coordinates
        if (user.userType !== "junkshop") return false;
        const lat = Number(user.latitude);
        const lng = Number(user.longitude);
        return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
      })
      .map(user => ({
        id: user.id,
        name: user.name,
        address: user.address || "Address not provided",
        phone: user.phone || "Phone not provided",
        latitude: Number(user.latitude),
        longitude: Number(user.longitude),
        operatingHours: "Operating",
        description: `Junkshop by ${user.name}`,
        materials: [],
      }));

    // Use real junkshops if available, otherwise use mock
    const locationsToUse = junkshops.length > 0 ? junkshops : MOCK_JUNKSHOP_LOCATIONS;
    setFilteredLocations(locationsToUse);
  }, [users]);

  const handleGetDirections = (location: Location) => {
    const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(location.address)}`;
    window.open(mapsUrl, "_blank");
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleMessage = (location: Location) => {
    console.log("Message:", location);
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header Section */}
      <div className="space-y-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Recycling Centers</h1>
          <p className="text-muted-foreground">
            Find and connect with premium recycling facilities in Baguio City
          </p>
        </div>

        {/* Search Bar and Controls */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by name, location, or materials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-11 text-base"
            />
          </div>
          
          {/* Map Layer Toggle */}
          <div className="flex gap-2 items-center">
            <Button
              variant={mapLayer === "street" ? "default" : "outline"}
              size="sm"
              onClick={() => setMapLayer("street")}
              className="gap-2"
            >
              <MapPin className="w-4 h-4" />
              Street
            </Button>
            <Button
              variant={mapLayer === "satellite" ? "default" : "outline"}
              size="sm"
              onClick={() => setMapLayer("satellite")}
              className="gap-2"
            >
              <Satellite className="w-4 h-4" />
              Satellite
            </Button>
            <Button
              variant={mapLayer === "dark" ? "default" : "outline"}
              size="sm"
              onClick={() => setMapLayer("dark")}
              className="gap-2"
            >
              🌙 Dark
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        {/* Map Container - Takes 2 columns on large screens */}
        <div className="lg:col-span-2 flex flex-col min-h-[500px]">
          <div className="relative rounded-xl border border-border overflow-hidden shadow-xl flex-1 bg-muted">
            <MapContainer {...({ key:`map-${mapLayer}`, center:[16.4023, 120.5960], zoom:14, style:{ height: "100%", width: "100%" }, className:"z-0" } as any)}>
              {/* Street Map */}
              {mapLayer === "street" && (
                <TileLayer {...({ url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: '&copy; OpenStreetMap contributors' } as any)} />
              )}

              {/* Satellite View */}
              {mapLayer === "satellite" && (
                <TileLayer {...({ url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attribution: "Tiles &copy; Esri" } as any)} />
              )}

              {/* Dark Map */}
              {mapLayer === "dark" && (
                <TileLayer {...({ url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", attribution: '&copy; OpenStreetMap, &copy; CartoDB' } as any)} />
              )}

              {/* Junkshop Markers */}
              {filteredLocations.map((location) => (
                <Marker {...({ key: location.id, position:[location.latitude, location.longitude] as [number, number], icon: createJunkshopIcon(), eventHandlers:{ click: () => setSelectedLocation(location) } } as any)} />
              ))}

              <MapController filteredLocations={filteredLocations} />
            </MapContainer>
          </div>
        </div>

        {/* Details Panel - 1 column */}
        <div className="lg:col-span-1 flex flex-col min-h-0">
          {selectedLocation ? (
            <Card className="flex-1 flex flex-col overflow-hidden shadow-xl">
              <CardHeader className="pb-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-b">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <Badge className="mb-2 bg-green-600 hover:bg-green-700 text-white">
                      Recycling Center
                    </Badge>
                    <CardTitle className="text-xl line-clamp-2">{selectedLocation.name}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedLocation(null)}
                    className="h-8 w-8 p-0 flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="flex-1 space-y-5 p-4 overflow-y-auto">

                {/* Address */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Location</p>
                  <div className="flex gap-2">
                    <MapPin className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm leading-relaxed">{selectedLocation.address}</p>
                  </div>
                </div>

                {/* Hours */}
                {selectedLocation.operatingHours && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Operating Hours</p>
                    <div className="flex gap-2">
                      <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm font-medium">{selectedLocation.operatingHours}</p>
                    </div>
                  </div>
                )}

                {/* Description */}
                {selectedLocation.description && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">About</p>
                    <p className="text-sm leading-relaxed text-muted-foreground">{selectedLocation.description}</p>
                  </div>
                )}

                {/* Materials */}
                {selectedLocation.materials && selectedLocation.materials.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Accepted Materials</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedLocation.materials.map((material) => (
                        <Badge key={material} variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-0">
                          {material}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>

              {/* Action Buttons */}
              <div className="border-t bg-muted/30 p-4 space-y-2">
                <Button
                  onClick={() => handleCall(selectedLocation.phone)}
                  className="w-full h-10 gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Phone className="w-4 h-4" />
                  Call Now
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleGetDirections(selectedLocation)}
                    className="gap-2"
                  >
                    <Navigation className="w-4 h-4" />
                    Directions
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleMessage(selectedLocation)}
                    className="gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Message
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="flex items-center justify-center shadow-xl border-dashed">
              <CardContent className="text-center py-12">
                <div className="mb-4">
                  <MapPin className="w-14 h-14 text-muted-foreground opacity-30 mx-auto" />
                </div>
                <p className="text-muted-foreground font-medium mb-2">Select a location</p>
                <p className="text-sm text-muted-foreground">Click on a marker on the map to view details and contact information</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

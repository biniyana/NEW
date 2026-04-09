import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Phone, Clock, Navigation, Search } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import GetDirectionsButton from "@/components/GetDirectionsButton";
import { useQuery } from "@tanstack/react-query";
import { User } from "@/models";

// Fix for leaflet markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface JunkshopLocation {
  id: string;
  name: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  operatingHours: string;
  acceptedMaterials: string[];
  distance?: number;
}


// Mock junkshop locations in Baguio City - KEPT AS FALLBACK
const MOCK_JUNKSHOP_LOCATIONS: JunkshopLocation[] = [];

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Helper function to filter and convert users to junkshops
const getValidJunkshops = (users: User[]): JunkshopLocation[] => {
  return users
    .filter(user => {
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
      acceptedMaterials: [],
    }));
};

export default function JunkshopLocator() {
  const [locations, setLocations] = useState<JunkshopLocation[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState<string>("All");
  const [selectedJunkshop, setSelectedJunkshop] = useState<JunkshopLocation | null>(null);
  const [showMapView, setShowMapView] = useState(false);

  // Fetch real junkshop users from database
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      return await fetch("/api/users").then(res => res.json());
    },
  });

  // Get user's GPS location and initialize junkshops
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          
          // Convert users to junkshop locations and calculate distances
          let junkshops = getValidJunkshops(users).map(loc => ({
            ...loc,
            distance: calculateDistance(latitude, longitude, loc.latitude, loc.longitude),
          }));

          // Fallback to mock data if no real junkshops
          if (junkshops.length === 0) {
            junkshops = MOCK_JUNKSHOP_LOCATIONS.map(loc => ({
              ...loc,
              distance: calculateDistance(latitude, longitude, loc.latitude, loc.longitude),
            }));
          }

          // Sort by distance
          junkshops.sort((a, b) => (a.distance || 0) - (b.distance || 0));
          setLocations(junkshops);
        },
        (error) => {
          console.log("Geolocation error:", error);
          // Use default Baguio coordinates if location access denied
          const defaultLocation = { latitude: 16.4023, longitude: 120.5960 };
          setUserLocation(defaultLocation);
          
          // Load junkshops without distance calculation
          let junkshops = getValidJunkshops(users);
          
          // Fallback to mock if no real junkshops
          if (junkshops.length === 0) {
            junkshops = MOCK_JUNKSHOP_LOCATIONS;
          }
          
          setLocations(junkshops);
        }
      );
    } else {
      // No geolocation available, just load junkshops
      let junkshops = getValidJunkshops(users);
      
      // Fallback to mock if no real junkshops
      if (junkshops.length === 0) {
        junkshops = MOCK_JUNKSHOP_LOCATIONS;
      }
      
      setLocations(junkshops);
    }
  }, [users]);

  // Filter locations by search query and material
  const filteredLocations = locations.filter((location) => {
    const matchesSearch =
      location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.address.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesMaterial =
      selectedMaterial === "All" || location.acceptedMaterials.includes(selectedMaterial);

    return matchesSearch && matchesMaterial;
  });

  const handleOpenMaps = (location: JunkshopLocation) => {
    // Open Google Maps with directions
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}&destination_place_id=${location.id}`;
    window.open(mapsUrl, "_blank");
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

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

  const allMaterials: string[] = Array.from(
    new Set(locations.flatMap((loc: JunkshopLocation) => loc.acceptedMaterials || []))
  ).sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <MapPin className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold text-foreground">Junk Shop Locator</h1>
        </div>
        <p className="text-muted-foreground">
          Find nearby junkshops in Baguio City and get directions to the closest recycling centers
        </p>
      </div>

      {/* User Location Status */}
      {userLocation && (
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-4 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-emerald-600" />
            <span className="text-sm text-emerald-900">
              📍 Your location detected. Showing junkshops sorted by distance.
            </span>
          </CardContent>
        </Card>
      )}

      {/* Search & Filters */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Search & Filter</CardTitle>
          <div className="flex gap-2">
            <Button
              variant={!showMapView ? "default" : "outline"}
              size="sm"
              onClick={() => setShowMapView(false)}
            >
              List View
            </Button>
            <Button
              variant={showMapView ? "default" : "outline"}
              size="sm"
              onClick={() => setShowMapView(true)}
            >
              Map View
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search junkshop name or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Filter by Material</label>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={selectedMaterial === "All" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedMaterial("All")}
              >
                All Materials
              </Badge>
              {allMaterials.map((material: string) => (
                <Badge
                  key={material}
                  variant={selectedMaterial === material ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedMaterial(material)}
                >
                  {material}
                </Badge>
              ))}
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            Found <strong>{filteredLocations.length}</strong> junkshop
            {filteredLocations.length !== 1 ? "s" : ""}
          </div>
        </CardContent>
      </Card>

      {/* Junkshop List */}
      <div className="space-y-4">
        {showMapView ? (
          // Map View
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Junkshops on Map ({filteredLocations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg overflow-hidden border border-border">
                <MapContainer
                  center={[userLocation?.latitude || 16.4023, userLocation?.longitude || 120.5960] as [number, number]}
                  zoom={13}
                  style={{ height: "500px", width: "100%" }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />

                  {/* User Location */}
                  {userLocation && (
                    <>
                      <Marker position={[userLocation.latitude, userLocation.longitude] as [number, number]} icon={userMarkerIcon}>
                        <Popup>
                          <div className="text-sm font-semibold">Your Location</div>
                        </Popup>
                      </Marker>
                      <Circle center={[userLocation.latitude, userLocation.longitude] as [number, number]} radius={5000} fillOpacity={0.1} />
                    </>
                  )}

                  {/* Junkshops */}
                  {filteredLocations.map((location) => (
                    <Marker
                      key={location.id}
                      position={[location.latitude, location.longitude] as [number, number]}
                      icon={junkshopMarkerIcon}
                      eventHandlers={{ click: () => setSelectedJunkshop(location) }}
                    >
                      <Popup>
                        <div className="text-sm">
                          <p className="font-semibold">{location.name}</p>
                          <p className="text-xs text-muted-foreground">{location.address}</p>
                          <p className="text-xs mt-1">📞 {location.phone}</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
              {filteredLocations.length > 0 && (
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Click on markers to view details and get directions
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          // List View
          <>
            {filteredLocations.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                </CardContent>
              </Card>
            ) : (
              filteredLocations.map((location) => (
                <Card
                  key={location.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
                  onClick={() => setSelectedJunkshop(location)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-bold text-foreground">{location.name}</h3>

                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                          <MapPin className="w-4 h-4" />
                          {location.address}
                          {location.distance && (
                            <span className="ml-2 font-semibold text-primary">
                              {location.distance.toFixed(1)} km away
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="text-foreground">{location.operatingHours}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-primary" />
                        <span className="text-foreground font-mono">{location.phone}</span>
                      </div>
                    </div>

                    {/* Materials */}
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">ACCEPTED MATERIALS:</p>
                      <div className="flex flex-wrap gap-2">
                        {location.acceptedMaterials.map((material) => (
                          <Badge key={material} variant="secondary" className="text-xs">
                            {material}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4 border-t">
                      <GetDirectionsButton
                        latitude={location.latitude}
                        longitude={location.longitude}
                        destinationName={location.name}
                        variant="default"
                        size="sm"
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCall(location.phone);
                        }}
                        className="flex-1"
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Call
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedJunkshop && (
        <Dialog open={!!selectedJunkshop} onOpenChange={() => setSelectedJunkshop(null)}>
          <DialogContent className="max-w-lg">
            {selectedJunkshop && (
              <>
                <DialogHeader>
                  <div className="flex items-center justify-between mb-2">
                    <DialogTitle className="text-2xl">{selectedJunkshop.name}</DialogTitle>

                  </div>
                  <DialogDescription>{selectedJunkshop.address}</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  {/* Contact */}
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Contact
                </h4>
                <p className="text-sm text-muted-foreground font-mono">{selectedJunkshop.phone}</p>
              </div>

              {/* Hours */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Operating Hours
                </h4>
                <p className="text-sm text-muted-foreground">{selectedJunkshop.operatingHours}</p>
              </div>

              {/* Location */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location
                </h4>
                <p className="text-sm text-muted-foreground mb-2">{selectedJunkshop.address}</p>
                {selectedJunkshop.distance && (
                  <p className="text-sm font-semibold text-primary">
                    {selectedJunkshop.distance.toFixed(1)} km from your location
                  </p>
                )}
              </div>

              {/* Materials */}
              <div>
                <h4 className="font-semibold mb-2">Accepted Materials</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedJunkshop.acceptedMaterials.map((material) => (
                    <Badge key={material} variant="secondary">
                      {material}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <GetDirectionsButton
                  latitude={selectedJunkshop.latitude}
                  longitude={selectedJunkshop.longitude}
                  destinationName={selectedJunkshop.name}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() => handleCall(selectedJunkshop.phone)}
                  className="flex-1"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call Now
                </Button>
              </div>
            </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <p className="text-sm text-blue-900">
            💡 <strong>Tip:</strong> Enable location services for better accuracy and automatic distance calculation.
            Click "Get Directions" to open navigation in Google Maps.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

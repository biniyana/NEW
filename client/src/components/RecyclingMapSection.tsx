import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Phone, Clock, Star, Navigation, Search, Loader } from "lucide-react";

// Declare Google Maps namespace
declare global {
  interface Window {
    google: any;
  }
}

interface Location {
  id: string;
  name: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  operatingHours?: string;
  rating: number;
  description?: string;
}

// Junkshops in Baguio City
const JUNKSHOP_LOCATIONS: Location[] = [];

export default function RecyclingMapSection() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredLocations, setFilteredLocations] = useState<Location[]>(JUNKSHOP_LOCATIONS);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [markersLoaded, setMarkersLoaded] = useState(false);

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setMapLoaded(true);
        return;
      }

      // Using demo Google Maps API key (replace with your own)
      const apiKey = "AIzaSyBDjedHw1pwj0Ygdx4wjPv8kQcVS7Qc5jw";
      
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setMapLoaded(true);
      };
      script.onerror = () => {
        console.warn("Google Maps API failed to load. Retrying with fallback...");
        setMapLoaded(true); // Still proceed to show something
      };
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  // Initialize map once API is loaded
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current) return;

    const baguioCenter = { lat: 16.4023, lng: 120.5960 };

    const mapOptions: any = {
      zoom: 14,
      center: baguioCenter,
      mapTypeId: "roadmap",
      disableDefaultUI: false,
      fullscreenControl: true,
      zoomControl: true,
      streetViewControl: false,
      mapTypeControl: true,
    };

    try {
      mapRef.current = new window.google.maps.Map(mapContainerRef.current, mapOptions);
      infoWindowRef.current = new window.google.maps.InfoWindow();
    } catch (error) {
      console.error("Error initializing map:", error);
    }
  }, [mapLoaded]);

  // Update markers when filtered locations change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    if (filteredLocations.length === 0) {
      setMarkersLoaded(true);
      return;
    }

    // Create new markers
    const bounds = new window.google.maps.LatLngBounds();

    filteredLocations.forEach((location) => {
      const markerIcon = {
        path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z",
        fillColor: "#22c55e",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
        scale: 1.5,
        anchor: new window.google.maps.Point(12, 12),
      };

      const marker = new window.google.maps.Marker({
        position: { lat: location.latitude, lng: location.longitude },
        map: mapRef.current,
        title: location.name,
        icon: markerIcon as any,
      });

      marker.addListener("click", () => {
        setSelectedLocation(location);
        infoWindowRef.current?.setContent(`
          <div style="padding: 12px; font-family: system-ui;">
            <div style="font-weight: bold; margin-bottom: 4px;">${location.name}</div>
            <div style="font-size: 12px; color: #666; margin-bottom: 8px;">${location.description}</div>
            <div style="font-size: 12px;">
              <div>Rating: <strong>${location.rating}★</strong></div>
              <div>${location.address}</div>
            </div>
          </div>
        `);
        infoWindowRef.current?.open(mapRef.current, marker);
      });

      markersRef.current.push(marker);
      bounds.extend(marker.getPosition()!);
    });

    // Fit bounds to show all markers
    if (markersRef.current.length > 1) {
      mapRef.current.fitBounds(bounds, { top: 100, bottom: 100, left: 100, right: 100 });
    } else if (markersRef.current.length === 1) {
      mapRef.current.setCenter(markersRef.current[0].getPosition()!);
      mapRef.current.setZoom(15);
    }

    setMarkersLoaded(true);
  }, [filteredLocations]);

  // Search/filter locations
  useEffect(() => {
    if (!searchQuery) {
      setFilteredLocations(JUNKSHOP_LOCATIONS);
      return;
    }

    const filtered = JUNKSHOP_LOCATIONS.filter(
      (loc) =>
        loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setFilteredLocations(filtered);
  }, [searchQuery]);

  const handleGetDirections = (location: Location) => {
    const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(location.address)}`;
    window.open(mapsUrl, "_blank");
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-3 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search by name or location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 h-11 text-base"
        />
      </div>

      {/* Map and Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Container */}
        <div className="lg:col-span-2">
          <Card className="h-[400px] overflow-hidden relative">
            {!mapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-card z-50">
                <div className="flex flex-col items-center gap-2">
                  <Loader className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading map...</p>
                </div>
              </div>
            )}
            {mapLoaded && !markersLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-card/50 z-40">
                <div className="flex flex-col items-center gap-2">
                  <Loader className="w-6 h-6 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading markers...</p>
                </div>
              </div>
            )}
            <div
              ref={mapContainerRef}
              className="w-full h-full bg-gradient-to-br from-blue-50 to-slate-100"
              style={{ minHeight: "400px" }}
            />


          </Card>
        </div>

        {/* Details Panel */}
        <div className="lg:col-span-1 flex flex-col min-h-0">
          {selectedLocation ? (
            <Card className="flex-1 flex flex-col overflow-hidden">
              <CardHeader className="pb-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-b">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">{selectedLocation.name}</CardTitle>
                    <div className="flex items-center gap-1 mt-2">
                      <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                      <span className="font-semibold text-sm">{selectedLocation.rating}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Description */}
                <p className="text-sm text-muted-foreground">{selectedLocation.description}</p>

                {/* Address */}
                <div className="flex gap-3">
                  <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Address</p>
                    <p className="text-sm text-foreground">{selectedLocation.address}</p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex gap-3">
                  <Phone className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Phone</p>
                    <p className="text-sm font-mono text-foreground">{selectedLocation.phone}</p>
                  </div>
                </div>

                {/* Hours */}
                {selectedLocation.operatingHours && (
                  <div className="flex gap-3">
                    <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Hours</p>
                      <p className="text-sm text-foreground">{selectedLocation.operatingHours}</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCall(selectedLocation.phone)}
                    className="flex-1"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleGetDirections(selectedLocation)}
                    className="flex-1"
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Directions
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="flex items-center justify-center bg-card/50 border-dashed">
              <CardContent className="p-6 text-center py-12">
                <div className="mb-3">
                  <MapPin className="w-12 h-12 text-muted-foreground opacity-30 mx-auto" />
                </div>
                <p className="text-muted-foreground font-medium mb-1">Select a location</p>
                <p className="text-xs text-muted-foreground">Click on a marker on the map</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="text-center text-sm text-muted-foreground">
        Showing <strong>{filteredLocations.length}</strong> recycling center{filteredLocations.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}

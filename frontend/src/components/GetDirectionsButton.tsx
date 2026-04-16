import { Button, ButtonProps } from "@/components/ui/button";
import { Navigation } from "lucide-react";

interface GetDirectionsButtonProps extends ButtonProps {
  latitude: number | string;
  longitude: number | string;
  destinationName?: string;
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

export default function GetDirectionsButton({
  latitude,
  longitude,
  destinationName = "Destination",
  variant = "default",
  size = "default",
  className,
  ...props
}: GetDirectionsButtonProps) {
  const handleGetDirections = () => {
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      console.error("Invalid coordinates provided");
      return;
    }

    // Encode the destination name for Google Maps URL
    const encodedName = encodeURIComponent(destinationName);

    // Open Google Maps with directions
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place=${encodedName}`;
    window.open(mapsUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleGetDirections}
      className={className}
      {...props}
    >
      <Navigation className="w-4 h-4 mr-2" />
      Get Directions
    </Button>
  );
}

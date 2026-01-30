import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import MapPinner from "@/components/MapPinner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User as UserType, Item, Request } from "@shared/schema";
import { MapPin, Mail, Phone, Star, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const { data: items = [] } = useQuery<Item[]>({
    queryKey: ["/api/items"],
    queryFn: async () => {
      return await fetch("/api/items").then(res => res.json());
    },
  });

  const { data: requests = [] } = useQuery<Request[]>({
    queryKey: ["/api/requests"],
    queryFn: async () => {
      return await fetch("/api/requests").then(res => res.json());
    },
  });

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr && userStr !== "undefined") {
      setCurrentUser(JSON.parse(userStr));
    }
  }, []);

  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [tempLat, setTempLat] = useState<number | null>(null);
  const [tempLng, setTempLng] = useState<number | null>(null);

  const handleSave = () => {
    if (currentUser) {
      localStorage.setItem("user", JSON.stringify(currentUser));
      toast({
        title: "Profile updated",
        description: "Your changes have been saved",
      });
      setIsEditing(false);
    }
  };

  const handleSaveLocation = async () => {
    if (!currentUser || tempLat === null || tempLng === null) return;
    try {
      const res = await fetch(`/api/users/${currentUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: tempLat, longitude: tempLng }),
      });
      const updated = await res.json();
      const newUser = { ...currentUser, latitude: String(tempLat), longitude: String(tempLng) } as UserType;
      setCurrentUser(newUser);
      localStorage.setItem("user", JSON.stringify(newUser));
      setIsLocationOpen(false);
      toast({ title: "Location saved", description: "Shop location updated" });
    } catch (err) {
      toast({ title: "Save failed", description: "Could not save location", variant: "destructive" });
    }
  };

  if (!currentUser) return null;

  const isHousehold = currentUser.userType === "household";

  // Calculate statistics
  const itemsListed = items.filter(item => item.sellerId === currentUser.id).length;
  const completedTransactions = requests.filter(
    req => req.status === "Completed" && (req.requesterId === currentUser.id || req.responderId === currentUser.id)
  ).length;
  const hasCompletedTransactions = completedTransactions > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Profile</h2>
        <p className="text-muted-foreground">Manage your account information</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Overview */}
        <Card className="md:col-span-1">
          <CardContent className="p-6 text-center">
            <Avatar className="w-24 h-24 mx-auto mb-4">
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {currentUser.name[0]}
              </AvatarFallback>
            </Avatar>
            <h3 className="text-xl font-bold text-foreground mb-2">{currentUser.name}</h3>
            <Badge variant="secondary" className="mb-4">
              {isHousehold ? "🏠 Household" : "🏪 Junkshop"}
            </Badge>
            <div className="flex items-center justify-center gap-2 text-primary">
              <Star className="w-5 h-5 fill-current" />
              <span className="text-lg font-semibold">{currentUser.rating || "4.8"}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">User Rating</p>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Account Information</CardTitle>
              <Button
                variant={isEditing ? "default" : "outline"}
                onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
                data-testid={isEditing ? "button-save" : "button-edit"}
              >
                {isEditing ? "Save Changes" : "Edit Profile"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                {isEditing ? (
                  <Input
                    id="name"
                    value={currentUser.name}
                    onChange={(e) =>
                      setCurrentUser({ ...currentUser, name: e.target.value })
                    }
                    data-testid="input-name"
                  />
                ) : (
                  <span className="text-foreground">{currentUser.name}</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    value={currentUser.email}
                    onChange={(e) =>
                      setCurrentUser({ ...currentUser, email: e.target.value })
                    }
                    data-testid="input-email"
                  />
                ) : (
                  <span className="text-foreground">{currentUser.email}</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                {isEditing ? (
                  <Input
                    id="phone"
                    type="tel"
                    value={currentUser.phone}
                    onChange={(e) =>
                      setCurrentUser({ ...currentUser, phone: e.target.value })
                    }
                    data-testid="input-phone"
                  />
                ) : (
                  <span className="text-foreground">{currentUser.phone}</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                {isEditing ? (
                  <Input
                    id="address"
                    value={currentUser.address}
                    onChange={(e) =>
                      setCurrentUser({ ...currentUser, address: e.target.value })
                    }
                    data-testid="input-address"
                  />
                ) : (
                  <span className="text-foreground">{currentUser.address}</span>
                )}
              </div>
            </div>

            {isEditing && (
              <Button
                variant="outline"
                onClick={() => {
                  const userStr = localStorage.getItem("user");
                  if (userStr) {
                    setCurrentUser(JSON.parse(userStr));
                  }
                  setIsEditing(false);
                }}
                className="w-full"
              >
                Cancel
              </Button>
            )}

            {currentUser.userType === 'junkshop' && (
              <div className="mt-4">
                <Dialog open={isLocationOpen} onOpenChange={setIsLocationOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">Set Shop Location</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Set Shop Location</DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                      <MapPinner
                        initialLatitude={currentUser.latitude ? Number(currentUser.latitude) : undefined}
                        initialLongitude={currentUser.longitude ? Number(currentUser.longitude) : undefined}
                        onLocationSelect={(lat, lng) => {
                          setTempLat(lat);
                          setTempLng(lng);
                        }}
                      />
                      <div className="flex gap-2 mt-4">
                        <Button onClick={handleSaveLocation} className="flex-1">Save Location</Button>
                        <Button variant="outline" onClick={() => setIsLocationOpen(false)} className="flex-1">Close</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-3xl font-bold text-primary mb-2">{isHousehold ? requests.filter(r => r.requesterId === currentUser.id).length : itemsListed}</p>
            <p className="text-sm text-muted-foreground">
              {isHousehold ? "Requests Made" : "Items Listed"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-3xl font-bold text-primary mb-2">{completedTransactions}</p>
            <p className="text-sm text-muted-foreground">Completed Transactions</p>
          </CardContent>
        </Card>
        {hasCompletedTransactions && (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-3xl font-bold text-primary mb-2">
                {new Date(currentUser.createdAt || new Date()).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </p>
              <p className="text-sm text-muted-foreground">Member Since</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

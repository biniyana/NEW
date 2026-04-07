import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import MapPinner from "@/components/MapPinner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User as UserType, Item } from "@shared/schema";
import { MapPin, Mail, Phone, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ref, onValue, update } from "firebase/database";
import { database, auth } from "@/firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function ProfilePage() {
  type ProfileUser = UserType & { uid?: string; profileComplete?: boolean };
  const [currentUser, setCurrentUser] = useState<ProfileUser | null>(null);
  const [authUid, setAuthUid] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const { toast } = useToast();

  // Load current user from localStorage and get auth UID
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr && userStr !== "undefined") {
      const parsed = JSON.parse(userStr);
      const normalizedUser = {
        ...parsed,
        id: parsed.id ?? null,
        uid: parsed.uid ?? parsed.userId ?? null,
      };
      setCurrentUser(normalizedUser);
    }

    // Also get the UID from Firebase auth
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.uid) {
        console.log("Auth UID:", user.uid);
        setAuthUid(user.uid);
      }
    });

    return unsubscribe;
  }, []);

  // Fetch items from Firebase for current user
  useEffect(() => {
    if (!authUid) {
      console.log("No auth UID, skipping items fetch");
      return;
    }

    console.log("Fetching items for user:", authUid);
    const itemsRef = ref(database, "items");

    const unsubscribe = onValue(
      itemsRef,
      (snapshot) => {
        const data = snapshot.val();
        console.log("Items from Firebase:", data);
        if (data) {
          const itemsList: Item[] = Object.values(data)
            .map((item: any) => ({
              id: item.id,
              title: item.title,
              category: item.category,
              price: item.price,
              description: item.description || null,
              imageUrl: item.imageUrl || null,
              imageUrls: item.imageUrls || null,
              sellerId: item.sellerId,
              sellerName: item.sellerName,
              emoji: item.emoji || null,
              status: item.status || "available",
              createdAt: item.createdAt ? new Date(item.createdAt) : null,
            }))
            // Filter only items by current user (compare with Firebase auth UID)
            .filter((item) => {
              const matches = item.sellerId === authUid;
              console.log(`Checking item ${item.id}: sellerId=${item.sellerId}, authUid=${authUid}, matches=${matches}`);
              return matches;
            });

          console.log("Filtered items for current user:", itemsList);
          setItems(itemsList);
        } else {
          setItems([]);
        }
      },
      (error) => {
        console.error("Error fetching items from Firebase:", error);
        toast({
          title: "Error",
          description: "Failed to load your marketplace items",
          variant: "destructive",
        });
      }
    );

    return () => unsubscribe();
  }, [authUid, toast]);

  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [tempLat, setTempLat] = useState<number | null>(null);
  const [tempLng, setTempLng] = useState<number | null>(null);

  const getCurrentUserId = () => currentUser?.id || currentUser?.uid || null;

  const handleSave = async () => {
    if (!currentUser) return;

    const userId = getCurrentUserId();
    if (!userId) {
      toast({
        title: "Save failed",
        description: "Unable to save profile: user identifier is missing.",
        variant: "destructive",
      });
      return;
    }

    try {
      let updatedUser: ProfileUser;

      if (currentUser.id) {
        const response = await apiRequest("PATCH", `/api/users/${currentUser.id}`, {
          name: currentUser.name,
          email: currentUser.email,
          phone: currentUser.phone,
          address: currentUser.address,
          latitude: currentUser.latitude,
          longitude: currentUser.longitude,
        });
        updatedUser = (await response.json()) as ProfileUser;
      } else {
        const firebaseUpdates = {
          name: currentUser.name,
          email: currentUser.email,
          phone: currentUser.phone,
          address: currentUser.address,
          latitude: currentUser.latitude ?? null,
          longitude: currentUser.longitude ?? null,
          updatedAt: new Date().toISOString(),
        };
        await update(ref(database, `users/${userId}`), firebaseUpdates);
        updatedUser = {
          ...currentUser,
          ...firebaseUpdates,
          uid: userId,
          id: currentUser.id ?? undefined,
        };
      }

      setCurrentUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      toast({
        title: "Profile updated",
        description: "Your changes have been saved",
      });
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error?.message || "Unable to save profile changes",
        variant: "destructive",
      });
    }
  };

  const handleSaveLocation = async () => {
    if (!currentUser || tempLat === null || tempLng === null) return;
    const userId = getCurrentUserId();
    if (!userId) {
      toast({ title: "Save failed", description: "Could not save location: missing user ID", variant: "destructive" });
      return;
    }

    try {
      if (currentUser.id) {
        const res = await fetch(`/api/users/${currentUser.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ latitude: tempLat, longitude: tempLng }),
        });
        await res.json();
      } else {
        await update(ref(database, `users/${userId}`), {
          latitude: tempLat,
          longitude: tempLng,
          updatedAt: new Date().toISOString(),
        });
      }

      const newUser = { ...currentUser, latitude: String(tempLat), longitude: String(tempLng) } as ProfileUser;
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

  // Calculate statistics (items already filtered by current user in useEffect)
  const itemsListed = items.length;

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

          </CardContent>
        </Card>

    {/* Household user's marketplace listing count */}
    {isHousehold && (
      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle>Marketplace Listings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-primary">{items.length}</div>
            <div>
              <p className="text-sm text-muted-foreground">
                {items.length === 0
                  ? "You haven't posted any items yet. Head to Marketplace to get started!"
                  : `You have listed ${items.length} item${items.length !== 1 ? "s" : ""} for sale`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )}
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
                        address={currentUser.address}
                        onLocationSelect={(lat, lng, addr) => {
                          setTempLat(lat);
                          setTempLng(lng);
                          if (addr) setCurrentUser({ ...currentUser, address: addr });
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
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-3xl font-bold text-primary mb-2">{itemsListed}</p>
            <p className="text-sm text-muted-foreground">Items Listed</p>
          </CardContent>
        </Card>
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
      </div>
    </div>
  );
}

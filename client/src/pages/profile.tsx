import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import MapPinner from "@/components/MapPinner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Mail, Phone, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { UserController, ItemController } from "@/controllers";
import { User as UserType, Item } from "@/models";
import { ref, update } from "firebase/database";
import { database } from "@/firebase/firebase";

export default function ProfilePage() {
  type ProfileUser = UserType & { uid?: string; profileComplete?: boolean };
  const [currentUser, setCurrentUser] = useState<ProfileUser | null>(null);
  const [authUid, setAuthUid] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const { toast } = useToast();

  // Load current user from localStorage and get auth UID
  useEffect(() => {
    const user = UserController.loadFromLocalStorage();
    if (user) {
      const normalizedUser = {
        ...user,
        id: (user as any).id ?? null,
        uid: (user as any).uid ?? (user as any).userId ?? null,
      };
      setCurrentUser(normalizedUser as ProfileUser);
      setAuthUid((normalizedUser as any).uid);
    }
  }, []);

  // Fetch items from Firebase for current user
  useEffect(() => {
    if (!authUid) {
      console.log("No auth UID, skipping items fetch");
      return;
    }

    const unsubscribe = ItemController.onSellerItems(authUid, (fetchedItems) => {
      console.log("Filtered items for current user:", fetchedItems);
      setItems(fetchedItems);
    });

    return () => unsubscribe();
  }, [authUid, toast]);

  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [tempLat, setTempLat] = useState<number | null>(null);
  const [tempLng, setTempLng] = useState<number | null>(null);

  // 🔐 Security Fix: Prefer uid for Firebase users (household), id for backend users
  // uid is the Firebase authentication identifier and is always reliable
  const getCurrentUserId = () => {
    // For Firebase users (household), uid is the authoritative ID
    if (currentUser?.uid) {
      return currentUser.uid;
    }
    // Fallback to id for non-Firebase users
    if (currentUser?.id) {
      return currentUser.id;
    }
    return null;
  };

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
      let updatedUser: ProfileUser = currentUser;

      // 🔐 Security Fix: Always update Firebase first as the source of truth
      // Firebase is where all household user profiles are stored
      const firebaseUid = currentUser.uid || userId;
      
      try {
        // 🔧 Firebase Fix: Filter out undefined values before updating
        // Firebase does not allow undefined values in update operations
        const firebaseUpdateData: any = {
          name: currentUser.name,
          email: currentUser.email,
          phone: currentUser.phone,
          address: currentUser.address,
          updatedAt: new Date().toISOString(),
        };

        // Only include latitude/longitude if they are defined
        if (currentUser.latitude !== undefined && currentUser.latitude !== null) {
          firebaseUpdateData.latitude = currentUser.latitude;
        }
        if (currentUser.longitude !== undefined && currentUser.longitude !== null) {
          firebaseUpdateData.longitude = currentUser.longitude;
        }

        console.log('📝 [profile] Firebase update data (undefined values filtered):', firebaseUpdateData);

        // Update Firebase Realtime Database with the uid (primary method for household users)
        await UserController.updateProfile(firebaseUid, firebaseUpdateData);
        updatedUser = currentUser;
      } catch (firebaseErr) {
        console.error('❌ Firebase update error:', firebaseErr);
        // If Firebase update fails, that's a critical error - don't proceed
        throw new Error('Failed to update profile in database: ' + (firebaseErr as any).message);
      }

      // 🔐 Security Fix: Sync to backend storage for consistency
      // This ensures the user is also in backend storage for searching/listings
      try {
        const syncData = {
          id: firebaseUid,
          name: currentUser.name,
          email: currentUser.email,
          phone: currentUser.phone,
          address: currentUser.address,
          userType: currentUser.userType || 'household',
          latitude: currentUser.latitude ?? null,
          longitude: currentUser.longitude ?? null,
          profileComplete: true,
        };

        console.log('📤 [profile] Syncing profile to backend:', syncData);

        const response = await fetch("/api/auth/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(syncData),
          credentials: "include",
        });

        console.log('📊 [profile] Sync response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.warn('⚠️ [profile] Profile sync to backend failed with status:', response.status, 'Response:', errorText);
          // Don't throw - allow the save to succeed even if backend sync fails
          // Firebase has the authoritative copy
        } else {
          const result = await response.json();
          console.log('✅ [profile] Profile synced to backend successfully:', result);
        }
      } catch (syncErr) {
        console.warn('⚠️ [profile] Backend sync error (non-critical):', syncErr);
        // Don't throw - Firebase update succeeded, which is what matters
      }

      // Update UI state
      setCurrentUser(updatedUser);
      UserController.saveToLocalStorage(updatedUser as any);
      
      toast({
        title: "Profile updated",
        description: "Your changes have been saved",
      });
      setIsEditing(false);
    } catch (error: any) {
      console.error('❌ [profile] handleSave error:', error);
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
      // 🔐 Firebase First: Update Firebase Realtime Database (primary source of truth)
      const firebaseUid = authUid || (currentUser as any).uid;
      if (!firebaseUid) {
        throw new Error("Unable to identify authenticated user for location save");
      }

      const userRef = ref(database, `users/${firebaseUid}`);
      await update(userRef, {
        latitude: tempLat,
        longitude: tempLng,
        updatedAt: new Date().toISOString(),
      });
      console.log(`📍 [Profile] Location saved to Firebase for user ${firebaseUid}:`, { latitude: tempLat, longitude: tempLng });

      // 🔐 Backend Sync: Also save to backend for consistency
      try {
        const syncData = {
          id: firebaseUid,
          latitude: tempLat,
          longitude: tempLng,
        };

        const res = await fetch(`/api/auth/profile`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: firebaseUid,
            name: currentUser.name,
            email: currentUser.email,
            phone: currentUser.phone,
            address: currentUser.address,
            userType: currentUser.userType || 'household',
            latitude: tempLat,
            longitude: tempLng,
          }),
          credentials: "include",
        });

        if (!res.ok) {
          console.warn('⚠️ [Profile] Backend location sync failed with status:', res.status);
          // Don't throw - Firebase succeeded which is what matters
        } else {
          console.log('✅ [Profile] Location synced to backend successfully');
        }
      } catch (syncErr) {
        console.warn('⚠️ [Profile] Backend location sync error (non-critical):', syncErr);
        // Don't throw - Firebase update succeeded
      }

      // Update UI state
      const newUser = { ...currentUser, latitude: String(tempLat), longitude: String(tempLng) } as ProfileUser;
      setCurrentUser(newUser);
      UserController.saveToLocalStorage(newUser as any);
      setIsLocationOpen(false);
      toast({ title: "Location saved", description: "Shop location updated and map will be updated in real-time" });
    } catch (err: any) {
      console.error("❌ Location save error:", err);
      toast({ 
        title: "Save failed", 
        description: err?.message || "Could not save location", 
        variant: "destructive" 
      });
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
              <Label htmlFor="name">Name</Label>
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
                  <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                    <DialogHeader className="flex-shrink-0">
                      <DialogTitle>Set Shop Location</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto min-h-0">
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
                    </div>
                    <div className="flex gap-2 mt-4 flex-shrink-0 border-t pt-4">
                      <Button onClick={handleSaveLocation} className="flex-1">Save Location</Button>
                      <Button variant="outline" onClick={() => setIsLocationOpen(false)} className="flex-1">Close</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      {isHousehold && (
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
      )}

    </div>
  );
}

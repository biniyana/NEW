import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Recycle, Home, Store } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MapPinner from "@/components/MapPinner";
import { useMutation } from "@tanstack/react-query";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { ref, set } from "firebase/database";
import { auth, database } from "@/firebase/firebase";




export default function CompleteProfile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [userType, setUserType] = useState<"household" | "junkshop" | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [showMapPinner, setShowMapPinner] = useState(false);
  const [authUid, setAuthUid] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.uid) {
        setAuthUid(user.uid);

        // Check if profile is already complete
        const stored = localStorage.getItem("user");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed?.profileComplete) {
              console.log("Profile already complete, redirecting to dashboard");
              setLocation("/dashboard");
              return;
            }
          } catch {
            // Continue with page
          }
        }
      } else {
        const stored = localStorage.getItem("user");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed?.profileComplete) {
              console.log("Profile already complete, redirecting to dashboard");
              setLocation("/dashboard");
              return;
            }
            setAuthUid(parsed?.uid ?? null);
          } catch {
            setAuthUid(null);
          }
        } else {
          // Not authenticated, redirect to login
          setLocation("/login");
        }
      }
    });
    return unsubscribe;
  }, [setLocation]);

  const signupMutation = useMutation({
    mutationFn: async (data: any) => {
      const uid = auth.currentUser?.uid || authUid;
      if (!uid) {
        throw new Error("No authenticated user found. Please log in and try again.");
      }

      if (auth.currentUser && data.name) {
        await updateProfile(auth.currentUser, { displayName: data.name }).catch(() => {
          // Do not block the update if displayName cannot be set.
        });
      }

      const userRef = ref(database, `users/${uid}`);
      const userData = {
        uid,
        name: data.name,
        phone: data.phone,
        address: data.address,
        userType: data.userType,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        profileComplete: true,
        updatedAt: new Date().toISOString(),
      };

      // Save to Firebase Realtime Database
      await set(userRef, userData);

      // Sync to backend storage so junkshops appear in /api/users endpoint
      // IMPORTANT: Wait for this to complete before continuing
      // This ensures junkshop users can be searched by household users
      const email = auth.currentUser?.email || "";
      let syncSuccess = false;
      
      try {
        const profileData = {
          id: uid,
          email: email,
          name: data.name,
          phone: data.phone,
          address: data.address,
          userType: data.userType,
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
        };
        
        console.log('📤 [complete-profile] Syncing profile to backend:', profileData);
        
        const response = await fetch("/api/auth/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profileData),
        });

        console.log('📊 [complete-profile] Sync response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Profile sync failed with status:', response.status, 'Response:', errorText);
        } else {
          const result = await response.json();
          console.log('✅ [complete-profile] Profile synced successfully:', result);
          syncSuccess = true;
        }
      } catch (err) {
        console.error("❌ [complete-profile] Sync error:", err);
      }
      
      // Log final sync status
      console.log(`[complete-profile] Sync ${syncSuccess ? '✅ SUCCESS' : '⚠️ FAILED - proceeding anyway'}`);
      
      return userData;
    },
    onSuccess: (data: any) => {
      console.log('🎉 [complete-profile] Profile mutation success. User saved:', data);
      localStorage.setItem("user", JSON.stringify({
        id: data.uid,
        uid: data.uid,
        name: data.name,
        email: auth.currentUser?.email || "",
        phone: data.phone,
        address: data.address,
        userType: data.userType,
        latitude: data.latitude,
        longitude: data.longitude,
        profileComplete: true,
      }));
      toast({
        title: "Profile saved",
        description: "Your profile has been connected to your account.",
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      console.error('❌ [complete-profile] Profile mutation error:', error);
      toast({
        title: "Save failed",
        description: error.message || "Could not save your profile.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if authenticated
    const currentUid = auth.currentUser?.uid || authUid;
    if (!currentUid) {
      toast({
        title: "Not authenticated",
        description: "Please log in before completing your profile.",
        variant: "destructive",
      });
      return;
    }

    // Validate form fields
    if (!formData.name?.trim() || !formData.phone?.trim() || !formData.address?.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!userType) {
      toast({
        title: "Select account type",
        description: "Please choose if you are a household or junkshop",
        variant: "destructive",
      });
      return;
    }
    if (userType === 'junkshop' && (latitude === null || longitude === null)) {
      toast({ title: 'Set shop location', description: 'Please pin your junkshop location before signing up', variant: 'destructive' });
      return;
    }

    const payload: any = { ...formData, userType };
    if (latitude !== null && longitude !== null) {
      payload.latitude = latitude;
      payload.longitude = longitude;
    }

    signupMutation.mutate(payload);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-lg bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center mb-4">
            <Recycle className="w-10 h-10 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Join Waiz</CardTitle>
          <CardDescription>Create your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>I am a:</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={userType === "household" ? "default" : "outline"}
                  className="h-auto py-3"
                  onClick={() => setUserType("household")}
                  data-testid="button-type-household"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Household
                </Button>
                <Button
                  type="button"
                  variant={userType === "junkshop" ? "default" : "outline"}
                  className="h-auto py-3"
                  onClick={() => setUserType("junkshop")}
                  data-testid="button-type-junkshop"
                >
                  <Store className="w-4 h-4 mr-2" />
                  Junkshop
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name / junkshop name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
                data-testid="input-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+63 XXX XXX XXXX"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                required
                data-testid="input-phone"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">
                {userType === "junkshop" ? "Junkshop Address in Baguio" : "Address in Baguio"}
              </Label>
              <Input
                id="address"
                type="text"
                placeholder="Street, Barangay, Baguio City"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                required
                data-testid="input-address"
              />
              <p className="text-xs text-muted-foreground">📍 Location</p>

              {userType === 'junkshop' && (
                <div className="mt-2">
                  <Button size="sm" variant="outline" onClick={() => setShowMapPinner((s) => !s)}>
                    {showMapPinner ? 'Hide Location Pin' : 'Set Shop Location on Map'}
                  </Button>

                  {showMapPinner && (
                    <div className="mt-3">
                      <MapPinner
                        initialLatitude={latitude ?? undefined}
                        initialLongitude={longitude ?? undefined}
                        address={formData.address}
                        onLocationSelect={(lat, lng, addr) => {
                          setLatitude(lat);
                          setLongitude(lng);
                          if (addr) setFormData(prev => ({ ...prev, address: addr }));
                        }}
                      />
                    </div>
                  )}

                  {latitude !== null && longitude !== null && (
                    <p className="text-sm text-muted-foreground mt-2">Pinned location: {latitude.toFixed(6)}, {longitude.toFixed(6)}</p>
                  )}
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!userType || signupMutation.isPending}
              data-testid="button-submit"
            >
              {signupMutation.isPending ? "Submitting..." : "Submit"}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-3">


          </div>
          
        </CardContent>
      </Card>
    </div>
  );
}



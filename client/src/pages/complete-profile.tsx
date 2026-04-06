import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User as UserType } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Mail, Phone, User as UserIcon, Home } from "lucide-react";

/**
 * Complete Profile Page
 * 
 * Users (especially from Google OAuth) are redirected here if their profile is incomplete.
 * They can fill in missing required fields: phone, address, and select their user type.
 */
export default function CompleteProfilePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    phone: "",
    address: "",
    userType: "household" as "household" | "junkshop",
  });

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr || userStr === "undefined") {
      setLocation("/login");
      return;
    }

    const user = JSON.parse(userStr);
    setCurrentUser(user);

    // Pre-fill form with existing values
    setFormData({
      phone: user.phone || "",
      address: user.address || "",
      userType: user.userType || "household",
    });
  }, [setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      toast({ title: "Error", description: "User not loaded", variant: "destructive" });
      return;
    }

    // Validate required fields
    if (!formData.phone.trim()) {
      toast({ title: "Required", description: "Phone number is required", variant: "destructive" });
      return;
    }

    if (!formData.address.trim()) {
      toast({ title: "Required", description: "Address is required", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      // Update user profile
      const res = await fetch(`/api/users/${currentUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          phone: formData.phone,
          address: formData.address,
          userType: formData.userType,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update profile");
      }

      const updatedUser = await res.json();

      // Update localStorage with complete profile
      const completeUser = {
        ...updatedUser,
        userType: updatedUser.userType || formData.userType,
        profileComplete: true,
      };
      localStorage.setItem("user", JSON.stringify(completeUser));

      toast({
        title: "Profile Complete!",
        description: "Welcome to Waiz. Redirecting to dashboard...",
      });

      // Redirect to dashboard
      setTimeout(() => setLocation("/dashboard"), 1500);
    } catch (err: any) {
      toast({
        title: "Failed to Update Profile",
        description: err.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Complete Your Profile</CardTitle>
          <CardDescription>
            Welcome! Please fill in the required information to finish setting up your account.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Display Name (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                <UserIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">{currentUser.name}</span>
              </div>
              <p className="text-xs text-muted-foreground">Provided by your authentication</p>
            </div>

            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground text-sm break-all">{currentUser.email}</span>
              </div>
              <p className="text-xs text-muted-foreground">Cannot be changed</p>
            </div>

            {/* Phone Number (required) */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+63 917 123 4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  data-testid="input-phone"
                />
              </div>
            </div>

            {/* Address (required) */}
            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <Input
                  id="address"
                  placeholder="123 Street, City, Province"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                  data-testid="input-address"
                />
              </div>
            </div>

            {/* User Type Selection */}
            <div className="space-y-3">
              <Label>Account Type *</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, userType: "household" })}
                  className={`p-3 rounded-lg border-2 transition-colors text-center ${
                    formData.userType === "household"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  data-testid="button-household"
                >
                  <div className="text-xl mb-1">🏠</div>
                  <div className="text-sm font-medium">Household</div>
                  <div className="text-xs text-muted-foreground">Sell recyclables</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, userType: "junkshop" })}
                  className={`p-3 rounded-lg border-2 transition-colors text-center ${
                    formData.userType === "junkshop"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  data-testid="button-junkshop"
                >
                  <div className="text-xl mb-1">🏪</div>
                  <div className="text-sm font-medium">Junkshop</div>
                  <div className="text-xs text-muted-foreground">Manage collections</div>
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
              data-testid="button-complete"
            >
              {isSubmitting ? "Completing..." : "Complete Profile & Enter"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

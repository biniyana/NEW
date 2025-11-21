import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Recycle, Home, Store } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Signup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [userType, setUserType] = useState<"household" | "junkshop" | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
  });

  const signupMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/auth/signup", data);
    },
    onSuccess: (data: any) => {
      localStorage.setItem("user", JSON.stringify(data.user));
      toast({
        title: "Account created!",
        description: "Welcome to Waiz",
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Signup failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userType) {
      toast({
        title: "Select account type",
        description: "Please choose if you are a household or junkshop",
        variant: "destructive",
      });
      return;
    }
    signupMutation.mutate({ ...formData, userType });
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
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
                data-testid="input-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
                data-testid="input-email"
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
              <p className="text-xs text-muted-foreground">📍 Used for location-based matching</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                required
                data-testid="input-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!userType || signupMutation.isPending}
              data-testid="button-submit"
            >
              {signupMutation.isPending ? "Creating account..." : "Sign Up"}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login">
                <span className="text-primary font-semibold hover:underline cursor-pointer" data-testid="link-login">
                  Log In
                </span>
              </Link>
            </p>
            <Link href="/">
              <span className="text-sm text-muted-foreground hover:underline cursor-pointer" data-testid="link-home">
                ← Back to Home
              </span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

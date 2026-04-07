import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Recycle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase/firebase";

function getFirebaseAuthErrorMessage(error: any) {
  if (!error) return "Could not create account.";
  switch (error.code) {
    case "auth/email-already-in-use":
      return "This email is already registered.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    default:
      return error.message || "Could not create account.";
  }
}

export default function Signup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const signupMutation = useMutation({
    mutationFn: async (data: any) => {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      return userCredential.user;
    },
    onSuccess: (user) => {
      // Minimal local storage save
      localStorage.setItem("user", JSON.stringify({
        uid: user.uid,
        email: user.email,
      }));
      
      toast({
        title: "Account created!",
        description: "Welcome to Waiz",
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Signup failed",
        description: getFirebaseAuthErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please make sure both passwords are identical.",
        variant: "destructive",
      });
      return;
    }

    signupMutation.mutate({ 
      email: formData.email, 
      password: formData.password 
    });
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
          <CardDescription>Enter your details to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
              />
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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repeat your password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={signupMutation.isPending}
            >
              {signupMutation.isPending ? "Creating account..." : "Sign Up"}
            </Button>

            <div className="mt-4">
              <hr className="border-t bg-border mb-4" />
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
                onClick={() => (window.location.href = "/auth/google")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21.35 11.1h-9.18v2.92h5.26c-.23 1.3-1.14 2.4-2.42 3.13v2.6h3.9c2.28-2.1 3.6-5.2 3.6-8.92 0-.6-.05-1.18-.12-1.73z" fill="#4285F4"/>
                  <path d="M12.17 22c2.83 0 5.2-.93 6.93-2.52l-3.3-2.62c-.92.62-2.1.99-3.64.99-2.79 0-5.16-1.87-6.01-4.38H2.19v2.75C3.93 19.9 7.77 22 12.17 22z" fill="#34A853"/>
                  <path d="M6.16 13.88a6.99 6.99 0 010-3.74V7.39H2.19a10.96 10.96 0 000 9.22l3.97-2.73z" fill="#FBBC05"/>
                  <path d="M12.17 6.18c1.54 0 2.94.53 4.03 1.56l3.03-3.03C17.36 2.2 14.99 1 12.17 1 7.77 1 3.93 3.1 2.19 6.39l3.97 2.75c.85-2.51 3.22-4.96 6.01-4.96z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login">
                <span className="text-primary font-semibold hover:underline cursor-pointer">
                  Log In
                </span>
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Recycle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      if (!response.ok) throw await response.json();
      return await response.json();
    },
    onSuccess: (data: any) => {
      if (data.requiresOtp) {
        toast({ title: "OTP sent", description: "A verification code was sent to your phone" });
        setLocation(`/verify-otp?userId=${encodeURIComponent(data.userId)}`);
        return;
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      toast({
        title: "Login successful!",
        description: "Welcome back to Waiz",
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = email.trim();
    const pw = password.trim();
    loginMutation.mutate({ email: id, password: pw });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-lg bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center mb-4">
            <Recycle className="w-10 h-10 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>Log in to your Waiz account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email or Phone</Label>
              <Input
                id="email"
                type="text"
                placeholder="Enter your email or phone"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="input-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="input-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
              data-testid="button-submit"
            >
              {loginMutation.isPending ? "Logging in..." : "Log In"}
            </Button>

            {/* Google OAuth button */}
            <div className="mt-4">
              <hr className="border-t bg-border mb-4" />
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
                onClick={() => (window.location.href = "/auth/google")}
                data-testid="button-google"
                aria-label="Continue with Google"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M21.35 11.1h-9.18v2.92h5.26c-.23 1.3-1.14 2.4-2.42 3.13v2.6h3.9c2.28-2.1 3.6-5.2 3.6-8.92 0-.6-.05-1.18-.12-1.73z" fill="#4285F4"/>
                  <path d="M12.17 22c2.83 0 5.2-.93 6.93-2.52l-3.3-2.62c-.92.62-2.1.99-3.64.99-2.79 0-5.16-1.87-6.01-4.38H2.19v2.75C3.93 19.9 7.77 22 12.17 22z" fill="#34A853"/>
                  <path d="M6.16 13.88a6.99 6.99 0 010-3.74V7.39H2.19a10.96 10.96 0 000 9.22l3.97-2.73z" fill="#FBBC05"/>
                  <path d="M12.17 6.18c1.54 0 2.94.53 4.03 1.56l3.03-3.03C17.36 2.2 14.99 1 12.17 1 7.77 1 3.93 3.1 2.19 6.39l3.97 2.75c.85-2.51 3.22-4.96 6.01-4.96z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </Button>
            </div>
          </form> 

          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/signup">
                <span className="text-primary font-semibold hover:underline cursor-pointer" data-testid="link-signup">
                  Sign Up
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

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function VerifyAccount() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const params = new URLSearchParams(window.location.search);
  const email = params.get("email") || "";
  const name = params.get("name") || "";
  const existing = params.get("existing") === "true";

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      toast({ title: "Invalid OAuth response", description: "No email received from provider", variant: "destructive" });
      setLocation("/login");
    }
  }, [email, setLocation, toast]);

  const handleExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const resp = await apiRequest("POST", "/api/auth/login", { email, password });
      if (!resp.ok) throw await resp.json();
      const data = await resp.json();
      if (data.requiresOtp) {
        toast({ title: "OTP sent", description: "A verification code was sent to your phone" });
        setLocation(`/verify-otp?userId=${encodeURIComponent(data.userId)}`);
        return;
      }
      localStorage.setItem("user", JSON.stringify(data.user));
      toast({ title: "Login successful", description: `Welcome back ${data.user.name}` });
      setLocation("/dashboard");
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message || "Incorrect password", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirm) {
      toast({ title: "Passwords don't match", description: "Please confirm your password", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const resp = await apiRequest("POST", "/api/auth/signup", { name, email, password, phone: "", address: "", userType: "household" });
      if (!resp.ok) throw await resp.json();
      const data = await resp.json();
      localStorage.setItem("user", JSON.stringify(data.user));
      toast({ title: "Account created", description: `Welcome ${data.user.name}` });
      setLocation("/dashboard");
    } catch (err: any) {
      toast({ title: "Signup failed", description: err.message || "Could not create account", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Verify account</h2>
        <p className="text-sm text-muted-foreground mb-6">Email: {email}</p>

        {existing ? (
          <form onSubmit={handleExisting} className="space-y-4">
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</Button>
          </form>
        ) : (
          <form onSubmit={handleNew} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" type="text" value={name} disabled />
            </div>
            <div>
              <Label htmlFor="password">Set Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="passwordConfirm">Confirm Password</Label>
              <Input id="passwordConfirm" type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating account..." : "Create account"}</Button>
          </form>
        )}
      </div>
    </div>
  );
}

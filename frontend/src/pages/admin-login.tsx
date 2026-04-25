import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Recycle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { AuthController, UserController } from "@/controllers";

export default function AdminLogin() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const storedUser = UserController.loadFromLocalStorage();
    if (storedUser?.userType === "admin") {
      setLocation("/admin");
      return;
    }
    setIsChecking(false);
  }, [setLocation]);

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      return AuthController.login(data.email, data.password);
    },
    onSuccess: (userData: any) => {
      if (userData.userType !== "admin") {
        toast({
          title: "Access denied",
          description: "This login is not an admin account.",
          variant: "destructive",
        });
        return;
      }

      localStorage.setItem("user", JSON.stringify(userData));
      toast({
        title: "Admin login successful",
        description: "Welcome to the admin dashboard.",
      });
      window.history.replaceState(null, "", "/admin");
      setLocation("/admin");
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: AuthController.getErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email: email.trim(), password: password.trim() });
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
        <div className="text-center">
          <div className="inline-block">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center mb-4 animate-pulse">
              <Recycle className="w-8 h-8 text-primary-foreground" />
            </div>
            <p className="text-muted-foreground">Checking admin session...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-lg bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center mb-4">
            <Recycle className="w-10 h-10 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <CardDescription>Sign in with your admin email and password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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
              />
            </div>

            <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? "Logging in..." : "Sign in as Admin"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>Not an admin? <Link href="/login" className="text-primary underline">Return to regular login</Link>.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

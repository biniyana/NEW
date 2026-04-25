import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Recycle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { UserController } from "@/controllers";
import { clearNavigationState } from "@/utils/authRedirect";

export default function AdminLogin() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isChecking, setIsChecking] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkAdminSession = async () => {
      try {
        const storedUser = UserController.loadFromLocalStorage();
        if (storedUser?.userType === "admin") {
          setLocation("/admin");
          return;
        }

        const currentUser = await UserController.fetchCurrentUser();
        if (currentUser) {
          if (currentUser.userType === "admin") {
            UserController.saveToLocalStorage(currentUser);
            setLocation("/admin");
            return;
          }

          UserController.saveToLocalStorage(currentUser);
          setLocation("/dashboard");
          return;
        }
      } catch (err) {
        console.warn("Failed to validate admin session:", err);
      } finally {
        setIsChecking(false);
      }
    };

    checkAdminSession();
  }, [setLocation]);

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onMutate: () => {
      setIsSubmitting(true);
    },
    onSuccess: (response: any) => {
      const userData = response.user;
      if (userData.userType !== 'admin') {
        toast({
          title: "Access denied",
          description: "Only admin accounts can use this page.",
          variant: "destructive",
        });
        setLocation("/login");
        return;
      }

      UserController.saveToLocalStorage(userData);
      clearNavigationState();
      toast({
        title: "Admin login successful",
        description: "Welcome to the admin panel.",
      });

      const redirectPath = "/admin";
      window.history.replaceState(null, "", redirectPath);
      setLocation(redirectPath);
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid admin credentials.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email: email.trim(), password: password.trim() });
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center animate-spin">
            <Recycle className="w-6 h-6" />
          </div>
          <p className="mt-4 text-muted-foreground">Checking admin session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-3">
              <Recycle className="h-5 w-5 text-primary" />
            </div>
            <CardTitle>Admin Sign In</CardTitle>
          </div>
          <CardDescription>Only authorized admin accounts may access this panel.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in as Admin"}
            </Button>
          </form>
          <div className="mt-4 text-sm text-muted-foreground">
            <p>Want regular access? <Link href="/login" className="text-primary underline">Use standard login</Link></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

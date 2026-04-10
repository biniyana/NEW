// src/pages/login.tsx
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Recycle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { AuthController, UserController } from "@/controllers";

// Firebase imports for Google login
import { signInWithPopup, sendEmailVerification } from "firebase/auth";
import { auth, googleProvider, database } from "../firebase.Config";
import { ref, get, set } from "firebase/database";

export default function Login() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isChecking, setIsChecking] = useState(true);

  // Get query parameters from URL
  const getSearchParams = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      fromSignup: params.get("fromSignup") === "true",
    };
  };

  // Check if user is already authenticated on page load
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        // 🔐 Security Fix: Don't auto-redirect if user is coming from signup
        // This prevents accidental session leaks where the old localStorage user
        // would be used instead of the newly signed-up user
        const { fromSignup } = getSearchParams();
        
        if (fromSignup) {
          // User explicitly navigated from signup to login
          // Let them take action - don't auto-redirect
          console.log("🔐 User coming from signup - skipping auto-redirect for security");
          setIsChecking(false);
          return;
        }

        // First, check localStorage for existing user
        const storedUser = UserController.loadFromLocalStorage();
        if (storedUser) {
          // 🔐 Security Fix: Validate the stored user matches server session
          // This prevents stale session leaks
          try {
            const currentUser = await UserController.fetchCurrentUser();
            if (currentUser && (currentUser.uid === storedUser.id || currentUser.uid === (storedUser as any).uid)) {
              // ✅ Server confirms this user is authenticated - safe to redirect
              console.log("✅ Session validated - redirecting to dashboard");
              setLocation("/dashboard");
              return;
            } else {
              // ⚠️ Stored user doesn't match server session - clear it
              console.warn("⚠️ Stored user doesn't match server session - clearing localStorage");
              UserController.removeFromLocalStorage();
            }
          } catch (err) {
            console.warn("⚠️ Could not validate session against server:", err);
            // Continue to check server session below
          }
        }

        // If not in localStorage or validation failed, try to fetch from server
        const currentUser = await UserController.fetchCurrentUser();
        if (currentUser) {
          // User is authenticated on server, save to localStorage and redirect
          UserController.saveToLocalStorage(currentUser);
          console.log("✅ Server session found - redirecting to dashboard");
          setLocation("/dashboard");
          return;
        }
      } catch (err) {
        console.error("Error checking authentication:", err);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuthentication();
  }, [setLocation]);

  // Email/password login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      return AuthController.login(data.email, data.password);
    },
    onSuccess: (userData: any) => {
      localStorage.setItem("user", JSON.stringify(userData));
      toast({
        title: "Login successful!",
        description: "Welcome back to Waiz",
      });

      // Replace the current history entry with the dashboard page
      // This prevents users from going back to the login page via browser back button
      const redirectPath = userData.profileComplete ? "/dashboard" : "/complete-profile";
      window.history.replaceState(null, "", redirectPath);
      
      setLocation(redirectPath);
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

  // Google login function with first-time and returning user handling
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userRef = ref(database, "users/" + user.uid);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        // First-time login → save user in Realtime DB
        await set(userRef, {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          photo: user.photoURL,
          profileComplete: false,
          createdAt: new Date().toISOString(),
        });

        localStorage.setItem(
          "user",
          JSON.stringify({
            uid: user.uid,
            email: user.email,
            name: user.displayName,
            photo: user.photoURL,
            profileComplete: false,
          })
        );

        toast({
          title: "Welcome!",
          description: "Please complete your profile to continue.",
        });

        // Replace history to prevent going back to login
        window.history.replaceState(null, "", "/complete-profile");
        setLocation("/complete-profile");
      } else {
        // Returning user → check email verification
        if (!user.emailVerified) {
          await sendEmailVerification(user);
          toast({
            title: "Email Verification Sent",
            description: "A verification link has been sent to your Google email. Please verify to continue.",
          });
          // Optional: redirect to a "check your email" page
        } else {
          // Verified → access dashboard
          const userData = snapshot.val();
          localStorage.setItem("user", JSON.stringify(userData));
          toast({
            title: "Login Successful!",
            description: "Welcome back to Waiz",
          });
          
          // Replace history to prevent going back to login
          window.history.replaceState(null, "", "/dashboard");
          setLocation("/dashboard");
        }
      }
    } catch (error: any) {
      toast({
        title: "Google login failed",
        description: error.message,
        variant: "destructive",
      });
      console.error("Google login error:", error);
    }
  };

  // Show loading state while checking authentication
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
        <div className="text-center">
          <div className="inline-block">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center mb-4 animate-pulse">
              <Recycle className="w-8 h-8 text-primary-foreground" />
            </div>
            <p className="text-muted-foreground">Checking authentication...</p>
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
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>Log in to your Waiz account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
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
                onClick={handleGoogleLogin}
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
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    try {
      // Get the user data from query params
      const params = new URLSearchParams(window.location.search);
      const encodedUser = params.get("user");

      if (encodedUser) {
        try {
          // Decode the base64 user data
          const userJson = atob(encodedUser);
          const user = JSON.parse(userJson);
          
          // Store user in localStorage
          localStorage.setItem("user", JSON.stringify(user));
          
          toast({
            title: "Login successful!",
            description: `Welcome ${user.name}!`,
          });
          
          // Redirect to dashboard
          setLocation("/dashboard");
        } catch (parseError) {
          console.error("Failed to parse user data:", parseError);
          toast({
            title: "Authentication error",
            description: "Failed to process login data",
            variant: "destructive",
          });
          setLocation("/login");
        }
      } else {
        toast({
          title: "Authentication failed",
          description: "No user data received",
          variant: "destructive",
        });
        setLocation("/login");
      }
    } catch (error) {
      console.error("Auth callback error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      setLocation("/login");
    }
  }, [setLocation, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Completing login...</h2>
        <p className="text-muted-foreground">Please wait while we set up your account.</p>
      </div>
    </div>
  );
}

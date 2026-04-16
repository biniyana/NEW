import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * Auth Callback Handler
 * 
 * This page is used after Google OAuth to:
 * 1. Fetch the authenticated user from /api/auth/me
 * 2. Check if the user's profile is complete
 * 3. Redirect to /complete-profile if incomplete
 * 4. Redirect to /dashboard if complete
 */
export default function AuthCallback() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    (async () => {
      try {
        // Fetch the authenticated user from the server session
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        
        if (!res.ok) {
          console.error('Failed to fetch user after OAuth callback');
          setLocation('/login');
          return;
        }

        const user = await res.json();
        
        // Ensure userType is set
        if (!user.userType) {
          user.userType = 'household';
        }

        // Store user in localStorage
        localStorage.setItem('user', JSON.stringify(user));

        // Check if profile is complete
        if (user.profileComplete) {
          console.log('Profile complete, redirecting to dashboard');
          setLocation('/dashboard');
        } else {
          console.log('Profile incomplete, redirecting to complete-profile');
          setLocation('/complete-profile');
        }
      } catch (err) {
        console.error('Error in auth callback:', err);
        setLocation('/login');
      }
    })();
  }, [setLocation]);

  // Show a loading state while checking profile
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}

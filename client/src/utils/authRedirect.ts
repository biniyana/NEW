/**
 * 🔐 Auth Redirect Utility
 * 
 * Centralized logic for handling redirects after authentication events.
 * Ensures consistent behavior across login, signup, and profile completion flows.
 * 
 * KEY PRINCIPLE: Always clear navigation state and redirect to a clean dashboard
 */

/**
 * Clear all navigation-related state from storage
 * Call this on logout and before redirecting to login
 * 
 * 🗑️ Clears:
 * - dashboardActiveTab: prevents users from returning to their last tab after logout
 * - Any other navigation/history keys that might persist across sessions
 */
export function clearNavigationState(): void {
  // Remove dashboard tab persistence to force fresh state after login
  localStorage.removeItem("dashboardActiveTab");
  
  // Add other navigation-related keys here as needed
  // For example:
  // localStorage.removeItem("lastVisitedPage");
  // localStorage.removeItem("routeHistory");
  // localStorage.removeItem("navigationStack");
  
  console.log("🗑️ Navigation state cleared - user will start fresh after login");
}

/**
 * Redirect to dashboard with clean state
 * Use after successful login or profile completion
 * 
 * ✅ Ensures:
 * - No dashboard tab state persists from logout
 * - User always lands on home tab
 * - Query parameters are not carried over
 */
export function redirectToDashboard(): void {
  // Clear navigation state before redirecting
  clearNavigationState();
  
  // Use replace to prevent back button returning to login
  window.location.replace("/dashboard");
}

/**
 * Redirect to complete profile page
 * Use after signup when profile is not yet complete
 */
export function redirectToCompleteProfile(): void {
  // Clear navigation state for fresh start
  clearNavigationState();
  
  // Use replace to prevent back button returning to login
  window.location.replace("/complete-profile");
}

/**
 * Redirect to login
 * Use when user is not authenticated or session is invalid
 */
export function redirectToLogin(): void {
  // Clear navigation state to prevent logged-out users seeing old route
  clearNavigationState();
  
  // Use replace to prevent back button issues
  window.location.replace("/login");
}

/**
 * ⚠️ Soft redirect (using wouter's setLocation)
 * For use with React Router / Wouter within the app
 * Does NOT clear navigation state (for navigation within authenticated session)
 * 
 * @param setLocation - The setLocation hook from useLocation()
 * @param path - The path to redirect to
 */
export function softRedirect(setLocation: (path: string) => void, path: string): void {
  setLocation(path);
}

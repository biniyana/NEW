import { Suspense, lazy, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Lazy load pages for better performance
const Landing = lazy(() => import("@/pages/landing"));
const About = lazy(() => import("@/pages/about"));
const Login = lazy(() => import("@/pages/login"));
const Signup = lazy(() => import("@/pages/signup"));
const Privacy = lazy(() => import("@/pages/privacy"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const MessagesPage = lazy(() => import("@/pages/messages"));
const ProfilePage = lazy(() => import("@/pages/profile"));
const AuthCallback = lazy(() => import("@/pages/auth-callback"));

function RedirectToDashboardMessages() {
  const [location, navigate] = useLocation();

  useEffect(() => {
    const search = window.location.search || "";
    const query = search ? `${search}&tab=messages` : "?tab=messages";
    navigate(`/dashboard${query}`, { replace: true });
  }, [navigate, location]);

  return null;
}

const CompleteProfile = lazy(() => import("@/pages/complete-profile"));
const AdminLogin = lazy(() => import("@/pages/admin-login"));
const AdminDashboard = lazy(() => import("@/pages/admin-dashboard"));
const NotFound = lazy(() => import("@/pages/not-found"));

function Router() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/about" component={About} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/login" component={Login} />
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/signup" component={Signup} />
        <Route path="/auth-callback" component={AuthCallback} />
        <Route path="/complete-profile" component={CompleteProfile} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/messages" component={RedirectToDashboardMessages} />
        <Route path="/profile" component={ProfilePage} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

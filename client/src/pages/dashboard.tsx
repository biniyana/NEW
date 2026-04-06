import { useState, useEffect, lazy, Suspense } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Recycle, Home, Package, FileText, MessageCircle, DollarSign, User, LogOut } from "lucide-react";
import { User as UserType, Message } from "@shared/schema";
import MarketplacePage from "@/pages/marketplace";
import RequestsPage from "@/pages/requests";
import MessagesPage from "@/pages/messages";
import RatesPage from "@/pages/rates";
import ProfilePage from "@/pages/profile";
import { ChatbotBubble } from "@/pages/chatbot";

// Lazy load heavy components
const GoogleMapView = lazy(() => import("@/components/GoogleMapView"));
const JunkshopsMap = lazy(() => import("@/components/JunkshopsMap"));
const TransactionAnalytics = lazy(() => import("@/components/TransactionAnalytics"));

export default function Dashboard() {
  const [location, setLocation] = useLocation();
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [activeTab, setActiveTab] = useState("home");

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
    queryFn: async () => {
      const res = await fetch("/api/messages");
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    enabled: !!currentUser?.id,
    staleTime: 1000 * 60,
  });

  const unreadMessagesCount = messages.reduce((count, msg) => {
    if (!currentUser) return count;
    if (msg.receiverId === currentUser.id && String(msg.read) !== "true") {
      return count + 1;
    }
    return count;
  }, 0);

  // sync activeTab from query param when location changes (e.g. via chatbot link)
  useEffect(() => {
    const parts = location.split("?");
    if (parts.length > 1) {
      const params = new URLSearchParams(parts[1]);
      const tab = params.get("tab");
      if (tab) {
        setActiveTab(tab);
      }
    }
  }, [location]);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr && userStr !== "undefined") {
      const user = JSON.parse(userStr);
      // Ensure userType is set; default to household if missing
      if (!user.userType) user.userType = "household";
      
      // If profile is incomplete, redirect to complete-profile
      if (!user.profileComplete) {
        console.log('User profile incomplete, redirecting to complete-profile');
        setLocation('/complete-profile');
        return;
      }
      
      setCurrentUser(user);
      return;
    }

    // Try to fetch authenticated user from server session
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const user = await res.json();
          // Ensure userType is set; default to household if missing
          if (!user.userType) {
            console.warn("User from /api/auth/me missing userType; defaulting to household", user);
            user.userType = "household";
          }
          localStorage.setItem('user', JSON.stringify(user));
          
          // If profile is incomplete, redirect to complete-profile
          if (!user.profileComplete) {
            console.log('User profile incomplete, redirecting to complete-profile');
            setLocation('/complete-profile');
            return;
          }
          
          setCurrentUser(user);
          return;
        } else {
          console.warn('/api/auth/me returned status:', res.status);
        }
      } catch (err) {
        console.error('Failed to fetch auth.me:', err);
      }
      setLocation('/login');
    })();
  }, [setLocation]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (err) {
      console.warn('Logout request failed:', err);
    }
    localStorage.removeItem("user");
    setLocation("/");
  };

  if (!currentUser) {
    return null;
  }

  const isHousehold = currentUser.userType === "household";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-card-border">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden border border-card-border bg-white flex items-center justify-center">
                <img src="/waiz logo.png" alt="Waiz logo" className="w-10 h-10 object-cover" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Waiz</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground" data-testid="text-username">
                👋 {currentUser.name}
              </span>
              <Badge variant="secondary" data-testid="badge-usertype">
                {isHousehold ? "🏠 Household" : "🏪 Junkshop"}
              </Badge>
              <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="button-logout">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-card border-r border-card-border p-6">
          <nav className="space-y-2">
            <Button
              variant={activeTab === "home" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("home")}
              data-testid="button-nav-home"
            >
              <Home className="w-4 h-4 mr-3" />
              Home Feed
            </Button>
            <Button
              variant={activeTab === "items" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("items")}
              data-testid="button-nav-items"
            >
              <Package className="w-4 h-4 mr-3" />
              Marketplace
            </Button>
            <Button
              variant={activeTab === "requests" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("requests")}
              data-testid="button-nav-requests"
            >
              <FileText className="w-4 h-4 mr-3" />
              {isHousehold ? "My Requests" : "Collection Requests"}
            </Button>
            <Button
              variant={activeTab === "messages" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("messages")}
              data-testid="button-nav-messages"
            >
              <div className="flex items-center justify-between w-full gap-3">
                <span className="flex items-center gap-3">
                  <MessageCircle className="w-4 h-4" />
                  Messages
                </span>
                {unreadMessagesCount > 0 && (
                  <Badge variant="secondary" className="text-xs px-2 py-1">
                    {unreadMessagesCount}
                  </Badge>
                )}
              </div>
            </Button>
            <Button
              variant={activeTab === "rates" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("rates")}
              data-testid="button-nav-rates"
            >
              <DollarSign className="w-4 h-4 mr-3" />
              Rate List
            </Button>
            <Button
              variant={activeTab === "profile" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("profile")}
              data-testid="button-nav-profile"
            >
              <User className="w-4 h-4 mr-3" />
              Profile
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeTab === "home" && <DashboardHome currentUser={currentUser} />}
          {activeTab === "items" && <MarketplacePage onNavigateToMessages={() => setActiveTab("messages")} />}
          {activeTab === "requests" && <RequestsPage />}
          {activeTab === "messages" && <MessagesPage />}
          {activeTab === "rates" && <RatesPage />}
          {activeTab === "profile" && <ProfilePage />}
        </main>

        {/* Jarvish Chatbot Bubble */}
        <ChatbotBubble currentUser={currentUser} activeTab={activeTab} />
      </div>
    </div>
  );
}

function DashboardHome({ currentUser }: { currentUser: UserType }) {
  const isHousehold = currentUser.userType === "household";



  const [junkshops, setJunkshops] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/junkshops');
        if (res.ok) {
          const data = await res.json();
          setJunkshops(data);
        }
      } catch (err) {
        console.error('Failed to fetch junkshops for dashboard map:', err);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2 text-foreground">
          {isHousehold ? "🏠 Household Dashboard" : "🏪 Junkshop Dashboard"}
        </h2>
        <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Transaction Analytics: show user-specific analytics in dashboard */}
      <Suspense fallback={<div>Loading analytics...</div>}>
        <TransactionAnalytics currentUser={currentUser} />
      </Suspense>



      {/* Dashboard Map */}
      <Card>
        <CardHeader>
          <CardTitle>Map</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading map...</div>}>
            { (import.meta.env as any).VITE_GOOGLE_MAPS_API_KEY ? (
              <GoogleMapView
                markers={junkshops.filter(j => j.latitude && j.longitude).map((j: any) => ({ id: j.id, name: j.name, address: j.address, latitude: Number(j.latitude), longitude: Number(j.longitude) })) }
                center={ junkshops && junkshops.length > 0 && junkshops[0].latitude ? { lat: Number(junkshops[0].latitude), lng: Number(junkshops[0].longitude) } : undefined }
                height="300px"
              />
            ) : (
              <div>
                <JunkshopsMap
                  junkshops={junkshops}
                  userLocation={currentUser && currentUser.latitude ? { latitude: Number(currentUser.latitude), longitude: Number(currentUser.longitude) } : undefined}
                />
              </div>
            )}
          </Suspense>
        </CardContent>
      </Card>


    </div>
  );
}

function ActivityItem({ text, time }: { text: string; time: string }) {
  return (
    <div className="flex items-start gap-3 pb-4 border-b border-border last:border-0 last:pb-0">
      <div className="text-primary font-bold">•</div>
      <div className="flex-1">
        <p className="text-sm text-foreground">{text}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  );
}

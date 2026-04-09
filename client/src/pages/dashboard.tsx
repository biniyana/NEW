import { useState, useEffect, lazy, Suspense } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Recycle, Home, Package, FileText, MessageCircle, DollarSign, User, LogOut } from "lucide-react";
import { User as UserType, Message } from "@/models";
import { UserController, AuthController, MessageController } from "@/controllers";
import MarketplacePage from "@/pages/marketplace";
import RequestsPage from "@/pages/requests";
import MessagesPage from "@/pages/messages";
import RatesPage from "@/pages/rates";
import ProfilePage from "@/pages/profile";
import { ChatbotBubble } from "@/pages/chatbot";
import { ref, onValue } from "firebase/database";
import { database } from "@/firebase/firebase";

// Lazy load heavy components
const GoogleMapView = lazy(() => import("@/components/GoogleMapView"));
const JunkshopsMap = lazy(() => import("@/components/JunkshopsMap"));
const TransactionAnalytics = lazy(() => import("@/components/TransactionAnalytics"));

export default function Dashboard() {
  const [location, setLocation] = useLocation();
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [activeTab, setActiveTab] = useState("home");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const { data: messages = [], refetch: refetchMessages } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
    queryFn: async () => {
      const res = await fetch("/api/messages");
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    enabled: !!currentUser?.id,
    staleTime: 1000 * 10, // Refresh every 10 seconds for more responsive updates
    refetchInterval: 1000 * 15, // Refetch every 15 seconds for background updates
  });

  // Real-time Firebase listener for immediate notification updates
  useEffect(() => {
    if (!currentUser?.id) return;

    const messagesRef = ref(database, "messages");
    
    const unsubscribe = onValue(
      messagesRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          refetchMessages();
        }
      },
      (error) => {
        console.error("Firebase listener error:", error);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.id, refetchMessages]);

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
    const user = UserController.loadFromLocalStorage();
    if (user) {
      // Ensure userType is set; default to household if missing
      if (!user.userType) user.userType = "household";
      
      // If profile is incomplete, redirect to complete-profile
      if (!(user as any).profileComplete) {
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
        const user = await UserController.fetchCurrentUser();
        if (user) {
          // Ensure userType is set; default to household if missing
          if (!user.userType) {
            console.warn("User missing userType; defaulting to household", user);
            user.userType = "household";
          }
          UserController.saveToLocalStorage(user);
          
          // If profile is incomplete, redirect to complete-profile
          if (!(user as any).profileComplete) {
            console.log('User profile incomplete, redirecting to complete-profile');
            setLocation('/complete-profile');
            return;
          }
          
          setCurrentUser(user);
          return;
        } else {
          console.warn('Failed to fetch current user');
        }
      } catch (err) {
        console.error('Failed to fetch authenticated user:', err);
      }
      setLocation('/login');
    })();
  }, [setLocation]);

  const handleLogout = async () => {
    try {
      await AuthController.logout();
    } catch (err) {
      console.warn('Logout request failed:', err);
    }
    UserController.removeFromLocalStorage();
    setShowLogoutConfirm(false);
    setLocation("/");
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(true);
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
              <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center">
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
              <Button variant="ghost" size="sm" onClick={confirmLogout} data-testid="button-logout">
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
                <span className="flex items-center gap-3 relative">
                  <MessageCircle className="w-4 h-4" />
                  Messages
                  {unreadMessagesCount > 0 && (
                    <span 
                      className="absolute -top-1 -right-2 w-3 h-3 bg-green-500 rounded-full animate-pulse"
                      data-testid="notification-dot"
                      title={`${unreadMessagesCount} unread message${unreadMessagesCount > 1 ? 's' : ''}`}
                    />
                  )}
                </span>
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

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to logout? You'll need to log back in to access your account.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end mt-6">
            <Button variant="outline" onClick={() => setShowLogoutConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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



      {/* Dashboard Map - Display Junkshops */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isHousehold ? "🏪 Nearby Junkshops" : "📍 Shop Network"}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            {isHousehold ? `Found ${junkshops.length} junkshops in your area` : `View all registered junkshops (${junkshops.length} total)`}
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <Suspense fallback={<div className="p-6">Loading map...</div>}>
            { (import.meta.env as any).VITE_GOOGLE_MAPS_API_KEY ? (
              <div className="h-96 rounded-b-lg overflow-hidden">
                <GoogleMapView
                  markers={junkshops.filter(j => j.latitude && j.longitude).map((j: any) => ({ id: j.id, name: j.name, address: j.address, latitude: Number(j.latitude), longitude: Number(j.longitude) })) }
                  center={ junkshops && junkshops.length > 0 && junkshops[0].latitude ? { lat: Number(junkshops[0].latitude), lng: Number(junkshops[0].longitude) } : undefined }
                  height="400px"
                />
              </div>
            ) : (
              <div className="rounded-b-lg overflow-hidden">
                <JunkshopsMap
                  junkshops={junkshops}
                  userLocation={currentUser && currentUser.latitude ? { latitude: Number(currentUser.latitude), longitude: Number(currentUser.longitude) } : undefined}
                  showAll={isHousehold}
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

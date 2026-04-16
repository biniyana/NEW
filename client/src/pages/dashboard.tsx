import { useState, useEffect, lazy, Suspense } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Recycle, Home, Package, FileText, MessageCircle, DollarSign, User, LogOut, Menu } from "lucide-react";
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
  const [hasUnread, setHasUnread] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: messages = [], refetch: refetchMessages } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
    queryFn: async () => {
      const res = await fetch("/api/messages");
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    enabled: !!currentUser?.id,
    staleTime: 1000 * 5, // 5 seconds - data becomes stale faster
    refetchInterval: 1000 * 5, // Refetch every 5 seconds for real-time updates
  });

  // Real-time Firebase listener for immediate notification updates
  // 🟢 Combined listener: refetch API messages AND check Firebase for unread
  useEffect(() => {
    if (!currentUser?.id) return;

    const conversationsRef = ref(database, "conversations");
    
    const unsubscribe = onValue(
      conversationsRef,
      (snapshot) => {
        console.log('🔄 [Dashboard] Conversations changed, refetching messages...');
        
        // 1. Refetch API messages
        refetchMessages();
        
        // 2. Also check Firebase directly for unread messages
        const data = snapshot.val();
        if (data) {
          let hasAnyUnread = false;
          
          Object.entries(data).forEach(([, conv]: [string, any]) => {
            if (conv.messages) {
              Object.values(conv.messages).forEach((msg: any) => {
                if (msg.receiverId === currentUser.id && msg.read === false) {
                  hasAnyUnread = true;
                }
              });
            }
          });

          console.log('🟢 [Dashboard Firebase] Conversations unread check:', {
            currentUserId: currentUser.id,
            hasAnyUnread,
          });

          // Set hasUnread based on Firebase data for immediate feedback
          if (hasAnyUnread) {
            setHasUnread(true);
          }
        }
      },
      (error) => {
        console.error("Firebase listener error:", error);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.id, refetchMessages]);

  // 🟢 Calculate unread notification dot from existing messages state
  useEffect(() => {
    if (!currentUser) return;

    const hasUnreadMessages = messages.some(
      (msg) =>
        msg.receiverId === currentUser.id &&
        String(msg.read) !== "true"
    );

    console.log('🟢 [Dashboard] Unread check:', {
      currentUserId: currentUser.id,
      totalMessages: messages.length,
      unreadMessages: messages.filter(msg => msg.receiverId === currentUser.id && String(msg.read) !== "true"),
      hasUnreadMessages,
      messagesArray: messages,
    });

    setHasUnread(hasUnreadMessages);
  }, [messages, currentUser]);

  const unreadMessagesCount = messages.reduce((count, msg) => {
    if (!currentUser) return count;
    if (msg.receiverId === currentUser.id && String(msg.read) !== "true") {
      return count + 1;
    }
    return count;
  }, 0);

  // 🔄 Ensure hasUnread matches unreadMessagesCount for consistency
  useEffect(() => {
    const shouldHaveUnread = unreadMessagesCount > 0;
    if (hasUnread !== shouldHaveUnread) {
      console.log('🔄 [Dashboard] Syncing hasUnread with unreadMessagesCount:', { unreadMessagesCount, hasUnread, shouldHaveUnread });
      setHasUnread(shouldHaveUnread);
    }
  }, [unreadMessagesCount, hasUnread]);

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
        <div className="px-4 md:px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0">
                  <nav className="space-y-2 p-6 mt-12">
                    <SidebarNav activeTab={activeTab} setActiveTab={setActiveTab} setMobileMenuOpen={setMobileMenuOpen} hasUnread={hasUnread} isHousehold={isHousehold} />
                  </nav>
                </SheetContent>
              </Sheet>
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden flex items-center justify-center">
                <img src="/waiz logo.png" alt="Waiz logo" className="w-8 md:w-10 h-8 md:h-10 object-cover" />
              </div>
              <h1 className="text-lg md:text-xl font-bold text-foreground">Waiz</h1>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <span className="hidden sm:inline text-sm text-muted-foreground" data-testid="text-username">
                👋 {currentUser.name}
              </span>
              <Badge variant="secondary" className="hidden sm:inline-flex" data-testid="badge-usertype">
                {isHousehold ? "🏠 Household" : "🏪 Junkshop"}
              </Badge>
              <div className="sm:hidden text-xs text-muted-foreground flex items-center gap-2">
                <div className="flex flex-col items-end">
                  <span>{currentUser.name}</span>
                  <span className="text-xs">{isHousehold ? "🏠 Household" : "🏪 Junkshop"}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={confirmLogout} data-testid="button-logout" className="text-xs md:text-sm">
                <LogOut className="w-4 h-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop only */}
        <aside className="hidden md:block w-64 bg-card border-r border-card-border p-6 sticky top-20 h-[calc(100vh-80px)] overflow-y-auto">
          <nav className="space-y-2">
            <SidebarNav activeTab={activeTab} setActiveTab={setActiveTab} setMobileMenuOpen={setMobileMenuOpen} hasUnread={hasUnread} isHousehold={isHousehold} />
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6">
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

  // Real-time Firebase listener for junkshop locations
  useEffect(() => {
    // Listen to all users in Firebase Realtime Database
    const usersRef = ref(database, "users");
    
    const unsubscribe = onValue(
      usersRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          // Extract all junkshops with valid locations
          const junkshopsList = Object.entries(data)
            .map(([, user]: [string, any]) => {
              // Ensure we have required fields
              if (!user.userType || user.userType !== "junkshop") return null;
              
              // Only include if they have both latitude and longitude
              const lat = user.latitude ? Number(user.latitude) : null;
              const lng = user.longitude ? Number(user.longitude) : null;
              
              if (!lat || !lng || isNaN(lat) || isNaN(lng)) return null;
              
              return {
                id: user.uid || user.id || "",
                name: user.name || "Junkshop",
                email: user.email || "",
                phone: user.phone || "",
                address: user.address || "",
                latitude: lat,
                longitude: lng,
                userType: user.userType,
              };
            })
            .filter((shop) => shop !== null);
          
          console.log(`📍 [Dashboard] Firebase real-time update: Found ${junkshopsList.length} junkshops with valid locations`);
          setJunkshops(junkshopsList);
        } else {
          console.log("📍 [Dashboard] No users data in Firebase");
          setJunkshops([]);
        }
      },
      (error) => {
        console.error("Firebase junkshops listener error:", error);
        // Fallback to API fetch on listener error
        (async () => {
          try {
            console.log("📍 [Dashboard] Falling back to API fetch for junkshops");
            const res = await fetch('/api/junkshops');
            if (res.ok) {
              const data = await res.json();
              // Filter and convert to junkshops with locations
              const filtered = data
                .filter((j: any) => j.userType === "junkshop" && j.latitude && j.longitude)
                .map((j: any) => ({
                  id: j.id || j.uid || "",
                  name: j.name || "Junkshop",
                  email: j.email || "",
                  phone: j.phone || "",
                  address: j.address || "",
                  latitude: Number(j.latitude),
                  longitude: Number(j.longitude),
                  userType: j.userType,
                }));
              console.log(`📍 [Dashboard] API fallback returned ${filtered.length} junkshops with locations`);
              setJunkshops(filtered);
            }
          } catch (err) {
            console.error('Fallback API fetch failed:', err);
          }
        })();
      }
    );

    return () => unsubscribe();
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
                  markers={junkshops.map((j: any) => ({ 
                    id: j.id, 
                    name: j.name, 
                    address: j.address, 
                    latitude: typeof j.latitude === "string" ? Number(j.latitude) : j.latitude,
                    longitude: typeof j.longitude === "string" ? Number(j.longitude) : j.longitude,
                  }))}
                  center={junkshops.length > 0 ? { 
                    lat: typeof junkshops[0].latitude === "string" ? Number(junkshops[0].latitude) : junkshops[0].latitude,
                    lng: typeof junkshops[0].longitude === "string" ? Number(junkshops[0].longitude) : junkshops[0].longitude,
                  } : undefined}
                  height="400px"
                />
              </div>
            ) : (
              <div className="rounded-b-lg overflow-hidden">
                <JunkshopsMap
                  junkshops={junkshops}
                  userLocation={
                    currentUser && currentUser.latitude !== null && currentUser.latitude !== undefined && currentUser.longitude !== null && currentUser.longitude !== undefined
                      ? { 
                          latitude: typeof currentUser.latitude === "string" ? Number(currentUser.latitude) : currentUser.latitude,
                          longitude: typeof currentUser.longitude === "string" ? Number(currentUser.longitude) : currentUser.longitude,
                        }
                      : undefined
                  }
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

interface SidebarNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setMobileMenuOpen: (open: boolean) => void;
  hasUnread: boolean;
  isHousehold: boolean;
}

function SidebarNav({ activeTab, setActiveTab, setMobileMenuOpen, hasUnread, isHousehold }: SidebarNavProps) {
  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <Button
        variant={activeTab === "home" ? "default" : "ghost"}
        className="w-full justify-start"
        onClick={() => handleTabClick("home")}
        data-testid="button-nav-home"
      >
        <Home className="w-4 h-4 mr-3" />
        Home Feed
      </Button>
      <Button
        variant={activeTab === "items" ? "default" : "ghost"}
        className="w-full justify-start"
        onClick={() => handleTabClick("items")}
        data-testid="button-nav-items"
      >
        <Package className="w-4 h-4 mr-3" />
        Marketplace
      </Button>
      <Button
        variant={activeTab === "requests" ? "default" : "ghost"}
        className="w-full justify-start"
        onClick={() => handleTabClick("requests")}
        data-testid="button-nav-requests"
      >
        <FileText className="w-4 h-4 mr-3" />
        {isHousehold ? "My Requests" : "Collection Requests"}
      </Button>
      <Button
        variant={activeTab === "messages" ? "default" : "ghost"}
        className="w-full justify-start"
        onClick={() => handleTabClick("messages")}
        data-testid="button-nav-messages"
      >
        <div className="flex items-center justify-between w-full gap-3">
          <span className="flex items-center gap-3 relative">
            <MessageCircle className="w-4 h-4" />
            Messages
            {hasUnread && (
              <span 
                className="absolute -top-1 -right-2 w-3 h-3 bg-green-500 rounded-full animate-pulse"
                data-testid="notification-dot"
                title="Unread messages"
              />
            )}
          </span>
        </div>
      </Button>
      <Button
        variant={activeTab === "rates" ? "default" : "ghost"}
        className="w-full justify-start"
        onClick={() => handleTabClick("rates")}
        data-testid="button-nav-rates"
      >
        <DollarSign className="w-4 h-4 mr-3" />
        Rate List
      </Button>
      <Button
        variant={activeTab === "profile" ? "default" : "ghost"}
        className="w-full justify-start"
        onClick={() => handleTabClick("profile")}
        data-testid="button-nav-profile"
      >
        <User className="w-4 h-4 mr-3" />
        Profile
      </Button>
    </>
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

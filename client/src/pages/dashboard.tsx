import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Recycle, Home, Package, FileText, MessageCircle, DollarSign, User, LogOut } from "lucide-react";
import { User as UserType } from "@shared/schema";
import MarketplacePage from "@/pages/marketplace";
import RequestsPage from "@/pages/requests";
import MessagesPage from "@/pages/messages";
import RatesPage from "@/pages/rates";
import ProfilePage from "@/pages/profile";
import { ChatbotBubble } from "@/pages/chatbot";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [activeTab, setActiveTab] = useState("home");

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr || userStr === "undefined") {
      setLocation("/login");
      return;
    }
    setCurrentUser(JSON.parse(userStr));
  }, [setLocation]);

  const handleLogout = () => {
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
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center">
                <Recycle className="w-6 h-6 text-primary-foreground" />
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
              {isHousehold ? "Browse Items" : "My Items"}
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
              <MessageCircle className="w-4 h-4 mr-3" />
              Messages
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
          {activeTab === "items" && <MarketplacePage />}
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
  const [requestCount, setRequestCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const isHousehold = currentUser.userType === "household";

  // Fetch real statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch requests
        const requestsRes = await fetch("/api/requests");
        const allRequests = await requestsRes.json();
        
        // Count active requests for current user
        const activeReqs = allRequests.filter((req: any) => {
          const isRequester = req.requesterId === currentUser.id;
          const isResponder = req.responderId === currentUser.id;
          const isActive = req.status === "Pending" || req.status === "Accepted";
          return (isRequester || isResponder) && isActive;
        }).length;
        setRequestCount(activeReqs);

        // Fetch messages
        const messagesRes = await fetch("/api/messages");
        const allMessages = await messagesRes.json();
        
        // Count unread messages for current user
        const unread = allMessages.filter((msg: any) => 
          msg.recipientId === currentUser.id && !msg.isRead
        ).length;
        setUnreadCount(unread);
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      }
    };

    fetchStats();
  }, [currentUser.id]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2 text-foreground">
          {isHousehold ? "🏠 Household Dashboard" : "🏪 Junkshop Dashboard"}
        </h2>
        <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {isHousehold ? "Active Requests" : "Pending Collections"}
                </p>
                <p className="text-3xl font-bold text-foreground" data-testid="stat-requests">{requestCount}</p>
              </div>
              <Package className="w-10 h-10 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Unread Messages</p>
                <p className="text-3xl font-bold text-foreground" data-testid="stat-messages">{unreadCount}</p>
              </div>
              <MessageCircle className="w-10 h-10 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Rating</p>
                <p className="text-3xl font-bold text-foreground" data-testid="stat-rating">{currentUser.rating || "N/A"}</p>
              </div>
              <div className="text-4xl">⭐</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <ActivityItem
              text="New message from GreenCycle Junkshop"
              time="2 hours ago"
            />
            <ActivityItem
              text={isHousehold ? "Collection request accepted" : "New collection request received"}
              time="5 hours ago"
            />
            <ActivityItem text="Rate list updated" time="1 day ago" />
          </div>
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

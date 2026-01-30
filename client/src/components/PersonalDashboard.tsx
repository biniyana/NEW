import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Request, Message } from "@shared/schema";
import { Store, Mail, Truck, TrendingUp, Clock, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface PersonalDashboardProps {
  currentUser: User;
}

export default function PersonalDashboard({ currentUser }: PersonalDashboardProps) {
  const [stats, setStats] = useState<any>(null);

  // Fetch requests
  const { data: allRequests = [] } = useQuery<Request[]>({
    queryKey: ["/api/requests"],
    queryFn: async () => fetch("/api/requests").then((r) => r.json()).catch(() => []),
  });

  // Fetch messages
  const { data: allMessages = [] } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
    queryFn: async () => fetch("/api/messages").then((r) => r.json()).catch(() => []),
  });

  useEffect(() => {
    const isJunkshop = currentUser?.userType === "junkshop";

    // Filter data for current user
    const userRequests = isJunkshop
      ? allRequests.filter((r: any) => r.responderId === currentUser.id || !r.responderId)
      : allRequests.filter((r: any) => r.requesterId === currentUser.id);

    const userMessages = allMessages.filter(
      (m: any) => m.receiverId === currentUser.id || m.senderId === currentUser.id
    );

    const unreadMessages = userMessages.filter((m: any) => m.read === "false" && m.receiverId === currentUser.id).length;
    const pendingCollections = userRequests.filter((r: any) => r.status === "Pending").length;
    const acceptedCollections = userRequests.filter((r: any) => r.status === "Accepted").length;
    const completedCollections = userRequests.filter((r: any) => r.status === "Completed").length;

    // Recent activity
    const recentActivity = [
      ...userMessages.slice(-3).map((m: any) => ({
        type: "message",
        text: `New message from ${m.senderId === currentUser.id ? m.receiverName : m.senderName}`,
        time: new Date(m.timestamp).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      })),
      ...userRequests.slice(-3).map((r: any) => ({
        type: "request",
        text: `${r.type} request ${r.status === "Pending" ? "received" : r.status.toLowerCase()}`,
        time: new Date(r.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      })),
    ]
      .sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5);

    setStats({
      pendingCollections,
      acceptedCollections,
      completedCollections,
      unreadMessages,
      recentActivity,
      isJunkshop,
    });
  }, [allRequests, allMessages, currentUser]);

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary/10 to-chart-2/10 rounded-lg p-8 border border-primary/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
            <Store className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-1">
              {stats.isJunkshop ? "🏪 Junkshop Dashboard" : "🏠 Household Dashboard"}
            </h2>
            <p className="text-muted-foreground">Welcome back, {currentUser.name}! Here's what's happening today.</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pending Collections</p>
                <p className="text-4xl font-bold text-primary">{stats.pendingCollections}</p>
              </div>
              <Truck className="w-10 h-10 text-amber-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Unread Messages</p>
                <p className="text-4xl font-bold text-primary">{stats.unreadMessages}</p>
              </div>
              <Mail className="w-10 h-10 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Completed</p>
                <p className="text-4xl font-bold text-primary">{stats.completedCollections}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accepted Collections Status */}
      {stats.acceptedCollections > 0 && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <div className="flex-1">
                <p className="font-semibold text-blue-900">{stats.acceptedCollections} Accepted Collections</p>
                <p className="text-sm text-blue-800">Awaiting completion or scheduling</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivity.map((activity: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3 pb-3 border-b last:border-b-0">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{activity.text}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No recent activity yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <Link href="/marketplace">
          <Button className="w-full" size="lg">
            {stats.isJunkshop ? "📦 Browse Collection Requests" : "🛒 Browse Marketplace"}
          </Button>
        </Link>
        <Link href="/messages">
          <Button variant="outline" className="w-full" size="lg">
            💬 Go to Messages
          </Button>
        </Link>
      </div>
    </div>
  );
}

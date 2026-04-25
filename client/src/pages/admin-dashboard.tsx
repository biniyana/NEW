import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserController, AuthController } from "@/controllers";
import { User } from "@/models";
import { LogOut, Users, ClipboardList, BarChart3, DollarSign, Bell } from "lucide-react";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const {
    data: users = [],
    isLoading: usersLoading,
  } = useQuery<User[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await fetch("/api/users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load users");
      return res.json();
    },
    enabled: !!currentUser,
  });

  const {
    data: requests = [],
    isLoading: requestsLoading,
  } = useQuery<any[]>({
    queryKey: ["admin-requests"],
    queryFn: async () => {
      const res = await fetch("/api/requests", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load requests");
      return res.json();
    },
    enabled: !!currentUser,
  });

  const {
    data: rates = [],
    isLoading: ratesLoading,
  } = useQuery<any[]>({
    queryKey: ["admin-rates"],
    queryFn: async () => {
      const res = await fetch("/api/rates", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load rates");
      return res.json();
    },
    enabled: !!currentUser,
  });

  const {
    data: messages = [],
    isLoading: messagesLoading,
  } = useQuery<any[]>({
    queryKey: ["admin-messages"],
    queryFn: async () => {
      const res = await fetch("/api/messages", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load messages");
      return res.json();
    },
    enabled: !!currentUser,
  });

  useEffect(() => {
    const initialize = async () => {
      const user = UserController.loadFromLocalStorage();
      if (user && user.userType === "admin") {
        setCurrentUser(user);
        return;
      }

      const serverUser = await UserController.fetchCurrentUser();
      if (!serverUser || serverUser.userType !== "admin") {
        setLocation("/admin/login");
        return;
      }

      UserController.saveToLocalStorage(serverUser);
      setCurrentUser(serverUser);
    };

    initialize();
  }, [setLocation]);

  const handleLogout = async () => {
    await AuthController.logout();
    setLocation("/login");
  };

  const adminUsers = users.filter((user) => user.userType === "admin").length;
  const totalHouseholds = users.filter((user) => user.userType === "household").length;
  const totalJunkshops = users.filter((user) => user.userType === "junkshop").length;
  const pendingVerifications = (users as any[]).filter((user) => user.userType === "junkshop" && user.verificationStatus !== "Approved").length;

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
          <p className="mt-2 text-muted-foreground">Manage users, verification, pricing, and reports from the backend app.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setLocation("/admin/login")}>Admin Sign In</Button>
          <Button variant="outline" onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" /> Logout</Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Total users</span>
                <Badge>{users.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Households</span>
                <Badge>{totalHouseholds}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Junkshops</span>
                <Badge>{totalJunkshops}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Admins</span>
                <Badge>{adminUsers}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center gap-3">
            <ClipboardList className="h-5 w-5 text-green-600" />
            <CardTitle className="text-base">Verifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Pending junkshop approvals</span>
                <Badge>{pendingVerifications}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Open requests</span>
                <Badge>{requests.length}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-base">Pricing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Total price entries</span>
                <Badge>{rates.length}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-sky-600" />
            <CardTitle className="text-base">Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Messages</span>
                <Badge>{messages.length}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card className="border">
          <CardHeader>
            <CardTitle>Recent admin activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">This view is updated from server data on the backend host.</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li><strong>Users:</strong> {usersLoading ? "Loading…" : `${users.length} total users`}</li>
              <li><strong>Requests:</strong> {requestsLoading ? "Loading…" : `${requests.length} open requests`}</li>
              <li><strong>Rates:</strong> {ratesLoading ? "Loading…" : `${rates.length} price entries`}</li>
              <li><strong>Messages:</strong> {messagesLoading ? "Loading…" : `${messages.length} reports`}</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader>
            <CardTitle>Admin notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              The admin panel is now served by the backend dev host. Use <strong>http://localhost:5006/admin</strong> after signing in.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

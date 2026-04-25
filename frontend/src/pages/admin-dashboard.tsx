import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User as UserType } from "@/models";
import { AuthController, UserController } from "@/controllers";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, ClipboardList, DollarSign, LogOut, MessageCircle, ShieldCheck, Users, XCircle } from "lucide-react";

type AdminUser = UserType & {
  verificationStatus?: string;
  latitude?: string | number | null;
  longitude?: string | number | null;
};

type RequestRow = {
  id: string;
  date: string;
  items: string;
  status: string;
  requesterName: string;
  responderName?: string | null;
};

type RateRow = {
  id: string;
  material: string;
  category: string;
  price: string;
  unit: string;
  icon?: string;
};

type ReportRow = {
  id: string;
  senderName: string;
  receiverName: string;
  content: string;
  timestamp: string;
};

const sectionLabels = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users" },
  { id: "verification", label: "Verifications" },
  { id: "transactions", label: "Transactions" },
  { id: "prices", label: "Prices" },
  { id: "reports", label: "Reports" },
];

const reportFilter = (content: string) => /issue|problem|concern|report|help|support/i.test(content);

const categoryFromItems = (items: string) => {
  const lower = items.toLowerCase();
  if (lower.includes("plastic")) return "Plastic";
  if (/paper|magazine|newspaper|cardboard|carton/.test(lower)) return "Paper";
  if (/metal|aluminum|aluminium|steel|iron/.test(lower)) return "Metal";
  if (lower.includes("glass")) return "Glass";
  if (/electronics|battery|diskette|ink jet|printer/.test(lower)) return "Electronics";
  return "Mixed";
};

const extractQuantity = (items: string) => {
  const match = items.match(/(\d+(?:\.\d+)?)\s*(kg|kilos|kilograms|pcs|pieces|bottles|bags|sets|packs)?/i);
  return match ? match[0] : "N/A";
};

const findRatePrice = (items: string, rates: RateRow[]) => {
  const category = categoryFromItems(items);
  const match = rates.find((rate) => rate.category === category || rate.material.toLowerCase().includes(category.toLowerCase()));
  return match?.price ?? "TBD";
};

export default function AdminDashboard() {
  const [location, setLocation] = useLocation();
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [activeSection, setActiveSection] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [rates, setRates] = useState<RateRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [priceEditId, setPriceEditId] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const storedUser = UserController.loadFromLocalStorage();
    if (!storedUser) {
      setLocation("/admin/login");
      return;
    }
    if (storedUser.userType !== "admin") {
      setLocation("/login");
      return;
    }
    setCurrentUser(storedUser);
    setLoading(false);
  }, [setLocation]);

  useEffect(() => {
    if (!currentUser) return;
    fetchData();
  }, [currentUser]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, requestsRes, ratesRes, messagesRes] = await Promise.all([
        fetch("/api/users", { credentials: "include" }),
        fetch("/api/requests", { credentials: "include" }),
        fetch("/api/rates", { credentials: "include" }),
        fetch("/api/messages", { credentials: "include" }),
      ]);

      if (!usersRes.ok || !requestsRes.ok || !ratesRes.ok || !messagesRes.ok) {
        throw new Error("Unable to load admin data.");
      }

      const usersData = await usersRes.json();
      const requestsData = await requestsRes.json();
      const ratesData = await ratesRes.json();
      const messagesData = await messagesRes.json();

      setUsers(usersData.map((user: any) => ({
        ...user,
        verificationStatus: user.verificationStatus || (user.userType === "junkshop" ? "Pending" : "N/A"),
      })));
      setRequests(requestsData);
      setRates(ratesData);
      setReports(
        messagesData
          .filter((message: any) => reportFilter(message.content))
          .map((message: any) => ({
            id: message.id,
            senderName: message.senderName,
            receiverName: message.receiverName,
            content: message.content,
            timestamp: message.timestamp,
          }))
      );
    } catch (error: any) {
      console.error("Failed to load admin dashboard data:", error);
      toast({
        title: "Failed to load admin data",
        description: error.message || "Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AuthController.logout();
    } catch (error) {
      console.warn(error);
    }
    UserController.removeFromLocalStorage();
    setLocation("/admin/login");
  };

  const handleUpdateVerification = async (user: AdminUser, status: string) => {
    setSubmitting(true);
    try {
      await apiRequest("PATCH", `/api/users/${user.id}`, { verificationStatus: status });
      toast({
        title: `Junkshop ${status}`,
        description: `${user.name} is now ${status.toLowerCase()}.`,
      });
      await fetchData();
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Could not update verification status.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePriceEdit = (rate: RateRow) => {
    setPriceEditId(rate.id);
    setPriceInput(rate.price);
  };

  const handleSavePrice = async () => {
    if (!priceEditId || !priceInput.trim()) {
      toast({ title: "Enter a price", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest("PATCH", `/api/rates/${priceEditId}`, { price: priceInput.trim() });
      toast({ title: "Price updated", description: "Rate has been updated." });
      setPriceEditId(null);
      setPriceInput("");
      await fetchData();
    } catch (error: any) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const summary = useMemo(() => {
    const totalHouseholds = users.filter((user) => user.userType === "household").length;
    const totalJunkshops = users.filter((user) => user.userType === "junkshop").length;
    const pendingVerifications = users.filter((user) => user.userType === "junkshop" && user.verificationStatus !== "Approved").length;
    const completedTransactions = requests.filter((request) => request.status === "Completed").length;
    const recentReports = reports.length;

    return {
      totalUsers: users.length,
      totalHouseholds,
      totalJunkshops,
      pendingVerifications,
      completedTransactions,
      recentReports,
    };
  }, [users, requests, reports]);

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-card border-b border-card-border">
        <div className="flex flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Admin Console</p>
            <h1 className="text-3xl font-bold text-foreground">System Management</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage users, junkshop approvals, rates, and reports from one place.</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary">Admin</Badge>
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="w-4 h-4" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-4">
          <Card>
            <CardContent className="space-y-3">
              <p className="text-sm font-semibold text-muted-foreground">Admin Sections</p>
              <div className="space-y-2">
                {sectionLabels.map((section) => (
                  <Button
                    key={section.id}
                    variant={activeSection === section.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveSection(section.id)}
                  >
                    {section.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
              <CardDescription>Platform snapshot</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Users</p>
                <span className="font-semibold">{summary.totalUsers}</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Junkshops</p>
                <span className="font-semibold">{summary.totalJunkshops}</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Pending verifications</p>
                <span className="font-semibold">{summary.pendingVerifications}</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Completed transactions</p>
                <span className="font-semibold">{summary.completedTransactions}</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Reports</p>
                <span className="font-semibold">{summary.recentReports}</span>
              </div>
            </CardContent>
          </Card>
        </aside>

        <main className="space-y-6">
          {activeSection === "overview" && (
            <Card>
              <CardHeader>
                <CardTitle>Admin Overview</CardTitle>
                <CardDescription>Quick access to the most important system metrics.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3 text-green-600"><ShieldCheck className="w-5 h-5" /> <p className="text-sm font-semibold">Verified Junkshops</p></div>
                  <p className="mt-3 text-3xl font-bold">{summary.totalJunkshops - summary.pendingVerifications}</p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3 text-blue-600"><Users className="w-5 h-5" /> <p className="text-sm font-semibold">Households</p></div>
                  <p className="mt-3 text-3xl font-bold">{summary.totalHouseholds}</p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3 text-yellow-600"><ClipboardList className="w-5 h-5" /> <p className="text-sm font-semibold">Transactions</p></div>
                  <p className="mt-3 text-3xl font-bold">{summary.completedTransactions}</p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3 text-red-600"><MessageCircle className="w-5 h-5" /> <p className="text-sm font-semibold">Reports</p></div>
                  <p className="mt-3 text-3xl font-bold">{summary.recentReports}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === "users" && (
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View all households and junkshops in the system.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-hidden rounded-lg border border-border">
                  <table className="min-w-full border-collapse text-left text-sm">
                    <thead className="bg-muted text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Location</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-t border-border even:bg-muted/50">
                          <td className="px-4 py-3 font-medium text-foreground">{user.name}</td>
                          <td className="px-4 py-3"><Badge variant="secondary">{user.userType}</Badge></td>
                          <td className="px-4 py-3">{user.address || "N/A"}</td>
                          <td className="px-4 py-3">{user.verificationStatus || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === "verification" && (
            <Card>
              <CardHeader>
                <CardTitle>Junkshop Verification</CardTitle>
                <CardDescription>Approve or reject junkshop accounts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {users.filter((user) => user.userType === "junkshop").length === 0 ? (
                  <div className="rounded-lg bg-secondary/10 p-6 text-sm text-muted-foreground">No junkshops found.</div>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-border">
                    <table className="min-w-full border-collapse text-left text-sm">
                      <thead className="bg-muted text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3">Email</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.filter((user) => user.userType === "junkshop").map((user) => (
                          <tr key={user.id} className="border-t border-border even:bg-muted/50">
                            <td className="px-4 py-3">{user.name}</td>
                            <td className="px-4 py-3">{user.email}</td>
                            <td className="px-4 py-3">
                              <Badge variant={user.verificationStatus === "Approved" ? "default" : user.verificationStatus === "Rejected" ? "destructive" : "secondary"}>
                                {user.verificationStatus}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 space-x-2">
                              <Button size="sm" variant="outline" onClick={() => handleUpdateVerification(user, "Approved")} disabled={submitting}>
                                <CheckCircle className="w-4 h-4 mr-1" /> Approve
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleUpdateVerification(user, "Rejected")} disabled={submitting}>
                                <XCircle className="w-4 h-4 mr-1" /> Reject
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeSection === "transactions" && (
            <Card>
              <CardHeader>
                <CardTitle>Transaction Monitoring</CardTitle>
                <CardDescription>Review completed recycle requests.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-hidden rounded-lg border border-border">
                  <table className="min-w-full border-collapse text-left text-sm">
                    <thead className="bg-muted text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Material</th>
                        <th className="px-4 py-3">Quantity</th>
                        <th className="px-4 py-3">Price</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((request) => (
                        <tr key={request.id} className="border-t border-border even:bg-muted/50">
                          <td className="px-4 py-3">{request.date || new Date().toLocaleDateString()}</td>
                          <td className="px-4 py-3">{categoryFromItems(request.items)}</td>
                          <td className="px-4 py-3">{extractQuantity(request.items)}</td>
                          <td className="px-4 py-3">{findRatePrice(request.items, rates)}</td>
                          <td className="px-4 py-3">
                            <Badge variant={request.status === "Completed" ? "default" : request.status === "Pending" ? "secondary" : "outline"}>
                              {request.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === "prices" && (
            <Card>
              <CardHeader>
                <CardTitle>Price Management</CardTitle>
                <CardDescription>Update recyclable material prices quickly.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-hidden rounded-lg border border-border">
                  <table className="min-w-full border-collapse text-left text-sm">
                    <thead className="bg-muted text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">Material</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Price</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rates.map((rate) => (
                        <tr key={rate.id} className="border-t border-border even:bg-muted/50">
                          <td className="px-4 py-3">{rate.material}</td>
                          <td className="px-4 py-3">{rate.category}</td>
                          <td className="px-4 py-3">
                            {priceEditId === rate.id ? (
                              <Input value={priceInput} onChange={(e) => setPriceInput(e.target.value)} />
                            ) : (
                              rate.price
                            )}
                          </td>
                          <td className="px-4 py-3 space-x-2">
                            {priceEditId === rate.id ? (
                              <>
                                <Button size="sm" variant="default" onClick={handleSavePrice} disabled={submitting}>
                                  Save
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setPriceEditId(null)}>
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <Button size="sm" variant="outline" onClick={() => handlePriceEdit(rate)}>
                                Edit
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === "reports" && (
            <Card>
              <CardHeader>
                <CardTitle>User Reports</CardTitle>
                <CardDescription>View feedback and flagged concerns from users.</CardDescription>
              </CardHeader>
              <CardContent>
                {reports.length === 0 ? (
                  <div className="rounded-lg bg-secondary/10 p-6 text-sm text-muted-foreground">No user reports found yet.</div>
                ) : (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div key={report.id} className="rounded-lg border border-border p-4 bg-card">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold">{report.senderName} → {report.receiverName}</p>
                            <p className="text-xs text-muted-foreground">{new Date(report.timestamp).toLocaleString()}</p>
                          </div>
                          <Badge variant="secondary">Report</Badge>
                        </div>
                        <p className="mt-3 text-sm text-foreground">{report.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}

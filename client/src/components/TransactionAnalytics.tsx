import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { TrendingUp, Users, Package, CheckCircle, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@/models";

interface TransactionAnalyticsProps {
  currentUser?: User;
}

export default function TransactionAnalytics({ currentUser }: TransactionAnalyticsProps) {
  const [stats, setStats] = useState<any>(null);

  // Fetch all data
  const { data: items = [] } = useQuery({
    queryKey: ["/api/items"],
    queryFn: async () => fetch("/api/items").then((r) => r.json()).catch(() => []),
  });

  const { data: requests = [] } = useQuery({
    queryKey: ["/api/requests"],
    queryFn: async () => fetch("/api/requests").then((r) => r.json()).catch(() => []),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => fetch("/api/users").then((r) => r.json()).catch(() => []),
  });

  useEffect(() => {
    // If currentUser is provided, show user-specific analytics
    if (currentUser) {
      const userTransactions = requests.filter((r: any) => 
        (r.requesterId === currentUser.id || r.responderId === currentUser.id) && 
        r.status === "Completed"
      );

      const totalTransactions = userTransactions.length;

      // Group by date
      const transactionsByDate = userTransactions.reduce((acc: any, req: any) => {
        const dateStr = new Date(req.date || req.createdAt).toISOString().split('T')[0];
        acc[dateStr] = (acc[dateStr] || 0) + 1;
        return acc;
      }, {});

      const dateChartData = Object.entries(transactionsByDate)
        .sort()
        .slice(-7) // Last 7 days
        .map(([date, count]: any) => ({
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          transactions: count
        }));

      // Extract junk types and quantities (try to parse numeric quantities when available)
      const junkTypeMap: Record<string, number> = {};

      const numberPattern = /(\d+(?:\.\d+)?)(?:\s*(kg|g|kgs|pcs|pc|pieces|lb|lbs))?/gi;

      const extractNearestNumber = (str: string, idx: number) => {
        const matches = Array.from(str.matchAll(numberPattern)).map(m => ({ value: Number(m[1]), index: m.index ?? 0 }));
        if (matches.length === 0) return 1; // default quantity
        let nearest = matches[0];
        let bestDist = Math.abs(nearest.index - idx);
        for (const m of matches) {
          const d = Math.abs(m.index - idx);
          if (d < bestDist) {
            nearest = m;
            bestDist = d;
          }
        }
        return nearest.value || 1;
      };

      userTransactions.forEach((req: any) => {
        const items = (req.items || "").toLowerCase();

        const checkAndAdd = (keywords: string[], displayName: string) => {
          for (const kw of keywords) {
            const idx = items.indexOf(kw);
            if (idx >= 0) {
              const qty = extractNearestNumber(items, idx);
              junkTypeMap[displayName] = (junkTypeMap[displayName] || 0) + qty;
              return; // don't double-count same transaction for other synonyms
            }
          }
        };

        checkAndAdd(['plastic', 'bottle', 'bottles'], 'Plastic');
        checkAndAdd(['paper', 'newspaper', 'newspapers'], 'Paper');
        checkAndAdd(['metal', 'aluminum', 'can', 'cans'], 'Metal');
        checkAndAdd(['glass', 'bottle glass'], 'Glass');
        checkAndAdd(['cardboard', 'box', 'boxes'], 'Cardboard');
        checkAndAdd(['copper'], 'Copper');
      });

      const junkTypeData = Object.entries(junkTypeMap).map(([type, count]) => ({
        name: type,
        value: count
      }));

      // Recent transactions
      const recentTransactions = userTransactions
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      setStats({
        mode: 'user',
        totalTransactions,
        dateChartData,
        junkTypeData,
        recentTransactions,
        currentUser
      });
      return;
    }

    // Show global analytics if no currentUser
    const totalItems = items.length;
    const totalRequests = requests.length;
    const completedRequests = requests.filter((r: any) => r.status === "Completed").length;
    const pendingRequests = requests.filter((r: any) => r.status === "Pending").length;
    const households = allUsers.filter((u: any) => u.userType === "household").length;
    const junkshops = allUsers.filter((u: any) => u.userType === "junkshop").length;
    const totalUsers = allUsers.length;


    // Category breakdown
    const categoryData = Object.entries(
      items.reduce((acc: any, item: any) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {})
    ).map(([category, count]) => ({
      name: category,
      value: count,
    }));

    // Request status breakdown
    const statusData = Object.entries(
      requests.reduce((acc: any, req: any) => {
        acc[req.status] = (acc[req.status] || 0) + 1;
        return acc;
      }, {})
    ).map(([status, count]) => ({
      name: status,
      value: count,
    }));

    // Timeline data (simulated monthly)
    const timelineData = [
      { month: "Jan", items: Math.floor(totalItems * 0.1), requests: Math.floor(totalRequests * 0.1) },
      { month: "Feb", items: Math.floor(totalItems * 0.15), requests: Math.floor(totalRequests * 0.12) },
      { month: "Mar", items: Math.floor(totalItems * 0.2), requests: Math.floor(totalRequests * 0.18) },
      { month: "Apr", items: Math.floor(totalItems * 0.25), requests: Math.floor(totalRequests * 0.22) },
      { month: "May", items: Math.floor(totalItems * 0.3), requests: Math.floor(totalRequests * 0.28) },
      { month: "Jun", items: totalItems, requests: totalRequests },
    ];

    setStats({
      totalItems,
      totalRequests,
      completedRequests,
      pendingRequests,
      households,
      junkshops,
      totalUsers,
      completionRate: totalRequests > 0 ? Math.round((completedRequests / totalRequests) * 100) : 0,
      categoryData: categoryData.length > 0 ? categoryData : [{ name: "No data", value: 1 }],
      statusData: statusData.length > 0 ? statusData : [{ name: "No data", value: 1 }],
      timelineData,
    });
  }, [items, requests, allUsers]);

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  if (!stats)
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    );

  // USER-SPECIFIC ANALYTICS VIEW
  if (stats.mode === 'user') {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold text-foreground">📊 Your Transaction Analytics</h3>
          <p className="text-muted-foreground">Track your completed recycling transactions</p>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Transactions</p>
                  <p className="text-3xl font-bold text-foreground">{stats.totalTransactions}</p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Transaction Types</p>
                  <p className="text-3xl font-bold text-foreground">{stats.junkTypeData.length}</p>
                </div>
                <Package className="w-10 h-10 text-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Recent Activity</p>
                  <p className="text-3xl font-bold text-foreground">{stats.recentTransactions.length}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Timeline Chart */}
          {stats.dateChartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Transaction Timeline (Last 7 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={stats.dateChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="transactions" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Junk Type Distribution */}
          {stats.junkTypeData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Junk Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={stats.junkTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {stats.junkTypeData.map((_entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Completed Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No completed transactions yet
              </p>
            ) : (
              <div className="space-y-3">
                {stats.recentTransactions.map((transaction: any) => (
                  <div
                    key={transaction.id}
                    className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-muted/50"
                  >
                    <Calendar className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{transaction.items}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.date || transaction.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stats.currentUser?.userType === 'household' ? 'Collected by: ' : 'Collected from: '}
                        {stats.currentUser?.id === transaction.requesterId ? transaction.responderName : transaction.requesterName}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-green-600">✓ Completed</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // GLOBAL ANALYTICS VIEW (existing code)
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Items Listed</p>
                <p className="text-3xl font-bold text-primary mt-2">{stats.totalItems}</p>
              </div>
              <Package className="w-10 h-10 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-3xl font-bold text-primary mt-2">{stats.totalRequests}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed Requests</p>
                <p className="text-3xl font-bold text-primary mt-2">{stats.completedRequests}</p>
                <p className="text-xs text-green-600 mt-1">{stats.completionRate}% completion rate</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-3xl font-bold text-primary mt-2">{stats.totalUsers}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.households} households, {stats.junkshops} junkshops
                </p>
              </div>
              <Users className="w-10 h-10 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Items by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Items by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={stats.categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.categoryData.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Request Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Request Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={stats.statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#82ca9d"
                    dataKey="value"
                  >
                    {stats.statusData.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Platform Growth Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={stats.timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="items"
                  stroke="#3b82f6"
                  name="Items Listed"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="requests"
                  stroke="#10b981"
                  name="Requests"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Platform Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-muted-foreground">Avg. Items per User</span>
              <Badge variant="secondary">
                {stats.totalUsers > 0 ? (stats.totalItems / stats.totalUsers).toFixed(1) : 0}
              </Badge>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-muted-foreground">Avg. Requests per Junkshop</span>
              <Badge variant="secondary">
                {stats.junkshops > 0 ? (stats.totalRequests / stats.junkshops).toFixed(1) : 0}
              </Badge>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-muted-foreground">Pending Requests</span>
              <Badge variant="outline">{stats.pendingRequests}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Platform Active</span>
              <Badge className="bg-green-500">✓ Active</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

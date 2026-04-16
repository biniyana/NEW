import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  Package,
  Users,
  Calendar,
  Download,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

// Transaction data
const transactionData = [
  { month: "Jan", junkshop: 45000, household: 12000 },
  { month: "Feb", junkshop: 52000, household: 15000 },
  { month: "Mar", junkshop: 48000, household: 18000 },
  { month: "Apr", junkshop: 61000, household: 21000 },
  { month: "May", junkshop: 55000, household: 19000 },
  { month: "Jun", junkshop: 67000, household: 24000 },
];

const materialsData = [
  { name: "Plastic", value: 35, junkshopCount: 245, householdCount: 312 },
  { name: "Metal", value: 25, junkshopCount: 178, householdCount: 156 },
  { name: "Glass", value: 20, junkshopCount: 142, householdCount: 198 },
  { name: "Cardboard", value: 15, junkshopCount: 106, householdCount: 224 },
  { name: "Electronics", value: 5, junkshopCount: 35, householdCount: 45 },
];

const monthlyTransactions = [
  { date: "Jun 1", junkshop: 2100, household: 890 },
  { date: "Jun 5", junkshop: 2450, household: 1020 },
  { date: "Jun 10", junkshop: 2800, household: 1150 },
  { date: "Jun 15", junkshop: 3100, household: 1280 },
  { date: "Jun 20", junkshop: 2950, household: 1100 },
  { date: "Jun 25", junkshop: 3400, household: 1420 },
  { date: "Jun 30", junkshop: 3650, household: 1580 },
];

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  type: "positive" | "negative" | "neutral";
}

function MetricCard({ title, value, change, icon, type }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            <div className="flex items-center gap-1 mt-2">
              {type === "positive" && <ArrowUp className="w-4 h-4 text-green-600" />}
              {type === "negative" && <ArrowDown className="w-4 h-4 text-red-600" />}
              <span
                className={`text-xs font-semibold ${
                  type === "positive"
                    ? "text-green-600"
                    : type === "negative"
                      ? "text-red-600"
                      : "text-muted-foreground"
                }`}
              >
                {Math.abs(change)}% vs last month
              </span>
            </div>
          </div>
          <div className="text-muted-foreground opacity-30">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TransactionAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState("6m");
  const [entityType, setEntityType] = useState<"all" | "junkshop" | "household">("all");

  // Calculate totals
  const totalJunkshopRevenue = transactionData.reduce((sum, item) => sum + item.junkshop, 0);
  const totalHouseholdRevenue = transactionData.reduce((sum, item) => sum + item.household, 0);
  const totalRevenue = totalJunkshopRevenue + totalHouseholdRevenue;
  const totalTransactions = monthlyTransactions.reduce(
    (sum, item) => sum + item.junkshop + item.household,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Transaction Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into junkshop and household recycling transactions
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedPeriod === "1m" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod("1m")}
            >
              1M
            </Button>
            <Button
              variant={selectedPeriod === "3m" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod("3m")}
            >
              3M
            </Button>
            <Button
              variant={selectedPeriod === "6m" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod("6m")}
            >
              6M
            </Button>
            <Button
              variant={selectedPeriod === "1y" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod("1y")}
            >
              1Y
            </Button>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              variant={entityType === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setEntityType("all")}
            >
              All
            </Button>
            <Button
              variant={entityType === "junkshop" ? "default" : "outline"}
              size="sm"
              onClick={() => setEntityType("junkshop")}
            >
              Junkshops
            </Button>
            <Button
              variant={entityType === "household" ? "default" : "outline"}
              size="sm"
              onClick={() => setEntityType("household")}
            >
              Households
            </Button>
          </div>

          <Button className="gap-2" variant="outline">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Revenue"
          value={`₱${(totalRevenue / 1000).toFixed(0)}K`}
          change={12}
          icon={<DollarSign className="w-12 h-12" />}
          type="positive"
        />
        <MetricCard
          title="Total Transactions"
          value={totalTransactions.toLocaleString()}
          change={8}
          icon={<Package className="w-12 h-12" />}
          type="positive"
        />
        <MetricCard
          title="Active Junkshops"
          value={6}
          change={0}
          icon={<Users className="w-12 h-12" />}
          type="neutral"
        />
        <MetricCard
          title="Active Households"
          value={48}
          change={15}
          icon={<TrendingUp className="w-12 h-12" />}
          type="positive"
        />
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Junkshop vs Household Revenue */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Comparison</CardTitle>
            <CardDescription>Junkshop vs Household revenue trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={transactionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="junkshop" fill="#22c55e" name="Junkshop Revenue" />
                <Bar dataKey="household" fill="#3b82f6" name="Household Revenue" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Junkshop Revenue</p>
                <p className="text-2xl font-bold">₱{(totalJunkshopRevenue / 1000).toFixed(0)}K</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {((totalJunkshopRevenue / totalRevenue) * 100).toFixed(0)}% of total
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Household Revenue</p>
                <p className="text-2xl font-bold">₱{(totalHouseholdRevenue / 1000).toFixed(0)}K</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {((totalHouseholdRevenue / totalRevenue) * 100).toFixed(0)}% of total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Volume Trend</CardTitle>
            <CardDescription>Daily transaction activity for June 2024</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTransactions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="junkshop"
                  stroke="#22c55e"
                  name="Junkshop Transactions"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="household"
                  stroke="#3b82f6"
                  name="Household Transactions"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Materials Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Materials Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Materials Distribution</CardTitle>
            <CardDescription>Breakdown by material type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={materialsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {materialsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Materials Details */}
        <Card>
          <CardHeader>
            <CardTitle>Material Statistics</CardTitle>
            <CardDescription>Transaction count by material type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {materialsData.map((material) => (
                <div key={material.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor:
                            COLORS[materialsData.indexOf(material) % COLORS.length],
                        }}
                      />
                      <span className="font-semibold">{material.name}</span>
                      <Badge variant="secondary" className="ml-auto">
                        {material.value}%
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-green-50 dark:bg-green-950 p-2 rounded">
                      <p className="text-muted-foreground">Junkshop Transactions</p>
                      <p className="font-bold text-green-600 dark:text-green-400">
                        {material.junkshopCount}
                      </p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-950 p-2 rounded">
                      <p className="text-muted-foreground">Household Transactions</p>
                      <p className="font-bold text-blue-600 dark:text-blue-400">
                        {material.householdCount}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Average Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Junkshop Average</p>
                <p className="text-3xl font-bold">₱{(totalJunkshopRevenue / 245).toFixed(0)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Household Average</p>
                <p className="text-3xl font-bold">₱{(totalHouseholdRevenue / 312).toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <span className="text-sm font-semibold">EcoRecycle Baguio</span>
                <Badge className="bg-green-600">₱24.5K</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <span className="text-sm font-semibold">GreenWaste Solutions</span>
                <Badge className="bg-green-600">₱18.2K</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <span className="text-sm font-semibold">BaguioJunk Hub</span>
                <Badge className="bg-green-600">₱15.8K</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Growth Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Monthly Growth</p>
                <p className="text-2xl font-bold text-green-600">+12%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">User Growth</p>
                <p className="text-2xl font-bold text-green-600">+8%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Transaction Growth</p>
                <p className="text-2xl font-bold text-blue-600">+15%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

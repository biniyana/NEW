import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Plus, Edit2, Trash2, Clock, DollarSign, Weight, Package, Home, Settings, LogOut } from "lucide-react";
import { User as UserType } from "@shared/schema";

interface MaterialTransaction {
  id: string;
  date: string;
  materialType: string;
  weight: number;
  unit: string;
  pricePerUnit: number;
  totalValue: number;
  status: "completed" | "pending" | "rejected";
}

interface DailyStats {
  totalTransactions: number;
  totalWeight: number;
  totalValue: number;
  averagePrice: number;
}

interface MaterialInventory {
  type: string;
  currentWeight: number;
  unit: string;
  pricePerUnit: number;
  totalValue: number;
  lastUpdated: string;
}

export default function JunkshopUI({ currentUser, onNavigate }: { currentUser: UserType; onNavigate: (section: string) => void }) {
  const { toast } = useToast();
  const [activeNav, setActiveNav] = useState("dashboard");
  const [transactions, setTransactions] = useState<MaterialTransaction[]>([]);
  const [inventory, setInventory] = useState<MaterialInventory[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats>({
    totalTransactions: 0,
    totalWeight: 0,
    totalValue: 0,
    averagePrice: 0,
  });

  const [newTransaction, setNewTransaction] = useState({
    materialType: "",
    weight: "",
    unit: "kg",
    pricePerUnit: "",
  });

  // Initialize mock data
  useEffect(() => {
    const mockTransactions: MaterialTransaction[] = [
      {
        id: "1",
        date: new Date().toISOString(),
        materialType: "Plastic Bottles",
        weight: 25,
        unit: "kg",
        pricePerUnit: 15,
        totalValue: 375,
        status: "completed",
      },
      {
        id: "2",
        date: new Date(Date.now() - 3600000).toISOString(),
        materialType: "Cardboard Boxes",
        weight: 40,
        unit: "kg",
        pricePerUnit: 8,
        totalValue: 320,
        status: "completed",
      },
      {
        id: "3",
        date: new Date(Date.now() - 7200000).toISOString(),
        materialType: "Aluminum Cans",
        weight: 15,
        unit: "kg",
        pricePerUnit: 45,
        totalValue: 675,
        status: "completed",
      },
    ];

    const mockInventory: MaterialInventory[] = [
      { type: "Plastic Bottles", currentWeight: 125, unit: "kg", pricePerUnit: 15, totalValue: 1875, lastUpdated: new Date().toISOString() },
      { type: "Cardboard Boxes", currentWeight: 280, unit: "kg", pricePerUnit: 8, totalValue: 2240, lastUpdated: new Date().toISOString() },
      { type: "Aluminum Cans", currentWeight: 45, unit: "kg", pricePerUnit: 45, totalValue: 2025, lastUpdated: new Date().toISOString() },
      { type: "Glass Bottles", currentWeight: 60, unit: "kg", pricePerUnit: 12, totalValue: 720, lastUpdated: new Date().toISOString() },
      { type: "Copper Wire", currentWeight: 35, unit: "kg", pricePerUnit: 120, totalValue: 4200, lastUpdated: new Date().toISOString() },
    ];

    setTransactions(mockTransactions);
    setInventory(mockInventory);

    const totalValue = mockTransactions.reduce((sum, t) => sum + t.totalValue, 0);
    const totalWeight = mockTransactions.reduce((sum, t) => sum + t.weight, 0);
    setDailyStats({
      totalTransactions: mockTransactions.length,
      totalWeight,
      totalValue,
      averagePrice: mockTransactions.length > 0 ? totalValue / mockTransactions.length : 0,
    });
  }, []);

  const handleAddTransaction = () => {
    if (!newTransaction.materialType || !newTransaction.weight || !newTransaction.pricePerUnit) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    const weight = parseFloat(newTransaction.weight);
    const pricePerUnit = parseFloat(newTransaction.pricePerUnit);
    const totalValue = weight * pricePerUnit;

    const transaction: MaterialTransaction = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      materialType: newTransaction.materialType,
      weight,
      unit: newTransaction.unit,
      pricePerUnit,
      totalValue,
      status: "completed",
    };

    setTransactions([transaction, ...transactions]);
    
    // Update daily stats
    setDailyStats({
      totalTransactions: dailyStats.totalTransactions + 1,
      totalWeight: dailyStats.totalWeight + weight,
      totalValue: dailyStats.totalValue + totalValue,
      averagePrice: (dailyStats.totalValue + totalValue) / (dailyStats.totalTransactions + 1),
    });

    setNewTransaction({ materialType: "", weight: "", unit: "kg", pricePerUnit: "" });
    toast({
      title: "Success",
      description: `Transaction recorded: ${weight}kg of ${newTransaction.materialType}`,
    });
  };

  const handleDeleteTransaction = (id: string) => {
    const transaction = transactions.find(t => t.id === id);
    if (transaction) {
      setTransactions(transactions.filter((t) => t.id !== id));
      setDailyStats({
        totalTransactions: Math.max(0, dailyStats.totalTransactions - 1),
        totalWeight: Math.max(0, dailyStats.totalWeight - transaction.weight),
        totalValue: Math.max(0, dailyStats.totalValue - transaction.totalValue),
        averagePrice: dailyStats.totalTransactions > 1 
          ? (dailyStats.totalValue - transaction.totalValue) / (dailyStats.totalTransactions - 1)
          : 0,
      });
    }
    toast({
      title: "Deleted",
      description: "Transaction removed",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-PH", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleNavigation = (section: string) => {
    setActiveNav(section);
    onNavigate(section);
  };

  // Dashboard Content
  const renderDashboard = () => (
    <div className="space-y-4">
      {/* Summary Panels */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600">Total Value Today</p>
                <p className="text-2xl font-bold text-emerald-700 mt-1">{formatCurrency(dailyStats.totalValue)}</p>
              </div>
              <DollarSign className="w-10 h-10 text-emerald-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600">Total Weight</p>
                <p className="text-2xl font-bold text-blue-700 mt-1">{dailyStats.totalWeight} kg</p>
              </div>
              <Weight className="w-10 h-10 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600">Transactions</p>
                <p className="text-2xl font-bold text-purple-700 mt-1">{dailyStats.totalTransactions}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600">Avg. Price</p>
                <p className="text-2xl font-bold text-orange-700 mt-1">{formatCurrency(dailyStats.averagePrice)}</p>
              </div>
              <Package className="w-10 h-10 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Entry Form */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="pb-3 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Quick Entry - Record Material
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-6 gap-3 items-end">
            <div className="col-span-2">
              <Label className="text-xs font-medium mb-1 block">Material Type</Label>
              <Select value={newTransaction.materialType} onValueChange={(v) => setNewTransaction({ ...newTransaction, materialType: v })}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Plastic Bottles">🍾 Plastic Bottles</SelectItem>
                  <SelectItem value="Cardboard Boxes">📦 Cardboard Boxes</SelectItem>
                  <SelectItem value="Aluminum Cans">🥫 Aluminum Cans</SelectItem>
                  <SelectItem value="Glass Bottles">🍷 Glass Bottles</SelectItem>
                  <SelectItem value="Copper Wire">🔌 Copper Wire</SelectItem>
                  <SelectItem value="Steel Scrap">⚙️ Steel Scrap</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium mb-1 block">Weight</Label>
              <Input
                type="number"
                placeholder="kg"
                value={newTransaction.weight}
                onChange={(e) => setNewTransaction({ ...newTransaction, weight: e.target.value })}
                className="h-9 text-sm"
                onKeyPress={(e) => e.key === "Enter" && handleAddTransaction()}
              />
            </div>

            <div>
              <Label className="text-xs font-medium mb-1 block">Unit</Label>
              <Select value={newTransaction.unit} onValueChange={(v) => setNewTransaction({ ...newTransaction, unit: v })}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="ton">ton</SelectItem>
                  <SelectItem value="pcs">pcs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium mb-1 block">Price/Unit</Label>
              <Input
                type="number"
                placeholder="₱"
                value={newTransaction.pricePerUnit}
                onChange={(e) => setNewTransaction({ ...newTransaction, pricePerUnit: e.target.value })}
                className="h-9 text-sm"
                onKeyPress={(e) => e.key === "Enter" && handleAddTransaction()}
              />
            </div>

            {newTransaction.weight && newTransaction.pricePerUnit && (
              <div className="bg-emerald-50 p-2 rounded border border-emerald-200">
                <p className="text-xs text-slate-600">Total</p>
                <p className="text-lg font-bold text-emerald-700">
                  {formatCurrency(parseFloat(newTransaction.weight) * parseFloat(newTransaction.pricePerUnit))}
                </p>
              </div>
            )}

            <Button
              onClick={handleAddTransaction}
              className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium"
            >
              Record
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tables Section */}
      <div className="grid grid-cols-3 gap-4">
        {/* Recent Transactions */}
        <div className="col-span-2">
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-3 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Recent Transactions (Today)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-xs font-semibold text-slate-700 py-2 px-3">Time</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-700 py-2 px-3">Material</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-700 py-2 px-3">Weight</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-700 py-2 px-3">Price/Unit</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-700 py-2 px-3">Total Value</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-700 py-2 px-3">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-700 py-2 px-3">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-6 text-slate-500 text-sm">
                          No transactions yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions.map((transaction) => (
                        <TableRow key={transaction.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <TableCell className="text-xs text-slate-700 py-2 px-3">{formatDate(transaction.date)}</TableCell>
                          <TableCell className="text-xs font-medium text-slate-900 py-2 px-3">{transaction.materialType}</TableCell>
                          <TableCell className="text-xs text-slate-700 py-2 px-3 font-mono">{transaction.weight} {transaction.unit}</TableCell>
                          <TableCell className="text-xs text-slate-700 py-2 px-3 font-mono">{formatCurrency(transaction.pricePerUnit)}</TableCell>
                          <TableCell className="text-xs font-bold text-emerald-700 py-2 px-3 font-mono">{formatCurrency(transaction.totalValue)}</TableCell>
                          <TableCell className="py-2 px-3">
                            <Badge variant={transaction.status === "completed" ? "default" : "secondary"} className="text-xs">
                              ✓ Done
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2 px-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTransaction(transaction.id)}
                              className="h-6 w-6 p-0 text-slate-400 hover:text-red-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Inventory */}
        <div>
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-3 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Package className="w-4 h-4" />
                Current Inventory
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {inventory.map((item, idx) => (
                  <div key={idx} className="p-3 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-xs font-semibold text-slate-900">{item.type}</p>
                      <Badge variant="outline" className="text-xs bg-slate-50">
                        {item.currentWeight} {item.unit}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-600">
                        Price: <span className="font-mono font-medium text-slate-900">{formatCurrency(item.pricePerUnit)}/kg</span>
                      </p>
                      <p className="text-xs text-slate-600">
                        Total: <span className="font-mono font-bold text-emerald-700">{formatCurrency(item.totalValue)}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Detailed Inventory */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="pb-3 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
          <CardTitle className="text-sm font-semibold">Inventory Levels - Detailed View</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="text-xs font-semibold text-slate-700 py-2 px-3">Material Type</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-700 py-2 px-3">Current Stock</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-700 py-2 px-3">Unit</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-700 py-2 px-3">Price/Unit</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-700 py-2 px-3">Total Value</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-700 py-2 px-3">Last Updated</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-700 py-2 px-3">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map((item, idx) => (
                  <TableRow key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                    <TableCell className="text-xs font-medium text-slate-900 py-2 px-3">{item.type}</TableCell>
                    <TableCell className="text-xs text-slate-700 py-2 px-3 font-mono font-bold">{item.currentWeight}</TableCell>
                    <TableCell className="text-xs text-slate-700 py-2 px-3">{item.unit}</TableCell>
                    <TableCell className="text-xs text-slate-700 py-2 px-3 font-mono">{formatCurrency(item.pricePerUnit)}</TableCell>
                    <TableCell className="text-xs font-bold text-emerald-700 py-2 px-3 font-mono">{formatCurrency(item.totalValue)}</TableCell>
                    <TableCell className="text-xs text-slate-500 py-2 px-3">
                      {new Date(item.lastUpdated).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-400 hover:text-slate-900">
                        <Edit2 className="w-3 h-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Fixed Sidebar */}
      <aside className="w-64 bg-slate-900 text-white fixed left-0 top-0 h-screen flex flex-col border-r border-slate-800">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg">Waiz</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">{currentUser.name}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => handleNavigation("dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeNav === "dashboard" ? "bg-emerald-600 text-white" : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Home className="w-4 h-4" />
            Dashboard
          </button>
          <button
            onClick={() => handleNavigation("inventory")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeNav === "inventory" ? "bg-emerald-600 text-white" : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Package className="w-4 h-4" />
            Inventory
          </button>
          <button
            onClick={() => handleNavigation("reports")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeNav === "reports" ? "bg-emerald-600 text-white" : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Reports
          </button>
          <button
            onClick={() => handleNavigation("settings")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeNav === "settings" ? "bg-emerald-600 text-white" : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-slate-800">
          <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white border-b border-slate-200 px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-slate-900">Junkshop Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">{currentUser.email}</span>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-8">
          {activeNav === "dashboard" && renderDashboard()}
          {activeNav === "inventory" && (
            <div className="text-center py-12">
              <p className="text-slate-500">Inventory management coming soon</p>
            </div>
          )}
          {activeNav === "reports" && (
            <div className="text-center py-12">
              <p className="text-slate-500">Reports & analytics coming soon</p>
            </div>
          )}
          {activeNav === "settings" && (
            <div className="text-center py-12">
              <p className="text-slate-500">Settings coming soon</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

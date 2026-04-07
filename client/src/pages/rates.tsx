import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { User, Rate } from "@shared/schema";
import { Edit2, Loader2, Trash2, Plus, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function RatesPage() {
  const [, navigate] = useLocation();
  const userStr = localStorage.getItem("user");
  const currentUser: User | null = userStr && userStr !== "undefined" ? JSON.parse(userStr) : null;
  const isJunkshop = currentUser?.userType === "junkshop";
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const { toast } = useToast();

  // Household view: search and list junkshops
  const [query, setQuery] = useState("");
  const [selectedShop, setSelectedShop] = useState<any | null>(null);
  const { data: junkshops = [], isLoading: isLoadingShops } = useQuery<any[]>({
    queryKey: ["/api/junkshops", query],
    queryFn: async () => {
      const url = query ? `/api/junkshops?q=${encodeURIComponent(query)}` : "/api/junkshops";
      return await fetch(url).then(res => res.json());
    },
    enabled: !isJunkshop,
  });

  // Junkshop view: own rates for editing
  const { data: rates = [], isLoading } = useQuery<Rate[]>({
    queryKey: ["/api/rates", currentUser?.id],
    queryFn: async () => {
      const url = currentUser?.id ? `/api/rates?sellerId=${encodeURIComponent(currentUser.id)}` : "/api/rates";
      console.log("🔍 [Frontend Rates] Fetching from:", url);
      const response = await fetch(url);
      console.log("📡 [Frontend Rates] Response status:", response.status);
      const data = await response.json();
      console.log("✅ [Frontend Rates] Received data:", data);
      console.log("📊 [Frontend Rates] Count:", Array.isArray(data) ? data.length : "not an array");
      return data || [];
    },
    enabled: isJunkshop,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; price: string }) => {
      return await apiRequest("PATCH", `/api/rates/${data.id}`, { price: data.price });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rates"] });
      toast({
        title: "Rate updated",
        description: "The rate has been updated successfully",
      });
      setEditingId(null);
      setEditPrice("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update rate",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create new rate (Junkshop)
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/rates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rates", currentUser?.id] });
      toast({ title: "Rate added", description: "New material added to your list" });
      setIsAddOpen(false);
      setNewRate({ material: "", category: "", price: "₱", icon: "📦", unit: "kg" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to add rate", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/rates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rates", currentUser?.id] });
      toast({ title: "Rate removed", description: "Material removed from your list" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to remove rate", description: error.message, variant: "destructive" });
    },
  });

  const handleEditClick = (rate: Rate) => {
    setEditingId(rate.id);
    setEditPrice(rate.price);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editPrice.trim()) return;
    updateMutation.mutate({ id: editingId, price: editPrice });
  };

  // Add / Remove (junkshop)
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newRate, setNewRate] = useState({ material: "", category: "", price: "", icon: "📦", unit: "kg" });

  const handleAddRate = () => {
    const userStr = localStorage.getItem("user");
    const currentUser: User | null = userStr && userStr !== "undefined" ? JSON.parse(userStr) : null;
    if (!currentUser) return toast({ title: "Not authenticated", variant: "destructive" });
    if (!newRate.material.trim() || !newRate.price.trim() || !newRate.category.trim()) {
      return toast({ title: "Missing fields", description: "Please fill out material, category and price", variant: "destructive" });
    }
    createMutation.mutate({ ...newRate, sellerId: currentUser.id });
  };

  const handleDeleteRate = (id: string) => {
    if (!confirm("Are you sure you want to remove this material?")) return;
    deleteMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🏪</span>
            <h2 className="text-3xl font-bold text-foreground">{isJunkshop ? "Rate List" : "Junkshops near you"}</h2>
          </div>
          <p className="text-muted-foreground">{isJunkshop ? "Market prices for recyclable materials in Baguio City" : "Find nearby junkshops and view their rate lists"}</p>
        </div>
        {isJunkshop && (
          <Badge variant="default" className="h-fit">Junkshop Owner</Badge>
        )}
      </div>

      {!isJunkshop ? (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input placeholder="Search junkshops by name or address" value={query} onChange={(e) => setQuery(e.target.value)} data-testid="input-search-junkshops" />
            <Button onClick={() => { /* triggers react-query refetch via query key */ }} data-testid="button-search-junkshops">Search</Button>
          </div>

          {isLoadingShops ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {junkshops.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">No junkshops found</CardContent>
                </Card>
              ) : (
                <>
                  {junkshops.map((shop: any) => (
                    <Card key={shop.id}>
                      <CardHeader className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{shop.name}</h3>
                          <p className="text-sm text-muted-foreground">{shop.address}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Button onClick={() => setSelectedShop(shop)}>
                            View Rates
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => navigate(`/dashboard?tab=messages&userId=${shop.id}`)}
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Contact
                          </Button>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}

                  <Dialog open={!!selectedShop} onOpenChange={(open) => !open && setSelectedShop(null)}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{selectedShop?.name} — Rates</DialogTitle>
                      </DialogHeader>
                      <CardContent>
                        {selectedShop?.rates && selectedShop.rates.length > 0 ? (
                          <div className="space-y-2">
                            {selectedShop.rates.map((rate: Rate) => (
                              <div key={rate.id} className="flex items-center justify-between p-2 border rounded">
                                <div>
                                  <div className="text-sm font-medium">{rate.material}</div>
                                  <div className="text-xs text-muted-foreground">{rate.category}</div>
                                </div>
                                <div className="text-sm font-semibold">{rate.price}</div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No rates available</p>
                        )}
                      </CardContent>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between w-full">
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">₱</span>
              Recyclable Material Prices
            </CardTitle>
            {isJunkshop && (
              <div className="flex items-center gap-2">
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                  <Button onClick={() => setIsAddOpen(true)} size="sm">
                    <Plus className="w-4 h-4 mr-2" /> Add Rate
                  </Button>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Rate</DialogTitle>
                      <DialogDescription>Add a material and price for your shop</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="material">Material</Label>
                        <Input id="material" value={newRate.material} onChange={(e) => setNewRate({ ...newRate, material: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Input id="category" value={newRate.category} onChange={(e) => setNewRate({ ...newRate, category: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label htmlFor="price">Price</Label>
                          <Input id="price" value={newRate.price} onChange={(e) => setNewRate({ ...newRate, price: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="unit">Unit</Label>
                          <select id="unit" value={newRate.unit} onChange={(e) => setNewRate({ ...newRate, unit: e.target.value })} className="w-full border rounded px-2 py-1 text-sm">
                            <option value="kg">kg</option>
                            <option value="g">g</option>
                            <option value="each">each</option>
                            <option value="lb">lb</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddRate} disabled={createMutation.isPending}>{createMutation.isPending ? 'Adding...' : 'Add Rate'}</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {rates.map((rate) => (
                  <div
                    key={rate.id}
                    className="flex items-center justify-between p-4 rounded-lg hover-elevate bg-card border border-card-border"
                    data-testid={`rate-${rate.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">{rate.icon}</div>
                      <div>
                        <p className="font-medium text-foreground">{rate.material}</p>
                        <Badge variant="secondary" className="mt-1">{rate.category}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-xl font-bold text-primary">{rate.price}{rate.unit ? ` / ${rate.unit}` : ''}</p>
                      {isJunkshop && (
                        <div className="flex items-center gap-2">
                          <Dialog open={editingId === rate.id} onOpenChange={(open) => !open && setEditingId(null)}>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEditClick(rate)}
                              data-testid={`button-edit-rate-${rate.id}`}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Rate</DialogTitle>
                                <DialogDescription>Update the price for {rate.material}</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 mt-4">
                                <div className="space-y-2">
                                  <Label htmlFor="price">Price</Label>
                                  <Input
  id="price"
  placeholder="₱ Price"
  value={newRate.price}
  onChange={(e) => {
    let value = e.target.value.replace(/[^\d]/g, "");

    if (value === "") {
      setNewRate({ ...newRate, price: "" });
      return;
    }

    setNewRate({
      ...newRate,
      price: `₱${value}`,
    });
  }}
                                  />
                                </div>
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    variant="outline"
                                    onClick={() => setEditingId(null)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={handleSaveEdit}
                                    disabled={updateMutation.isPending || !editPrice.trim()}
                                    data-testid="button-save-rate"
                                  >
                                    {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Save
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Button size="icon" variant="ghost" onClick={() => handleDeleteRate(rate.id)} data-testid={`button-delete-rate-${rate.id}`}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="bg-muted/50">
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            {isJunkshop ? (
              <>
                💡 <strong>Note:</strong> You can edit the rates above to reflect your current market prices. 
                These rates will be displayed to all users on the platform.
              </>
            ) : (
              <>
                💡 <strong>Note:</strong> Prices may vary depending on quality, quantity, and market conditions. 
                Contact junkshops directly for the most accurate pricing for your specific materials.
              </>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

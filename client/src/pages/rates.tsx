import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { User, Rate } from "@shared/schema";
import { Edit2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function RatesPage() {
  const userStr = localStorage.getItem("user");
  const currentUser: User | null = userStr && userStr !== "undefined" ? JSON.parse(userStr) : null;
  const isJunkshop = currentUser?.userType === "junkshop";
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const { toast } = useToast();

  const { data: rates = [], isLoading } = useQuery<Rate[]>({
    queryKey: ["/api/rates"],
    queryFn: async () => {
      return await fetch("/api/rates").then(res => res.json());
    },
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

  const handleEditClick = (rate: Rate) => {
    setEditingId(rate.id);
    setEditPrice(rate.price);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editPrice.trim()) return;
    updateMutation.mutate({ id: editingId, price: editPrice });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">₱</span>
            <h2 className="text-3xl font-bold text-foreground">Rate List</h2>
          </div>
          <p className="text-muted-foreground">Market prices for recyclable materials in Baguio City</p>
        </div>
        {isJunkshop && (
          <Badge variant="default" className="h-fit">Junkshop Owner</Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">₱</span>
            Recyclable Material Prices
          </CardTitle>
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
                    <p className="text-xl font-bold text-primary">{rate.price}</p>
                    {isJunkshop && (
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
                                placeholder="e.g., ₱50.00 per kilo"
                                value={editPrice}
                                onChange={(e) => setEditPrice(e.target.value)}
                                data-testid="input-edit-price"
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
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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

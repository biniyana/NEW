import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Item, User } from "@shared/schema";
import { Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const categories = ["All", "Plastic", "Paper", "Metal", "Glass", "Cardboard", "Copper"];

const categoryEmojis: Record<string, string> = {
  Plastic: "🍾",
  Paper: "📰",
  Metal: "🥫",
  Glass: "🍷",
  Cardboard: "📦",
  Copper: "🔌",
};

export default function MarketplacePage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const userStr = localStorage.getItem("user");
  const currentUser: User | null = userStr && userStr !== "undefined" ? JSON.parse(userStr) : null;
  const isJunkshop = currentUser?.userType === "junkshop";

  const { data: items = [], isLoading } = useQuery<Item[]>({
    queryKey: ["/api/items", selectedCategory],
    queryFn: async () => {
      const url = selectedCategory === "All" 
        ? "/api/items" 
        : `/api/items?category=${selectedCategory}`;
      return await fetch(url).then(res => res.json());
    },
  });

  const filteredItems = selectedCategory === "All"
    ? items
    : items.filter((item) => item.category === selectedCategory);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-foreground">
            {isJunkshop ? "My Listings" : "Browse Marketplace"}
          </h2>
          <p className="text-muted-foreground">
            {isJunkshop ? "Manage your recyclable items" : "Discover recyclable materials in Baguio"}
          </p>
        </div>
        {isJunkshop && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-item">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <AddItemForm onClose={() => setIsDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            data-testid={`filter-${category.toLowerCase()}`}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Items Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-12 w-12 rounded-lg" />
                <Skeleton className="h-6 w-3/4 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground">No items found</p>
            <p className="text-sm text-muted-foreground">
              {isJunkshop ? "Start by adding your first item" : "Check back later for new listings"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function ItemCard({ item }: { item: Item }) {
  return (
    <Card className="hover-elevate" data-testid={`card-item-${item.id}`}>
      <CardHeader>
        <div className="text-5xl mb-2">{item.emoji}</div>
        <CardTitle className="text-lg">{item.title}</CardTitle>
        <Badge variant="secondary">{item.category}</Badge>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-primary mb-2">{item.price}</p>
        <p className="text-sm text-muted-foreground">
          Seller: {item.sellerName}
        </p>
        {item.description && (
          <p className="text-sm text-foreground mt-2">{item.description}</p>
        )}
      </CardContent>
      <CardFooter>
        <Button className="w-full" data-testid={`button-contact-${item.id}`}>
          Contact Seller
        </Button>
      </CardFooter>
    </Card>
  );
}

function AddItemForm({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const currentUser: User = JSON.parse(localStorage.getItem("user")!);

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    price: "",
    description: "",
  });

  const addItemMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/items", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      toast({
        title: "Item added!",
        description: "Your item has been listed successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emoji = categoryEmojis[formData.category] || "📦";
    addItemMutation.mutate({
      ...formData,
      emoji,
      sellerId: currentUser.id,
      sellerName: currentUser.name,
      status: "available",
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add New Item</DialogTitle>
        <DialogDescription>List a recyclable item for sale</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="title">Item Title</Label>
          <Input
            id="title"
            placeholder="e.g., Plastic Bottles (50pcs)"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            data-testid="input-title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
            required
          >
            <SelectTrigger data-testid="select-category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.slice(1).map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {categoryEmojis[cat]} {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Price</Label>
          <Input
            id="price"
            placeholder="e.g., ₱150"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            required
            data-testid="input-price"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            placeholder="Additional details about the item"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            data-testid="input-description"
          />
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={addItemMutation.isPending}
            data-testid="button-submit-item"
          >
            {addItemMutation.isPending ? "Adding..." : "Add Item"}
          </Button>
        </div>
      </form>
    </>
  );
}

function Package({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M16.5 9.4 7.55 4.24" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.29 7 12 12 20.71 7" />
      <line x1="12" x2="12" y1="22" y2="12" />
    </svg>
  );
}

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

interface MarketplacePageProps {
  onNavigateToMessages?: () => void;
}

export default function MarketplacePage({ onNavigateToMessages }: MarketplacePageProps) {
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
            Marketplace
          </h2>
          <p className="text-muted-foreground">
            Buy and sell recyclable materials in Baguio City
          </p>
        </div>
        {!isJunkshop && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-item">
                <Plus className="w-4 h-4 mr-2" />
                Post Item
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
            <ItemCard key={item.id} item={item} onNavigateToMessages={onNavigateToMessages} />
          ))}
        </div>
      )}
    </div>
  );
}

interface ItemCardProps {
  item: Item;
  onNavigateToMessages?: () => void;
}

function ItemCard({ item, onNavigateToMessages }: ItemCardProps) {
  const { toast } = useToast();
  const currentUser: User | null = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")!) : null;
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const contactMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser?.id || !currentUser?.name) {
        throw new Error("User information missing");
      }
      if (!item.sellerId || !item.sellerName) {
        throw new Error("Seller information missing");
      }
      
      return await apiRequest("POST", "/api/messages", {
        senderId: currentUser.id,
        senderName: currentUser.name,
        receiverId: item.sellerId,
        receiverName: item.sellerName,
        content: `Hi! I'm interested in your ${item.title}. Can we discuss the details?`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      toast({
        title: "Message sent!",
        description: `Started conversation with ${item.sellerName}`,
      });
      // Navigate to messages after successful contact
      if (onNavigateToMessages) {
        setTimeout(() => onNavigateToMessages(), 500);
      }
    },
    onError: (error: any) => {
      console.error("Contact error:", error);
      toast({
        title: "Failed to contact seller",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleContactSeller = () => {
    if (!currentUser) {
      toast({
        title: "Please login",
        description: "You need to be logged in to contact sellers",
        variant: "destructive",
      });
      return;
    }
    if (currentUser.id === item.sellerId) {
      toast({
        title: "Cannot contact yourself",
        description: "You are the seller of this item",
        variant: "destructive",
      });
      return;
    }
    contactMutation.mutate();
  };

  return (
    <Card className="hover-elevate" data-testid={`card-item-${item.id}`}>
      <CardHeader>
        {item.imageUrls ? (
          (() => {
            const imgs: string[] = typeof item.imageUrls === "string" ? JSON.parse(item.imageUrls) : (item.imageUrls as any || []);
            return (
              <>
                <div className="grid grid-cols-3 gap-1 mb-2">
                  {imgs.slice(0, 3).map((u: string, i: number) => (
                    <div key={i} className="w-full h-16 overflow-hidden rounded cursor-pointer" onClick={() => setPreviewImage(u)}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={u} className="w-full h-full object-cover" alt={`thumb-${i}`} />
                    </div>
                  ))}
                </div>
                {previewImage && (
                  <Dialog open={true} onOpenChange={() => setPreviewImage(null)}>
                    <DialogContent>
                      <img src={previewImage} alt="preview" className="w-full h-auto max-h-[70vh] object-contain" />
                    </DialogContent>
                  </Dialog>
                )}
              </>
            );
          })()
        ) : (
          <div className="text-5xl mb-2">{item.emoji}</div>
        )}
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
        <Button 
          className="w-full" 
          data-testid={`button-contact-${item.id}`}
          onClick={handleContactSeller}
          disabled={contactMutation.isPending}
        >
          {contactMutation.isPending ? "Contacting..." : "Contact Seller"}
        </Button>
      </CardFooter>
    </Card>
  );
}

interface AddItemFormProps {
  onClose: () => void;
}

function AddItemForm({ onClose }: AddItemFormProps) {
  const { toast } = useToast();
  const currentUser: User = JSON.parse(localStorage.getItem("user")!);

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    price: "",
    description: "",
    emoji: "📦",
    imageUrls: [] as string[],
  });
  const [uploading, setUploading] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

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
      imageUrls: formData.imageUrls,
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

        <div className="space-y-2">
          <Label htmlFor="images">Photos (up to 5)</Label>
          <input
            id="images"
            type="file"
            accept="image/*"
            multiple
            onChange={async (e) => {
              setUploadError(null);
              const files = Array.from(e.target.files || []);
              if (files.length === 0) return;
              if (files.length + formData.imageUrls.length > 5) {
                setUploadError("Maximum 5 images allowed");
                return;
              }
              setUploading(true);
              try {
                const uploaded: string[] = [];
                for (const file of files) {
                  const reader = new FileReader();
                  const dataUrl: string = await new Promise((resolve, reject) => {
                    reader.onload = () => resolve(String(reader.result));
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                  });
                  const res = await fetch("/api/upload", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ filename: file.name, data: dataUrl }),
                  });
                  if (!res.ok) throw new Error((await res.json()).message || "Upload failed");
                  const json = await res.json();
                  uploaded.push(json.url);
                }
                setFormData({ ...formData, imageUrls: [...formData.imageUrls, ...uploaded] });
              } catch (err: any) {
                console.error("Upload error", err);
                setUploadError(err.message || "Upload failed");
              } finally {
                setUploading(false);
              }
            }}
          />
          {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}

          {formData.imageUrls.length > 0 && (
            <div className="flex gap-2 mt-2">
              {formData.imageUrls.map((url, idx) => (
                <div key={idx} className="w-16 h-16 rounded overflow-hidden cursor-pointer" onClick={() => setPreviewIndex(idx)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`preview-${idx}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
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

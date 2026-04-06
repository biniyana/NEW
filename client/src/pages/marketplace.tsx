import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Item, User } from "@shared/schema";
import { Plus, Edit, Trash2, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { uploadImageToCloudinary } from "@/utils/cloudinary";

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

  const [, navigate] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const { toast } = useToast();

  const userStr = localStorage.getItem("user");
  const currentUser: User | null =
    userStr && userStr !== "undefined" ? JSON.parse(userStr) : null;

  const isHousehold = currentUser?.userType === "household";

  const { data: items = [], isLoading } = useQuery<Item[]>({
    queryKey: ["/api/items", selectedCategory],
    queryFn: async () => {
      const url =
        selectedCategory === "All"
          ? "/api/items"
          : `/api/items?category=${selectedCategory}`;

      return await fetch(url).then((res) => res.json());
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      return await apiRequest("DELETE", `/api/items/${itemId}`, { sellerId: currentUser.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      toast({
        title: "Item deleted!",
        description: "Your item has been removed from the marketplace",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete item",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Marketplace</h2>
          <p className="text-muted-foreground">
            Buy and sell recyclable materials
          </p>
        </div>

        {isHousehold && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>

            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Post Item
              </Button>
            </DialogTrigger>

            <DialogContent>
              <AddItemForm onClose={() => setIsDialogOpen(false)} />
            </DialogContent>

          </Dialog>
        )}

        {editingItem && (
          <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
            <DialogContent>
              <EditItemForm item={editingItem} onClose={() => setEditingItem(null)} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Button>
        ))}
      </div>

      {isLoading ? (

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-12 w-12 rounded-lg" />
              </CardHeader>
            </Card>
          ))}
        </div>

      ) : (

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              currentUser={currentUser}
              onDeleteItem={(itemId) => setDeletingItemId(itemId)}
              onEditItem={setEditingItem}
              navigate={navigate}
            />
          ))}
        </div>

      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingItemId} onOpenChange={() => setDeletingItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingItemId) {
                  deleteItemMutation.mutate(deletingItemId);
                  setDeletingItemId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

interface ItemCardProps {
  item: Item;
  currentUser: User | null;
  onDeleteItem?: (itemId: string) => void;
  onEditItem?: (item: Item) => void;
  navigate?: (path: string) => void;
}

export function ItemCard({ item, currentUser, onDeleteItem, onEditItem, navigate }: ItemCardProps) {
  const isOwner = currentUser && item.sellerId === currentUser.id;
  const isJunkshop = currentUser?.userType === "junkshop";

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{item.title}</CardTitle>
            <Badge>{item.category}</Badge>
          </div>
          {isOwner && onDeleteItem && onEditItem && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEditItem(item)}
                className="hover:bg-blue-50 hover:border-blue-200"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDeleteItem(item.id)}
                className="hover:bg-red-50 hover:border-red-200"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-xl font-bold">{item.price}</p>

        {item.imageUrl && (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-40 object-cover rounded mt-2"
          />
        )}
      </CardContent>

      <CardFooter>
        <div className="flex justify-between items-center w-full">
          <p className="text-sm text-muted-foreground">
            Seller: {item.sellerName}
          </p>
          {isJunkshop && !isOwner && navigate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/messages?userId=${item.sellerId}`)}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Contact
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

interface AddItemFormProps {
  onClose: () => void;
}

function AddItemForm({ onClose }: AddItemFormProps) {

  const { toast } = useToast();

  const userStr = localStorage.getItem("user");
  const currentUser: User | null = userStr ? JSON.parse(userStr) : null;

  const [formData, setFormData] = useState<{
    title: string;
    category: string;
    price: string;
    description: string;
    emoji: string;
    imageUrls: string[];
  }>({
    title: "",
    category: "",
    price: "",
    description: "",
    emoji: "📦",
    imageUrls: [],
  });

  const [uploading, setUploading] = useState(false);
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
  });

  const handleSubmit = (e: React.FormEvent) => {

    e.preventDefault();

    if (!currentUser) return;

    const emoji = categoryEmojis[formData.category] || "📦";

    addItemMutation.mutate({
      ...formData,
      emoji,
      sellerId: currentUser.id,
      sellerName: currentUser.name,
      imageUrl: formData.imageUrls[0] || "",
    });

  };

  return (
    <>

      <DialogHeader>
        <DialogTitle>Add New Item</DialogTitle>
        <DialogDescription>
          List a recyclable item for sale
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 mt-4">

        <Input
          placeholder="Item Title"
          value={formData.title}
          onChange={(e) =>
            setFormData({ ...formData, title: e.target.value })
          }
          required
        />

        <Select
          value={formData.category}
          onValueChange={(v) =>
            setFormData({ ...formData, category: v })
          }
        >
          <SelectTrigger>
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

        <Input
  placeholder="₱ Price"
  value={formData.price}
  onChange={(e) => {
    let value = e.target.value.replace(/[^\d]/g, "");

    if (value === "") {
      setFormData({ ...formData, price: "" });
      return;
    }

    setFormData({
      ...formData,
      price: `₱${value}`,
    });
  }}
  required
/>

        <Textarea
          placeholder="Description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
        />

        {/* IMAGE UPLOAD */}
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={async (e) => {

            setUploadError(null);

            const files = Array.from(e.target.files || []);
            if (files.length === 0) return;

            setUploading(true);

            try {

              const urls: string[] = [];

              for (const file of files) {
                const url = await uploadImageToCloudinary(file);
                urls.push(url);
              }

              setFormData((prev) => ({
                ...prev,
                imageUrls: [...prev.imageUrls, ...urls],
              }));

            } catch (err: any) {

              console.error(err);
              setUploadError(err.message || "Upload failed");

            } finally {

              setUploading(false);

            }
          }}
        />

        {uploadError && (
          <p className="text-sm text-red-500">{uploadError}</p>
        )}

        {formData.imageUrls.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {formData.imageUrls.map((img, i) => (
              <img
                key={i}
                src={img}
                alt="preview"
                className="w-16 h-16 object-cover rounded"
              />
            ))}
          </div>
        )}

        <Button
          type="submit"
          disabled={uploading || addItemMutation.isPending}
        >
          {uploading ? "Uploading..." : "Add Item"}
        </Button>

      </form>

    </>
  );
}

interface EditItemFormProps {
  item: Item;
  onClose: () => void;
}

function EditItemForm({ item, onClose }: EditItemFormProps) {
  const { toast } = useToast();

  const userStr = localStorage.getItem("user");
  const currentUser: User | null = userStr ? JSON.parse(userStr) : null;

  const [formData, setFormData] = useState<{
    title: string;
    category: string;
    price: string;
    description: string;
    emoji: string;
    imageUrls: string[];
  }>({
    title: item.title,
    category: item.category,
    price: item.price,
    description: item.description || "",
    emoji: item.emoji || "📦",
    imageUrls: Array.isArray(item.imageUrls) ? item.imageUrls : [item.imageUrl].filter(Boolean) as string[],
  });

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const updateItemMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PATCH", `/api/items/${item.id}`, {
        ...data,
        sellerId: currentUser?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      toast({
        title: "Item updated!",
        description: "Your item has been updated successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update item",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const emoji = categoryEmojis[formData.category] || "📦";

    updateItemMutation.mutate({
      ...formData,
      emoji,
      imageUrl: formData.imageUrls[0] || "",
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit Item</DialogTitle>
        <DialogDescription>
          Update your item listing
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <Input
          placeholder="Item Title"
          value={formData.title}
          onChange={(e) =>
            setFormData({ ...formData, title: e.target.value })
          }
          required
        />

        <Select
          value={formData.category}
          onValueChange={(v) =>
            setFormData({ ...formData, category: v })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(categoryEmojis).map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Price (e.g., ₱50/kg)"
          value={formData.price}
          onChange={(e) =>
            setFormData({ ...formData, price: e.target.value })
          }
          required
        />

        <Textarea
          placeholder="Description (optional)"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
        />

        <Input
          type="file"
          accept="image/*"
          multiple
          onChange={async (e) => {
            const files = Array.from(e.target.files || []);
            if (files.length === 0) return;

            setUploading(true);
            setUploadError(null);

            try {
              const urls: string[] = [];
              for (const file of files) {
                const url = await uploadImageToCloudinary(file);
                urls.push(url);
              }

              setFormData((prev) => ({
                ...prev,
                imageUrls: [...prev.imageUrls, ...urls],
              }));
            } catch (err: any) {
              console.error(err);
              setUploadError(err.message || "Upload failed");
            } finally {
              setUploading(false);
            }
          }}
        />

        {uploadError && (
          <p className="text-sm text-red-500">{uploadError}</p>
        )}

        {formData.imageUrls.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {formData.imageUrls.map((img, i) => (
              <img
                key={i}
                src={img}
                alt="preview"
                className="w-16 h-16 object-cover rounded"
              />
            ))}
          </div>
        )}

        <Button
          type="submit"
          disabled={uploading || updateItemMutation.isPending}
        >
          {uploading ? "Uploading..." : "Update Item"}
        </Button>
      </form>
    </>
  );
}
import { useState, useEffect } from "react";
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
import { Item, User } from "@/models";
import { Plus, Edit, Trash2, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { uploadImageToCloudinary } from "@/utils/cloudinary";
import { ref, set, update, remove, onValue, query, get } from "firebase/database";
import { database, auth } from "@/firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getOrCreateConversation, fetchUserNameFromDB } from "@/lib/firebaseConversations";

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
  onContact?: (conversationId: string, userId: string, userName: string) => void;
}

export default function MarketplacePage({ onContact }: MarketplacePageProps) {

  const [, navigate] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authUid, setAuthUid] = useState<string | null>(null);
  const { toast } = useToast();

  const userStr = localStorage.getItem("user");
  const currentUser: User | null =
    userStr && userStr !== "undefined" ? JSON.parse(userStr) : null;

  const isHousehold = currentUser?.userType === "household";

  // Get Firebase auth UID
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.uid) {
        setAuthUid(user.uid);
      }
    });
    return unsubscribe;
  }, []);

  // Fetch items from Firebase in real-time
  useEffect(() => {
    setIsLoading(true);
    const itemsRef = ref(database, "items");

    const unsubscribe = onValue(
      itemsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const itemsList: Item[] = Object.values(data).map((item: any) => ({
            id: item.id,
            title: item.title,
            category: item.category,
            price: item.price,
            description: item.description || null,
            imageUrl: item.imageUrl || null,
            imageUrls: item.imageUrls || null,
            sellerId: item.sellerId,
            sellerName: item.sellerName,
            emoji: item.emoji || null,
            status: item.status || "available",
            createdAt: item.createdAt ? new Date(item.createdAt) : null,
          }));

          // Filter by category if not "All"
          const filtered =
            selectedCategory === "All"
              ? itemsList
              : itemsList.filter((item) => item.category === selectedCategory);

          setItems(filtered);
        } else {
          setItems([]);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching items from Firebase:", error);
        setIsLoading(false);
        toast({
          title: "Error",
          description: "Failed to load marketplace items",
          variant: "destructive",
        });
      }
    );

    return () => unsubscribe();
  }, [selectedCategory, toast]);

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        throw new Error("No authenticated user. Please log in.");
      }

      console.log("Deleting item from database:", itemId);
      const itemRef = ref(database, `items/${itemId}`);
      await remove(itemRef);
      
      return itemId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      toast({
        title: "Item deleted!",
        description: "Your item has been removed from the marketplace",
      });
    },
    onError: (error: any) => {
      console.error("Error deleting item:", error);
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

        <div className="space-y-6">
          {Object.entries(
            items.reduce((sellers: Record<string, Item[]>, item) => {
              if (!sellers[item.sellerId]) {
                sellers[item.sellerId] = [];
              }
              sellers[item.sellerId].push(item);
              return sellers;
            }, {})
          )
            .sort((a, b) => {
              // Sort sellers by most recent item first
              const aTime = Math.max(...a[1].map(it => (it.createdAt ? new Date(it.createdAt).getTime() : 0)));
              const bTime = Math.max(...b[1].map(it => (it.createdAt ? new Date(it.createdAt).getTime() : 0)));
              return bTime - aTime;
            })
            .map(([sellerId, sellerItems]) => (
              <SellerCard
                key={sellerId}
                sellerId={sellerId}
                sellerName={sellerItems[0]?.sellerName || "Unknown"}
                items={sellerItems}
                currentUser={currentUser}
                authUid={authUid}
                onDeleteItem={(itemId) => setDeletingItemId(itemId)}
                onEditItem={setEditingItem}
                navigate={navigate}
                onContact={onContact}
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
  authUid?: string | null;
  onDeleteItem?: (itemId: string) => void;
  onEditItem?: (item: Item) => void;
  navigate?: (path: string) => void;
}

export function ItemCard({ item, currentUser, authUid, onDeleteItem, onEditItem, navigate }: ItemCardProps) {
  const { toast } = useToast();
  const [isHandlingContact, setIsHandlingContact] = useState(false);
  const isOwner = authUid && item.sellerId === authUid;
  const isJunkshop = currentUser?.userType === "junkshop";

  const handleContact = async () => {
    if (!currentUser?.id || !item.sellerId || !navigate) {
      toast({
        title: "Error",
        description: "Unable to start conversation",
        variant: "destructive",
      });
      return;
    }

    setIsHandlingContact(true);
    try {
      const conversationId = await getOrCreateConversation(currentUser.id, item.sellerId);
      const sellerName = await fetchUserNameFromDB(item.sellerId);
      console.log(`✅ Conversation ready: ${conversationId}`);
      navigate(`/dashboard?tab=messages&conversationId=${conversationId}&userId=${item.sellerId}&userName=${encodeURIComponent(sellerName)}`);
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast({
        title: "Error",
        description: "Failed to start conversation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsHandlingContact(false);
    }
  };

  return (
    <Card className={isOwner ? "border-2 border-primary/50 bg-primary/5" : ""}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>{item.title}</CardTitle>
              {isOwner && <Badge className="bg-green-500 hover:bg-green-600">✓ My Post</Badge>}
            </div>
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
        {item.imageUrl && (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-40 object-cover rounded"
          />
        )}
      </CardContent>

      <CardFooter>
        <div className="flex justify-between items-center w-full">
          <p className="text-sm text-muted-foreground">
            Seller: {item.sellerName}
          </p>
          {isJunkshop && !isOwner && currentUser?.id && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleContact}
              disabled={isHandlingContact}
              data-testid="button-contact-seller"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              {isHandlingContact ? "Starting..." : "Contact"}
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
      const uid = auth.currentUser?.uid;
      if (!uid) {
        throw new Error("No authenticated user. Please log in.");
      }

      // Fetch the current user's profile to get the correct name
      let sellerName = currentUser?.name || auth.currentUser?.displayName || "Unknown";
      try {
        const userRef = ref(database, `users/${uid}`);
        const userSnapshot = await get(userRef);
        if (userSnapshot.exists()) {
          const userProfile = userSnapshot.val();
          sellerName = userProfile.name || sellerName;
        }
      } catch (error) {
        console.warn("Could not fetch user profile, using cached name", error);
      }

      const itemId = `item_${Date.now()}`;
      const itemData = {
        id: itemId,
        ...data,
        sellerId: uid,
        sellerName,
        imageUrl: data.imageUrls?.[0] || "",
        imageUrls: data.imageUrls || [],
        status: "available",
        createdAt: new Date().toISOString(),
      };

      console.log("Saving item to database:", itemId, itemData);
      const itemRef = ref(database, `items/${itemId}`);
      await set(itemRef, itemData);
      
      return itemData;
    },

    onSuccess: (data) => {
      console.log("Item saved successfully");
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });

      toast({
        title: "Item added!",
        description: "Your item has been listed successfully",
      });

      onClose();
    },
    onError: (error: any) => {
      console.error("Error saving item:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add item",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to post an item",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title || !formData.category) {
      toast({
        title: "Missing fields",
        description: "Please fill in title and category",
        variant: "destructive",
      });
      return;
    }

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
          placeholder="Item Title e.g plastic cans 2kg"
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
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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
      const uid = auth.currentUser?.uid;
      if (!uid) {
        throw new Error("No authenticated user. Please log in.");
      }

      const updateData = {
        ...data,
        imageUrl: data.imageUrls?.[0] || "",
        imageUrls: data.imageUrls || [],
      };

      console.log("Updating item in database:", item.id, updateData);
      const itemRef = ref(database, `items/${item.id}`);
      await update(itemRef, updateData);

      return updateData;
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
      console.error("Error updating item:", error);
      toast({
        title: "Update failed",
        description: error.message || "Failed to update item",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to edit an item",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title || !formData.category) {
      toast({
        title: "Missing fields",
        description: "Please fill in title and category",
        variant: "destructive",
      });
      return;
    }

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

interface SellerCardProps {
  sellerId: string;
  sellerName: string;
  items: Item[];
  currentUser: User | null;
  authUid: string | null;
  onDeleteItem: (itemId: string) => void;
  onEditItem: (item: Item) => void;
  navigate?: (path: string) => void;
  onContact?: (conversationId: string, userId: string, userName: string) => void;
}

function SellerCard({ sellerId, sellerName, items, currentUser, authUid, onDeleteItem, onEditItem, navigate, onContact }: SellerCardProps) {
  const isOwner = authUid && sellerId === authUid;
  const { toast } = useToast();
  const [isHandlingContact, setIsHandlingContact] = useState(false);
  const [sellerUserType, setSellerUserType] = useState<string | null>(null);

  // Fetch seller's user type to determine if prices should be hidden
  useEffect(() => {
    const fetchSellerUserType = async () => {
      try {
        const userRef = ref(database, `users/${sellerId}`);
        const userSnapshot = await get(userRef);
        if (userSnapshot.exists()) {
          const userProfile = userSnapshot.val();
          setSellerUserType(userProfile.userType || null);
        }
      } catch (error) {
        console.error("Error fetching seller user type:", error);
      }
    };

    fetchSellerUserType();
  }, [sellerId]);

  const handleContact = async () => {
    if (!currentUser?.id || !sellerId) {
      toast({
        title: "Error",
        description: "Unable to start conversation",
        variant: "destructive",
      });
      return;
    }

    setIsHandlingContact(true);
    try {
      const conversationId = await getOrCreateConversation(currentUser.id, sellerId);
      console.log(`✅ Conversation ready: ${conversationId}`);
      if (onContact) {
        onContact(conversationId, sellerId, sellerName);
      } else if (navigate) {
        navigate(`/dashboard?tab=messages&conversationId=${conversationId}&userId=${sellerId}&userName=${encodeURIComponent(sellerName)}`);
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast({
        title: "Error",
        description: "Failed to start conversation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsHandlingContact(false);
    }
  };

  return (
    <Card className={isOwner ? "border-2 border-primary/50 bg-primary/5" : ""}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{sellerName}</CardTitle>
            <Badge className="mt-2">{items.length} item{items.length !== 1 ? 's' : ''}</Badge>
          </div>
          {!isOwner && (
            <Button
              onClick={handleContact}
              disabled={isHandlingContact}
              size="sm"
              className="gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              {isHandlingContact ? "Starting..." : "Contact"}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Items Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items
            .sort((a, b) => {
              const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return bTime - aTime;
            })
            .map((item) => (
              <div key={item.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                {/* Item Image */}
                <div className="bg-muted h-32 flex items-center justify-center relative group">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl">{categoryEmojis[item.category] || "📦"}</span>
                  )}
                  {isOwner && (
                    <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8"
                        onClick={() => onEditItem(item)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8"
                        onClick={() => onDeleteItem(item.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Item Info */}
                <div className="p-3">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{item.title}</h4>
                      <Badge variant="outline" className="text-xs mt-1">{item.category}</Badge>
                    </div>
                    {isOwner && <Badge className="bg-green-500 hover:bg-green-600 text-xs flex-shrink-0">My Post</Badge>}
                  </div>
                  {sellerUserType !== "household" && (
                    <p className="text-lg font-bold text-primary">{item.price}</p>
                  )}
                  {item.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{item.description}</p>
                  )}
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
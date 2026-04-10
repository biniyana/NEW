import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Request as RequestType, User } from "@/models";
import { Plus, Calendar, MapPin, Image as ImageIcon, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ref, onValue, set, update, push, get, remove } from "firebase/database";
import { database } from "@/firebase/firebase";

export default function RequestsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [requests, setRequests] = useState<RequestType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const userStr = localStorage.getItem("user");
  const rawUser: any = userStr && userStr !== "undefined" ? JSON.parse(userStr) : null;
  const currentUser: User | null = rawUser
    ? { ...rawUser, id: rawUser.id || rawUser.uid, name: rawUser.name || rawUser.displayName || "User" }
    : null;
  const isHousehold = currentUser?.userType === "household";
  
  console.log("👤 [Requests Page] Current user:", {
    name: currentUser?.name,
    id: currentUser?.id,
    email: currentUser?.email,
    userType: currentUser?.userType,
  });

  // Real-time listener for requests from Firebase
  React.useEffect(() => {
    setIsLoading(true);
    const requestsRef = ref(database, "requests");
    
    const unsubscribe = onValue(
      requestsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const requestsList: RequestType[] = Object.values(data).map((req: any) => ({
            id: req.id,
            type: req.type,
            items: req.items,
            address: req.address,
            date: req.date,
            time: req.time,
            requesterId: req.requesterId,
            requesterName: req.requesterName,
            responderId: req.responderId,
            responderName: req.responderName,
            status: req.status || "Pending",
            createdAt: req.createdAt ? new Date(req.createdAt) : null,
          }));
          console.log("✅ [Frontend] Received requests from Firebase:", requestsList);
          setRequests(requestsList);
        } else {
          setRequests([]);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching requests from Firebase:", error);
        setIsLoading(false);
        toast({
          title: "Error",
          description: "Failed to load collection requests",
          variant: "destructive",
        });
      }
    );

    return () => unsubscribe();
  }, [toast]);

  // Show only the household's own requests to household users (hide seed/dummy requests)
  const visibleRequests = isHousehold ? requests.filter(r => {
    const matches = r.requesterId === currentUser?.id;
    console.log(`🔎 [Filter] Request ${r.id}: requesterId="${r.requesterId}" vs currentUser.id="${currentUser?.id}" → ${matches ? "SHOW" : "HIDE"}`);
    return matches;
  }) : requests;
  
  console.log(`📋 [Frontend] Total requests: ${requests.length}, Visible: ${visibleRequests.length}, User: ${currentUser?.name}`);
  if (visibleRequests.length === 0 && isHousehold) {
    console.log(`⚠️  [Frontend] Household user "${currentUser?.name}" (${currentUser?.id}) has no visible requests`);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-foreground">
            {isHousehold ? "My Requests" : "Collection Requests"}
          </h2>
          <p className="text-muted-foreground">
            {isHousehold ? "Track your collection requests" : "Manage incoming collection requests"}
          </p>
        </div>
        {isHousehold && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-request">
                <Plus className="w-4 h-4 mr-2" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent>
              <NewRequestForm onClose={() => setIsDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        )} 
      </div>

      {/* Requests List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-1/4 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : visibleRequests.length === 0 ? (
        <></>
      ) : (
        <div className="space-y-4">
          {visibleRequests.map((request) => (
            <RequestCard key={request.id} request={request} isHousehold={isHousehold} />
          ))}
        </div>
      )}
    </div>
  );
}

function RequestCard({ request, isHousehold }: { request: RequestType; isHousehold: boolean }) {
  const { toast } = useToast();
  const [requesterItems, setRequesterItems] = useState<any[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const statusColors: Record<string, "secondary" | "default" | "outline" | "destructive"> = {
    Pending: "secondary",
    Accepted: "default",
    Completed: "outline",
    Cancelled: "destructive",
    Declined: "destructive",
  };

  const updateRequestStatus = async (newStatus: string) => {
    if (!request.id) return;
    
    setIsUpdating(true);
    try {
      const requestRef = ref(database, `requests/${request.id}`);
      await update(requestRef, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      toast({
        title: `Request ${newStatus}`,
        description: `The request has been ${newStatus.toLowerCase()}`,
      });
    } catch (error: any) {
      console.error("Error updating request status:", error);
      toast({
        title: "Failed to update request",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteRequest = async () => {
    if (!request.id) return;
    
    setIsDeleting(true);
    try {
      const requestRef = ref(database, `requests/${request.id}`);
      await remove(requestRef);
      toast({
        title: "Request deleted",
        description: "The collection request has been successfully deleted",
      });
    } catch (error: any) {
      console.error("Error deleting request:", error);
      toast({
        title: "Failed to delete request",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  React.useEffect(() => {
    if (!request.requesterId) return;

    // Fetch items from Firebase in real-time
    const itemsRef = ref(database, "items");
    const unsubscribe = onValue(
      itemsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const itemsList: any[] = Object.values(data)
            .filter((item: any) => item.sellerId === request.requesterId)
            .map((item: any) => ({
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
          setRequesterItems(itemsList);
        } else {
          setRequesterItems([]);
        }
      },
      (error) => {
        console.error("Error fetching items from Firebase:", error);
        setRequesterItems([]);
      }
    );

    return () => unsubscribe();
  }, [request.requesterId]);

  return (
    <Card className="hover-elevate" data-testid={`card-request-${request.id}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{request.type} Request</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{request.items}</p>
          </div>
          <Badge variant={statusColors[request.status || "Pending"] || "secondary"} data-testid={`badge-status-${request.id}`}>
            {request.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span>{request.address}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>{request.date}{request.time ? ` at ${request.time}` : ""}</span>
        </div>
        <p className="text-sm text-foreground">
          {isHousehold ? `Junkshop: ${request.responderName || "Waiting for response"}` : `From: ${request.requesterName}`}
        </p>
        {requesterItems.length > 0 && (
          <div className="mt-2">
            <div className="text-sm font-medium mb-1">Items</div>
            <div className="grid grid-cols-3 gap-2">
              {requesterItems.map((it) => {
                const imgs: any[] = typeof it.imageUrls === 'string' ? JSON.parse(it.imageUrls || '[]') : (it.imageUrls || []);
                const url = (Array.isArray(imgs) && imgs[0]) || it.imageUrl || null;
                return (
                  <div key={it.id} className="text-xs">
                    {url ? <img src={url} alt={it.title} className="w-full h-16 object-cover rounded" /> : <div className="text-2xl">{it.emoji}</div>}
                    <div className="truncate">{it.title}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div className="mt-2 text-sm">
          <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(request.address)}`} target="_blank" rel="noreferrer" className="text-primary underline">Get directions</a>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        {!isHousehold && request.status === "Pending" && (
          <>
            <Button variant="outline" className="flex-1" onClick={() => updateRequestStatus("Accepted")} disabled={isUpdating}>
              {isUpdating ? "Accepting..." : "Accept"}
            </Button>
            <Button variant="destructive" className="flex-1" onClick={() => updateRequestStatus("Declined")} disabled={isUpdating}>
              Decline
            </Button>
          </>
        )}

        {!isHousehold && request.status === "Accepted" && (
          <Button className="w-full" onClick={() => updateRequestStatus("Completed")} disabled={isUpdating}>
            {isUpdating ? "Marking..." : "Mark Completed"}
          </Button>
        )}

        {request.status === "Completed" && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full" disabled={isDeleting}>
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Collection Request?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this collection request. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={deleteRequest} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardFooter>
    </Card>
  );
}

function NewRequestForm({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const userStr = localStorage.getItem("user");
  const rawUser: any = userStr && userStr !== "undefined" ? JSON.parse(userStr) : null;
  const currentUser: User | null = rawUser
    ? { ...rawUser, id: rawUser.id || rawUser.uid, name: rawUser.name || rawUser.displayName || "User" }
    : null;

  const [availableItems, setAvailableItems] = useState<Array<any>>([]);
  const [junkshops, setJunkshops] = useState<Array<any>>([]);
  const [selectedJunkshop, setSelectedJunkshop] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    type: "Collection",
    items: "",
    address: currentUser?.address || "",
    date: new Date().toISOString().split("T")[0],
    time: "",
  });

  // Load household items and available junkshops
  React.useEffect(() => {
    if (!currentUser) return;
    const currentUserId = (currentUser as any).id || (currentUser as any).uid;
    if (!currentUserId) return;

    // Fetch user's items from Firebase with real-time listener
    const itemsRef = ref(database, "items");
    const unsubscribe = onValue(
      itemsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const itemsList: any[] = Object.values(data)
            .filter((item: any) => item.sellerId === currentUserId)
            .map((item: any) => ({
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
          setAvailableItems(itemsList);
          // Auto-populate items field if empty
          if ((!formData.items || formData.items.length === 0) && itemsList && itemsList.length > 0) {
            setFormData(f => ({ ...f, items: itemsList.map((it: any) => it.title).join("; ") }));
          }
        } else {
          setAvailableItems([]);
        }
      },
      (error) => {
        console.error("Error fetching items from Firebase:", error);
        setAvailableItems([]);
      }
    );

    // Fetch junkshops
    (async () => {
      try {
        const usersRef = ref(database, "users");
        const usersSnap = await get(usersRef);
        const usersData = usersSnap.val() || {};
        const shops = Object.values(usersData)
          .filter((u: any) => u.userType === "junkshop" && u.profileComplete)
          .map((u: any) => ({ ...u, id: u.id || u.uid }));
        setJunkshops(shops);
      } catch (e) {
        console.error("Error fetching junkshops:", e);
      }
    })();

    return () => unsubscribe();
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast({ title: "Not signed in", description: "Please log in to create a request", variant: "destructive" });
      window.location.href = "/login";
      return;
    }
    if (currentUser.userType !== "household") {
      toast({ title: "Not allowed", description: "Only household users may create collection requests", variant: "destructive" });
      return;
    }
    if (!availableItems || availableItems.length === 0) {
      toast({ title: "No items", description: "Please post at least one recyclable item before creating a request", variant: "destructive" });
      return;
    }
    if (!selectedJunkshop) {
      toast({ title: "Select junkshop", description: "Please choose a junkshop to address this request to", variant: "destructive" });
      return;
    }
    if (!formData.items.trim() || !formData.address.trim() || !formData.date.trim()) {
      toast({ title: "Missing fields", description: "Please complete items, address, and date", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const currentUserId = (currentUser as any).id || (currentUser as any).uid;
      if (!currentUserId) {
        toast({ title: "Missing user ID", description: "Please log in again", variant: "destructive" });
        return;
      }

      const requestId = push(ref(database, "requests")).key || `req_${Date.now()}`;
      const requestRef = ref(database, `requests/${requestId}`);
      
      const requestData = {
        id: requestId,
        ...formData,
        requesterId: currentUserId,
        requesterName: currentUser.name,
        responderId: selectedJunkshop,
        responderName: junkshops.find(j => (j.id || j.uid) === selectedJunkshop)?.name || null,
        status: "Pending",
        createdAt: new Date().toISOString(),
      };

      await set(requestRef, requestData);
      
      console.log("✅ Request saved to Firebase:", requestId);
      toast({
        title: "Request created!",
        description: "Your collection request has been submitted",
      });
      onClose();
    } catch (error: any) {
      console.error("Error creating request:", error);
      toast({
        title: "Failed to create request",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>New Collection Request</DialogTitle>
        <DialogDescription>Schedule a pickup for your recyclables</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="items">Items for Collection</Label>
          <Textarea
            id="items"
            placeholder="e.g., Mixed recyclables - plastic bottles, newspapers, cardboard"
            value={formData.items}
            onChange={(e) => setFormData({ ...formData, items: e.target.value })}
            required
            data-testid="input-items"
          />
          {availableItems.length > 0 && (
            <div className="mt-2 text-sm text-muted-foreground">
              <p className="mb-2">Your posted items:</p>
              <div className="grid grid-cols-2 gap-2">
                {availableItems.map((it: any) => {
                  let firstImage: string | null = null;
                  try {
                    const imgs = typeof it.imageUrls === "string" ? JSON.parse(it.imageUrls || "[]") : (it.imageUrls || []);
                    firstImage = Array.isArray(imgs) && imgs.length > 0 ? imgs[0] : (it.imageUrl || null);
                  } catch {
                    firstImage = it.imageUrl || null;
                  }

                  return (
                    <div key={it.id} className="flex items-center gap-2 rounded border p-2 bg-muted/30">
                      {firstImage ? (
                        <img src={firstImage} alt={it.title} className="h-12 w-12 rounded object-cover" />
                      ) : (
                        <div className="h-12 w-12 rounded border border-dashed border-muted-foreground/40 flex items-center justify-center bg-background">
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-foreground text-xs font-medium">{it.title}</p>
                        <p className="text-[11px]">{firstImage ? "Image attached" : "Image placeholder"}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Pickup Address</Label>
          <Input
            id="address"
            placeholder="Street, Barangay, Baguio City"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            required
            data-testid="input-address"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="junkshop">Choose Junkshop</Label>
          <select id="junkshop" value={selectedJunkshop || ""} onChange={(e) => setSelectedJunkshop(e.target.value)} className="w-full border rounded p-2" required>
            <option value="">Select a junkshop</option>
            {junkshops.map(js => (
              <option key={js.id || js.uid} value={js.id || js.uid}>{js.name} — {js.address}</option>
            ))}
          </select>
          {junkshops.length === 0 && (
            <p className="text-sm text-muted-foreground">No junkshops found yet. Ask a junkshop to complete their profile first.</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="date">Preferred Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              data-testid="input-date"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="time">Preferred Time</Label>
            <Input
              id="time"
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              data-testid="input-time"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={isSubmitting}
            data-testid="button-submit-request"
          >
            {isSubmitting ? "Creating..." : "Create Request"}
          </Button>
        </div>
      </form>
    </>
  );
}

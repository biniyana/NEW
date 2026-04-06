import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Request as RequestType, User } from "@shared/schema";
import { Plus, Calendar, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function RequestsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const userStr = localStorage.getItem("user");
  const currentUser: User | null = userStr && userStr !== "undefined" ? JSON.parse(userStr) : null;
  const isHousehold = currentUser?.userType === "household";
  
  console.log("👤 [Requests Page] Current user:", {
    name: currentUser?.name,
    id: currentUser?.id,
    email: currentUser?.email,
    userType: currentUser?.userType,
  });

  const { data: requests = [], isLoading } = useQuery<RequestType[]>({
    queryKey: ["/api/requests"],
    queryFn: async () => {
      console.log("🔍 [Frontend] Fetching requests from /api/requests...");
      const response = await fetch("/api/requests");
      console.log("📡 [Frontend] Response status:", response.status);
      const data = await response.json();
      console.log("✅ [Frontend] Received requests:", data);
      console.log("📊 [Frontend] Requests count:", Array.isArray(data) ? data.length : "not an array");
      return data || [];
    },
  });

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
  
  const statusColors: Record<string, "secondary" | "default" | "outline" | "destructive"> = {
    Pending: "secondary",
    Accepted: "default",
    Completed: "outline",
    Cancelled: "destructive",
  };

  const cancelMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("PATCH", `/api/requests/${request.id}`, { status: "Cancelled", actorId: (JSON.parse(localStorage.getItem('user')||'null')||{}).id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      toast({
        title: "Request cancelled",
        description: "Your request has been cancelled",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to cancel request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const acceptMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("PATCH", `/api/requests/${request.id}`, { status: "Accepted", actorId: (JSON.parse(localStorage.getItem('user')||'null')||{}).id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      toast({
        title: "Request accepted",
        description: "You've accepted this collection request",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to accept request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAction = () => {
    if (isHousehold) {
      // Households cannot change request status after submission per system rules
      toast({ title: "Action not allowed", description: "Households cannot modify requests after submission", variant: "destructive" });
      return;
    }
    // Junkshop: accept
    acceptMutation.mutate();
  };

  React.useEffect(() => {
    (async () => {
      try {
        const items = await fetch(`/api/items?sellerId=${encodeURIComponent(request.requesterId)}`).then(r => r.json()).catch(() => []);
        setRequesterItems(items || []);
      } catch (e) {}
    })();
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
            <Button variant="outline" className="flex-1" onClick={() => acceptMutation.mutate()} disabled={acceptMutation.isPending}>
              {acceptMutation.isPending ? "Accepting..." : "Accept"}
            </Button>
            <Button variant="destructive" className="flex-1" onClick={() => apiRequest("PATCH", `/api/requests/${request.id}`, { status: "Declined", actorId: (JSON.parse(localStorage.getItem('user')||'null')||{}).id }).then(() => queryClient.invalidateQueries({ queryKey: ["/api/requests"] }))}>
              Decline
            </Button>
          </>
        )}

        {!isHousehold && request.status === "Accepted" && (
          <Button className="w-full" onClick={() => apiRequest("PATCH", `/api/requests/${request.id}`, { status: "Completed", actorId: (JSON.parse(localStorage.getItem('user')||'null')||{}).id }).then(() => queryClient.invalidateQueries({ queryKey: ["/api/requests"] }))}>
            Mark Completed
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function NewRequestForm({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const userStr = localStorage.getItem("user");
  const currentUser: User | null = userStr && userStr !== "undefined" ? JSON.parse(userStr) : null;

  const [availableItems, setAvailableItems] = useState<Array<any>>([]);
  const [junkshops, setJunkshops] = useState<User[]>([]);
  const [selectedJunkshop, setSelectedJunkshop] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    type: "Collection",
    items: "",
    address: currentUser?.address || "",
    date: new Date().toISOString().split("T")[0],
    time: "",
  });

  // Load household items and available junkshops
  React.useEffect(() => {
    (async () => {
      if (!currentUser) return;
      try {
        const items = await fetch(`/api/items?sellerId=${encodeURIComponent(currentUser.id)}`).then(r => r.json()).catch(() => []);
        setAvailableItems(items || []);
        if ((!formData.items || formData.items.length === 0) && items && items.length > 0) {
          setFormData(f => ({ ...f, items: items.map((it: any) => it.title).join("; ") }));
        }
      } catch (e) {
        // ignore
      }
      try {
        const users = await fetch(`/api/users`).then(r => r.json()).catch(() => []);
        setJunkshops((users || []).filter((u: any) => u.userType === "junkshop"));
      } catch (e) {}
    })();
  }, []);

  const createRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/requests", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      toast({
        title: "Request created!",
        description: "Your collection request has been submitted",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
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

    createRequestMutation.mutate({
      ...formData,
      requesterId: currentUser.id,
      requesterName: currentUser.name,
      responderId: selectedJunkshop,
      responderName: (junkshops.find(j => j.id === selectedJunkshop) as any)?.name || null,
      status: "Pending",
    });
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
              Your posted items:
              <ul className="list-disc pl-5">
                {availableItems.map(it => <li key={it.id}>{it.title}</li>)}
              </ul>
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
          <select id="junkshop" value={selectedJunkshop || ""} onChange={(e) => setSelectedJunkshop(e.target.value)} className="w-full border rounded p-2">
            <option value="">Select a junkshop</option>
            {junkshops.map(js => (
              <option key={js.id} value={js.id}>{js.name} — {js.address}</option>
            ))}
          </select>
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
            disabled={createRequestMutation.isPending}
            data-testid="button-submit-request"
          >
            {createRequestMutation.isPending ? "Creating..." : "Create Request"}
          </Button>
        </div>
      </form>
    </>
  );
}

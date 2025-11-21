import { useState } from "react";
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

  const currentUser: User | null = JSON.parse(localStorage.getItem("user") || "null");
  const isHousehold = currentUser?.userType === "household";

  const { data: requests = [], isLoading } = useQuery<RequestType[]>({
    queryKey: ["/api/requests"],
    queryFn: async () => {
      return await fetch("/api/requests").then(res => res.json());
    },
  });

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
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground">No requests yet</p>
            <p className="text-sm text-muted-foreground">
              {isHousehold ? "Create your first collection request" : "No pending requests at the moment"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <RequestCard key={request.id} request={request} isHousehold={isHousehold} />
          ))}
        </div>
      )}
    </div>
  );
}

function RequestCard({ request, isHousehold }: { request: RequestType; isHousehold: boolean }) {
  const statusColors: Record<string, "secondary" | "default" | "outline" | "destructive"> = {
    Pending: "secondary",
    Accepted: "default",
    Completed: "outline",
    Cancelled: "destructive",
  };

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
          <span>{request.date}</span>
        </div>
        <p className="text-sm text-foreground">
          {isHousehold ? `Junkshop: ${request.responderName || "Waiting for response"}` : `From: ${request.requesterName}`}
        </p>
      </CardContent>
      {request.status === "Pending" && (
        <CardFooter>
          <Button className="w-full" variant="outline" data-testid={`button-action-${request.id}`}>
            {isHousehold ? "Cancel Request" : "Accept Request"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

function NewRequestForm({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const currentUser: User = JSON.parse(localStorage.getItem("user")!);

  const [formData, setFormData] = useState({
    type: "Collection",
    items: "",
    address: currentUser.address,
    date: new Date().toISOString().split("T")[0],
  });

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
    createRequestMutation.mutate({
      ...formData,
      requesterId: currentUser.id,
      requesterName: currentUser.name,
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

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Message, User } from "@shared/schema";
import { Send, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function MessagesPage() {
  const currentUser: User | null = JSON.parse(localStorage.getItem("user") || "null");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const { toast } = useToast();

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
    queryFn: async () => {
      return await fetch("/api/messages").then(res => res.json());
    },
  });

  // Get unique conversations
  const conversations = Array.from(
    new Set(
      messages.map((m) =>
        m.senderId === currentUser?.id ? m.receiverId : m.senderId
      )
    )
  ).map((userId) => {
    const lastMessage = messages
      .filter(
        (m) =>
          (m.senderId === userId && m.receiverId === currentUser?.id) ||
          (m.senderId === currentUser?.id && m.receiverId === userId)
      )
      .sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeB - timeA;
      })[0];
    
    return {
      userId,
      userName: lastMessage?.senderId === currentUser?.id ? lastMessage.receiverName : lastMessage.senderName,
      lastMessage: lastMessage?.content || "",
      timestamp: lastMessage?.timestamp ? new Date(lastMessage.timestamp) : new Date(),
    };
  });

  const selectedMessages = messages
    .filter(
      (m) =>
        (m.senderId === selectedUser && m.receiverId === currentUser?.id) ||
        (m.senderId === currentUser?.id && m.receiverId === selectedUser)
    )
    .sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeA - timeB;
    });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/messages", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      setMessageText("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedUser) return;

    const receiver = conversations.find((c) => c.userId === selectedUser);
    sendMessageMutation.mutate({
      senderId: currentUser?.id,
      senderName: currentUser?.name,
      receiverId: selectedUser,
      receiverName: receiver?.userName,
      content: messageText,
      read: "false",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Messages</h2>
        <p className="text-muted-foreground">Chat with households and junkshops</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 h-[600px]">
        {/* Conversations List */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">No messages yet</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.userId}
                    onClick={() => setSelectedUser(conv.userId)}
                    className={`w-full p-4 text-left hover-elevate border-b border-border ${
                      selectedUser === conv.userId ? "bg-accent" : ""
                    }`}
                    data-testid={`conversation-${conv.userId}`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarFallback>{conv.userName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{conv.userName}</p>
                        <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="md:col-span-2">
          {selectedUser ? (
            <>
              <CardHeader>
                <CardTitle>
                  {conversations.find((c) => c.userId === selectedUser)?.userName}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[440px] p-4">
                  <div className="space-y-4">
                    {selectedMessages.map((message) => {
                      const isOwn = message.senderId === currentUser?.id;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                          data-testid={`message-${message.id}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              isOwn
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-foreground"
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${isOwn ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                              {message.timestamp ? new Date(message.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
                <div className="border-t border-border p-4">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      data-testid="input-message"
                    />
                    <Button
                      type="submit"
                      disabled={!messageText.trim() || sendMessageMutation.isPending}
                      data-testid="button-send"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-foreground">Select a conversation</p>
                <p className="text-sm text-muted-foreground">Choose a conversation to start messaging</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}

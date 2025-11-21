import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2 } from "lucide-react";
import { User as UserType, ChatbotConversation } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

interface ChatbotPageProps {
  currentUser: UserType | null;
}

export default function ChatbotPage({ currentUser }: ChatbotPageProps) {
  const [messageText, setMessageText] = useState("");

  const { data: conversations = [] } = useQuery<ChatbotConversation[]>({
    queryKey: ["/api/chatbot", currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const response = await fetch(`/api/chatbot/${currentUser.id}`);
      if (!response.ok) throw new Error("Failed to fetch chat history");
      return response.json();
    },
  });

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/chatbot/chat", {
        userId: currentUser?.id,
        message,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chatbot", currentUser?.id] });
      setMessageText("");
    },
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    chatMutation.mutate(messageText);
  };

  return (
    <div className="h-full">
      <Card className="h-full flex flex-col">
        <CardHeader className="bg-gradient-to-r from-primary to-chart-2">
          <CardTitle className="text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">🤖</div>
            Jarvish - Your Eco-Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1 flex flex-col">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {conversations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🤖</div>
                  <p className="text-foreground font-medium mb-2">Welcome to Jarvish!</p>
                  <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                    I'm your eco-friendly marketplace assistant. Ask me anything about recycling, selling items, collection requests, or how to use Waiz!
                  </p>
                </div>
              ) : (
                conversations.map((conv) => {
                  const isUser = conv.role === "user";
                  return (
                    <div key={conv.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          isUser
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        <p className="text-sm">{conv.content}</p>
                        <p className={`text-xs mt-1 ${isUser ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                          {new Date(conv.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              {chatMutation.isPending && (
                <div className="flex justify-start">
                  <div className="bg-muted text-foreground rounded-lg p-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <p className="text-sm">Thinking...</p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="border-t border-border p-4">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                placeholder="Ask Jarvish anything about Waiz..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                data-testid="input-jarvish-message"
                disabled={chatMutation.isPending}
              />
              <Button
                type="submit"
                disabled={!messageText.trim() || chatMutation.isPending}
                data-testid="button-jarvish-send"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

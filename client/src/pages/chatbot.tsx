import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, X, MessageCircle } from "lucide-react";
import { User as UserType, ChatbotConversation } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

interface ChatbotBubbleProps {
  currentUser: UserType | null;
}

export function ChatbotBubble({ currentUser }: ChatbotBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);
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
    onError: (error: any) => {
      console.error("Chat error:", error);
    },
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    chatMutation.mutate(messageText);
  };

  if (!currentUser) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {isOpen ? (
        <div className="bg-card border border-border rounded-lg shadow-lg w-96 flex flex-col h-[500px] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-chart-2 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-sm">
                🤖
              </div>
              <span className="text-white font-semibold">Jarvish</span>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/20 h-8 w-8"
              onClick={() => setIsOpen(false)}
              data-testid="button-close-jarvish"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Chat Area */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {chatMutation.isError && (
                <div className="bg-destructive/20 text-destructive-foreground rounded-lg p-3 text-xs">
                  <p className="font-medium mb-1">Jarvish is temporarily unavailable</p>
                  <p>Our AI assistant is experiencing issues. Please try again later or ask our support team.</p>
                </div>
              )}
              {conversations.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-3xl mb-2">🤖</div>
                  <p className="text-foreground font-medium text-sm mb-1">Welcome to Jarvish!</p>
                  <p className="text-muted-foreground text-xs">
                    Ask about recycling, items, or Waiz features.
                  </p>
                </div>
              ) : (
                conversations.map((conv) => {
                  const isUser = conv.role === "user";
                  return (
                    <div key={conv.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[70%] rounded-lg p-2 text-sm ${
                          isUser
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        <p>{conv.content}</p>
                      </div>
                    </div>
                  );
                })
              )}
              {chatMutation.isPending && (
                <div className="flex justify-start">
                  <div className="bg-muted text-foreground rounded-lg p-2 flex items-center gap-1 text-sm">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t border-border p-3">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                placeholder="Ask Jarvish..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                data-testid="input-jarvish-message"
                disabled={chatMutation.isPending}
                className="text-sm h-9"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!messageText.trim() || chatMutation.isPending}
                data-testid="button-jarvish-send"
                className="h-9 w-9"
              >
                <Send className="w-3 h-3" />
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-14 h-14 shadow-lg"
          size="icon"
          data-testid="button-open-jarvish"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      )}
    </div>
  );
}

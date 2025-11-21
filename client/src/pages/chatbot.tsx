import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, X, MessageCircle, Trash2, ChevronDown } from "lucide-react";
import { User as UserType, ChatbotConversation } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ChatbotBubbleProps {
  currentUser: UserType | null;
  activeTab?: string;
}

const SUGGESTED_PROMPTS = [
  "How do I sell recyclables?",
  "What are the current rates?",
  "How to create a collection request?",
  "Tell me about eco-friendly practices",
];

export function ChatbotBubble({ currentUser, activeTab }: ChatbotBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Close chatbot when tab changes
  useEffect(() => {
    setIsOpen(false);
  }, [activeTab]);
  const [messageText, setMessageText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [conversations, chatMutation.isPending]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    chatMutation.mutate(messageText);
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setMessageText(prompt);
  };

  const handleClearHistory = () => {
    if (conversations.length === 0) return;
    if (confirm("Are you sure you want to clear the conversation history?")) {
      localStorage.removeItem(`jarvish-${currentUser?.id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/chatbot", currentUser?.id] });
      toast({
        title: "Conversation cleared",
        description: "Chat history has been cleared",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as any);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 font-sans">
      {isOpen ? (
        <div className="bg-card border border-border rounded-xl shadow-2xl w-96 flex flex-col h-[600px] overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary via-primary/80 to-chart-2 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-lg animate-bounce">
                🤖
              </div>
              <div>
                <p className="text-white font-bold text-sm">Jarvish</p>
                <p className="text-white/70 text-xs">Eco-Assistant</p>
              </div>
            </div>
            <div className="flex gap-2">
              {conversations.length > 0 && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/20 h-8 w-8"
                  onClick={handleClearHistory}
                  data-testid="button-clear-jarvish"
                  title="Clear history"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20 h-8 w-8"
                onClick={() => setIsOpen(false)}
                data-testid="button-close-jarvish"
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Chat Area */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {chatMutation.isError && (
                <div className="bg-destructive/20 border border-destructive/30 text-destructive-foreground rounded-lg p-3 text-xs animate-in fade-in">
                  <p className="font-semibold mb-1">⚠️ Jarvish Unavailable</p>
                  <p className="text-xs">Our AI assistant is experiencing issues. Please check back shortly or contact support.</p>
                </div>
              )}

              {conversations.length === 0 && !chatMutation.isPending ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="text-4xl">🤖</div>
                  <div className="text-center">
                    <p className="text-foreground font-bold text-sm mb-1">Welcome to Jarvish!</p>
                    <p className="text-muted-foreground text-xs mb-4">
                      Your eco-friendly marketplace assistant
                    </p>
                  </div>
                  <div className="w-full space-y-2">
                    <p className="text-xs text-muted-foreground font-medium px-2">Quick Start:</p>
                    {SUGGESTED_PROMPTS.map((prompt, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-8 justify-start text-left"
                        onClick={() => handleSuggestedPrompt(prompt)}
                      >
                        {prompt}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                conversations.map((conv, idx) => {
                  const isUser = conv.role === "user";
                  return (
                    <div
                      key={conv.id}
                      className={`flex ${isUser ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2`}
                    >
                      <div
                        className={`max-w-[75%] rounded-lg p-3 ${
                          isUser
                            ? "bg-primary text-primary-foreground rounded-br-none"
                            : "bg-muted text-foreground rounded-bl-none"
                        }`}
                      >
                        <p className="text-sm break-words">{conv.content}</p>
                        <p
                          className={`text-xs mt-2 ${
                            isUser ? "text-primary-foreground/70" : "text-muted-foreground"
                          }`}
                        >
                          {new Date(conv.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}

              {chatMutation.isPending && (
                <div className="flex justify-start animate-in fade-in">
                  <div className="bg-muted text-foreground rounded-lg rounded-bl-none p-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Jarvish is thinking...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t border-border p-3 bg-background/50 backdrop-blur">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                placeholder="Ask Jarvish..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyDown}
                data-testid="input-jarvish-message"
                disabled={chatMutation.isPending}
                className="text-sm h-10"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!messageText.trim() || chatMutation.isPending}
                data-testid="button-jarvish-send"
                className="h-10 w-10"
              >
                {chatMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-2 px-1">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-16 h-16 shadow-2xl animate-in fade-in zoom-in-75 duration-500 hover:scale-110 transition-transform"
          size="icon"
          data-testid="button-open-jarvish"
          title="Open Jarvish Assistant"
        >
          <div className="flex flex-col items-center justify-center gap-1">
            <MessageCircle className="w-6 h-6" />
            <span className="text-xs">Ask</span>
          </div>
        </Button>
      )}
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, X, MessageCircle, Trash2, ChevronDown } from "lucide-react";
import { User as UserType, ChatbotConversation } from "@/models";
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
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: conversations = [] /*, refetch: refetchConversations */ } = useQuery<ChatbotConversation[]>({
    queryKey: ["/api/chatbot", currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const response = await fetch(`/api/chatbot/${currentUser.id}`);
      if (!response.ok) throw new Error("Failed to fetch chat history");
      return response.json();
    },
    staleTime: 0, // Disable caching to always get fresh data
    refetchInterval: false,
  });

  const [loading, setLoading] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setHasNewMessage(false);
    }
  }, [isOpen]);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      console.log("[Chatbot] Sending message:", { userId: currentUser?.id, message });
      const response = await apiRequest("POST", "/api/chatbot/chat", {
        userId: currentUser?.id,
        message,
      });
      const data = await response.json();
      console.log("[Chatbot] Response received:", data);
      return data;
    },
    onMutate: (message: string) => {
      setLoading(true);
      // show user's message right away
      if (currentUser) {
        queryClient.setQueryData<ChatbotConversation[]>(["/api/chatbot", currentUser.id], (old = []) => [
          ...old,
          {
            id: `temp-user-${Date.now()}`,
            userId: currentUser.id,
            role: "user",
            content: message,
            timestamp: new Date(),
          } as ChatbotConversation,
        ]);
      }
    },
    onSuccess: (data: any) => {
      console.log("[Chatbot] Success - received:", data?.message);
      setMessageText("");
      // Immediately append assistant message for snappy UI (persist locally)
      if (data?.message && currentUser) {
        queryClient.setQueryData<ChatbotConversation[]>(["/api/chatbot", currentUser.id], (old = []) => [
          ...old,
          {
            id: `temp-${Date.now()}`,
            userId: currentUser.id,
            role: "assistant",
            content: data.message,
            timestamp: new Date(),
          } as ChatbotConversation,
        ]);
        if (!isOpen) {
          setHasNewMessage(true);
        }
      }
      // skip immediate refetch; we'll rely on optimistic state or manual refresh if needed
      // refetchConversations();
    },
    onError: (error: any) => {
      console.error("[Chatbot] Mutation error:", error?.message || error);
      toast({
        title: "Message failed",
        description: error?.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      return await apiRequest("DELETE", `/api/chatbot/${messageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chatbot", currentUser?.id] });
      toast({
        title: "Message deleted",
        description: "The message has been removed from the conversation",
      });
      setDeletingMessageId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete message",
        variant: "destructive",
      });
      setDeletingMessageId(null);
    },
  });

  const clearConversationMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser?.id) throw new Error("User not found");
      return await apiRequest("DELETE", `/api/chatbot/user/${currentUser.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chatbot", currentUser?.id] });
      toast({
        title: "Conversation cleared",
        description: "All messages have been deleted",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Clear failed",
        description: error.message || "Failed to clear conversation",
        variant: "destructive",
      });
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
  }, [conversations, loading]);

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
    clearConversationMutation.mutate();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as any);
    }
  };


  function renderMessage(text: string | undefined) {
    if (!text) return null;
    const content = String(text).trim();
    if (!content) return null;

    // simple paragraph/line splitting, no link handling
    return content.split(/\n\n+/).map((para, idx) => (
      <p key={idx} className="mb-2">
        {para.split(/\n/).map((line, j) => (
          <>
            {line}
            {j < para.split(/\n/).length - 1 && <br />}
          </>
        ))}
      </p>
    ));
  }

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
                <p className="text-white font-bold text-sm">Garbish</p>
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
                  disabled={clearConversationMutation.isPending}
                  data-testid="button-clear-garbish"
                  title="Clear history"
                >
                  {clearConversationMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20 h-8 w-8"
                onClick={() => setIsOpen(false)}
                data-testid="button-close-garbish"
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
                  <p className="font-semibold mb-1">⚠️ Garbish Unavailable</p>
                  <p className="text-xs">Our AI assistant is experiencing issues. Please check back shortly or contact support.</p>
                </div>
              )}

              {conversations.length === 0 && !loading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="text-4xl">🤖</div>
                  <div className="text-center">
                    <p className="text-foreground font-bold text-sm mb-1">Welcome to Garbish!</p>
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
                      className={`flex ${isUser ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 group`}
                    >
                      <div
                        className={`max-w-[75%] rounded-lg p-3 relative ${
                          isUser
                            ? "bg-primary text-primary-foreground rounded-br-none"
                            : "bg-muted text-foreground rounded-bl-none"
                        }`}
                      >
                        {isUser && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute -top-2 -left-8 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/20"
                            onClick={() => deleteMessageMutation.mutate(conv.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                        <div className="text-sm break-words">
                          {renderMessage(conv.content)}
                        </div>
                        <p
                          className={`text-xs mt-2 ${
                            isUser ? "text-primary-foreground/70" : "text-muted-foreground"
                          }`}
                        >
                          {conv.timestamp ? new Date(conv.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          }) : ""}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}

              {loading && (
                <div className="flex justify-start animate-in fade-in">
                  <div className="bg-muted text-foreground rounded-lg rounded-bl-none p-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Garbish is thinking...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t border-border p-3 bg-background/50 backdrop-blur">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                placeholder="Ask Garbish..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyDown}
                data-testid="input-garbish-message"
                disabled={loading}
                className="text-sm h-10"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!messageText.trim() || loading}
                data-testid="button-garbish-send"
                className="h-10 w-10"
              >
                {loading ? (
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
          data-testid="button-open-garbish"
          title="Open Garbish Assistant"
        >
          <div className="relative flex flex-col items-center justify-center gap-1">
            <MessageCircle className="w-6 h-6" />
            {hasNewMessage && (
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-white animate-pulse" />
            )}
            <span className="text-xs">Ask</span>
          </div>
        </Button>
      )}
    </div>
  );
}

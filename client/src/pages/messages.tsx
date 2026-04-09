import { useMemo, useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Message, User } from "@/models";
import { Send, MessageCircle, Search, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ref, onValue, set, update, get } from "firebase/database";
import { database } from "@/firebase/firebase";
import { getOtherParticipantName, sendConversationMessage, fetchUserNameFromDB } from "@/lib/firebaseConversations";

export default function MessagesPage() {
  const userStr = localStorage.getItem("user");
  const rawUser: any = userStr && userStr !== "undefined" ? JSON.parse(userStr) : null;
  const currentUser: User | null = rawUser
    ? {
        ...rawUser,
        id: rawUser.id || rawUser.uid,
        name: rawUser.name || rawUser.displayName || rawUser.email || "User",
      }
    : null;

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>("");
  const [messageText, setMessageText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [chatSearchTerm, setChatSearchTerm] = useState("");
  const [allConversations, setAllConversations] = useState<any[]>([]);
  const [conversationMessages, setConversationMessages] = useState<any[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingUserName, setIsLoadingUserName] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const [location] = useLocation();

  // Listen to all conversations
  useEffect(() => {
    if (!currentUser?.id) return;

    const conversationsRef = ref(database, "conversations");

    const unsubscribe = onValue(
      conversationsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const convList = Object.values(data)
            .filter((conv: any) => 
              conv.participants && conv.participants.includes(currentUser.id)
            )
            .sort((a: any, b: any) => {
              const timeA = new Date(a.updatedAt).getTime();
              const timeB = new Date(b.updatedAt).getTime();
              return timeB - timeA;
            });
          setAllConversations(convList);
        } else {
          setAllConversations([]);
        }
      },
      (error) => {
        console.error("Error fetching conversations:", error);
        toast({
          title: "Error",
          description: "Failed to load conversations",
          variant: "destructive",
        });
      }
    );

    return () => unsubscribe();
  }, [currentUser?.id, toast]);

  // Listen to messages in selected conversation
  useEffect(() => {
    if (!selectedConversationId) {
      setConversationMessages([]);
      return;
    }

    const messagesRef = ref(database, `conversations/${selectedConversationId}/messages`);

    const unsubscribe = onValue(
      messagesRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const msgList = Object.values(data)
            .sort((a: any, b: any) => {
              const timeA = new Date(a.timestamp).getTime();
              const timeB = new Date(b.timestamp).getTime();
              return timeA - timeB;
            });
          setConversationMessages(msgList);

          // Mark messages as read
          if (currentUser?.id) {
            markMessagesAsRead(selectedConversationId, currentUser.id);
          }

          // Auto-scroll to latest message
          setTimeout(() => {
            if (scrollAreaRef.current) {
              const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
              if (scrollElement) {
                scrollElement.scrollTop = scrollElement.scrollHeight;
              }
            }
          }, 100);
        } else {
          setConversationMessages([]);
        }
      },
      (error) => {
        console.error("Error fetching messages:", error);
      }
    );

    return () => unsubscribe();
  }, [selectedConversationId, currentUser?.id]);

  // Mark messages as read
  const markMessagesAsRead = async (conversationId: string, userId: string) => {
    try {
      const unreadMessages = conversationMessages.filter(
        (msg: any) => msg.receiverId === userId && !msg.read
      );

      for (const message of unreadMessages) {
        const messageRef = ref(database, `conversations/${conversationId}/messages/${message.id}/read`);
        await set(messageRef, true);
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  // Handle URL parameters
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const conversationId = params.get("conversationId");
      const userId = params.get("userId");
      const userName = params.get("userName");

      if (conversationId) {
        setSelectedConversationId(conversationId);
      } else if (userId) {
        setSelectedUser(userId);
      }

      if (userName) {
        setSelectedUserName(decodeURIComponent(userName));
      }
    } catch (e) {
      console.error("Error parsing URL params:", e);
    }
  }, [location]);

  // Build conversation list
  const conversations = useMemo(() => {
    return allConversations.map((conv: any) => {
      const otherUserId = conv.participants?.find((id: string) => id !== currentUser?.id);
      const otherUserName = conv.participantNames?.[otherUserId] || otherUserId || "Unknown";
      const lastMessage = Object.values(conv.messages || {})
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0] as any;

      return {
        id: conv.id,
        userId: otherUserId,
        userName: otherUserName,
        lastMessage: lastMessage?.content || "",
        timestamp: lastMessage?.timestamp ? new Date(lastMessage.timestamp) : new Date(),
        unreadCount: Object.values(conv.messages || {})
          .filter((msg: any) => msg.receiverId === currentUser?.id && !msg.read).length,
      };
    });
  }, [allConversations, currentUser?.id]);

  // Filter conversations
  const filteredConversations = conversations.filter((conv) =>
    conv.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get selected conversation
  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedConversationId),
    [conversations, selectedConversationId]
  );

  // Filter messages by search term
  const filteredMessages = conversationMessages.filter((m) =>
    chatSearchTerm ? m.content.toLowerCase().includes(chatSearchTerm.toLowerCase()) : true
  );

  // Fetch user name if not available
  useEffect(() => {
    if (!selectedConversation && selectedUser && !selectedUserName) {
      setIsLoadingUserName(true);
      fetchUserNameFromDB(selectedUser)
        .then((name) => setSelectedUserName(name || selectedUser))
        .catch(() => setSelectedUserName(selectedUser))
        .finally(() => setIsLoadingUserName(false));
    } else if (selectedConversation) {
      setSelectedUserName(selectedConversation.userName);
    }
  }, [selectedConversation, selectedUser, selectedUserName]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !currentUser) return;

    // If conversation not yet created, use legacy message system for now
    if (!selectedConversationId && selectedUser) {
      setIsSending(true);
      try {
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const messageRef = ref(database, `messages/${messageId}`);

        const messageData = {
          id: messageId,
          senderId: currentUser.id,
          senderName: currentUser.name,
          receiverId: selectedUser,
          receiverName: selectedUserName || "User",
          content: messageText,
          read: false,
          timestamp: new Date().toISOString(),
        };

        await set(messageRef, messageData);
        console.log("✅ Message sent to Firebase:", messageId);
        setMessageText("");
      } catch (error: any) {
        console.error("Error sending message:", error);
        toast({
          title: "Failed to send message",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsSending(false);
      }
      return;
    }

    // Send through conversation
    if (!selectedConversationId) {
      toast({
        title: "Error",
        description: "Please select a conversation",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      await sendConversationMessage(
        selectedConversationId,
        currentUser.id,
        currentUser.name,
        selectedUser || selectedConversation?.userId || "",
        selectedUserName || selectedConversation?.userName || "User",
        messageText
      );
      setMessageText("");
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Messages</h2>
        <p className="text-muted-foreground">Chat with households and junkshops</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 h-[600px]">
        {/* Conversations List */}
        <Card className={`md:col-span-1 ${selectedConversationId ? "hidden md:block" : ""}`}>
          <CardHeader className="pb-3">
            <CardTitle>Conversations</CardTitle>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-8"
                data-testid="input-search-messages"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  data-testid="button-clear-search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[420px]">
              {conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">No conversations yet</p>
                  <p className="text-xs text-muted-foreground mt-2">Contact someone to start messaging</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">No conversations found</p>
                  <p className="text-xs text-muted-foreground mt-2">Try a different search term</p>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setSelectedConversationId(conv.id);
                      setSelectedUser(conv.userId);
                      setSelectedUserName(conv.userName);
                    }}
                    className={`w-full p-4 text-left hover-elevate border-b border-border transition-colors ${
                      selectedConversationId === conv.id ? "bg-accent" : "hover:bg-accent/50"
                    }`}
                    data-testid={`conversation-${conv.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarFallback>{conv.userName[0] || "?"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground truncate">{conv.userName}</p>
                          {conv.unreadCount > 0 && (
                            <Badge variant="secondary" className="text-[10px] px-2 py-1">
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(conv.timestamp).toLocaleDateString()}
                        </p>
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
          {selectedConversationId || selectedUserName ? (
            <>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar>
                      <AvatarFallback>{selectedUserName?.[0] || "?"}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <CardTitle className="truncate">
                        {isLoadingUserName ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading...
                          </span>
                        ) : (
                          selectedUserName || "Conversation"
                        )}
                      </CardTitle>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedConversationId(null);
                      setSelectedUser(null);
                      setSelectedUserName("");
                    }}
                    className="md:hidden"
                    data-testid="button-back-conversations"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="relative mt-3">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search messages..."
                    value={chatSearchTerm}
                    onChange={(e) => setChatSearchTerm(e.target.value)}
                    className="pl-10 pr-8"
                    data-testid="input-search-chat"
                  />
                  {chatSearchTerm && (
                    <button
                      onClick={() => setChatSearchTerm("")}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                      data-testid="button-clear-chat-search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea ref={scrollAreaRef} className="h-[440px] p-4">
                  {filteredMessages.length === 0 ? (
                    <div className="flex h-full min-h-[360px] items-center justify-center text-center">
                      <div>
                        <MessageCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                        <p className="text-base font-medium text-foreground">
                          Start a conversation with {selectedUserName || "this user"}
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Your first message will appear here and be saved to Firebase.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredMessages.map((message) => {
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
                              <p
                                className={`text-xs mt-1 ${
                                  isOwn ? "text-primary-foreground/80" : "text-muted-foreground"
                                }`}
                              >
                                {message.timestamp
                                  ? new Date(message.timestamp).toLocaleTimeString()
                                  : new Date().toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
                <div className="border-t border-border p-4">
                  <form onSubmit={sendMessage} className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      data-testid="input-message"
                      disabled={isLoadingUserName || !selectedUserName}
                    />
                    <Button
                      type="submit"
                      disabled={!messageText.trim() || isSending || isLoadingUserName || !selectedUserName}
                      data-testid="button-send"
                    >
                      {isSending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
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
                <p className="text-sm text-muted-foreground">Choose a conversation to start messaging or contact someone from the marketplace</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}

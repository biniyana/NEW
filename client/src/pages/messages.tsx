import { useMemo, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Message, User } from "@shared/schema";
import { Send, MessageCircle, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ref, onValue, set, update } from "firebase/database";
import { database } from "@/firebase/firebase";

export default function MessagesPage() {
  const userStr = localStorage.getItem("user");
  const currentUser: User | null = userStr && userStr !== "undefined" ? JSON.parse(userStr) : null;
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>("");
  const [messageText, setMessageText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [chatSearchTerm, setChatSearchTerm] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  // Real-time listener for messages from Firebase
  useEffect(() => {
    const messagesRef = ref(database, "messages");
    
    const unsubscribe = onValue(
      messagesRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const messagesList: Message[] = Object.values(data).map((msg: any) => ({
            id: msg.id,
            senderId: msg.senderId,
            senderName: msg.senderName,
            receiverId: msg.receiverId,
            receiverName: msg.receiverName,
            content: msg.content,
            read: msg.read || false,
            timestamp: msg.timestamp,
          }));
          console.log("✅ [Messages] Received messages from Firebase:", messagesList.length);
          setMessages(messagesList);
        } else {
          setMessages([]);
        }
      },
      (error) => {
        console.error("Error fetching messages from Firebase:", error);
        toast({
          title: "Error",
          description: "Failed to load messages",
          variant: "destructive",
        });
      }
    );

    return () => unsubscribe();
  }, [toast]);

  const [location] = useLocation();

  const unreadCountsByUser = messages.reduce((acc, msg) => {
    if (!currentUser) return acc;
    if (msg.receiverId === currentUser.id && String(msg.read) !== "true") {
      acc[msg.senderId] = (acc[msg.senderId] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const userId = params.get("userId");
      const userName = params.get("userName");

      if (userId) {
        setSelectedUser(userId);
      }

      if (userName) {
        setSelectedUserName(userName);
      }
    } catch (e) {
      // ignore
    }
  }, [location]);

  useEffect(() => {
    if (!currentUser || !selectedUser) return;

    const unreadToMark = messages.filter(
      (m) =>
        m.senderId === selectedUser &&
        m.receiverId === currentUser.id &&
        String(m.read) !== "true"
    );

    if (unreadToMark.length === 0) return;

    const markRead = async () => {
      try {
        // Mark messages as read in Firebase
        for (const message of unreadToMark) {
          const messageRef = ref(database, `messages/${message.id}`);
          await update(messageRef, { read: true });
        }
      } catch (error) {
        console.error("Failed to mark messages read", error);
      }
    };

    markRead();
  }, [currentUser, selectedUser, messages]);

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
      userName: lastMessage ? (lastMessage.senderId === currentUser?.id ? lastMessage.receiverName : lastMessage.senderName) : "Unknown",
      lastMessage: lastMessage?.content || "",
      timestamp: lastMessage?.timestamp ? new Date(lastMessage.timestamp) : new Date(),
      unreadCount: unreadCountsByUser[userId] || 0,
    };
  });

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.userId === selectedUser),
    [conversations, selectedUser]
  );

  // Filter conversations based on search term
  const filteredConversations = conversations.filter((conv) =>
    conv.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    })
    .filter((m) =>
      chatSearchTerm ? m.content.toLowerCase().includes(chatSearchTerm.toLowerCase()) : true
    );

  useEffect(() => {
    if (!selectedUser) {
      setSelectedUserName("");
      return;
    }

    if (selectedConversation) {
      setSelectedUserName(selectedConversation.userName);
      return;
    }

    const fetchUserName = async () => {
      try {
        const response = await fetch(`/api/users/${selectedUser}`);
        if (!response.ok) {
          throw new Error("Failed to fetch user name");
        }
        const userData = await response.json();
        setSelectedUserName(userData.name || "Unknown");
      } catch (error) {
        console.error("Failed to load chat partner name", error);
        setSelectedUserName("Unknown");
      }
    };

    fetchUserName();
  }, [selectedUser, selectedConversation]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedUser || !currentUser) return;

    setIsSending(true);
    try {
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const messageRef = ref(database, `messages/${messageId}`);

      const messageData = {
        id: messageId,
        senderId: currentUser.id,
        senderName: currentUser.name,
        receiverId: selectedUser,
        receiverName: selectedConversation?.userName || selectedUserName || "Unknown",
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
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Messages</h2>
        <p className="text-muted-foreground">Chat with households and junkshops</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 h-[600px]">
        {/* Conversations List - Always visible on desktop, hidden on mobile when chat is open */}
        <Card className={`md:col-span-1 ${selectedUser ? 'hidden md:block' : ''}`}>
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
                  <p className="text-sm text-muted-foreground">No messages yet</p>
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
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground truncate">{conv.userName}</p>
                          {conv.unreadCount > 0 && (
                            <Badge variant="secondary" className="text-[10px] px-2 py-1">
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </div>
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
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>
                    {selectedUserName || selectedConversation?.userName || "Conversation"}
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setSelectedUser(null)}
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
                <ScrollArea className="h-[440px] p-4">
                  {selectedMessages.length === 0 ? (
                    <div className="flex h-full min-h-[360px] items-center justify-center text-center">
                      <div>
                        <MessageCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                        <p className="text-base font-medium text-foreground">
                          Start a conversation with {selectedUserName || "this user"}
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Your first message will be saved to Firebase and this thread will appear in your conversations list.
                        </p>
                      </div>
                    </div>
                  ) : (
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
                  )}
                </ScrollArea>
                <div className="border-t border-border p-4">
                  <form onSubmit={sendMessage} className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      data-testid="input-message"
                    />
                    <Button
                      type="submit"
                      disabled={!messageText.trim() || isSending}
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

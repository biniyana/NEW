# Code Snippets Reference

Quick code references for the Firebase Conversations implementation.

---

## 🔧 Using Conversation Functions

### Create or Get Conversation
```typescript
import { getOrCreateConversation } from "@/lib/firebaseConversations";

// In your component
const handleContact = async () => {
  try {
    const conversationId = await getOrCreateConversation(
      currentUser.id,
      sellerId
    );
    navigate(`/messages?conversationId=${conversationId}`);
  } catch (error) {
    toast({
      title: "Error",
      description: "Failed to start conversation",
      variant: "destructive",
    });
  }
};
```

### Send a Message
```typescript
import { sendConversationMessage } from "@/lib/firebaseConversations";

const handleSendMessage = async () => {
  try {
    await sendConversationMessage(
      conversationId,
      currentUser.id,
      currentUser.name,
      recipientId,
      recipientName,
      messageText
    );
    setMessageText("");
  } catch (error) {
    console.error("Failed to send message:", error);
  }
};
```

### Fetch User Name
```typescript
import { fetchUserNameFromDB } from "@/lib/firebaseConversations";

// Get name from Firebase
const userName = await fetchUserNameFromDB(userId);
console.log(`User name: ${userName}`); // Will never be "Unknown"
```

---

## 🎧 Real-Time Listeners

### Listen to Conversations
```typescript
import { ref, onValue } from "firebase/database";
import { database } from "@/firebase/firebase";

useEffect(() => {
  if (!currentUser?.id) return;

  const conversationsRef = ref(database, "conversations");

  const unsubscribe = onValue(
    conversationsRef,
    (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Filter to current user's conversations
        const userConvs = Object.values(data).filter((conv: any) =>
          conv.participants?.includes(currentUser.id)
        );
        setAllConversations(userConvs);
      }
    }
  );

  return () => unsubscribe();
}, [currentUser?.id]);
```

### Listen to Messages in Conversation
```typescript
import { ref, onValue } from "firebase/database";
import { database } from "@/firebase/firebase";

useEffect(() => {
  if (!conversationId) return;

  const messagesRef = ref(database, `conversations/${conversationId}/messages`);

  const unsubscribe = onValue(
    messagesRef,
    (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convert to array and sort by timestamp
        const msgList = Object.values(data).sort((a: any, b: any) => {
          const timeA = new Date(a.timestamp).getTime();
          const timeB = new Date(b.timestamp).getTime();
          return timeA - timeB;
        });
        setMessages(msgList);
      }
    }
  );

  return () => unsubscribe();
}, [conversationId]);
```

---

## 🔄 Data Structures

### Conversation Object
```typescript
interface Conversation {
  id: string;
  participants: string[];
  participantNames: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  messages?: Record<string, Message>;
}
```

### Message Object
```typescript
interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  content: string;
  read: boolean;
  timestamp: string;
}
```

---

## 📱 Component Patterns

### Conversation List Item
```typescript
<button
  onClick={() => {
    setSelectedConversationId(conversation.id);
    setSelectedUserId(conversation.userId);
    setSelectedUserName(conversation.userName);
  }}
  className={`w-full p-4 text-left ${
    selectedConversationId === conversation.id ? "bg-accent" : ""
  }`}
>
  <div className="flex items-start gap-3">
    <Avatar>
      <AvatarFallback>{conversation.userName[0]}</AvatarFallback>
    </Avatar>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <p className="font-medium truncate">{conversation.userName}</p>
        {conversation.unreadCount > 0 && (
          <Badge variant="secondary">{conversation.unreadCount}</Badge>
        )}
      </div>
      <p className="text-sm text-muted-foreground truncate">
        {conversation.lastMessage}
      </p>
    </div>
  </div>
</button>
```

### Message Item
```typescript
<div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
  <div
    className={`max-w-[80%] rounded-lg p-3 ${
      isOwn
        ? "bg-primary text-primary-foreground"
        : "bg-muted text-foreground"
    }`}
  >
    <p className="text-sm">{message.content}</p>
    <p className={`text-xs mt-1 ${
      isOwn ? "text-primary-foreground/80" : "text-muted-foreground"
    }`}>
      {new Date(message.timestamp).toLocaleTimeString()}
    </p>
  </div>
</div>
```

---

## 🎨 UI/UX Patterns

### Contact Button with Loading
```typescript
const [isHandlingContact, setIsHandlingContact] = useState(false);

const handleContact = async () => {
  setIsHandlingContact(true);
  try {
    const conversationId = await getOrCreateConversation(...);
    navigate(`/messages?conversationId=${conversationId}`);
  } catch (error) {
    // Handle error
  } finally {
    setIsHandlingContact(false);
  }
};

return (
  <Button
    onClick={handleContact}
    disabled={isHandlingContact}
    data-testid="button-contact-seller"
  >
    <MessageCircle className="w-4 h-4 mr-2" />
    {isHandlingContact ? "Starting..." : "Contact"}
  </Button>
);
```

### Loading State in Header
```typescript
{isLoadingUserName ? (
  <span className="flex items-center gap-2">
    <Loader2 className="w-4 h-4 animate-spin" />
    Loading...
  </span>
) : (
  selectedUserName || "Conversation"
)}
```

### Auto-Scroll Effect
```typescript
useEffect(() => {
  // After messages update, scroll to bottom
  setTimeout(() => {
    const scrollElement = scrollAreaRef.current?.querySelector(
      '[data-radix-scroll-area-viewport]'
    ) as HTMLElement;
    if (scrollElement) {
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  }, 100);
}, [conversationMessages]);
```

---

## ⚠️ Error Handling Patterns

### Try-Catch with Toast
```typescript
try {
  await sendConversationMessage(
    conversationId,
    senderId,
    senderName,
    receiverId,
    receiverName,
    content
  );
  setMessageText("");
} catch (error: any) {
  console.error("Error sending message:", error);
  toast({
    title: "Failed to send message",
    description: error.message,
    variant: "destructive",
  });
}
```

### Fallback Values
```typescript
// Names always have a value
const displayName = 
  fetchedName || 
  participantNames[userId] || 
  userId ||
  "Unknown User";

// Timestamps always work
const timeStr = message.timestamp 
  ? new Date(message.timestamp).toLocaleTimeString()
  : new Date().toLocaleTimeString();
```

---

## 🧮 Helper Functions

### Generate Conversation ID
```typescript
// Ensures same ID regardless of user order
const generateConversationId = (userId1: string, userId2: string) => {
  const [id1, id2] = [userId1, userId2].sort();
  return `conv_${id1}_${id2}`;
};

// Examples:
generateConversationId("user_123", "user_456") 
// → "conv_user_123_user_456"

generateConversationId("user_456", "user_123") 
// → "conv_user_123_user_456" (SAME!)
```

### Get Other Participant
```typescript
const getOtherParticipant = (participants: string[], currentUserId: string) => {
  return participants.find(id => id !== currentUserId);
};
```

### Is Own Message
```typescript
const isOwnMessage = (message: Message, currentUserId: string) => {
  return message.senderId === currentUserId;
};
```

---

## 🚀 Performance Tips

### Memoization
```typescript
const conversations = useMemo(() => {
  return allConversations.map(conv => ({
    id: conv.id,
    userName: conv.participantNames[otherUserId],
    // ... rest of mapping
  }));
}, [allConversations]);
```

### Efficient Listeners
```typescript
// Only subscribe when needed
const unsubscribe = onValue(
  messagesRef,
  (snapshot) => { ... }
);

// Always cleanup
return () => unsubscribe();
```

### Debounced Operations
```typescript
const markReadTimeout = useRef<NodeJS.Timeout>();

useEffect(() => {
  // Cancel previous timeout
  if (markReadTimeout.current) {
    clearTimeout(markReadTimeout.current);
  }

  // Debounce mark as read
  markReadTimeout.current = setTimeout(() => {
    markMessagesAsRead(conversationId, currentUserId);
  }, 300);

  return () => clearTimeout(markReadTimeout.current);
}, [selectedConversationId]);
```

---

## 🔐 Security Checks

### Auth Guard
```typescript
if (!currentUser?.id || !selectedUser) {
  toast({
    title: "Error",
    description: "Unable to start conversation",
    variant: "destructive",
  });
  return;
}
```

### Input Validation
```typescript
if (!messageText.trim() || !currentUser || !conversationId) {
  return; // Don't send
}
```

### Type Safety
```typescript
// Always use typed data
const messageData: Message = {
  id: messageId,
  senderId: currentUser.id,
  senderName: currentUser.name,
  receiverId: selectedUser,
  receiverName: selectedUserName || "User",
  content: messageText,
  read: false,
  timestamp: new Date().toISOString(),
};
```

---

## 📊 State Patterns

### Conversation List State
```typescript
const [allConversations, setAllConversations] = useState<Conversation[]>([]);
const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
```

### UI State
```typescript
const [messageText, setMessageText] = useState("");
const [isSending, setIsSending] = useState(false);
const [isLoadingUserName, setIsLoadingUserName] = useState(false);
const [searchTerm, setSearchTerm] = useState("");
```

### Refs for DOM Access
```typescript
const scrollAreaRef = useRef<HTMLDivElement>(null);

// Usage
scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
```

---

## 🧪 Testing Examples

### Test: Contact Button
```typescript
test("Contact button creates conversation", async () => {
  const { getByTestId } = render(<ItemCard {...props} />);
  
  const contactBtn = getByTestId("button-contact-seller");
  fireEvent.click(contactBtn);
  
  await waitFor(() => {
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringMatching(/conversationId=conv_/)
    );
  });
});
```

### Test: Message Sending
```typescript
test("Message sends and appears in thread", async () => {
  // Send message
  const input = screen.getByTestId("input-message");
  fireEvent.change(input, { target: { value: "Test message" } });
  fireEvent.click(screen.getByTestId("button-send"));
  
  // Verify it appears
  await waitFor(() => {
    expect(screen.getByText("Test message")).toBeInTheDocument();
  });
});
```

---

## 📝 Import Templates

### All Necessary Imports
```typescript
import { useState, useEffect, useMemo, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { ref, onValue, set } from "firebase/database";
import { database } from "@/firebase/firebase";
import {
  getOrCreateConversation,
  fetchUserNameFromDB,
  sendConversationMessage,
  getOtherParticipantName,
} from "@/lib/firebaseConversations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
```

---

## 🔗 File References

| Function | File | Location |
|----------|------|----------|
| `getOrCreateConversation` | firebaseConversations.ts | Line ~70 |
| `fetchUserNameFromDB` | firebaseConversations.ts | Line ~8 |
| `sendConversationMessage` | firebaseConversations.ts | Line ~95 |
| `handleContact` | marketplace.tsx | Line ~297 |
| Conversation listener | messages.tsx | Line ~52 |
| Messages listener | messages.tsx | Line ~75 |
| Auto-scroll effect | messages.tsx | Line ~93 |

---

## 💾 Firebase Database Paths

### Key Paths
```
conversations/
├── conv_{userId1}_{userId2}/
│   ├── id
│   ├── participants
│   ├── participantNames
│   ├── createdAt
│   ├── updatedAt
│   └── messages/
│       └── msg_{timestamp}_{id}/
```

### Query Examples
```typescript
// Get all conversations
ref(database, "conversations")

// Get specific conversation
ref(database, `conversations/${conversationId}`)

// Get messages in conversation
ref(database, `conversations/${conversationId}/messages`)

// Get participant names
ref(database, `conversations/${conversationId}/participantNames`)
```

---

*Generated: April 9, 2026*
*For: Firebase Conversations Implementation*
*Status: Complete Reference ✅*

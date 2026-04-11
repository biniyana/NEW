import { ref, get, set, query, orderByChild, equalTo, update, push, serverTimestamp } from "firebase/database";
import { doc, getDoc } from "firebase/firestore";
import { database, db, auth } from "@/firebase/firebase";

/**
 * Fetch user name from Firebase Realtime Database
 */
export const fetchUserNameFromDB = async (userId: string): Promise<string> => {
  try {
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      const userData = snapshot.val();
      return userData.name || userData.displayName || userData.email || userId;
    }
  } catch (error) {
    console.error(`Error fetching user name for ${userId}:`, error);
  }
  return userId;
};

/**
 * Fetch user name from Firestore
 */
export const fetchUserNameFromFirestore = async (userId: string): Promise<string> => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.name || userData.displayName || userData.email || userId;
    }
  } catch (error) {
    console.error(`Error fetching user name from Firestore for ${userId}:`, error);
  }
  return userId;
};

/**
 * Generate conversation ID (consistent both ways)
 */
export const generateConversationId = (userId1: string, userId2: string): string => {
  const [id1, id2] = [userId1, userId2].sort();
  return `conv_${id1}_${id2}`;
};

/**
 * Check if a private conversation exists between two users
 */
export const checkConversationExists = async (userId1: string, userId2: string): Promise<boolean> => {
  try {
    const conversationId = generateConversationId(userId1, userId2);
    const conversationRef = ref(database, `conversations/${conversationId}`);
    const snapshot = await get(conversationRef);
    return snapshot.exists();
  } catch (error) {
    console.error("Error checking conversation:", error);
    return false;
  }
};

/**
 * Create a new conversation in Realtime Database
 * 🔧 Stable Architecture: Initialize with conversation metadata and unread counters
 */
export const createConversation = async (userId1: string, userId2: string): Promise<string> => {
  try {
    const [user1Id, user2Id] = [userId1, userId2].sort();
    const conversationId = generateConversationId(user1Id, user2Id);
    
    const user1Name = await fetchUserNameFromDB(user1Id);
    const user2Name = await fetchUserNameFromDB(user2Id);

    const now = new Date().toISOString();
    const conversationData = {
      id: conversationId,
      participants: [user1Id, user2Id],
      participantNames: {
        [user1Id]: user1Name,
        [user2Id]: user2Name,
      },
      // 🔧 Unread counters for notification badges
      unread: {
        [user1Id]: 0,
        [user2Id]: 0,
      },
      lastMessage: "",
      lastMessageTime: now,
      createdAt: now,
      updatedAt: now,
    };

    const conversationRef = ref(database, `conversations/${conversationId}`);
    await set(conversationRef, conversationData);
    console.log(`✅ Created conversation: ${conversationId}`);
    
    return conversationId;
  } catch (error) {
    console.error("Error creating conversation:", error);
    throw error;
  }
};

/**
 * Get or create a conversation between two users
 */
export const getOrCreateConversation = async (userId1: string, userId2: string): Promise<string> => {
  try {
    const exists = await checkConversationExists(userId1, userId2);
    
    if (exists) {
      console.log("✅ Conversation already exists");
      return generateConversationId(userId1, userId2);
    }
    
    console.log("📝 Creating new conversation...");
    return await createConversation(userId1, userId2);
  } catch (error) {
    console.error("Error getting or creating conversation:", error);
    throw error;
  }
};

/**
 * Get conversation participants and their names
 */
export const getConversationDetails = async (conversationId: string): Promise<{
  participants: string[];
  participantNames: Record<string, string>;
}> => {
  try {
    const conversationRef = ref(database, `conversations/${conversationId}`);
    const snapshot = await get(conversationRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      return {
        participants: data.participants || [],
        participantNames: data.participantNames || {},
      };
    }
    
    return { participants: [], participantNames: {} };
  } catch (error) {
    console.error("Error getting conversation details:", error);
    return { participants: [], participantNames: {} };
  }
};

/**
 * Get the other participant's name in a conversation
 */
export const getOtherParticipantName = async (conversationId: string, currentUserId: string): Promise<string> => {
  try {
    const details = await getConversationDetails(conversationId);
    const otherUserId = details.participants.find((id) => id !== currentUserId);
    
    if (otherUserId) {
      return details.participantNames?.[otherUserId] || 
             (await fetchUserNameFromDB(otherUserId)) ||
             otherUserId;
    }
    
    return "Unknown";
  } catch (error) {
    console.error("Error getting other participant name:", error);
    return "Unknown";
  }
};

/**
 * Fetch messages for a conversation
 */
export const fetchConversationMessages = async (conversationId: string): Promise<any[]> => {
  try {
    const messagesRef = ref(database, `conversations/${conversationId}/messages`);
    const snapshot = await get(messagesRef);
    
    if (snapshot.exists()) {
      return Object.values(snapshot.val());
    }
    
    return [];
  } catch (error) {
    console.error("Error fetching conversation messages:", error);
    return [];
  }
};

/**
 * 🔧 STABLE Firebase Chat: Send message with proper error handling and realtime update
 * Uses push() for automatic ID generation instead of manual set()
 * Includes serverTimestamp() for consistent server-side timestamps
 */
export const sendConversationMessage = async (
  conversationId: string,
  senderId: string,
  senderName: string,
  receiverId: string,
  receiverName: string,
  content: string
): Promise<string> => {
  try {
    if (!conversationId || !senderId || !receiverId || !content.trim()) {
      throw new Error("Missing required message fields");
    }

    // 🔧 Use push() for proper realtime synchronization with Firebase
    const messagesRef = ref(database, `conversations/${conversationId}/messages`);
    const newMessageRef = push(messagesRef);
    const messageId = newMessageRef.key;

    if (!messageId) {
      throw new Error("Failed to generate message ID");
    }

    const messageData = {
      id: messageId,
      senderId,
      senderName,
      receiverId,
      receiverName,
      content: content.trim(),
      read: false,
      // 🔧 Use serverTimestamp for precise server-side timestamps
      timestamp: serverTimestamp(),
    };

    // Write message to Firebase
    await set(newMessageRef, messageData);
    console.log(`✅ Message sent: ${messageId} in conversation ${conversationId}`);
    
    // 🚀 Update conversation metadata (truly non-blocking - fire and forget)
    updateConversationMetadata(conversationId, content, receiverId).catch((metaErr) => {
      console.warn('⚠️ Failed to update conversation metadata (non-critical):', metaErr);
    });
    
    return messageId;
  } catch (error) {
    console.error("❌ Error sending message:", error);
    throw error;
  }
};

/**
 * 🔧 Update conversation metadata after message sent
 * Updates: lastMessage, lastMessageTime, unread counter, updatedAt
 */
export const updateConversationMetadata = async (
  conversationId: string,
  messageContent: string,
  receiverId: string
): Promise<void> => {
  try {
    const conversationRef = ref(database, `conversations/${conversationId}`);
    const now = new Date().toISOString();

    const updates: any = {
      lastMessage: messageContent.substring(0, 100), // Preview
      lastMessageTime: now,
      updatedAt: now,
      [`unread/${receiverId}`]: true, // Mark as unread for receiver
    };

    await update(conversationRef, updates);
    console.log(`✅ Conversation metadata updated: ${conversationId}`);
  } catch (error) {
    console.error("Error updating conversation metadata:", error);
    throw error;
  }
};

/**
 * 🔧 Mark messages as read - Efficient batch update
 * Marks all unread messages from a specific sender as read
 */
export const markMessagesAsRead = async (
  conversationId: string,
  senderId: string
): Promise<void> => {
  try {
    const messagesRef = ref(database, `conversations/${conversationId}/messages`);
    const snapshot = await get(messagesRef);

    if (!snapshot.exists()) {
      return;
    }

    const messages = snapshot.val();
    const updates: any = {};
    let updateCount = 0;

    // Efficiently batch all unread message updates
    Object.keys(messages).forEach((messageId) => {
      const message = messages[messageId];
      if (message.senderId === senderId && !message.read) {
        updates[`${messageId}/read`] = true;
        updateCount++;
      }
    });

    if (updateCount > 0) {
      await update(messagesRef, updates);
      console.log(`✅ Marked ${updateCount} messages as read in ${conversationId}`);
    }
  } catch (error) {
    console.error("Error marking messages as read:", error);
    // Don't throw - this is non-critical
  }
};

/**
 * 🗑️ Delete a conversation - removes it for the current user
 * Deletes the entire conversation from Firebase Realtime Database
 */
export const deleteConversation = async (conversationId: string): Promise<void> => {
  try {
    const conversationRef = ref(database, `conversations/${conversationId}`);
    await set(conversationRef, null); // Set to null to delete
    console.log(`✅ Conversation deleted: ${conversationId}`);
  } catch (error) {
    console.error("Error deleting conversation:", error);
    throw error;
  }
};

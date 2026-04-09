import { Message } from '@/models';

/**
 * Message Controller - Handles messaging operations
 */
export class MessageController {
  /**
   * Fetch all messages
   */
  static async fetchAllMessages(): Promise<Message[]> {
    try {
      const res = await fetch('/api/messages', { credentials: 'include' });
      if (res.ok) {
        return res.json();
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
    return [];
  }

  /**
   * Fetch messages received by user
   */
  static async fetchReceivedMessages(receiverId: string): Promise<Message[]> {
    try {
      const res = await fetch(`/api/messages/received/${receiverId}`, { credentials: 'include' });
      if (res.ok) {
        return res.json();
      }
    } catch (err) {
      console.error('Failed to fetch received messages:', err);
    }
    return [];
  }

  /**
   * Fetch messages sent by user
   */
  static async fetchSentMessages(senderId: string): Promise<Message[]> {
    try {
      const res = await fetch(`/api/messages/sent/${senderId}`, { credentials: 'include' });
      if (res.ok) {
        return res.json();
      }
    } catch (err) {
      console.error('Failed to fetch sent messages:', err);
    }
    return [];
  }

  /**
   * Fetch conversation between two users
   */
  static async fetchConversation(userId1: string, userId2: string): Promise<Message[]> {
    try {
      const res = await fetch(`/api/messages/conversation?user1=${userId1}&user2=${userId2}`, {
        credentials: 'include',
      });
      if (res.ok) {
        return res.json();
      }
    } catch (err) {
      console.error('Failed to fetch conversation:', err);
    }
    return [];
  }

  /**
   * Send message
   */
  static async sendMessage(messageData: any): Promise<Message> {
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData),
        credentials: 'include',
      });
      if (res.ok) {
        return res.json();
      }
      throw new Error('Failed to send message');
    } catch (err) {
      console.error('Failed to send message:', err);
      throw err;
    }
  }

  /**
   * Mark message as read
   */
  static async markAsRead(messageId: string): Promise<void> {
    try {
      const res = await fetch(`/api/messages/${messageId}/read`, {
        method: 'PUT',
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Failed to mark message as read');
      }
    } catch (err) {
      console.error('Failed to mark message as read:', err);
    }
  }

  /**
   * Mark all messages as read for a receiver
   */
  static async markAllAsRead(receiverId: string): Promise<void> {
    try {
      const res = await fetch(`/api/messages/mark-all-read/${receiverId}`, {
        method: 'PUT',
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Failed to mark all messages as read');
      }
    } catch (err) {
      console.error('Failed to mark all messages as read:', err);
    }
  }

  /**
   * Delete message
   */
  static async deleteMessage(messageId: string): Promise<void> {
    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Failed to delete message');
      }
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  }
}

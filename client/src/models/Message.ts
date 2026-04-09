import { Message, InsertMessage, insertMessageSchema } from '@shared/schema';

export type { Message, InsertMessage };
export { insertMessageSchema };

/**
 * Message Model - Represents a message/chat between two users
 */
export class MessageModel {
  /**
   * Validates message data against the schema
   */
  static validate(data: unknown): data is InsertMessage {
    try {
      insertMessageSchema.parse(data);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if message is read
   */
  static isRead(message: Message): boolean {
    return String(message.read) === 'true';
  }

  /**
   * Check if message is unread
   */
  static isUnread(message: Message): boolean {
    return String(message.read) !== 'true';
  }

  /**
   * Filter messages received by a user
   */
  static filterReceived(messages: Message[], receiverId: string): Message[] {
    return messages.filter(msg => msg.receiverId === receiverId);
  }

  /**
   * Filter messages sent by a user
   */
  static filterSent(messages: Message[], senderId: string): Message[] {
    return messages.filter(msg => msg.senderId === senderId);
  }

  /**
   * Filter unread messages
   */
  static filterUnread(messages: Message[]): Message[] {
    return messages.filter(msg => MessageModel.isUnread(msg));
  }

  /**
   * Count unread messages received by a user
   */
  static countUnreadReceived(messages: Message[], receiverId: string): number {
    return messages.filter(
      msg => msg.receiverId === receiverId && MessageModel.isUnread(msg)
    ).length;
  }

  /**
   * Get conversation between two users
   */
  static getConversation(
    messages: Message[],
    userId1: string,
    userId2: string
  ): Message[] {
    return messages.filter(
      msg =>
        (msg.senderId === userId1 && msg.receiverId === userId2) ||
        (msg.senderId === userId2 && msg.receiverId === userId1)
    );
  }
}

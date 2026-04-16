// Re-export all types from shared schema for centralized type management
export type {
  User,
  InsertUser,
  Item,
  InsertItem,
  Request,
  InsertRequest,
  Message,
  InsertMessage,
  Review,
  InsertReview,
  Rate,
  InsertRate,
  ChatbotConversation,
  InsertChatbotConversation,
  StaticRate,
} from '@shared/schema';

export {
  insertUserSchema,
  insertItemSchema,
  insertRequestSchema,
  insertMessageSchema,
  insertReviewSchema,
  insertRateSchema,
  insertChatbotConversationSchema,
} from '@shared/schema';

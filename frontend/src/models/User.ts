import { User, InsertUser, insertUserSchema } from '@shared/schema';

export type { User, InsertUser };
export { insertUserSchema };

/**
 * User Model - Represents a user in the system
 * Can be either a Household or Junkshop user
 */
export class UserModel {
  /**
   * Validates user data against the schema
   */
  static validate(data: unknown): data is InsertUser {
    try {
      insertUserSchema.parse(data);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create a user from raw data with normalized fields
   */
  static create(data: any): Partial<User> {
    return {
      ...data,
      id: data.id ?? null,
      uid: data.uid ?? data.userId ?? null,
    };
  }

  /**
   * Check if user is a household
   */
  static isHousehold(user: User | Partial<User>): boolean {
    return user.userType === 'household';
  }

  /**
   * Check if user is a junkshop
   */
  static isJunkshop(user: User | Partial<User>): boolean {
    return user.userType === 'junkshop';
  }

  /**
   * Get user display name with fallback
   */
  static getDisplayName(user: User | Partial<User>): string {
    return user.name || 'Anonymous User';
  }

  /**
   * Check if user profile is complete
   */
  static isProfileComplete(user: any): boolean {
    return (
      user &&
      user.name &&
      user.email &&
      user.phone &&
      user.address &&
      user.userType &&
      user.profileComplete !== false
    );
  }
}

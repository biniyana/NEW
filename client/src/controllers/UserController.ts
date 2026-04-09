import { ref, get, set, update, onValue } from 'firebase/database';
import { database } from '@/firebase/firebase';
import { User } from '@/models';

/**
 * User Controller - Handles user profile and management operations
 */
export class UserController {
  /**
   * Load user from localStorage
   */
  static loadFromLocalStorage(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr && userStr !== 'undefined') {
      return JSON.parse(userStr);
    }
    return null;
  }

  /**
   * Save user to localStorage
   */
  static saveToLocalStorage(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
  }

  /**
   * Remove user from localStorage
   */
  static removeFromLocalStorage(): void {
    localStorage.removeItem('user');
  }

  /**
   * Fetch user by UID from Firebase
   */
  static async fetchUserByUid(uid: string): Promise<any> {
    const userRef = ref(database, `users/${uid}`);
    const snapshot = await get(userRef);
    return snapshot.val();
  }

  /**
   * Fetch user by email from server
   */
  static async fetchUserByEmail(email: string): Promise<User | null> {
    try {
      const res = await fetch(`/api/users/email/${email}`, { credentials: 'include' });
      if (res.ok) {
        return res.json();
      }
    } catch (err) {
      console.error('Failed to fetch user by email:', err);
    }
    return null;
  }

  /**
   * Fetch authenticated user from server
   */
  static async fetchCurrentUser(): Promise<User | null> {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        return res.json();
      }
    } catch (err) {
      console.error('Failed to fetch authenticated user:', err);
    }
    return null;
  }

  /**
   * Update user profile
   */
  static async updateProfile(uid: string, data: Partial<User>): Promise<void> {
    const userRef = ref(database, `users/${uid}`);
    await update(userRef, data);
  }

  /**
   * Update user location
   */
  static async updateLocation(uid: string, latitude: number, longitude: number): Promise<void> {
    const userRef = ref(database, `users/${uid}`);
    await update(userRef, { latitude, longitude });
  }

  /**
   * Subscribe to user profile changes
   */
  static onProfileChange(uid: string, callback: (user: any) => void): () => void {
    const userRef = ref(database, `users/${uid}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      callback(snapshot.val());
    });
    return unsubscribe;
  }

  /**
   * Fetch all users (for admin or search)
   */
  static async fetchAllUsers(): Promise<User[]> {
    try {
      const res = await fetch('/api/users', { credentials: 'include' });
      if (res.ok) {
        return res.json();
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
    return [];
  }

  /**
   * Search users by name or email
   */
  static async searchUsers(query: string): Promise<User[]> {
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
        credentials: 'include',
      });
      if (res.ok) {
        return res.json();
      }
    } catch (err) {
      console.error('Failed to search users:', err);
    }
    return [];
  }

  /**
   * Mark user profile as complete
   */
  static async completeProfile(uid: string): Promise<void> {
    const userRef = ref(database, `users/${uid}`);
    await update(userRef, { profileComplete: true });
  }
}

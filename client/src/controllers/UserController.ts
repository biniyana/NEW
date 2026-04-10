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
      const raw: any = JSON.parse(userStr);
      // Normalise legacy field names: old sessions stored 'uid'/'displayName'
      return {
        ...raw,
        id: raw.id || raw.uid,
        name: raw.name || raw.displayName || raw.email || 'User',
      } as User;
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
   * 🔧 Firebase Fix: Filters out undefined values before update
   * Firebase does not allow undefined values in update operations
   */
  static async updateProfile(uid: string, data: Partial<User>): Promise<void> {
    const userRef = ref(database, `users/${uid}`);
    
    // Filter out undefined values - Firebase doesn't allow them
    const cleanData: any = {};
    Object.keys(data).forEach((key) => {
      const value = (data as any)[key];
      // Include the value if it's not undefined (null is allowed)
      if (value !== undefined) {
        cleanData[key] = value;
      }
    });

    console.log('📝 [UserController.updateProfile] Cleaned data (undefined removed):', cleanData);
    
    // Only call update if we have data to update
    if (Object.keys(cleanData).length > 0) {
      await update(userRef, cleanData);
    } else {
      console.warn('⚠️ [UserController.updateProfile] No valid data to update - all values were undefined');
    }
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

  /**
   * 🔐 Security Fix: Validate that stored user matches server session
   * This prevents unauthorized access or session leaks
   * @returns true if stored user is valid and authorized, false otherwise
   */
  static async isStoredUserValid(): Promise<boolean> {
    try {
      const storedUser = this.loadFromLocalStorage();
      if (!storedUser) {
        return false;
      }

      // Verify against server
      const serverUser = await this.fetchCurrentUser();
      if (!serverUser) {
        return false;
      }

      // Check if UIDs match (handle both 'id' and 'uid' fields)
      const storedUid = (storedUser as any).id || (storedUser as any).uid;
      const serverUid = (serverUser as any).id || (serverUser as any).uid;

      if (storedUid !== serverUid) {
        console.warn('🔐 Session validation failed: stored user UID does not match server');
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error validating user session:', err);
      return false;
    }
  }

  /**
   * 🔐 Security Fix: Clear user session completely
   * Use this when transitioning between auth states
   */
  static clearSession(): void {
    this.removeFromLocalStorage();
  }
}

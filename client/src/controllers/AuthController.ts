import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { ref, get, set, update } from 'firebase/database';
import { auth, database } from '@/firebase/firebase';

/**
 * Authentication Controller - Handles auth-related operations
 */
export class AuthController {
  /**
   * Get Firebase auth error message from error code
   */
  static getErrorMessage(error: any): string {
    if (!error) return 'Invalid email or password.';
    switch (error.code) {
      case 'auth/invalid-email':
        return 'Enter a valid email address.';
      case 'auth/user-not-found':
        return 'No account found with this email.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      case 'auth/operation-not-allowed':
        return 'Email/password login is disabled. Enable Email/Password sign-in in your Firebase console.';
      case 'auth/too-many-requests':
        return 'Too many login attempts. Please try again later.';
      case 'auth/email-already-in-use':
        return 'Email is already in use.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      default:
        return error.message || 'Invalid email or password.';
    }
  }

  /**
   * Login user with email and password
   */
  static async login(email: string, password: string): Promise<{ uid: string; email: string | null; profileComplete: boolean; userType: string }> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // Fetch user profile from Firebase to check if complete
    const userRef = ref(database, `users/${uid}`);
    const snapshot = await get(userRef);
    const userProfile = snapshot.val();

    return {
      uid,
      email: userCredential.user.email,
      profileComplete: userProfile?.profileComplete ?? false,
      userType: userProfile?.userType ?? 'household',
    };
  }

  /**
   * Signup user with email and password
   */
  static async signup(
    email: string,
    password: string,
    name: string,
    userType: 'household' | 'junkshop'
  ): Promise<{ uid: string; email: string | null }> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // Create user profile in Firebase
    const userRef = ref(database, `users/${uid}`);
    await set(userRef, {
      uid,
      email,
      name,
      userType,
      profileComplete: false,
      createdAt: new Date().toISOString(),
    });

    return {
      uid,
      email: userCredential.user.email,
    };
  }

  /**
   * Logout current user
   */
  static async logout(): Promise<void> {
    await signOut(auth);
  }

  /**
   * Get current auth user
   */
  static getCurrentUser() {
    return auth.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return auth.currentUser !== null;
  }

  /**
   * Get current user ID
   */
  static getCurrentUserId(): string | null {
    return auth.currentUser?.uid ?? null;
  }

  /**
   * Fetch user profile from Firebase
   */
  static async fetchUserProfile(uid: string): Promise<any> {
    const userRef = ref(database, `users/${uid}`);
    const snapshot = await get(userRef);
    return snapshot.val();
  }

  /**
   * Update user profile in Firebase
   */
  static async updateUserProfile(uid: string, data: any): Promise<void> {
    const userRef = ref(database, `users/${uid}`);
    await update(userRef, data);
  }
}

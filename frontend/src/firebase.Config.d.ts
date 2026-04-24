import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Database } from 'firebase/database';
import { GoogleAuthProvider } from 'firebase/auth';

export const app: FirebaseApp;
export const auth: Auth;
export const googleProvider: GoogleAuthProvider;
export const database: Database;

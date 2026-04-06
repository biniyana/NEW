import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBqSDdsobkyBRveiZYc6DifNGwR8rC253k",
  authDomain: "waiz-app-f11f1.firebaseapp.com",
  projectId: "waiz-app-f11f1",
  storageBucket: "waiz-app-f11f1.firebasestorage.app",
  messagingSenderId: "1081440177346",
  appId: "1:1081440177346:web:5c6e9ceba5df51f9d5bf5b",
  measurementId: "G-KJJ5GWSFGL"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
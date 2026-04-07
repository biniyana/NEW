// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBqSDdsobkyBRveiZYc6DifNGwR8rC253k",
  authDomain: "waiz-app-f11f1.firebaseapp.com",
  databaseURL: "https://waiz-app-f11f1-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "waiz-app-f11f1",
  storageBucket: "waiz-app-f11f1.firebasestorage.app",
  messagingSenderId: "1081440177346",
  appId: "1:1081440177346:web:5c6e9ceba5df51f9d5bf5b",
  measurementId: "G-KJJ5GWSFGL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Initialize Realtime Database and get a reference to the service
const database = getDatabase(app);

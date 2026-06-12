import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDabCtuqCKgnPCnqZjB48Hgq7XZT-dj-go",
  authDomain: "paperquiz.firebaseapp.com",
  projectId: "paperquiz",
  storageBucket: "paperquiz.firebasestorage.app",
  messagingSenderId: "213662575295",
  appId: "1:213662575295:web:0645f25f369f0866c6740a",
  databaseURL: "https://paperquiz-default-rtdb.asia-southeast1.firebasedatabase.app" // Regional URL for Singapore (common in Vietnam)
};

// Initialize Firebase (SSR friendly to avoid re-initialization error)
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getDatabase(app);
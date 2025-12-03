// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBjkBG3QWAMt-0XaUtytZN8VZAbS4XpKWw",
  authDomain: "naamjapcountere.firebaseapp.com",
  projectId: "naamjapcountere",
  storageBucket: "naamjapcountere.firebasestorage.app",
  messagingSenderId: "827261408454",
  appId: "1:827261408454:web:29283f0ef54b7ff86673c7",
  measurementId: "G-MSQKFE63WH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with Modern Caching (Fixes the warning & offline issues)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});
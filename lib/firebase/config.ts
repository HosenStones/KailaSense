import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyDbcso_YRXnD7r3hZB9XZgapRualmMyPDw",
  authDomain: "kaila-7fe41.firebaseapp.com",
  projectId: "kaila-7fe41",
  storageBucket: "kaila-7fe41.firebasestorage.app",
  messagingSenderId: "936710809739",
  appId: "1:936710809739:web:81c97608c50f79d70bcc8e",
  measurementId: "G-4ELNCVQ8ZX"
};

console.log("DEBUG: Starting Firebase initialization with Project:", firebaseConfig.projectId);

let app: FirebaseApp;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  console.log("DEBUG: Firebase App initialized successfully");
} catch (error) {
  console.error("DEBUG: Firebase App initialization FAILED:", error);
  throw error;
}

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export default app;

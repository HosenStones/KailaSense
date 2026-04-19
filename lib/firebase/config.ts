import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
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

// Initialize Firebase - works both on client and server
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const db: Firestore = getFirestore(app)

// Auth only available on client side
let auth: Auth | null = null
if (typeof window !== 'undefined') {
  auth = getAuth(app)
}

export { app, auth, db }

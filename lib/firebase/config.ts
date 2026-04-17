import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyBjSF7mvsg6yqjodzxUVfRwhbWHh2-oe6k",
  authDomain: "kaila-7fe41.firebaseapp.com",
  projectId: "kaila-7fe41",
  storageBucket: "kaila-7fe41.firebasestorage.app",
  messagingSenderId: "936710809739",
  appId: "1:936710809739:web:81c97608c50f79d70bcc8e",
  measurementId: "G-4ELNCVQ8ZX"
}

// Initialize Firebase
let app: FirebaseApp
let auth: Auth
let db: Firestore

if (typeof window !== 'undefined') {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  auth = getAuth(app)
  db = getFirestore(app)
}

export { app, auth, db }

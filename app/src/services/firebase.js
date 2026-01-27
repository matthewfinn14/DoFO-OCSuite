import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Production Firebase config (dofo-ocsuite-prod)
const firebaseConfig = {
  apiKey: "AIzaSyBSN0enEOC6opYM71kxCPLo13npMdY0dog",
  authDomain: "dofo-ocsuite-prod.firebaseapp.com",
  projectId: "dofo-ocsuite-prod",
  storageBucket: "dofo-ocsuite-prod.firebasestorage.app",
  messagingSenderId: "388773904656",
  appId: "1:388773904656:web:df87487a0b1441344de595",
  measurementId: "G-0DS2K18FX9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Firestore
export const db = getFirestore(app);

// Storage
export const storage = getStorage(app);

export default app;

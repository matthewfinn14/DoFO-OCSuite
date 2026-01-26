import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCkhw8oHLkLURwmJyjlkBlIgx1TUzH8IrU",
  authDomain: "dofo-oc-suite.firebaseapp.com",
  projectId: "dofo-oc-suite",
  storageBucket: "dofo-oc-suite.firebasestorage.app",
  messagingSenderId: "620991340354",
  appId: "1:620991340354:web:1673825ec67d1875a3f2db",
  measurementId: "G-ET6K18RG1Z"
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

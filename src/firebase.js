// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { useNavigate } from "react-router-dom";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAnbb96Ndu0emoBWDuSpIHUK5VsP-E6Txs",
  authDomain: "fitweather-638a3.firebaseapp.com",
  projectId: "fitweather-638a3",
  storageBucket: "fitweather-638a3.appspot.com",
  messagingSenderId: "606417155001",
  appId: "1:606417155001:web:6c3998df975e2fe6263c68",
  measurementId: "G-YW36DSG53V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth
export const auth = getAuth(app);

// Firestore
export const db = getFirestore(app);

// Storage
export const storage = getStorage(app, "gs://fitweather-638a3.firebasestorage.app");

// Google login
export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result;
}

// Logout
export async function logout() {
  await signOut(auth);
  if (typeof window !== "undefined") {
    window.location.href = "/";
  }
}

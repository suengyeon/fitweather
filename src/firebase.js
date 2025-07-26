// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAnbb96Ndu0emoBWDuSpIHUK5VsP-E6Txs",
  authDomain: "fitweather-638a3.firebaseapp.com",
  projectId: "fitweather-638a3",
  storageBucket: "fitweather-638a3.firebasestorage.app",
  messagingSenderId: "606417155001",
  appId: "1:606417155001:web:6c3998df975e2fe6263c68",
  measurementId: "G-YW36DSG53V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

const analytics = getAnalytics(app);

console.log("Auth:", auth);
console.log("DB:", db);
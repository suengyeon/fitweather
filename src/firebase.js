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

// 카카오 로그아웃
export async function logoutKakao() {
  try {
    // 로컬 스토리지에서 카카오 토큰 제거
    localStorage.removeItem('kakao_access_token');
    localStorage.removeItem('kakao_refresh_token');
    
    // 카카오 로그아웃 (선택사항 - 실패해도 무방)
    const accessToken = localStorage.getItem('kakao_access_token');
    if (accessToken) {
      await fetch('https://kapi.kakao.com/v1/user/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
    }
  } catch (error) {
    console.error('카카오 로그아웃 오류:', error);
  } finally {
    // 페이지 새로고침으로 상태 초기화
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  }
}

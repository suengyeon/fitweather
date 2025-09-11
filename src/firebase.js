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

// Firebase 초기화 확인
console.log('Firebase 앱 초기화 완료:', app);
console.log('Firebase Auth 초기화 완료:', auth);
console.log('Firebase Firestore 초기화 완료:', db);

// Google login
export async function loginWithGoogle() {
  try {
    console.log('Firebase Auth 초기화 확인...');
    console.log('Auth 객체:', auth);
    
    const provider = new GoogleAuthProvider();
    
    // 추가 스코프 설정 (필요한 경우)
    provider.addScope('email');
    provider.addScope('profile');
    
    console.log('Google Auth Provider 설정 완료');
    console.log('팝업 로그인 시작...');
    
    const result = await signInWithPopup(auth, provider);
    console.log('로그인 결과:', result);
    
    return result;
  } catch (error) {
    console.error('Firebase Google 로그인 오류:', error);
    throw error;
  }
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

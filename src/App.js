// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { saveOutfitRecord } from "./api/saveOutfitRecord";
import { auth } from "./firebase";
import Login from "./pages/Login";
import ProfileSetup from "./pages/ProfileSetup";
import Home from "./pages/Home";
import MyPageUserInfo from "./pages/MyPageUserInfo";
import Withdraw from "./pages/Withdraw";
import Record from "./pages/Record";
import Feed from "./pages/Feed";
import Recommend from "./pages/Recommend";
import RecommendView from "./pages/RecommendView";
import RecommendFilterSettings from "./pages/RecommendFilterSettings";
import KakaoCallback from "./pages/KakaoCallback";
import Calendar from "./pages/Calendar";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import FeedDetail from "./pages/FeedDetail";
import Follow from "./pages/Follow";
import Admin from "./pages/Admin";
import BannedUserMessage from "./components/BannedUserMessage";
import SetAdmin from "./pages/SetAdmin";
import AdminLogin from "./pages/AdminLogin";



// 전역 테스트 함수: 브라우저 콘솔에서 testSaveOutfitRecord() 호출
window.testSaveOutfitRecord = async () => {
  if (!auth.currentUser) {
    console.error("❗️ 로그인된 사용자가 없습니다.");
    return;
  }

  const dummyRecord = {
    uid: auth.currentUser.uid,
    region: "Seoul",
    date: new Date().toISOString(),
    feeling: "👍",
    weatherEmojis: ["🌤️"],
    imageUrls: ["https://example.com/dummy.jpg"],
    feedback: "테스트 저장입니다!",
    outfit: {
      outer: ["자켓"],
      top: ["티셔츠"],
      bottom: ["청바지"],
      shoes: ["운동화"],
      acc: ["모자"]
    },
    isPublic: true
  };

  try {
    console.log("⚙️ saveOutfitRecord 호출…");
    const id = await saveOutfitRecord(dummyRecord);
    console.log("✅ 저장 성공! 문서 ID:", id);
  } catch (err) {
    console.error("❌ 저장 에러:", err);
  }
};

function App() {
  // 전역 오류 핸들러 추가
  React.useEffect(() => {
    const handleError = (error) => {
      const errorMessage = error?.message || error?.toString() || '';
      
      // Firestore 내부 오류 감지 및 처리
      if (errorMessage.includes('INTERNAL ASSERTION FAILED') || 
          errorMessage.includes('FIRESTORE') && errorMessage.includes('Unexpected state')) {
        console.warn('⚠️ Firestore 내부 오류 감지 (일반적으로 무시해도 됩니다):', error);
        // 이 오류는 보통 Firestore SDK의 내부 상태 문제로, 
        // 실제 기능에는 영향을 주지 않는 경우가 많습니다.
        // 페이지 새로고침으로 해결될 수 있습니다.
        return;
      }
      
      if (errorMessage.includes('permission')) {
        console.error('Firestore 권한 오류 감지:', error);
      } else {
        console.error('전역 오류 발생:', error);
      }
    };

    const handleUnhandledRejection = (event) => {
      const reason = event.reason;
      const errorMessage = reason?.message || reason?.toString() || '';
      
      // Firestore 내부 오류 감지 및 처리
      if (errorMessage.includes('INTERNAL ASSERTION FAILED') || 
          errorMessage.includes('FIRESTORE') && errorMessage.includes('Unexpected state')) {
        console.warn('⚠️ Firestore 내부 오류 감지 (Promise, 일반적으로 무시해도 됩니다):', reason);
        event.preventDefault(); // 기본 오류 처리 방지
        return;
      }
      
      console.error('처리되지 않은 Promise 거부:', reason);
      if (errorMessage.includes('permission')) {
        console.error('Firestore 권한 오류 감지 (Promise):', reason);
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <AuthProvider>
      {/* ToastContainer를 최상단에 추가 */}
      <ToastContainer position="top-center" />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

function AppContent() {
  const { isBanned } = useAuth();

  // 차단된 사용자는 차단 메시지만 표시
  if (isBanned) {
    return <BannedUserMessage />;
  }

  return (
    <Routes>
          <Route path="/mypage_userinfo" element={<MyPageUserInfo />} />
          <Route path="/withdraw" element={<Withdraw />} />
          <Route path="/login" element={<Login />} />
          <Route path="/record" element={<Record />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/recommend" element={<Recommend />} />
          <Route path="/recommend-view" element={<RecommendView />} />
          <Route path="/recommend-filter-settings" element={<RecommendFilterSettings />} />
          <Route path="/feed-detail/:id" element={<FeedDetail />} />
          <Route path="/auth/kakao/callback" element={<KakaoCallback />} />
          <Route path="/profile-setup" element={<ProfileSetup />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/calendar/:uid" element={<Calendar />} />
          <Route path="/" element={<Home />} />
          <Route path="/follow" element={<Follow />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/set-admin" element={<SetAdmin />} />
        </Routes>
  );
}

export default App;

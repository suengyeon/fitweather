// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { saveOutfitRecord } from "./api/saveOutfitRecord";
import { auth } from "./firebase";
import Login from "./pages/Login";
import ProfileSetup from "./pages/ProfileSetup";
import Home from "./pages/Home";
import MyPageUserInfo from "./pages/MyPageUserInfo";
import ProfileEdit from "./pages/ProfileEdit";
import Withdraw from "./pages/Withdraw";
import Record from "./pages/Record";
import Feed from "./pages/Feed";
import Recommend from "./pages/Recommend";
import RecommendView from "./pages/RecommendView";
import RecommendFilterSettings from "./pages/RecommendFilterSettings";
import KakaoCallback from "./pages/KakaoCallback";
import NaverCallback from "./pages/NaverCallback";

import Calendar from "./pages/Calendar";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import FeedDetail from "./pages/FeedDetail";
import MyPageLikes from "./pages/MyPageLikes";

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
  return (
    <AuthProvider>
      {/* ToastContainer를 최상단에 추가 */}
      <ToastContainer position="top-center" />
      <BrowserRouter>
        <Routes>
          <Route path="/mypage_userinfo" element={<MyPageUserInfo />} />
          <Route path="/profile-edit" element={<ProfileEdit />} />
          <Route path="/withdraw" element={<Withdraw />} />
          <Route path="/login" element={<Login />} />
          <Route path="/record" element={<Record />} />
                  <Route path="/feed" element={<Feed />} />
        <Route path="/recommend" element={<Recommend />} />
        <Route path="/recommend-view" element={<RecommendView />} />
        <Route path="/recommend-filter-settings" element={<RecommendFilterSettings />} />
        <Route path="/FeedDetail/:id" element={<FeedDetail />} />
        <Route path="/auth/kakao/callback" element={<KakaoCallback />} />
        <Route path="/auth/naver/callback" element={<NaverCallback />} />

          <Route path="/mypage_likes" element={<MyPageLikes />} />
          <Route path="/profile-setup" element={<ProfileSetup />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/" element={<Home />} />
          
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Feed from "./pages/Feed";
import MyPage from "./pages/MyPage";
import MyPageUserInfo from "./pages/MyPageUserInfo";
import ProfileEdit from "./pages/ProfileEdit";
import Withdraw from "./pages/Withdraw";
import ProfileSetup from "./pages/ProfileSetup";
import AuthRouteGuard from "./components/AuthRouteGuard";
import ProfileGuard from "./components/ProfileGuard";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* 로그인 사용자가 /login 접근 시 리디렉트 */}
          <Route element={<AuthRouteGuard />}>
            <Route path="/login" element={<Login />} />
          </Route>

          {/* 회원정보 등록된 사용자만 접근 가능한 보호 라우트 */}
          <Route element={<ProfileGuard />}>
            <Route path="/home" element={<Home />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/mypage" element={<MyPage />} />
            <Route path="/mypage_userinfo" element={<MyPageUserInfo />} />
            <Route path="/profile-edit" element={<ProfileEdit />} />
            <Route path="/withdraw" element={<Withdraw />} />
          </Route>

          {/* 회원가입 이후 정보 입력 */}
          <Route path="/profile-setup" element={<ProfileSetup />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

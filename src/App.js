import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Login from "./pages/Login";
import ProfileSetup from "./pages/ProfileSetup";
import Home from "./pages/Home";
import MyPageUserInfo from "./pages/MyPageUserInfo";
import ProfileEdit from "./pages/ProfileEdit";
import Withdraw from "./pages/Withdraw";
import Record from "./pages/Record";
import Feed from "./pages/Feed";
import MyPage from "./pages/MyPage";
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/mypage_userinfo" element={<MyPageUserInfo />} />
          <Route path="/profile-edit" element={<ProfileEdit />} />
          <Route path="/withdraw" element={<Withdraw />} />
          <Route path="/login" element={<Login />} />
          <Route path="/record" element={<Record />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/profile-setup" element={<ProfileSetup />} />
          <Route path="/" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
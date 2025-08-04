// src/pages/Login.js
import { loginWithGoogle, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { HomeIcon, Bars3Icon } from "@heroicons/react/24/solid";
import { OAUTH_CONFIG } from "../config/oauth";

function Login() {
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      const result = await loginWithGoogle();
      const uid = result.user.uid;
      const email = result.user.email;
      const displayName = result.user.displayName;

      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        navigate("/");
      } else {
        navigate("/profile-setup", {
          state: { uid, email, displayName }
        });
      }
    } catch (err) {
      alert("로그인 실패: " + err.message);
    }
  };

  const handleKakaoLogin = () => {
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${OAUTH_CONFIG.KAKAO.CLIENT_ID}&redirect_uri=${encodeURIComponent(OAUTH_CONFIG.KAKAO.REDIRECT_URI)}&response_type=code`;
    window.location.href = kakaoAuthUrl;
  };

  const handleNaverLogin = () => {
    const state = Math.random().toString(36).substring(2, 15);
    const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${OAUTH_CONFIG.NAVER.CLIENT_ID}&redirect_uri=${encodeURIComponent(OAUTH_CONFIG.NAVER.REDIRECT_URI)}&state=${state}`;
    window.location.href = naverAuthUrl;
  };

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* 상단 네비게이션 */}
      <div className="flex justify-between items-center px-4 py-3 bg-blue-100 shadow">
        <button className="bg-blue-300 px-3 py-1 rounded-md text-sm font-medium hover:bg-blue-400">
          <Bars3Icon className="w-5 h-5" />
        </button>

        <h2 className="font-bold text-lg">Login</h2>

        <a
          href="/"
          className="bg-blue-300 px-3 py-1 rounded-md text-sm font-medium hover:bg-blue-400"
        >
          <HomeIcon className="w-5 h-5" />
        </a>
      </div>

      {/* 중앙 로그인 섹션 */}
      <div className="flex flex-col items-center justify-start mt-10">
        <h1 className="text-5xl font-lilita text-indigo-500 mb-10">
          Fitweather
        </h1>

        <div className="space-y-6 w-80">
          <button
            onClick={handleGoogleLogin}
            className="w-full bg-white px-6 py-3 rounded-xl shadow-md font-semibold hover:bg-gray-100 flex items-center justify-center gap-2"
          >
            <span className="text-xl">🔍</span>
            Google 로그인
          </button>

          <button
            onClick={handleKakaoLogin}
            className="w-full bg-yellow-400 px-6 py-3 rounded-xl shadow-md font-semibold hover:bg-yellow-500 flex items-center justify-center gap-2"
          >
            <span className="text-xl">💛</span>
            카카오 로그인
          </button>

          <button
            onClick={handleNaverLogin}
            className="w-full bg-green-500 text-white px-6 py-3 rounded-xl shadow-md font-semibold hover:bg-green-600 flex items-center justify-center gap-2"
          >
            <span className="text-xl">🟢</span>
            네이버 로그인
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;

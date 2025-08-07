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
    try {
      console.log('카카오 로그인 버튼 클릭됨');
      
      // 설정 확인
      console.log('카카오 설정:', {
        CLIENT_ID: OAUTH_CONFIG.KAKAO.CLIENT_ID,
        REDIRECT_URI: OAUTH_CONFIG.KAKAO.REDIRECT_URI,
        origin: window.location.origin
      });
      
      // URL이 올바른지 확인
      if (!OAUTH_CONFIG.KAKAO.CLIENT_ID) {
        alert('카카오 앱 키가 설정되지 않았습니다.');
        return;
      }
      
      // 가장 기본적인 권한만 요청
      const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${OAUTH_CONFIG.KAKAO.CLIENT_ID}&redirect_uri=${encodeURIComponent(OAUTH_CONFIG.KAKAO.REDIRECT_URI)}&response_type=code`;
      console.log('카카오 로그인 URL:', kakaoAuthUrl);
      
      // URL 길이 확인 (너무 길면 문제가 될 수 있음)
      if (kakaoAuthUrl.length > 2000) {
        alert('카카오 로그인 URL이 너무 깁니다.');
        return;
      }
      
      console.log('카카오 인증 페이지로 이동 시작...');
      
      // 카카오 서버 혼잡 시 안내
      const showBusyAlert = () => {
        setTimeout(() => {
          if (window.location.pathname.includes('/auth/kakao/callback')) {
            // 콜백 페이지에 있으면 이미 처리 중
            return;
          }
          // 10초 후에도 콜백 페이지에 없으면 서버 혼잡 가능성
          if (!window.location.pathname.includes('/auth/kakao/callback')) {
            alert('카카오 서버가 혼잡할 수 있습니다. 잠시 기다려주세요.');
          }
        }, 10000);
      };
      
      showBusyAlert();
      window.location.href = kakaoAuthUrl;
      
    } catch (error) {
      console.error('카카오 로그인 URL 생성 오류:', error);
      alert('카카오 로그인 설정에 문제가 있습니다.');
    }
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
        <h1 className="text-5xl font-bold text-indigo-500 mb-10">
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
        </div>
      </div>
    </div>
  );
}

export default Login;

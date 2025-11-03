// src/pages/Login.js
import { loginWithGoogle, db, auth } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { HomeIcon, Bars3Icon } from "@heroicons/react/24/solid";
import { OAUTH_CONFIG } from "../config/oauth";

/**
 * Login 컴포넌트 - Google 및 Kakao 소셜 로그인을 처리하는 페이지입니다.
 */
function Login() {
  const navigate = useNavigate();

  // Google 로그인 처리 핸들러
  const handleGoogleLogin = async () => {
    try {
      // Firebase Google 팝업 로그인 실행
      const result = await loginWithGoogle();
      
      const uid = result.user.uid;
      
      // Firestore에서 기존 사용자 문서 확인
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        // 기존 사용자 : 홈으로 이동
        navigate("/");
      } else {
        // 신규 사용자 : 프로필 설정 페이지로 이동(사용자 정보 state 전달)
        navigate("/profile-setup", {
          state: { uid: uid, email: result.user.email, displayName: result.user.displayName }
        });
      }
    } catch (err) {
      // 로그인 및 에러 처리 상세 로직
      let errorMessage = "로그인 실패: ";
      
      if (err.code === 'auth/popup-closed-by-user') {
        errorMessage += "로그인 창이 닫혔습니다. 다시 시도해주세요.";
      } else if (err.code === 'auth/popup-blocked') {
        errorMessage += "팝업이 차단되었습니다. 팝업을 허용해주세요.";
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage += "네트워크 연결을 확인해주세요.";
      } else {
        errorMessage += err.message || '알 수 없는 오류가 발생했습니다.';
      }
      
      alert(errorMessage);
    }
  };

  // Kakao 로그인 처리 핸들러(리다이렉션)
  const handleKakaoLogin = () => {
    try {
      // 카카오 앱 키 설정 확인
      if (!OAUTH_CONFIG.KAKAO.CLIENT_ID) {
        alert('카카오 앱 키가 설정되지 않았습니다.');
        return;
      }
      
      // 카카오 인가 코드 요청 URL 생성 및 리다이렉트
      const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${OAUTH_CONFIG.KAKAO.CLIENT_ID}&redirect_uri=${encodeURIComponent(OAUTH_CONFIG.KAKAO.REDIRECT_URI)}&response_type=code`;
      
      // 카카오 서버 혼잡 시 안내 타이머 설정(10초 후 안내)
      const showBusyAlert = () => {
        setTimeout(() => {
          if (!window.location.pathname.includes('/auth/kakao/callback')) {
            alert('카카오 서버가 혼잡할 수 있습니다. 잠시 기다려주세요.');
          }
        }, 10000);
      };
      
      showBusyAlert();
      // 카카오 인증 페이지로 이동
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
        {/* 메뉴 버튼 */}
        <button className="bg-blue-200 px-3 py-1 rounded-md text-sm font-medium hover:bg-blue-300">
          <Bars3Icon className="w-5 h-5" />
        </button>

        <h2 className="font-bold text-lg">Login</h2>

        {/* 홈으로 이동 버튼 */}
        <a
          href="/"
          className="bg-blue-200 px-3 py-1 rounded-md text-sm font-medium hover:bg-blue-300"
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
          {/* Google 로그인 버튼 */}
          <button
            onClick={handleGoogleLogin}
            className="w-full bg-white px-6 py-3 rounded-xl shadow-md font-semibold hover:bg-gray-100 flex items-center justify-center gap-2"
          >
            <span className="text-xl">🔍</span>
            Google 로그인
          </button>

          {/* 카카오 로그인 버튼 */}
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
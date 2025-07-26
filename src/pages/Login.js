// src/pages/Login.js
import { loginWithGoogle, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { HomeIcon, Bars3Icon } from "@heroicons/react/24/solid";

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
      <div className="flex flex-col items-center justify-center flex-1">
        <h1 className="text-5xl font-lilita text-indigo-500 mb-8">
          Fitweather
        </h1>

        <button
          onClick={handleGoogleLogin}
          className="bg-white px-6 py-3 rounded-xl shadow-md border font-semibold hover:bg-gray-100"
        >
          Google 로그인
        </button>

        <p className="text-xs text-gray-500 mt-4 hover:underline cursor-pointer">
          회원가입
        </p>
      </div>
    </div>
  );
}

export default Login;

// src/pages/Login.js
import { loginWithGoogle, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

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
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-3xl mb-6 font-bold">FitWeather</h1>
      <button
        onClick={handleGoogleLogin}
        className="bg-blue-500 text-white px-6 py-3 rounded-xl shadow-md font-semibold"
      >
        Google로 로그인
      </button>
    </div>
  );
}

export default Login;

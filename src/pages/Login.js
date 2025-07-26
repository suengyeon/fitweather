// src/pages/Login.js
<<<<<<< HEAD
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
=======
import { auth } from "../firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("로그인 성공:", user.uid);
      navigate("/profile-setup");
    } catch (error) {
      console.error("로그인 실패:", error);
>>>>>>> c712750 (회원가입)
    }
  };

  return (
<<<<<<< HEAD
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-3xl mb-6 font-bold">FitWeather</h1>
      <button
        onClick={handleGoogleLogin}
        className="bg-blue-500 text-white px-6 py-3 rounded-xl shadow-md font-semibold"
=======
    <div className="flex flex-col items-center justify-center h-screen gap-6 bg-gray-50">
      <h1 className="text-3xl font-bold text-gray-800">FitWeather</h1>
      <button
        onClick={handleGoogleLogin}
        className="bg-blue-500 text-white px-6 py-2 rounded-xl shadow hover:bg-blue-600 transition"
>>>>>>> c712750 (회원가입)
      >
        Google로 로그인
      </button>
    </div>
  );
}
<<<<<<< HEAD

export default Login;
=======
>>>>>>> c712750 (회원가입)

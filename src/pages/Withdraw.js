import { useAuth } from "../contexts/AuthContext";
import { db, logout } from "../firebase";
import { doc, deleteDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { GoogleAuthProvider, reauthenticateWithPopup } from "firebase/auth";
import { useState } from "react";
import { Bars3Icon, HomeIcon } from "@heroicons/react/24/solid";

function Withdraw() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  const handleWithdraw = async () => {
    if (!window.confirm("정말로 회원 탈퇴하시겠습니까? 모든 정보가 삭제됩니다.")) return;
    try {
      // 🔴 1. Google 재인증
      const provider = new GoogleAuthProvider();
      await reauthenticateWithPopup(user, provider);

      // 🔵 2. Firestore 회원정보 삭제
      await deleteDoc(doc(db, "users", user.uid));
      // 🔵 3. 계정 삭제
      await user.delete();
      setInfoMsg("회원탈퇴 완료. 메인으로 이동합니다.");
      setTimeout(() => {
        logout();
        navigate("/");
      }, 1500);
    } catch (err) {
      setError("탈퇴 중 에러: " + err.message);
    }
  };

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* 상단 네비게이션 */}
      <div className="flex justify-between items-center px-4 py-3 bg-blue-100 shadow">
        <button className="bg-blue-300 px-3 py-1 rounded-md hover:bg-blue-400">
          <Bars3Icon className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-lg">회원탈퇴</h2>
        <button
          onClick={() => navigate("/")}
          className="bg-blue-300 px-3 py-1 rounded-md hover:bg-blue-400"
        >
          <HomeIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="mt-10 flex justify-center">
          <h1 className="text-5xl font-lilita text-indigo-500">Fitweather</h1>
      </div>

      {/* 중앙 콘텐츠 */}
      <div className="flex flex-col items-center justify-start flex-1 px-4 mt-12">
        {/* 안내 메시지 카드 */}
        <div className="bg-white rounded-lg shadow px-8 py-8 w-full max-w-xl mb-8">
          <div className="text-center text-black text-base leading-relaxed">
            <p className="font-semibold">회원탈퇴 시 모든 정보가 삭제되며, 복구할 수 없습니다.</p>
            <p className="mt-2">정말 탈퇴하시겠습니까?</p>
          </div>
        </div>

        {/* ✅ 버튼 그룹: 카드 외부 */}
        <div className="flex justify-center gap-4 mb-4">
          <button
            onClick={handleWithdraw}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-md"
          >
            동의
          </button>
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-md"
          >
            이전
          </button>
        </div>

        {/* 메시지 출력 */}
        {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
        {infoMsg && <p className="text-black mt-2 text-sm">{infoMsg}</p>}
      </div>
    </div>
  );
}

export default Withdraw;

import { useAuth } from "../contexts/AuthContext";
import { db, logout } from "../firebase";
import { doc, deleteDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { GoogleAuthProvider, reauthenticateWithPopup } from "firebase/auth";
import { useState } from "react";

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
      setInfoMsg("회원탈퇴 완료! 메인으로 이동합니다.");
      setTimeout(() => {
        logout();
        navigate("/");
      }, 1500);
    } catch (err) {
      setError("탈퇴 중 에러: " + err.message);
    }
  };

  return (
    <div className="max-w-xs mx-auto mt-16">
      <h2 className="text-xl font-bold mb-6">회원탈퇴</h2>
      <p className="mb-4 text-red-500">
        회원탈퇴 시 모든 정보가 삭제되며, 복구할 수 없습니다.<br/>
        정말 탈퇴하시겠습니까?
      </p>
      <button
        onClick={handleWithdraw}
        className="bg-red-500 text-white w-full py-2 rounded mb-2"
      >
        회원탈퇴
      </button>
      <button
        onClick={() => navigate(-1)}
        className="bg-gray-300 text-black w-full py-2 rounded"
      >
        돌아가기
      </button>
      {error && <p className="text-red-500 mt-4">{error}</p>}
      {infoMsg && <p className="text-green-600 mt-4">{infoMsg}</p>}
    </div>
  );
}

export default Withdraw;

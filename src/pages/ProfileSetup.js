import { useLocation, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, setDoc, query, collection, where, getDocs } from "firebase/firestore";
import { useState } from "react";

function ProfileSetup() {
  const location = useLocation();
  const navigate = useNavigate();

  const uid = location.state?.uid;
  const email = location.state?.email || "";
  const displayName = location.state?.displayName || "";

  const [nickname, setNickname] = useState(displayName);
  const [region, setRegion] = useState("");
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!nickname || !region) {
      setError("닉네임과 지역을 모두 입력해주세요!");
      return;
    }
    try {
      const q = query(
        collection(db, "users"),
        where("nickname", "==", nickname)
      );
      const querySnapshot = await getDocs(q);

      let duplicated = false;
      querySnapshot.forEach((docSnap) => {
        if (docSnap.id !== uid) duplicated = true;
      });

      if (duplicated) {
        setError("이미 사용 중인 닉네임입니다!");
        return;
      }

      await setDoc(doc(db, "users", uid), {
        nickname,
        region,
        email,
      });
      navigate("/");
    } catch (err) {
      setError("저장 중 에러: " + err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h2 className="text-2xl font-semibold mb-4">회원정보 입력</h2>
      <input
        className="border p-2 mb-2 w-64 rounded"
        placeholder="닉네임"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
      />
      <select
        className="border p-2 mb-2 w-64 rounded"
        value={region}
        onChange={(e) => setRegion(e.target.value)}
      >
        <option value="">지역 선택</option>
        <option value="서울">서울</option>
        <option value="부산">부산</option>
        {/* 필요 시 더 추가 */}
      </select>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        onClick={handleSave}
        className="mt-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
      >
        저장
      </button>
    </div>
  );
}

export default ProfileSetup;

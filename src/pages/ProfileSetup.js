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
    <div className="max-w-xs mx-auto mt-10">
      <h2 className="text-xl font-bold mb-4">회원정보 입력</h2>
      <input
        value={nickname}
        onChange={e => setNickname(e.target.value)}
        placeholder="닉네임을 입력하세요."
        className="border p-2 mb-2 w-full"
      />
      <select
        value={region}
        onChange={e => setRegion(e.target.value)}
        className="border p-2 mb-2 w-full"
      >
        <option value="">지역 선택</option>
        <option value="서울">서울</option>
        <option value="부산">부산</option>
      </select>
      {error && <p className="text-red-500 mt-2">{error}</p>}
      <button
        onClick={handleSave}
        className="bg-blue-500 text-white w-full py-2 rounded"
      >
        저장
      </button>
    </div>
  );
}

export default ProfileSetup;

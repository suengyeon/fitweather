import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { doc, getDoc, updateDoc, query, collection, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function ProfileEdit() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [nickname, setNickname] = useState("");
  const [region, setRegion] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  // 1. 기존 정보 불러오기
  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setNickname(userSnap.data().nickname);
        setRegion(userSnap.data().region);
        setEmail(userSnap.data().email);
      }
    };
    fetchProfile();
  }, [user]);

  // 2. 저장 함수 (닉네임 중복 검사)
  const handleSave = async () => {
    if (!nickname || !region) {
      setError("닉네임과 지역을 모두 입력해주세요!");
      setInfoMsg("");
      return;
    }
    try {
      // 닉네임 중복 체크 (자기자신 제외)
      const q = query(
        collection(db, "users"),
        where("nickname", "==", nickname)
      );
      const querySnapshot = await getDocs(q);
      let duplicated = false;
      querySnapshot.forEach((docSnap) => {
        if (docSnap.id !== user.uid) duplicated = true;
      });
      if (duplicated) {
        setError("이미 사용 중인 닉네임입니다!");
        setInfoMsg("");
        return;
      }

      await updateDoc(doc(db, "users", user.uid), {
        nickname,
        region,
      });
      setInfoMsg("수정 완료!");
      setError("");
    } catch (err) {
      setError("저장 중 에러: " + err.message);
      setInfoMsg("");
    }
  };

  return (
    <div className="max-w-xs mx-auto mt-16">
      <h2 className="text-xl font-bold mb-6">회원정보 수정</h2>
      <input
        value={nickname}
        onChange={e => setNickname(e.target.value)}
        placeholder="닉네임을 입력하세요"
        className="border p-2 mb-2 w-full"
      />
      <input
        value={region}
        onChange={e => setRegion(e.target.value)}
        placeholder="지역(예: 서울)"
        className="border p-2 mb-2 w-full"
      />
      <button
        onClick={handleSave}
        className="bg-blue-500 text-white w-full py-2 rounded mb-2"
      >
        저장
      </button>
      <button
        onClick={() => navigate(-1)}
        className="bg-gray-300 text-black w-full py-2 rounded"
      >
        돌아가기
      </button>
      <div className="mt-2 text-xs text-neutral-400">이메일: {email}</div>
      {error && <p className="text-red-500 mt-4">{error}</p>}
      {infoMsg && <p className="text-green-600 mt-4">{infoMsg}</p>}
    </div>
  );
}

export default ProfileEdit;

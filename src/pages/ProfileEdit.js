import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { doc, getDoc, updateDoc, query, collection, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Bars3Icon, HomeIcon } from "@heroicons/react/24/solid";

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
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* 네비게이션 바 */}
      <div className="flex justify-between items-center px-4 py-3 bg-blue-100 shadow">
        <button className="bg-blue-300 px-3 py-1 rounded-md hover:bg-blue-400">
          <Bars3Icon className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-lg">내 정보 수정</h2>
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
        <div className="bg-white rounded-lg shadow px-8 py-8 w-full max-w-xl mb-8">
          {/* 입력 항목 */}
          <div className="mb-10 flex items-center">
            <label className="w-28 font-semibold text-base">지역</label>
             <select
                value={region}
                onChange={e => setRegion(e.target.value)}
                className="flex-1 border border-gray-300 bg-gray-200 px-4 py-2 rounded text-base"
              >
              <option value="Seoul">서울</option>
              <option value="Busan">부산</option>
              <option value="Gwangju">광주</option>
              <option value="Daegu">대구</option>
              <option value="Daejeon">대전</option>
              <option value="Ulsan">울산</option>
              <option value="Incheon">인천</option>
              </select>
          </div>
          <div className="mb-10 flex items-center">
            <label className="w-28 font-semibold text-base">닉네임</label>
            <input
              type="text"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              className="flex-1 border border-gray-300 bg-gray-200 px-4 py-2 rounded text-base"
            />
          </div>
          <div className="mb-10 flex items-center">
            <label className="w-28 font-semibold text-base">이메일</label>
            <input
              type="text"
              value={email}
              readOnly
              className="flex-1 border border-gray-300 bg-gray-200 px-4 py-2 rounded text-base"
            />
          </div>
        </div>

        {/* 버튼 영역 */}
        <div className="flex gap-4">
          <button
            onClick={handleSave}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md"
          >
            저장
          </button>
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-md"
          >
            이전
          </button>
        </div>

        {/* 메시지 */}
        {error && <p className="text-red-500 mt-4">{error}</p>}
        {infoMsg && <p className="text-black0 mt-4">{infoMsg}</p>}
      </div>
    </div>
  );
}

export default ProfileEdit;

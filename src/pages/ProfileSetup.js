import { useLocation, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, setDoc, query, collection, where, getDocs } from "firebase/firestore";
import { useState } from "react";
import { HomeIcon, Bars3Icon } from "@heroicons/react/24/solid";

function ProfileSetup() {
  const location = useLocation();
  const navigate = useNavigate();

  const uid = location.state?.uid;
  const email = location.state?.email || "";
  const displayName = location.state?.displayName || "";

  const [nickname, setNickname] = useState(displayName);
  const [region, setRegion] = useState("");
  const [error, setError] = useState(""); // eslint-disable-next-line no-unused-vars

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
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* 상단 네비게이션 */}
      <div className="flex justify-between items-center px-4 py-3 bg-blue-100 shadow">
        <button className="bg-blue-300 px-3 py-1 rounded-md text-sm font-medium hover:bg-blue-400">
          <Bars3Icon className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-lg">회원 정보 입력</h2>
        <button
          onClick={() => navigate("/")}
          className="bg-blue-300 px-3 py-1 rounded-md hover:bg-blue-400"
        >
          <HomeIcon className="w-5 h-5" />
        </button>
      </div>

      {/* 로고 */}
      <div className="mt-10 flex justify-center">
        <h1 className="text-5xl font-lilita text-indigo-500">Fitweather</h1>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="flex flex-col items-center justify-start flex-1 px-4 mt-12">
        <div className="bg-white rounded-lg shadow px-8 py-8 w-full max-w-md mb-8">
          <div className="mb-6">
            <label className="block font-semibold mb-2">닉네임</label>
            <input
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder="닉네임을 입력하세요."
              className="w-full border border-gray-300 px-4 py-2 rounded"
            />
          </div>

          <div className="mb-6">
            <label className="block font-semibold mb-2">지역</label>
            <select
              value={region}
              onChange={e => setRegion(e.target.value)}
              className="w-full border border-gray-300 px-4 py-2 rounded bg-white"
            >
              <option value="">지역 선택</option>
              <option value="Seoul">서울</option>
              <option value="Busan">부산</option>
              <option value="Gwangju">광주</option>
              <option value="Daegu">대구</option>
              <option value="Daejeon">대전</option>
              <option value="Ulsan">울산</option>
              <option value="Incheon">인천</option>
            </select>
          </div>

          {error && (
            <p className="text-red-500 text-sm mb-4">{error}</p>
          )}

          <div className="flex justify-center">
            <button
              onClick={handleSave}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded w-auto"
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileSetup;

import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bars3Icon, HomeIcon } from "@heroicons/react/24/solid";

function MyPageUserInfo() {
  const { user } = useAuth();
  const [nickname, setNickname] = useState("");
  const [region, setRegion] = useState("");
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* 상단 네비게이션 */}
      <div className="flex justify-between items-center px-4 py-3 bg-blue-100 shadow">
        <button className="bg-blue-300 px-3 py-1 rounded-md hover:bg-blue-400">
          <Bars3Icon className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-lg">내 정보</h2>
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
        
        {/* 정보 카드 */}
        <div className="bg-white rounded-lg shadow px-8 py-8 w-full max-w-xl mb-8">
        {[
          { label: "지역", value: region },
          { label: "이름", value: nickname },
          { label: "아이디", value: email },
          { label: "비밀번호", value: "********" }, // 마스킹 처리
        ].map((item, idx) => (
          <div key={idx} className="mb-12 flex items-center">
            <label className="w-28 font-semibold text-base">{item.label}</label>
            <input
              type="text"
              value={item.value}
              readOnly
              className="flex-1 border border-gray-300 bg-gray-200 px-4 py-2 rounded text-base"
            />
          </div>
        ))}
      </div>

        {/* 버튼 (카드 외부) */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate("/profile-edit")}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md"
          >
            수정
          </button>
          <button
            onClick={() => navigate("/withdraw")}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-md"
          >
            탈퇴
          </button>
        </div>
      </div>
    </div>

  );
}

export default MyPageUserInfo;

import { useAuth } from "../contexts/AuthContext";
import { db, logout } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bars3Icon } from "@heroicons/react/24/solid";

function Home() {
  const { user, loading } = useAuth();
  const [nickname, setNickname] = useState("");
  const [region, setRegion] = useState("서울");
  const [profileLoading, setProfileLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNickname = async () => {
      if (!user) return;
      setProfileLoading(true);
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setNickname(userSnap.data().nickname);
          setRegion(userSnap.data().region || "서울");
        } else {
          setNickname("");
        }
      } catch (err) {
        setNickname("");
      }
      setProfileLoading(false);
    };
    fetchNickname();
  }, [user]);

  if (loading || profileLoading) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      {user ? (
          <div className="w-full min-h-screen bg-gray-100 flex flex-col">
        {/* 상단 네비게이션 */}
        <div className="flex justify-between items-center px-4 py-3 bg-blue-100 shadow">
          <button className="bg-blue-300 px-3 py-1 rounded-md hover:bg-blue-400">
            <Bars3Icon className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-4">
            <button
              onClick={logout}
              className="text-sm hover:underline"
            >
              logout
            </button>
            <button
              onClick={() => navigate("/mypage_userinfo")}
              className="text-sm hover:underline"
            >
              Mypage
            </button>
            <div className="bg-blue-200 px-2 py-1 rounded text-sm font-medium">
              {nickname || "회원"}님
            </div>
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <h1 className="text-5xl font-lilita text-indigo-500">Fitweather</h1>
      </div>

        {/* 중앙 콘텐츠 */}
        <div className="flex flex-col items-center mt-12 px-4">

          {/* 지역 선택 */}
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="border border-gray-300 bg-white px-4 py-2 rounded mb-6"
          >
            <option value="서울">서울</option>
            <option value="부산">부산</option>
          </select>

          {/* 이미지 영역 (placeholder) */}
          <div className="w-60 h-60 bg-white border border-gray-400 mb-4"></div>

          {/* 온도 / 강수량 */}
          <div className="flex space-x-12 mb-12">
            <div className="bg-blue-100 px-4 py-2 rounded">온도</div>
            <div className="bg-blue-100 px-4 py-2 rounded">강수량</div>
          </div>

          {/* 기록하기 버튼 */}
          <button className="bg-blue-300 hover:bg-blue-400 px-6 py-2 rounded">
            기록하기
          </button>
        </div>
      </div>
      ) : (
       <div className="w-full h-screen bg-gray-100 flex flex-col">
      {/* 상단 네비게이션 */}
      <div className="flex justify-end items-center px-4 py-3 bg-blue-100 shadow">
        <button
          onClick={() => navigate("/login")}
          className="bg-blue-300 px-3 py-1 rounded-md text-sm font-medium hover:bg-blue-400"
        >
          login
        </button>
      </div>

      {/* 중앙 콘텐츠 */}
      <div className="flex flex-1 items-center justify-center">
        <h1 className="text-6xl font-lilita text-indigo-500">Fitweather</h1>
      </div>
    </div>
      )}
    </div>
  );
}

export default Home;

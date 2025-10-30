import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bars3Icon, HomeIcon } from "@heroicons/react/24/solid";
import { BellIcon } from "@heroicons/react/24/outline";
import MenuSidebar from "../components/MenuSidebar";
import NotiSidebar from "../components/NotiSidebar";
import useNotiSidebar from "../hooks/useNotiSidebar";
import { regionMap } from "../constants/regionData";

function MyPageUserInfo() {
  const { user } = useAuth();
  const [nickname, setNickname] = useState("");
  const [region, setRegion] = useState("");
  const [email, setEmail] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { alarmOpen, setAlarmOpen,
    notifications, unreadCount,
    markAllRead, handleDeleteSelected,
    markOneRead, handleAlarmItemClick,
  } = useNotiSidebar();

  const navigate = useNavigate();

  // 지역 이름을 한글로 변환하는 함수
  const getKoreanRegionName = (englishRegion) => {
    // regionMap은 regionData.js에서 가져옴
    return regionMap[englishRegion] || englishRegion;
  };

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setNickname(data.nickname);
        setRegion(data.region);
        setEmail(data.email);
      }
    };
    fetchProfile();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col relative">
      {/* 사이드바 */}
      <MenuSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <NotiSidebar
        isOpen={alarmOpen}
        onClose={() => setAlarmOpen(false)}
        notifications={notifications}
        onMarkAllRead={markAllRead}
        onDeleteSelected={handleDeleteSelected}
        onMarkOneRead={markOneRead}
        onItemClick={handleAlarmItemClick}
      />

      {/* 상단 네비게이션 */}
      <div className="flex justify-between items-center px-4 py-3 bg-blue-100 shadow">
        <button
          className="bg-blue-200 px-3 py-1 rounded-md hover:bg-blue-300"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Bars3Icon className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-lg">회원정보</h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/")}
            className="bg-blue-200 px-3 py-1 rounded-md hover:bg-blue-300"
          >
            <HomeIcon className="w-5 h-5" />
          </button>
          <button
            className="relative flex items-center justify-center 
                                            bg-white w-7 h-7 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={() => setAlarmOpen(true)}
            aria-label="알림 열기"
          >
            <BellIcon className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-2 w-1.5 h-1.5 bg-red-500 rounded-full" />
            )}
          </button>
        </div>
      </div>

      <div className="mt-10 flex justify-center">
        <h1 className="text-5xl font-lilita text-indigo-500">Fitweather</h1>
      </div>

      {/* 중앙 콘텐츠 */}
      <div className="flex flex-col items-center justify-start flex-1 px-4 mt-12">

        {/* 정보 카드 */}
        <div className="bg-white rounded-lg px-8 py-8 w-full max-w-xl mb-8">
          {[
            { label: "지역", value: getKoreanRegionName(region) },
            { label: "닉네임", value: nickname },
            { label: "아이디", value: email },
          ].map((item, idx) => (
            <div key={idx} className="mb-10 flex items-center">
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
            className="bg-blue-400 hover:bg-blue-500 text-white px-6 py-2 rounded-md font-medium"
          >
            수정
          </button>
          <button
            onClick={() => navigate("/withdraw")}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-md font-medium"
          >
            탈퇴
          </button>
        </div>
      </div>
    </div>

  );
}

export default MyPageUserInfo;

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Bars3Icon, HomeIcon } from "@heroicons/react/24/solid";
import { BellIcon } from "@heroicons/react/24/outline";
import MenuSidebar from "../components/MenuSidebar";
import NotiSidebar from "../components/NotiSidebar";
import useNotiSidebar from "../hooks/useNotiSidebar";
import { regionMap } from "../constants/regionData";

/**
 * MyPageUserInfo 컴포넌트 - 사용자의 기본 회원 정보를 표시하는 마이페이지 뷰
 */
function MyPageUserInfo() {
  const { user } = useAuth(); // 사용자 인증 정보 훅
  const [nickname, setNickname] = useState("");
  const [region, setRegion] = useState("");
  const [email, setEmail] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // 알림 사이드바 훅
  const { alarmOpen, setAlarmOpen,
    notifications, unreadCount,
    markAllRead, handleDeleteSelected,
    markOneRead, handleAlarmItemClick,
    reportNotificationPopup
  } = useNotiSidebar();

  const navigate = useNavigate();

  // 지역 코드를 한국어 이름으로 변환하는 함수
  const getKoreanRegionName = (englishRegion) => {
    return regionMap[englishRegion] || englishRegion;
  };

  // 사용자 정보 가져오기(컴포넌트 로드 시, user 객체가 있을 경우 실행)
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
      {/* 메뉴 사이드바 */}
      <MenuSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {/* 알림 사이드바 */}
      <NotiSidebar
        isOpen={alarmOpen}
        onClose={() => setAlarmOpen(false)}
        notifications={notifications}
        onMarkAllRead={markAllRead}
        onDeleteSelected={handleDeleteSelected}
        onMarkOneRead={markOneRead}
        onItemClick={handleAlarmItemClick}
        reportNotificationPopup={reportNotificationPopup}
      />

      {/* 상단 네비게이션 */}
      <div className="flex justify-between items-center px-4 py-3 bg-blue-100 shadow">
        {/* 메뉴 열기 버튼 */}
        <button
          className="bg-blue-200 px-3 py-1 rounded-md hover:bg-blue-300"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Bars3Icon className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-lg">회원정보</h2>
        <div className="flex items-center space-x-4">
          {/* 홈 버튼 */}
          <button
            onClick={() => navigate("/")}
            className="bg-blue-200 px-3 py-1 rounded-md hover:bg-blue-300"
          >
            <HomeIcon className="w-5 h-5" />
          </button>
          {/* 알림 버튼 */}
          <button
            className="relative flex items-center justify-center 
            bg-white w-7 h-7 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={() => setAlarmOpen(true)}
            aria-label="알림 열기"
          >
            <BellIcon className="w-5 h-5" />
            {/* 읽지 않은 알림 인디케이터 */}
            {unreadCount > 0 && (
              <span className="absolute top-1 right-2 w-1.5 h-1.5 bg-red-500 rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* 앱 타이틀 */}
      <div className="mt-10 flex justify-center">
        <h1 className="text-5xl font-lilita text-indigo-500">Fitweather</h1>
      </div>

      {/* 중앙 콘텐츠 */}
      <div className="flex flex-col items-center justify-start flex-1 px-4 mt-12">

        {/* 정보 카드 */}
        <div className="bg-white rounded-lg px-8 py-8 w-full max-w-xl mb-8">
          {[
            // 표시할 회원 정보 목록(지역, 닉네임, 아이디)
            { label: "지역", value: getKoreanRegionName(region) },
            { label: "닉네임", value: nickname },
            { label: "아이디", value: email },
          ].map((item, idx) => (
            <div key={idx} className="mb-10 flex items-center">
              <label className="w-28 font-semibold text-base">{item.label}</label>
              <input
                type="text"
                value={item.value}
                readOnly // 읽기 전용 필드
                className="flex-1 border border-gray-300 bg-gray-100 px-4 py-2 rounded text-base"
              />
            </div>
          ))}
        </div>

        {/* 버튼(카드 외부) */}
        <div className="flex gap-4">
          {/* 수정 페이지로 이동 */}
          <button
            onClick={() => navigate("/profile-edit")}
            className="bg-blue-400 hover:bg-blue-500 text-white px-6 py-2 rounded-md font-medium"
          >
            수정
          </button>
          {/* 탈퇴 페이지로 이동 */}
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
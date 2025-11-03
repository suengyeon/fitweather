import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bars3Icon, HomeIcon } from "@heroicons/react/24/solid";
import { BellIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../contexts/AuthContext";
import MenuSidebar from "../components/MenuSidebar";
import NotiSidebar from "../components/NotiSidebar";
import useNotiSidebar from "../hooks/useNotiSidebar";
import useFollowData from "../hooks/useFollowData"; 
import FollowItem from "../components/FollowItem"; 

/**
 * Follow 컴포넌트 - 사용자의 팔로잉 및 팔로워 목록을 표시하고 관리
 */
export default function Follow() {
  const navigate = useNavigate();
  // 메뉴 사이드바 열림/닫힘 상태
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // 알림 사이드바 로직 커스텀 훅
  const { alarmOpen, setAlarmOpen,
    notifications, unreadCount,
    markAllRead, handleDeleteSelected,
    markOneRead, handleAlarmItemClick,
  } = useNotiSidebar();

  const { user } = useAuth();
  
  // 팔로우/구독 데이터 및 로직 커스텀 훅
  const { 
    following, 
    followers, 
    loading, 
    subscriptionStates, 
    handleSubscriptionToggle 
  } = useFollowData(user?.uid); 

  // 닉네임 클릭 시 캘린더 페이지로 이동
  const handleNicknameClick = (userId, nickname) => {
    navigate(`/calendar/${userId}`);
  };

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
      />

      {/* 상단 네비게이션 및 헤더 */}
      <div className="flex justify-between items-center px-4 py-3 bg-blue-100 shadow">
        {/* 메뉴 열기 버튼 */}
        <button
          className="bg-blue-200 px-3 py-1 rounded-md hover:bg-blue-300"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Bars3Icon className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-lg">구독</h2>
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
            {/* 읽지 않은 알림 카운트 표시 */}
            {unreadCount > 0 && (
              <span className="absolute top-1 right-2 w-1.5 h-1.5 bg-red-500 rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div className="max-w-6xl w-full mx-auto px-4 py-6 space-y-4">
        {/* 목록 라벨(팔로잉 / 팔로워) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl py-2 text-center font-semibold">팔로잉</div>
          <div className="bg-white rounded-xl py-2 text-center font-semibold">팔로워</div>
        </div>

        {/* 팔로잉/팔로워 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* 1. 팔로잉 카드 섹션 */}
          <section className="bg-white rounded-2xl min-h-[70vh] p-4">
            <ul className="space-y-4">
              {loading ? (
                <li className="text-sm text-gray-500">로딩 중...</li>
              ) : following.length === 0 ? (
                <li className="text-sm text-gray-500">아직 팔로잉한 사용자가 없어요.</li>
              ) : (
                // 팔로잉 목록 렌더링
                following.map((user) => (
                  <FollowItem
                    key={user.id} 
                    user={user} 
                    isSubscribed={subscriptionStates[user.id]}
                    onToggleSubscription={handleSubscriptionToggle}
                    onNicknameClick={handleNicknameClick}
                  />
                ))
              )}
            </ul>
          </section>

          {/* 2. 팔로워 카드 섹션 */}
          <section className="bg-white rounded-2xl min-h-[60vh] p-4">
            <ul className="space-y-4">
              {loading ? (
                <li className="text-sm text-gray-500">로딩 중...</li>
              ) : followers.length === 0 ? (
                <li className="text-sm text-gray-500">아직 나를 팔로우한 사용자가 없어요.</li>
              ) : (
                // 팔로워 목록 렌더링
                followers.map((user) => (
                  <FollowItem
                    key={user.id} 
                    user={user} 
                    isSubscribed={subscriptionStates[user.id]}
                    onToggleSubscription={handleSubscriptionToggle}
                    onNicknameClick={handleNicknameClick}
                  />
                ))
              )}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
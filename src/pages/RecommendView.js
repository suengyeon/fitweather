import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Bars3Icon, HomeIcon } from "@heroicons/react/24/solid";
import { BellIcon } from "@heroicons/react/24/outline";
import MenuSidebar from "../components/MenuSidebar";
import NotiSidebar from "../components/NotiSidebar";
import useNotiSidebar from "../hooks/useNotiSidebar";
import FeedCard from "../components/FeedCard";
import { getAllRecords } from "../api/getAllRecords";
import { toggleLike } from "../api/toggleLike";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { sortRecords } from "../utils/sortingUtils";

/**
 * RecommendView 컴포넌트 - 사용자가 설정한 기본 날씨 필터에 따라 코디를 추천하여 보여줌
 */
function RecommendView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [outfits, setOutfits] = useState([]); 
  const [filteredOutfits, setFilteredOutfits] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // 알림 사이드바 훅
  const { alarmOpen, setAlarmOpen,
    notifications, unreadCount,
    markAllRead, handleDeleteSelected,
    markOneRead, handleAlarmItemClick,
    reportNotificationPopup
  } = useNotiSidebar();

  // 사용자 설정 필터 및 지역 상태
  const [userFilters, setUserFilters] = useState(null); 
  const [userRegion, setUserRegion] = useState("");
  
  // 추가 체크박스 필터 상태
  const [excludeMyRecords, setExcludeMyRecords] = useState(false);
  const [onlyMyRecords, setOnlyMyRecords] = useState(false);
  const [onlySubscribedUsers, setOnlySubscribedUsers] = useState(false);
  
  // 구독한 사용자 ID 목록
  const [subscribedUsers, setSubscribedUsers] = useState([]);

  // 사용자 필터(온도/강수량/습도) 및 지역 가져오기
  useEffect(() => {
    if (!user) return;
    const fetchUserFilters = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          if (data.filters && data.region) {
            setUserFilters(data.filters);
            setUserRegion(data.region);
          }
        }
      } catch (error) {
        console.error("Error fetching user filters:", error);
      }
    };
    fetchUserFilters();
  }, [user]);

  // 구독한 사용자 목록 가져오기
  useEffect(() => {
    if (!user) return;
    const fetchSubscribedUsers = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          // Firestore users 컬렉션에 subscribedUsers 필드가 있다고 가정
          if (data.subscribedUsers) { 
            setSubscribedUsers(data.subscribedUsers);
          }
        }
      } catch (error) {
        console.error("Error fetching subscribed users:", error);
      }
    };
    fetchSubscribedUsers();
  }, [user]);

  // FeedDetail에서의 반응 변경 이벤트 감지 및 반영
  useEffect(() => {
    const handleReactionUpdate = (event) => {
      const { recordId, type, isActive } = event.detail;
      setOutfits(prevOutfits => 
        prevOutfits.map(outfit => {
          if (outfit.id === recordId) {
            const updatedOutfit = { ...outfit };
            // 좋아요/싫어요 카운트 업데이트 로직
            if (type === 'thumbsUp') {
              if (isActive) {
                updatedOutfit.thumbsUpCount = (updatedOutfit.thumbsUpCount || 0) + 1;
              } else {
                updatedOutfit.thumbsUpCount = Math.max(0, (updatedOutfit.thumbsUpCount || 0) - 1);
              }
            } else if (type === 'thumbsDown') {
              if (isActive) {
                updatedOutfit.thumbsDownCount = (updatedOutfit.thumbsDownCount || 0) + 1;
              } else {
                updatedOutfit.thumbsDownCount = Math.max(0, (updatedOutfit.thumbsDownCount || 0) - 1);
              }
            }
            return updatedOutfit;
          }
          return outfit;
        })
      );
    };

    window.addEventListener('reactionUpdated', handleReactionUpdate);
    return () => window.removeEventListener('reactionUpdated', handleReactionUpdate);
  }, []);

  // 모든 기록 가져오기(최신 30개)
  useEffect(() => {
    const fetchAllRecords = async () => {
      try {
        const records = await getAllRecords(30);
        setOutfits(records);
      } catch (error) {
        console.error("Error fetching records:", error);
      }
    };

    fetchAllRecords();
  }, []);

  // 필터 적용(필터, 지역, 전체 기록, 체크박스 상태 변경 시 재실행)
  useEffect(() => {
    // 필수 데이터가 없으면 필터링 스킵
    if (!userFilters || !userRegion || outfits.length === 0) {
      setFilteredOutfits([]);
      return;
    }

    const filtered = outfits.filter(record => {
      // 나의 기록만 / 제외 체크박스 필터
      if (onlyMyRecords && record.uid !== user?.uid) return false;
      if (excludeMyRecords && record.uid === user?.uid) return false;

      // 구독한 사람만 필터
      if (onlySubscribedUsers && !subscribedUsers.includes(record.uid)) return false;

      // 지역 필터 (사용자 지역과 일치해야 함)
      if (record.region !== userRegion) return false;

      // 온도 필터 (weather 필드 또는 record.temp 사용)
      const temp = record.temp || record.weather?.temp;
      const tempMatch = temp !== null && temp !== undefined &&
        temp >= userFilters.tempRange.min && temp <= userFilters.tempRange.max;

      // 강수량 필터
      const rain = record.rain || record.weather?.rain;
      const rainMatch = rain !== null && rain !== undefined &&
        rain >= userFilters.rainRange.min && rain <= userFilters.rainRange.max;

      // 습도 필터
      const humidity = record.humidity || record.weather?.humidity;
      const humidityMatch = humidity !== null && humidity !== undefined &&
        humidity >= userFilters.humidityRange.min && humidity <= userFilters.humidityRange.max;

      // 모든 날씨 조건을 만족해야 함 (AND 조건)
      return tempMatch && rainMatch && humidityMatch;
    });

    // 인기 순으로 정렬
    const sortedFiltered = sortRecords(filtered, "popular");
    setFilteredOutfits(sortedFiltered);
  }, [outfits, userFilters, userRegion, excludeMyRecords, onlyMyRecords, onlySubscribedUsers, subscribedUsers, user]);

  // 좋아요 토글 핸들러
  const handleToggleLike = async (recordId, liked) => {
    if (!user) return;

    try {
      await toggleLike(recordId, user.uid, liked);
      // 필터링된 목록만 업데이트 (즉각적인 반영)
      setFilteredOutfits(prev =>
        prev.map(record =>
          record.id === recordId
            ? {
              ...record,
              likes: liked
                ? record.likes.filter(id => id !== user.uid)
                : [...record.likes, user.uid],
            }
            : record
        )
      );
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

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
        reportNotificationPopup={reportNotificationPopup}
      />

      {/* 상단 네비게이션 */}
      <div className="flex justify-between items-center px-4 py-3 bg-blue-100 shadow">
        <button
          className="bg-blue-200 px-3 py-1 rounded-md hover:bg-blue-300"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Bars3Icon className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-lg">추천 코디</h2>
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

      {/* 상단 버튼(상세 필터) */}
      <div className="flex justify-end items-center px-4 py-3 bg-white shadow-sm">
        <button
          onClick={() => navigate("/recommend")}
          className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          상세 필터
        </button>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 px-4 py-6">
        {!userFilters ? (
          // 필터 설정이 없을 경우
          <div className="text-center py-12">
            <p className="text-gray-500 mb-2">추천필터 설정이 필요합니다</p>
            <p className="text-sm text-gray-400">추천필터 설정에서 온도, 강수량, 습도 범위를 설정해주세요</p>
            <button
              onClick={() => navigate("/recommend-filter-settings")}
              className="mt-4 bg-blue-400 hover:bg-blue-500 text-white px-6 py-2 rounded-md font-medium"
            >
              필터 설정하기
            </button>
          </div>
        ) : (
          <>
            {/* 기본필터 설정 버튼 - 항상 표시 */}
            <div className="flex justify-center mb-6">
              <button
                onClick={() => navigate("/recommend-filter-settings")}
                className="bg-blue-400 hover:bg-blue-500 text-white px-6 py-2 rounded-md font-medium"
              >
                기본필터 설정
              </button>
            </div>

            {/* 체크박스 필터 */}
            <div className="mb-4 space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="excludeMyRecords"
                  checked={excludeMyRecords}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setExcludeMyRecords(checked);
                    if (checked) {
                      setOnlyMyRecords(false);
                      setOnlySubscribedUsers(false);
                    }
                  }}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="excludeMyRecords" className="ml-2 text-sm text-gray-700">
                  나의 기록 제외
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="onlyMyRecords"
                  checked={onlyMyRecords}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setOnlyMyRecords(checked);
                    if (checked) {
                      setExcludeMyRecords(false);
                      setOnlySubscribedUsers(false);
                    }
                  }}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="onlyMyRecords" className="ml-2 text-sm text-gray-700">
                  나의 기록만
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="onlySubscribedUsers"
                  checked={onlySubscribedUsers}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setOnlySubscribedUsers(checked);
                    if (checked) {
                      setExcludeMyRecords(false);
                      setOnlyMyRecords(false);
                    }
                  }}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="onlySubscribedUsers" className="ml-2 text-sm text-gray-700">
                  내가 구독한 사람만
                </label>
              </div>
            </div>

            {filteredOutfits.length === 0 ? (
              // 필터링 결과가 없을 때
              <div className="text-center py-12">
                <p className="text-gray-500 mb-2">조건에 맞는 코디가 없습니다</p>
                <p className="text-sm text-gray-400">필터를 조정해보세요</p>
              </div>
            ) : (
              // 코디 목록
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOutfits.map((record) => (
                  <FeedCard
                    key={record.id}
                    record={record}
                    currentUserUid={user?.uid}
                    onToggleLike={handleToggleLike}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default RecommendView;
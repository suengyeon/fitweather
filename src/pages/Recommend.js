// src/pages/Recommend.js
import React, { useEffect, useState } from "react";
import FeedCard from "../components/FeedCard";
import { getAllRecords } from "../api/getAllRecords";
import { toggleLike } from "../api/toggleLike";
import { sortRecords } from "../utils/sortingUtils";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Bars3Icon, HomeIcon } from "@heroicons/react/24/solid";
import { BellIcon } from "@heroicons/react/24/outline";
import MenuSidebar from "../components/MenuSidebar";
import NotiSidebar from "../components/NotiSidebar";
import useNotiSidebar from "../hooks/useNotiSidebar";
import { regionMap } from "../constants/regionData";
import { styleOptions } from "../constants/styleOptions";
import { seasonMap, normalizeSeason, matchesStyle } from "../utils/filterUtils";
import { getFeelingOptions } from "../utils/weatherUtils";

/**
 * Recommend 컴포넌트 - 전체 착장 기록을 불러와 다양한 기준으로 필터링 및 정렬하여 보여줌
 */
function Recommend() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [outfits, setOutfits] = useState([]); // 전체 기록
  const [filteredOutfits, setFilteredOutfits] = useState([]); // 필터링된 기록
  const [hasActiveFilters, setHasActiveFilters] = useState(false); // 활성 필터 존재 여부
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // 알림 사이드바 훅
  const { alarmOpen, setAlarmOpen,
    notifications, unreadCount,
    markAllRead, handleDeleteSelected,
    markOneRead, handleAlarmItemClick,
  } = useNotiSidebar();

  // 체크박스 필터 상태
  const [excludeMyRecords, setExcludeMyRecords] = useState(false);
  const [onlyMyRecords, setOnlyMyRecords] = useState(false);
  const [likedOnly, setLikedOnly] = useState(false);
  const [onlySubscribedUsers, setOnlySubscribedUsers] = useState(false);
  
  // 구독한 사용자 ID 목록
  const [subscribedUsers, setSubscribedUsers] = useState([]);
  // 내가 좋아요한 기록 ID 목록
  const [likedRecordIds, setLikedRecordIds] = useState([]); 

  // 드롭다운/입력 필터 상태
  const [filters, setFilters] = useState(() => {
    const saved = sessionStorage.getItem("recommendFilters");
    if (saved) {
      try {
        const p = JSON.parse(saved);
        return {
          region: p.region || "",
          feeling: p.feeling || "",
          season: p.season || "",
          style: p.style || "",
        };
      } catch {
      }
    }
    return { region: "", feeling: "", season: "", style: "" };
  });

  // 체감 옵션 목록
  const feelingOptions = getFeelingOptions();

  // 필터 변경 핸들러
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // 모든 기록 가져오기
  useEffect(() => {
    const fetchAllRecords = async () => {
      try {
        const records = await getAllRecords();
        setOutfits(records);
        setFilteredOutfits(records);
      } catch (error) {
        console.error("Error fetching records:", error);
      }
    };
    fetchAllRecords();
  }, []);

  // 구독한 사용자 목록 가져오기
  useEffect(() => {
    if (!user) return;
    const fetchSubscribedUsers = async () => {
      try {
        const { collection, query, where, getDocs } = await import("firebase/firestore");
        const { db } = await import("../firebase");
        
        const followsQuery = query(
          collection(db, "follows"),
          where("followerId", "==", user.uid)
        );
        
        const followsSnapshot = await getDocs(followsQuery);
        const followingIds = followsSnapshot.docs.map(doc => doc.data().followingId);
        
        setSubscribedUsers(followingIds);
      } catch (error) {
        console.error("❌ 구독 사용자 목록 조회 실패:", error);
        setSubscribedUsers([]); 
      }
    };
    fetchSubscribedUsers();
  }, [user]);

  // 내가 좋아요한 기록 ID 목록 가져오기
  useEffect(() => {
    if (!user) return;
    const fetchLikedRecords = async () => {
      try {
        const { collection, query, where, getDocs } = await import("firebase/firestore");
        const { db } = await import("../firebase");
        
        const reactionsQuery = query(
          collection(db, "reactions"),
          where("uid", "==", user.uid),
          where("type", "==", "up")
        );
        
        const reactionsSnapshot = await getDocs(reactionsQuery);
        const likedIds = reactionsSnapshot.docs.map(doc => doc.data().recordId);
        
        setLikedRecordIds(likedIds);
      } catch (error) {
        console.error("❌ 좋아요 기록 목록 조회 실패:", error);
        setLikedRecordIds([]); 
      }
    };
    fetchLikedRecords();
  }, [user]);

  // 다른 페이지에서 전달된 필터 적용(뒤로가기/홈화면에서 진입 시)
  useEffect(() => {
    if (location.state?.userFilters && location.state?.userRegion) {
      const userRegion = location.state.userRegion;
      setFilters((prev) => ({ ...prev, region: userRegion, feeling: "" }));
    } else if (location.state?.currentWeather) {
      const currentWeather = location.state.currentWeather;
      setFilters((prev) => ({
        ...prev,
        region: currentWeather.region || "",
        feeling: "",
      }));
    } else if (location.state?.fromDetail && location.state?.currentFilters) {
      const cf = location.state.currentFilters;
      setFilters((prev) => ({
        ...prev,
        region: cf.region || "",
        feeling: cf.feeling || "",
        // season/style은 기존 저장값 유지
      }));
    }
  }, [location.state]);

  // FeedDetail에서의 반응 변경 이벤트 감지 및 반영
  useEffect(() => {
    const handleReactionUpdate = (event) => {
      const { recordId, type, isActive } = event.detail;
      setOutfits(prevOutfits =>
        prevOutfits.map(outfit => {
          if (outfit.id === recordId) {
            const updatedOutfit = { ...outfit };
            // 좋아요/싫어요 카운트 업데이트
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

  // 필터 적용(필터 상태, 원본 데이터, 좋아요/구독 목록 변경 시 재실행)
  useEffect(() => {
    // 필터 활성 여부 판단
    const hasFilters =
      !!filters.region ||
      !!filters.feeling ||
      !!filters.season ||
      !!filters.style ||
      excludeMyRecords ||
      onlyMyRecords ||
      likedOnly ||
      onlySubscribedUsers;
    setHasActiveFilters(hasFilters);

    let filtered = [...outfits];

    filtered = filtered.filter((record) => {
      // 나의 기록 제외/만 필터
      if (excludeMyRecords && user?.uid && record.uid === user.uid) return false;
      if (onlyMyRecords && (!user?.uid || record.uid !== user.uid)) return false;

      // 내가 좋아요 한 코디 필터
      if (likedOnly && (!user?.uid || !likedRecordIds.includes(record.id))) return false;

      // 구독한 사람만 필터
      if (onlySubscribedUsers && (!user?.uid || !subscribedUsers.includes(record.uid))) return false;

      // 지역 필터
      if (filters.region && record.region !== filters.region) return false;

      // 체감 필터
      if (filters.feeling && record.feeling !== filters.feeling) return false;

      // 계절 필터
      if (filters.season) {
        const wantedKo = normalizeSeason(filters.season);
        const recSeason =
          record.season || record.weather?.season || record.meta?.season || "";
        if (normalizeSeason(recSeason) !== wantedKo) return false;
      }

      // 스타일 필터
      if (filters.style) {
        const recStyle = record.styles ?? record.style ?? null;
        if (!matchesStyle(recStyle, filters.style)) return false;
      }

      return true;
    });

    // 인기 순(좋아요 순)으로 정렬
    const sortedFiltered = sortRecords(filtered, "popular");
    setFilteredOutfits(sortedFiltered);
  }, [
    outfits,
    filters,
    excludeMyRecords,
    onlyMyRecords,
    likedOnly,
    likedRecordIds, 
    onlySubscribedUsers,
    subscribedUsers,
    user,
  ]);

  // 필터 상태 세션 스토리지에 저장
  useEffect(() => {
    sessionStorage.setItem("recommendFilters", JSON.stringify(filters));
  }, [filters]);

  // 좋아요 토글 핸들러(FeedCard에 전달)
  const handleToggleLike = async (recordId, liked) => {
    if (!user) return;
    await toggleLike(recordId, user.uid);
    // 좋아요 상태 로컬 업데이트 
    setOutfits((prev) =>
      prev.map((record) =>
        record.id === recordId
          ? {
            ...record,
            likes: liked
              ? record.likes.filter((uid) => uid !== user.uid)
              : [...(record.likes || []), user.uid],
          }
          : record
      )
    );
  };

  // 모든 필터 초기화
  const clearFilters = () => {
    setFilters({ region: "", feeling: "", season: "", style: "" });
    setExcludeMyRecords(false);
    setOnlyMyRecords(false);
    setLikedOnly(false);
    setOnlySubscribedUsers(false);
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
      />
      {/* 상단 네비게이션 */}
      <div className="flex justify-between items-center px-4 py-3 bg-blue-100 shadow">
        {/* 메뉴 버튼 */}
        <button
          className="bg-blue-200 px-3 py-1 rounded-md hover:bg-blue-300"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Bars3Icon className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-lg">추천 코디</h2>
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

      {/* 뒤로가기 버튼 */}
      <div className="flex justify-start items-center px-4 py-3 bg-white shadow-sm">
        <button
          onClick={() => navigate("/recommend-view")}
          className="bg-gray-400 hover:bg-gray-600 text-white px-4 py-1.5 rounded-md text-sm flex items-center gap-2"
        >
          ← 뒤로가기
        </button>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 px-4 mt-10 flex flex-col md:flex-row gap-6 mb-10">
        {/* 왼쪽 : 필터 패널 */}
        <div className="w-full md:w-1/4 bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">필터</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              초기화
            </button>
          </div>

          {/* 체크박스 필터 */}
          <div className="mb-6 space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="excludeMyRecords"
                checked={excludeMyRecords}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setExcludeMyRecords(checked);
                  // "나의 기록만"과 상호 배타적
                  if (checked) {
                    setOnlyMyRecords(false);
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
                  // "나의 기록 제외"와 상호 배타적
                  if (checked) {
                    setExcludeMyRecords(false);
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
                id="likedOnly"
                checked={likedOnly}
                onChange={(e) => {
                  setLikedOnly(e.target.checked);
                }}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="likedOnly" className="ml-2 text-sm text-gray-700">
                내가 좋아요 한 코디
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="onlySubscribedUsers"
                checked={onlySubscribedUsers}
                onChange={(e) => {
                  setOnlySubscribedUsers(e.target.checked);
                }}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="onlySubscribedUsers" className="ml-2 text-sm text-gray-700">
                내가 구독한 사람만
              </label>
            </div>
          </div>

          {/* 지역 드롭다운 */}
          <div className="mb-6">
            <label className="block text-base font-semibold mb-2">지역</label>
            <select
              value={filters.region}
              onChange={(e) => handleFilterChange('region', e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-center"
            >
              <option value="">전체 지역</option>
              {Object.entries(regionMap).map(([eng, kor]) => (
                <option key={eng} value={eng}>
                  {kor}
                </option>
              ))}
            </select>
          </div>

          {/* 체감 드롭다운 */}
          <div className="mb-6">
            <label className="block text-base font-semibold mb-3">체감</label>
            <select
              value={filters.feeling}
              onChange={(e) => handleFilterChange('feeling', e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-center"
            >
              <option value="">전체</option>
              {feelingOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* 계절 드롭다운 */}
          <div className="mb-5">
            <label className="block text-base font-semibold mb-3">계절</label>
            <select
              value={filters.season}
              onChange={(e) => handleFilterChange('season', e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-center"
            >
              <option value="">전체</option>
              {Object.entries(seasonMap).map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* 스타일 드롭다운 */}
          <div className="mb-5">
            <label className="block text-base font-semibold mb-3">스타일</label>
            <select
              value={filters.style}
              onChange={(e) => handleFilterChange('style', e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-center"
            >
              <option value="">전체</option>
              {styleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 오른쪽 : 코디 목록 */}
        <div className="w-full md:w-3/4 bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">
              총 {filteredOutfits.length}개의 코디
            </h3>
            <p className="text-sm text-gray-600">
              좋아요 순으로 정렬된 추천 코디입니다.
            </p>
          </div>

          {filteredOutfits.length === 0 ? (
            // 필터링 결과가 없을 때
            <div className="text-center py-12">
              <p className="text-gray-500 mb-2">
                {hasActiveFilters ? "조건에 맞는 코디가 없습니다" : "필터를 설정해주세요"}
              </p>
              <p className="text-sm text-gray-400">
                {hasActiveFilters
                  ? "필터를 조정해보세요"
                  : "지역/체감/계절/스타일 또는 '나의 기록 제외/만'을 설정해보세요"}
              </p>
            </div>
          ) : (
            // 코디 목록 그리드
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredOutfits.map((outfit) => (
                <FeedCard
                  key={outfit.id}
                  record={outfit}
                  currentUserUid={user?.uid}
                  onToggleLike={handleToggleLike}
                  currentFilters={filters}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Recommend;
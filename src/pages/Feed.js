import React, { useState } from "react";
import FeedCard from "../components/FeedCard";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Bars3Icon, HomeIcon } from "@heroicons/react/24/solid";
import { BellIcon } from "@heroicons/react/24/outline";
import MenuSidebar from "../components/MenuSidebar";
import NotiSidebar from "../components/NotiSidebar";
import useNotiSidebar from "../hooks/useNotiSidebar";
import { regionMap } from "../constants/regionData";
import { styleOptions } from "../constants/styleOptions";
import useWeather from "../hooks/useWeather";
import { getWeatherEmoji } from "../utils/weatherUtils";
import { useFeedConfig } from "../hooks/useFeedConfig";
import { useFeedData } from "../hooks/useFeedData";
import { useSortedFeed } from "../hooks/useSortedFeed";
import { useDateSelectors } from "../hooks/useDateSelectors";

function Feed() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { region, setRegion, dateState, setDateState } = useFeedConfig(user);

  // 기존 상태 유지 (필터 및 UI 관련)
  const [order, setOrder] = useState("popular"); // 인기순 or 최신순
  const [style, setStyle] = useState(""); // 스타일 필터
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // useNotiSidebar 훅 사용 (개별 함수로 비구조화 할당)
  const {
    alarmOpen, setAlarmOpen,
    notifications, unreadCount,
    markAllRead, handleDeleteSelected, 
    markOneRead, handleAlarmItemClick,
  } = useNotiSidebar();

  // 날씨 정보 가져오기 (유지)
  const { weather, loading: weatherLoading } = useWeather(region);

  // 1. useFeedData 훅 적용
  const { 
    outfits, 
    selectedDate, 
    isLoading: isFeedLoading, 
    handleToggleLike 
  } = useFeedData(region, order, style, dateState);

  // 2. useSortedFeed 훅 적용
  const isPopular = order === "popular";
  const { 
    top3, 
    rest, 
    isLoadingReactions 
  } = useSortedFeed(outfits, isPopular);

  // 3. useDateSelectors 훅 적용
  const { 
    years, 
    months, 
    days, 
    handleDateChange 
  } = useDateSelectors(dateState, setDateState);
  
  // 최종 로딩 상태
  const isLoading = isFeedLoading || (isPopular && isLoadingReactions);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col relative">
      {/* 사이드바 */}
      <MenuSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <NotiSidebar
        isOpen={alarmOpen}
        onClose={() => setAlarmOpen(false)}
        notifications={notifications}
        // ✅ 오류 수정: notiHandlers 대신 개별 함수를 직접 전달
        onMarkAllRead={markAllRead} 
        onDeleteSelected={handleDeleteSelected}
        onMarkOneRead={markOneRead}
        onItemClick={handleAlarmItemClick}
      />

      {/* 상단 네비게이션 (유지) */}
      <div className="flex justify-between items-center px-4 py-3 bg-blue-100 shadow">
        <button
          className="bg-blue-200 px-3 py-1 rounded-md hover:bg-blue-300"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Bars3Icon className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-lg">우리 동네</h2>
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

      {/* 콘텐츠 */}
      <div className="flex-1 px-4 mt-10 flex md:flex-row gap-6 h-[700px]">
        {/* 왼쪽: 지역/정렬/날씨 카드 영역 (유지) */}
        <div className="w-full md:w-1/4 bg-gray-200 px-6 py-6 text-center overflow-hidden rounded-lg h-[700px]">
          <h3 className="text-lg font-semibold mb-3">{regionMap[region] || region}</h3>

          {/* 날씨 표시 (유지) */}
          <div className="flex justify-center items-center mb-6" style={{ minHeight: 120 }}>
            {weather ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-60 h-60 bg-gray-200 rounded flex items-center justify-center text-6xl relative overflow-hidden">
                  <div className="absolute text-8xl animate-bounce">
                    {getWeatherEmoji(weather.icon)}
                  </div>
                </div>
              </div>
            ) : weatherLoading ? (
              <p className="text-sm text-gray-500">날씨 정보를 불러오는 중...</p>
            ) : (
              <p className="text-sm text-gray-500">날씨 정보를 가져올 수 없습니다.</p>
            )}
          </div>

          <div className="flex flex-col items-center gap-8 mt-6">
            {/* 지역 선택 (유지) */}
            <div className="flex items-center justify-between gap-4 w-60">
              <label htmlFor="region" className="font-semibold">지역</label>
              <select
                id="region"
                value={region}
                onChange={e => {
                  const newRegion = e.target.value;
                  setRegion(newRegion);
                }}
                className="w-32 px-3 py-2 rounded text-sm text-center"
              >
                {Object.entries(regionMap).map(([eng, kor]) => (
                  <option key={eng} value={eng}>{kor}</option>
                ))}
              </select>
            </div>

            {/* 정렬 선택 (유지) */}
            <div className="flex items-center justify-between gap-4 w-60">
              <label htmlFor="sort" className="font-semibold">정렬</label>
              <select
                id="sort"
                value={order}
                onChange={e => setOrder(e.target.value)}
                className="w-32 px-3 py-2 rounded text-sm text-center"
              >
                <option value="" className="text-gray-500">선택</option>
                <option value="popular">인기순</option>
                <option value="latest">최신순</option>
              </select>
            </div>

            {/* 스타일 선택 (유지) */}
            <div className="flex items-center justify-between gap-4 w-60">
              <label htmlFor="style" className="font-semibold">스타일</label>
              <select
                id="style"
                value={style}
                onChange={e => setStyle(e.target.value)}
                className="w-32 px-3 py-2 rounded  text-sm text-center"
              >
                <option value="" className="text-gray-500">전체</option>
                {styleOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 로고 (유지) */}
          <div className="flex justify-center items-center pt-32">
            <h1 className="text-5xl font-lilita text-indigo-500">Fitweather</h1>
          </div>
        </div>

        {/* 오른쪽: 피드 카드 영역 */}
        <div className="w-full md:w-3/4 bg-white rounded-lg flex flex-col h-[700px]">
          {/* 선택된 날짜 드롭다운 - 훅의 값 사용 */}
          <div className="px-6 py-4 bg-gray-50 border-b rounded-t-lg">
            <div className="flex justify-center items-center gap-3 mb-2">
              {/* 연도 드롭다운 - years와 handleDateChange 사용 */}
              <div className="flex items-center gap-1">
                <select
                  value={dateState.year}
                  onChange={(e) => handleDateChange('year', parseInt(e.target.value))}
                  className="px-2 py-1 rounded bg-white text-sm text-center w-[80px]"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <span className="text-sm font-medium">년</span>
              </div>

              {/* 월 드롭다운 - months와 handleDateChange 사용 */}
              <div className="flex items-center gap-1">
                <select
                  value={dateState.month}
                  onChange={(e) => handleDateChange('month', parseInt(e.target.value))}
                  className="px-2 py-1 rounded bg-white text-sm text-center w-[60px]"
                >
                  {months.map((month) => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
                <span className="text-sm font-medium">월</span>
              </div>

              {/* 일 드롭다운 - days와 handleDateChange 사용 */}
              <div className="flex items-center gap-1">
                <select
                  value={dateState.day}
                  onChange={(e) => handleDateChange('day', parseInt(e.target.value))}
                  className="px-2 py-1 rounded bg-white text-sm text-center w-[60px]"
                >
                  {days.map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
                <span className="text-sm font-medium">일</span>
              </div>
            </div>

            <p className="text-sm text-gray-500 text-center">
              총 {outfits.length}개의 기록이 있습니다.
            </p>
          </div>

          {/* TOP3 강조 - top3 사용 */}
          {isPopular && top3.length > 0 && (
            <div className="w-full bg-gray-200 px-6 pb-4 pt-4 overflow-x-auto">
              <div className="flex justify-center gap-20 min-w-max">
                {top3.map((outfit, idx) => (
                  <FeedCard
                    key={outfit.id}
                    record={outfit}
                    currentUserUid={user?.uid}
                    onToggleLike={handleToggleLike}
                    rank={idx + 1}
                    selectedDate={selectedDate}
                    selectedYear={dateState.year}
                    selectedMonth={dateState.month}
                    selectedDay={dateState.day}
                  />
                ))}
              </div>
            </div>
          )}
          {/* 나머지 피드 카드 목록 */}
          <div className="mt-4 flex-1 overflow-y-auto px-6 pb-6">
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">데이터를 불러오는 중입니다...</p>
              </div>
            ) : outfits.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">해당 날짜에 기록이 없습니다.</p>
              </div>
            ) : (
              // isPopular일 경우 rest 사용, 아닐 경우 outfits(최신순) 사용
              <div className="grid grid-cols-5 gap-4">
                {(isPopular ? rest : outfits).map(outfit => (
                  <FeedCard
                    key={outfit.id}
                    record={outfit}
                    currentUserUid={user?.uid}
                    onToggleLike={handleToggleLike}
                    selectedDate={selectedDate}
                    selectedYear={dateState.year}
                    selectedMonth={dateState.month}
                    selectedDay={dateState.day}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div >
  );
}

export default Feed;
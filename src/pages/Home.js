import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Bars3Icon, ArrowPathIcon } from "@heroicons/react/24/solid";
import { BellIcon } from "@heroicons/react/24/outline";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, logout } from "../firebase";
import useUserProfile from "../hooks/useUserProfile";
import useWeather from "../hooks/useWeather";
import { useAuth } from "../contexts/AuthContext";
import MenuSidebar from "../components/MenuSidebar";
import NotiSidebar from "../components/NotiSidebar";
import useNotiSidebar from "../hooks/useNotiSidebar";
import { getHomeRecommendations, getRandomHomeRecommendations } from "../utils/homeRecommendationUtils";
import { regionMap } from "../constants/regionData";
import { styleOptions } from "../constants/styleOptions";
import { getWeatherEmoji } from "../utils/weatherUtils";

// 지역 드롭다운 옵션 목록 생성
const regionOptions = Object.entries(regionMap).map(([key, label]) => ({ value: key, label }));

/**
 * Home 컴포넌트 - 메인 화면을 렌더링하며, 날씨 정보 기반의 착장 추천 기능을 제공
 */
function Home() {
  const { profile, loading: profileLoading } = useUserProfile(); // 사용자 프로필 훅
  const { user } = useAuth(); // 인증 정보 훅
  const nickname = profile?.nickname || "회원";
  const navigate = useNavigate();

  // 지역, 사이드바 상태 관리
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 알림 사이드바 훅
  const {
    alarmOpen, setAlarmOpen,
    notifications, unreadCount,
    markAllRead, handleDeleteSelected, markOneRead, handleAlarmItemClick,
    reportNotificationPopup
  } = useNotiSidebar();

  // 추천 관련 상태
  const [recommendations, setRecommendations] = useState([]);
  const [currentRecommendationIndex, setCurrentRecommendationIndex] = useState(0);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState("");

  // 날씨 정보 가져오기 훅
  const { weather, loading: weatherLoading } = useWeather(selectedRegion);

  // 사용자 프로필 지역이 로드되면 선택 지역으로 설정
  useEffect(() => {
    if (profile?.region) {
      setSelectedRegion(profile.region);
    }
  }, [profile?.region]);

  // 추천 데이터 가져오기(지역, 스타일, 계절 변경 시 재실행)
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!selectedRegion) return;
      setRecommendationLoading(true);
      try {
        // 홈화면 추천 로직(계절 및 스타일 기반)
        const data = await getHomeRecommendations(selectedStyle, weather?.season);
        setRecommendations(data);
        // 다음 추천으로 인덱스 업데이트
        setCurrentRecommendationIndex(prev => (prev + 1) % Math.max(data.length, 1));
      } catch (error) {
        console.error("추천 데이터 가져오기 실패:", error);
        setRecommendations([]);
      } finally {
        setRecommendationLoading(false);
      }
    };
    fetchRecommendations();
  }, [selectedRegion, selectedStyle, weather?.season]);

  // 새로고침 버튼 클릭 핸들러(랜덤 추천으로 업데이트)
  const handleRefreshRecommendation = async () => {
    if (!selectedRegion) return;

    setIsRefreshing(true);
    try {
      // 랜덤 추천 로직 실행
      const newData = await getRandomHomeRecommendations(selectedStyle, weather?.season);

      if (newData.length > 0) {
        setRecommendations(newData);
        setCurrentRecommendationIndex(0); // 첫 번째 추천으로 설정
      }
    } catch (error) {
      console.error("새로고침 추천 실패:", error);
    } finally {
      // 1초 후 새로고침 애니메이션 종료
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  const loading = profileLoading || weatherLoading; // 통합 로딩 상태

  // 현재 표시할 추천 데이터 계산 (useMemo로 성능 최적화)
  const currentRecommendation = useMemo(() => {
    if (recommendations.length === 0) return null;
    return recommendations[currentRecommendationIndex];
  }, [recommendations, currentRecommendationIndex]);

  // 지역 선택 드롭다운 렌더링 함수
  const renderRegionSelect = () => (
    <select
      value={selectedRegion || profile?.region || "Seoul"}
      onChange={(e) => setSelectedRegion(e.target.value)}
      className="w-32 bg-white px-4 py-2 rounded mb-4 text-center"
    >
      {regionOptions.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );

  // 스타일 선택 드롭다운 렌더링 함수
  const renderStyleSelect = () => (
    <select
      value={selectedStyle}
      onChange={(e) => setSelectedStyle(e.target.value)}
      className="w-32 text-sm font-medium text-gray-700 text-center focus:outline-none border border-gray-300 rounded px-2 py-1"
    >
      <option value="">전체</option>
      {styleOptions.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      {profile ? (
        // 로그인 상태
        <div className="w-full min-h-screen bg-gray-100 flex flex-col relative">
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
            {/* 메뉴 버튼 */}
            <button
              className="bg-blue-200 px-3 py-1 rounded-md hover:bg-blue-300"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Bars3Icon className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-4">
              {/* 로그아웃 버튼 */}
              <button onClick={logout} className="text-sm font-medium hover:underline">
                logout
              </button>
              {/* 회원정보 버튼 */}
              <button
                onClick={() => navigate("/mypage_userinfo")}
                className="text-sm font-medium hover:underline"
              >
                회원정보
              </button>
              {/* 사용자 닉네임 표시 */}
              <div className="bg-blue-200 px-3 py-1 rounded text-sm font-semibold">
                {nickname}님
              </div>
              {/* 알림 버튼 */}
              <button
                className="relative flex items-center justify-center 
                  bg-white w-7 h-7 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
                onClick={() => setAlarmOpen(true)}
                aria-label="알림 열기"
              >
                <BellIcon className="w-5 h-5" />
                {/* 읽지 않은 알림 개수 인디케이터 */}
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-2 w-1.5 h-1.5 bg-red-500 rounded-full" />
                )}
              </button>
            </div>
          </div>

          {/* 앱 타이틀 */}
          <div className="mt-8 flex justify-center">
            <h1 className="text-5xl font-lilita text-indigo-500">Fitweather</h1>
          </div>

          {/* 메인 콘텐츠 */}
          <div className="flex flex-col items-center mt-8 px-4 flex-1">
            {/* 지역 선택 드롭다운 */}
            {renderRegionSelect()}

            {/* 오늘의 날씨 섹션 */}
            {weather && (
              <div className="w-full max-w-md flex flex-col items-center">
                <div className="flex items-center gap-4 mb-2">
                  {/* 1. 날씨 이모지 */}
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-4xl animate-bounce">
                      {getWeatherEmoji(weather.icon)}
                    </span>
                  </div>

                  {/* 2. 현재 온도 */}
                  <div className="text-4xl font-bold text-gray-800">
                    {weather.temp}°C
                  </div>

                  {/* 3. 체감온도 + 풍속 */}
                  <div className="flex flex-col justify-center text-sm font-medium text-gray-600 space-y-1 ml-4">

                    {/* 1단: 체감 온도 */}
                    <div className="flex items-center">
                      <span className="mr-1">체감</span>
                      {/* 체감 온도 데이터 (예시: weather.feelsLike) */}
                      <span className="font-bold text-gray-800">
                        {weather.feelsLike}°C
                      </span>
                    </div>

                    {/* 2단: 풍속 */}
                    <div className="flex items-center">
                      <span className="mr-1">바람</span>
                      {/* 풍속 데이터 (예시: weather.windSpeed) */}
                      <span className="font-bold text-gray-800">
                        {weather.windSpeed}m/s
                      </span>
                    </div>
                  </div>
                </div>
                {/* 날씨에 따른 추천 메시지 */}
                <div className="text-center text-gray-600">
                  <p className="text-lg">
                    오늘의 날씨는{" "}
                    <span
                      className="font-semibold"
                      style={{ color: weather.seasonColor || "#795548" }}
                    >
                      {weather.season || "초가을"}
                    </span>{" "}
                    <span
                      className="font-semibold"
                      style={{ color: weather.expressionColor || "#03A9F4" }}
                    >
                      {weather.weatherExpression || (weather.temp < 10 ? "추워요" : "시원해요")}
                    </span>
                    ! 이런 아이템 어때요?
                  </p>
                </div>
              </div>
            )}

            {/* 추천 섹션 */}
            {recommendationLoading ? (
              // 로딩 중 표시
              <div className="w-full max-w-md mt-6">
                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
                  <div className="text-center text-gray-500">
                    <p>추천 데이터를 불러오는 중...</p>
                  </div>
                </div>
              </div>
            ) : currentRecommendation ? (
              // 추천 데이터 표시
              <div className="w-full max-w-md mt-6">
                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
                  {/* 카드 헤더(스타일 선택 및 새로고침 버튼) */}
                  <div className="flex items-center justify-between mb-4">
                    {renderStyleSelect()}
                    <button
                      onClick={handleRefreshRecommendation}
                      className={`p-1 text-gray-400 hover:text-gray-600 transition-colors ${isRefreshing ? "animate-spin" : ""}`}
                    >
                      <ArrowPathIcon className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 추천 아이템 그리드 */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "16px",
                    }}
                  >
                    {/* 아우터 */}
                    <div style={{ backgroundColor: "#f3f4f6", borderRadius: "8px", padding: "12px" }}>
                      <div className="text-sm font-medium text-gray-800 mb-1">아우터</div>
                      <div className="flex flex-wrap gap-1">
                        {/* 아우터 아이템 목록 렌더링 */}
                        {currentRecommendation.outfit?.outer?.length > 0 && (
                          currentRecommendation.outfit.outer.map((item, index) => (
                            <div key={index} className="inline-block text-xs text-gray-600 bg-blue-100 px-2 py-1 rounded">
                              {item}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* 하의 */}
                    <div style={{ backgroundColor: "#f3f4f6", borderRadius: "8px", padding: "12px" }}>
                      <div className="text-sm font-medium text-gray-800 mb-1">하의</div>
                      <div className="flex flex-wrap gap-1">
                        {/* 하의 아이템 목록 렌더링 */}
                        {currentRecommendation.outfit?.bottom?.length > 0 && (
                          currentRecommendation.outfit.bottom.map((item, index) => (
                            <div key={index} className="inline-block text-xs text-gray-600 bg-blue-100 px-2 py-1 rounded">
                              {item}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* 상의 */}
                    <div style={{ backgroundColor: "#f3f4f6", borderRadius: "8px", padding: "12px" }}>
                      <div className="text-sm font-medium text-gray-800 mb-1">상의</div>
                      <div className="flex flex-wrap gap-1">
                        {/* 상의 아이템 목록 렌더링 */}
                        {currentRecommendation.outfit?.top?.length > 0 && (
                          currentRecommendation.outfit.top.map((item, index) => (
                            <div key={index} className="inline-block text-xs text-gray-600 bg-blue-100 px-2 py-1 rounded">
                              {item}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* 신발 */}
                    <div style={{ backgroundColor: "#f3f4f6", borderRadius: "8px", padding: "12px" }}>
                      <div className="text-sm font-medium text-gray-800 mb-1">신발</div>
                      <div className="flex flex-wrap gap-1">
                        {/* 신발 아이템 목록 렌더링 */}
                        {currentRecommendation.outfit?.shoes?.length > 0 && (
                          currentRecommendation.outfit.shoes.map((item, index) => (
                            <div key={index} className="inline-block text-xs text-gray-600 bg-blue-100 px-2 py-1 rounded">
                              {item}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* 악세서리 */}
                    <div style={{ backgroundColor: "#f3f4f6", borderRadius: "8px", padding: "12px", gridColumn: "1 / -1" }}>
                      <div className="text-sm font-medium text-gray-800 mb-1">악세서리</div>
                      <div className="flex flex-wrap gap-1">
                        {/* 악세서리 아이템 목록 렌더링 */}
                        {currentRecommendation.outfit?.acc?.length > 0 && (
                          currentRecommendation.outfit.acc.map((item, index) => (
                            <div key={index} className="inline-block text-xs text-gray-600 bg-blue-100 px-2 py-1 rounded">
                              {item}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 착장 상세 보기 링크 및 체감 이모지 */}
                  <div className="flex justify-between items-center mt-4">
                    {/* 체감 이모지 (왼쪽) */}
                    {currentRecommendation.feeling && (
                      <div className="text-2xl">
                        {(() => {
                          const feelingEmojiMap = {
                            steam: "🥟",
                            hot: "🥵",
                            nice: "👍🏻",
                            cold: "💨",
                            ice: "🥶",
                          };
                          return feelingEmojiMap[currentRecommendation.feeling] || currentRecommendation.feeling;
                        })()}
                      </div>
                    )}
                    {/* 착장 보기 버튼 (오른쪽) */}
                    <button
                      onClick={() => navigate(`/feed-detail/${currentRecommendation.id}`)}
                      className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      착장 보기
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // 추천 데이터가 없을 때 표시
              <div className="w-full max-w-md mt-6">
                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
                  {/* 스타일 선택 드롭다운 */}
                  <div className="flex items-center justify-center mb-4">
                    {renderStyleSelect()}
                  </div>
                  <div className="text-center text-gray-500">
                    <p>오늘의 추천 착장이 없습니다.</p>
                    <p className="text-sm mt-2">스타일을 선택하여 다른 추천을 찾아보세요.</p>
                  </div>
                </div>
              </div>
            )}

            {/* 메인 버튼들 */}
            <div className="flex gap-4 mt-6">
              {/* 기록하기 버튼 */}
              <button
                className="bg-blue-400 hover:bg-blue-500 px-6 py-2 rounded text-white font-semibold"
                // 오늘 날짜의 기록이 있는지 확인하고 있으면 수정, 없으면 새로 기록 페이지로 이동
                onClick={async () => {
                  const today = new Date();
                  const todayStr = today.toLocaleDateString("sv-SE");

                  if (user?.uid) {
                    try {
                      const q = query(
                        collection(db, "records"),
                        where("uid", "==", user.uid),
                        where("date", "==", todayStr)
                      );
                      const querySnapshot = await getDocs(q);

                      if (!querySnapshot.empty) {
                        const existingRecord = { ...querySnapshot.docs[0].data(), id: querySnapshot.docs[0].id };
                        navigate("/record", { state: { existingRecord } });
                      } else {
                        navigate("/record", { state: { date: todayStr, selectedRegion } });
                      }
                    } catch (error) {
                      console.error("기록 확인 중 오류:", error);
                      navigate("/record", { state: { date: todayStr, selectedRegion } });
                    }
                  } else {
                    navigate("/record", { state: { date: todayStr, selectedRegion } });
                  }
                }}
              >
                기록하기
              </button>

              {/* 추천보기 버튼(추천 목록 페이지로 이동) */}
              <button
                className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded font-semibold"
                onClick={() => navigate("/recommend")}
              >
                추천보기
              </button>
            </div>
          </div>
        </div>
      ) : (
        // 로그아웃 상태(로그인 유도 화면)
        <div className="w-full h-screen bg-gray-100 flex flex-col">
          <div className="flex justify-end items-center px-4 py-3 bg-blue-100 shadow">
            <button
              onClick={() => navigate("/login")}
              className="bg-blue-200 px-3 py-1 rounded-md text-sm font-medium hover:bg-blue-300"
            >
              login
            </button>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <h1 className="text-6xl font-lilita text-indigo-500">Fitweather</h1>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
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

function Home() {
  const { profile, loading: profileLoading } = useUserProfile();
  const { user } = useAuth();
  const nickname = profile?.nickname || "회원";
  const navigate = useNavigate();

  const [selectedRegion, setSelectedRegion] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 🔔 알림 사이드바 훅 (상태/로직 모두 훅에서 관리)
  const {
    alarmOpen, setAlarmOpen,
    notifications, unreadCount,
    markAllRead, handleDeleteSelected, markOneRead, handleAlarmItemClick
  } = useNotiSidebar();

  // 추천 관련 상태
  const [recommendations, setRecommendations] = useState([]);
  const [currentRecommendationIndex, setCurrentRecommendationIndex] = useState(0);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState(""); // 기본값: 전체

  // 날씨 정보 가져오기
  const { weather, loading: weatherLoading } = useWeather(selectedRegion);

  useEffect(() => {
    if (profile?.region) {
      setSelectedRegion(profile.region);
    }
  }, [profile?.region]);

  // 추천 데이터 가져오기
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!selectedRegion) return;
      setRecommendationLoading(true);
      try {
        console.log("🔍 추천 데이터 가져오기 시작:", { selectedRegion, selectedStyle });

        // 홈화면 추천 로직 사용 (계절별 + 스타일 필터링, 지역 무관)
        const data = await getHomeRecommendations(selectedStyle, weather?.season);
        console.log("추천 결과:", data.length, "개");

        console.log("최종 추천 데이터:", data);
        setRecommendations(data);
        setCurrentRecommendationIndex(prev => {
          const newIndex = (prev + 1) % Math.max(data.length, 1);
          return newIndex;
        });
      } catch (error) {
        console.error("추천 데이터 가져오기 실패:", error);
        setRecommendations([]);
      } finally {
        setRecommendationLoading(false);
      }
    };
    fetchRecommendations();
  }, [selectedRegion, selectedStyle, weather?.season]);

  // 새로고침 버튼 클릭 핸들러
  const handleRefreshRecommendation = async () => {
    if (!selectedRegion) return;

    setIsRefreshing(true);
    try {
      console.log("🔄 새로고침 추천 요청:", { selectedRegion, selectedStyle });

      // 랜덤 추천 로직 사용 (지역 무관)
      const newData = await getRandomHomeRecommendations(selectedStyle, weather?.season);
      console.log("새로고침 추천 결과:", newData.length, "개");

      if (newData.length > 0) {
        setRecommendations(newData);
        setCurrentRecommendationIndex(0); // 첫 번째 추천으로 설정
      }
    } catch (error) {
      console.error("새로고침 추천 실패:", error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  const loading = profileLoading || weatherLoading;

  // 현재 표시할 추천 데이터 계산
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

  // 스타일 선택 드롭다운 렌더링 함수 (재사용)
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
        <div className="w-full min-h-screen bg-gray-100 flex flex-col relative">
          {/* 사이드바들 */}
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
            <div className="flex items-center space-x-4">
              <button onClick={logout} className="text-sm font-medium hover:underline">
                logout
              </button>
              <button
                onClick={() => navigate("/mypage_userinfo")}
                className="text-sm font-medium hover:underline"
              >
                회원정보
              </button>
              <div className="bg-blue-200 px-3 py-1 rounded text-sm font-semibold">
                {nickname}님
              </div>
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

          {/* 타이틀 */}
          <div className="mt-8 flex justify-center">
            <h1 className="text-5xl font-lilita text-indigo-500">Fitweather</h1>
          </div>

          {/* 콘텐츠 */}
          <div className="flex flex-col items-center mt-8 px-4 flex-1">
            {/* 지역 선택 드롭다운 (분리된 함수 사용) */}
            {renderRegionSelect()}

            {/* 오늘의 날씨 섹션 */}
            {weather && (
              <div className="w-full max-w-md flex flex-col items-center">
                {/* 날씨 요약 */}
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-3xl animate-bounce">
                      {getWeatherEmoji(weather.icon)}
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-gray-800">
                    {weather.temp}°C
                  </div>
                </div>
                {/* 날씨 메시지 */}
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
              <div className="w-full max-w-md mt-6">
                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
                  <div className="text-center text-gray-500">
                    <p>추천 데이터를 불러오는 중...</p>
                  </div>
                </div>
              </div>
            ) : currentRecommendation ? (
              <div className="w-full max-w-md mt-6">
                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
                  {/* 카드 헤더 */}
                  <div className="flex items-center justify-between mb-4">
                    {/* 스타일 선택 드롭다운 (분리된 함수 사용) */}
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
                        {currentRecommendation.outfit?.outer?.length > 0 ? (
                          currentRecommendation.outfit.outer.map((item, index) => (
                            <div key={index} className="inline-block text-xs text-gray-600 bg-blue-100 px-2 py-1 rounded">
                              {item}
                            </div>
                          ))
                        ) : (
                          <div className="inline-block text-xs text-xs text-gray-600 bg-blue-100 px-2 py-1 rounded">
                            가디건
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 하의 */}
                    <div style={{ backgroundColor: "#f3f4f6", borderRadius: "8px", padding: "12px" }}>
                      <div className="text-sm font-medium text-gray-800 mb-1">하의</div>
                      <div className="flex flex-wrap gap-1">
                        {currentRecommendation.outfit?.bottom?.length > 0 ? (
                          currentRecommendation.outfit.bottom.map((item, index) => (
                            <div key={index} className="inline-block text-xs text-gray-600 bg-blue-100 px-2 py-1 rounded">
                              {item}
                            </div>
                          ))
                        ) : (
                          <div className="inline-block text-xs text-gray-600 bg-blue-100 px-2 py-1 rounded">
                            바지
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 상의 */}
                    <div style={{ backgroundColor: "#f3f4f6", borderRadius: "8px", padding: "12px" }}>
                      <div className="text-sm font-medium text-gray-800 mb-1">상의</div>
                      <div className="flex flex-wrap gap-1">
                        {currentRecommendation.outfit?.top?.length > 0 ? (
                          currentRecommendation.outfit.top.map((item, index) => (
                            <div key={index} className="inline-block text-xs text-gray-600 bg-blue-100 px-2 py-1 rounded">
                              {item}
                            </div>
                          ))
                        ) : (
                          <div className="inline-block text-xs text-gray-600 bg-blue-100 px-2 py-1 rounded">
                            긴팔티
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 신발 */}
                    <div style={{ backgroundColor: "#f3f4f6", borderRadius: "8px", padding: "12px" }}>
                      <div className="text-sm font-medium text-gray-800 mb-1">신발</div>
                      <div className="flex flex-wrap gap-1">
                        {currentRecommendation.outfit?.shoes?.length > 0 ? (
                          currentRecommendation.outfit.shoes.map((item, index) => (
                            <div key={index} className="inline-block text-xs text-gray-600 bg-blue-100 px-2 py-1 rounded">
                              {item}
                            </div>
                          ))
                        ) : (
                          <div className="inline-block text-xs text-gray-600 bg-blue-100 px-2 py-1 rounded">
                            스니커즈
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 악세서리 - 두 열을 모두 차지 */}
                    <div style={{ backgroundColor: "#f3f4f6", borderRadius: "8px", padding: "12px", gridColumn: "1 / -1" }}>
                      <div className="text-sm font-medium text-gray-800 mb-1">악세서리</div>
                      <div className="flex flex-wrap gap-1">
                        {currentRecommendation.outfit?.acc?.length > 0 ? (
                          currentRecommendation.outfit.acc.map((item, index) => (
                            <div key={index} className="inline-block text-xs text-gray-600 bg-blue-100 px-2 py-1 rounded">
                              {item}
                            </div>
                          ))
                        ) : (
                          <div className="inline-block text-xs text-gray-600 bg-blue-100 px-2 py-1 rounded">
                            우산
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 착장 보기 링크 */}
                  <div className="flex justify-end mt-4">
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
              <div className="w-full max-w-md mt-6">
                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
                  {/* 스타일 선택 드롭다운 (분리된 함수 사용) */}
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

            {/* 버튼들 */}
            <div className="flex gap-4 mt-6">
              <button
                className="bg-blue-400 hover:bg-blue-500 px-6 py-2 rounded text-white font-semibold"
                onClick={async () => {
                  const today = new Date();
                  const todayStr = today.toLocaleDateString("sv-SE"); // YYYY-MM-DD

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

              <button
                className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded font-semibold"
                onClick={() => navigate("/recommend-view")}
              >
                추천보기
              </button>
            </div>
          </div>
        </div>
      ) : (
        // 로그인 안 된 경우
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
      {/* 좌측 하단 임시 피드 버튼 */}
      <button
        style={{
          position: "fixed",
          left: "24px",
          bottom: "24px",
          padding: "10px 18px",
          borderRadius: "24px",
          background: "#eee",
          color: "#333",
          border: "1px solid #ccc",
          fontSize: "16px",
          zIndex: 100,
          boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
        }}
        onClick={() => navigate("/feed")}
      >
        피드로
      </button>

      {/* 우측 하단 임시 달력 버튼 */}
      <button
        style={{
          position: "fixed",
          right: "24px",
          bottom: "24px",
          padding: "10px 18px",
          borderRadius: "24px",
          background: "#4f46e5",
          color: "white",
          border: "none",
          fontSize: "16px",
          zIndex: 100,
          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
        }}
        onClick={() => navigate("/calendar")}
      >
        📅 달력
      </button>

    </div>
  );
}

export default Home;
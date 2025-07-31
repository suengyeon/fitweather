import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bars3Icon } from "@heroicons/react/24/solid";

import useUserProfile from "../hooks/useUserProfile";
import useWeather from "../hooks/useWeather";
import { logout } from "../firebase";

import Skeleton from "../components/Skeleton";
import WeatherCard from "../components/WeatherCard";
import Sidebar from "../components/Sidebar";

function Home() {
  const { profile, loading: profileLoading } = useUserProfile();
  const nickname = profile?.nickname || "회원";
  const navigate = useNavigate();

  const [selectedRegion, setSelectedRegion] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (profile?.region) {
      setSelectedRegion(profile.region);
    }
  }, [profile?.region]);

  const { weather, loading: weatherLoading } = useWeather(selectedRegion);
  const loading = profileLoading || weatherLoading;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      {profile ? (
        <div className="w-full min-h-screen bg-gray-100 flex flex-col relative">
          {/* 사이드바 */}
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          {/* 상단 네비게이션 */}
          <div className="flex justify-between items-center px-4 py-3 bg-blue-100 shadow">
            <button 
              className="bg-blue-300 px-3 py-1 rounded-md hover:bg-blue-400"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Bars3Icon className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-4">
              <button onClick={logout} className="text-sm font-bold hover:underline">
                logout
              </button>
              <button
                onClick={() => navigate("/mypage_userinfo")}
                className="text-sm font-semibold hover:underline"
              >
                회원정보
              </button>
              <div className="bg-blue-200 px-2 py-1 rounded text-sm font-medium">
                {nickname}님
              </div>
            </div>
          </div>

          {/* 타이틀 */}
          <div className="mt-10 flex justify-center">
            <h1 className="text-5xl font-lilita text-indigo-500">Fitweather</h1>
          </div>

          {/* 콘텐츠 */}
          <div className="flex flex-col items-center mt-12 px-4 flex-1">
            {/* 지역 선택 드롭다운 */}
            <select
              value={selectedRegion || profile?.region || "Seoul"}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-30bg-white px-4 py-2 rounded mb-6 text-center"
            >
              <option value="Baengnyeongdo">백령도</option>
              <option value="Incheon">인천</option>
              <option value="Seoul">서울</option>
              <option value="Chuncheon">춘천</option>
              <option value="Gangneung">강릉</option>
              <option value="Ulleungdo">울릉도/독도</option>
              <option value="Hongseong">홍성</option>
              <option value="Suwon">수원</option>
              <option value="Cheongju">청주</option>
              <option value="Andong">안동</option>
              <option value="Jeonju">전주</option>
              <option value="Daejeon">대전</option>
              <option value="Daegu">대구</option>
              <option value="Pohang">포항</option>
              <option value="Heuksando">흑산도</option>
              <option value="Mokpo">목포</option>
              <option value="Jeju">제주</option>
              <option value="Ulsan">울산</option>
              <option value="Yeosu">여수</option>
              <option value="Changwon">창원</option>
              <option value="Busan">부산</option>
            </select>

            {/* 날씨 카드 */}
            {loading ? (
              <Skeleton />
            ) : weather ? (
              <>
                <WeatherCard
                  region={selectedRegion}
                  temp={weather.temp}
                  rain={weather.rain}
                  humidity={weather.humidity}
                  icon={weather.icon}
                  isHome={true}
                />


              </>
            ) : (
              <p>날씨 정보를 불러올 수 없습니다.</p>
            )}

            {/* 기록하기 버튼 */}
            <button
              className="bg-blue-300 hover:bg-blue-400 px-6 py-2 rounded font-semibold"
              onClick={() => {
                const today = new Date();
                const todayStr = today.toLocaleDateString("sv-SE"); // YYYY-MM-DD 형식
                navigate("/record", { state: { date: todayStr } });
              }}
            >
              기록하기
            </button>
          </div>
        </div>
      ) : (
        // 로그인 안 된 경우
        <div className="w-full h-screen bg-gray-100 flex flex-col">
          <div className="flex justify-end items-center px-4 py-3 bg-blue-100 shadow">
            <button
              onClick={() => navigate("/login")}
              className="bg-blue-300 px-3 py-1 rounded-md text-sm font-medium hover:bg-blue-400"
            >
              login
            </button>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <h1 className="text-6xl font-lilita text-indigo-500">Fitweather</h1>
          </div>
        </div>
      )}
      {/* 좌측 하단에 임시 피드 버튼 */}
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
      
      {/* 우측 하단에 임시 달력 버튼 */}
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

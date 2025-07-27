import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bars3Icon } from "@heroicons/react/24/solid";

import useUserProfile from "../hooks/useUserProfile";
import useWeather from "../hooks/useWeather";
import { logout } from "../firebase";

import Skeleton from "../components/Skeleton";
import WeatherCard from "../components/WeatherCard";

function Home() {
  const { profile, loading: profileLoading } = useUserProfile();
  const nickname = profile?.nickname || "회원";

  const [selectedRegion, setSelectedRegion] = useState(null);

  useEffect(() => {
    if (profile?.region) {
      setSelectedRegion(profile.region);
    }
  }, [profile?.region]);

  const { weather, loading: weatherLoading } = useWeather(selectedRegion);
  const navigate = useNavigate();
  const loading = profileLoading || weatherLoading;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      {profile ? (
        <div className="w-full min-h-screen bg-gray-100 flex flex-col">
          {/* 상단 네비게이션 */}
          <div className="flex justify-between items-center px-4 py-3 bg-blue-100 shadow">
            <button className="bg-blue-300 px-3 py-1 rounded-md hover:bg-blue-400">
              <Bars3Icon className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-4">
              <button onClick={logout} className="text-sm hover:underline">
                logout
              </button>
              <button
                onClick={() => navigate("/mypage_userinfo")}
                className="text-sm hover:underline"
              >
                Mypage
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
              value={selectedRegion || "Seoul"}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="border border-gray-300 bg-white px-4 py-2 rounded mb-6"
            >
              <option value="Seoul">서울</option>
              <option value="Busan">부산</option>
              <option value="Gwangju">광주</option>
              <option value="Daegu">대구</option>
              <option value="Daejeon">대전</option>
              <option value="Ulsan">울산</option>
              <option value="Incheon">인천</option>
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
                  icon={weather.icon}
                />

                {/* ✅ 온도/강수량 박스 */}
                <div className="flex space-x-12 mb-12">
                  <div className="bg-blue-100 px-4 py-2 rounded text-center">
                    <span className="text-lg font-semibold">{weather.temp}°C</span>
                  </div>
                  <div className="bg-blue-100 px-4 py-2 rounded text-center">
                    <span className="text-lg font-semibold">{weather.rain}mm</span>
                  </div>
                </div>
              </>
            ) : (
              <p>날씨 정보를 불러올 수 없습니다.</p>
            )}

            {/* 기록하기 버튼 */}
            <button
              className="bg-blue-300 hover:bg-blue-400 px-6 py-2 rounded mt-8"
              onClick={() => navigate("/record")}
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
    </div>
  );
}

export default Home;

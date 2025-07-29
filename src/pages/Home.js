import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bars3Icon } from "@heroicons/react/24/solid";

import useUserProfile from "../hooks/useUserProfile";
import useWeather from "../hooks/useWeather";
import { logout } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";

import Skeleton from "../components/Skeleton";
import WeatherCard from "../components/WeatherCard";

function Home() {
  const { user } = useAuth();
  const [region, setRegion] = useState("");
  const [nickname, setNickname] = useState("");

  useEffect(() => {
    async function fetchUserProfile() {
      if (!user) return;
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setRegion(userData.region || "Seoul");
        setNickname(userData.nickname || "회원");
      } else {
        setRegion("Seoul");
        setNickname("회원");
      }
    }
    fetchUserProfile();
  }, [user]);

  const [selectedRegion, setSelectedRegion] = useState(null);

  useEffect(() => {
    if (region) {
      setSelectedRegion(region);
    }
  }, [region]);

  const { weather, loading: weatherLoading } = useWeather(selectedRegion);
  const navigate = useNavigate();
  const loading = user?.loading || weatherLoading;

  const regionMap = {
    Seoul: "서울",
    Busan: "부산",
    Daegu: "대구",
    Incheon: "인천",
    Gwangju: "광주",
    Daejeon: "대전",
    Ulsan: "울산",
    Suwon: "수원",
  };
  const displayRegion = regionMap[region] || region;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      {user ? (
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
              {/* 상단에 {nickname}님 표시 */}
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
              className="bg-blue-300 hover:bg-blue-400 px-6 py-2 rounded"
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
    </div>
  );
}

export default Home;

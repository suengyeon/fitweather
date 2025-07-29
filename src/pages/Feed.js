import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bars3Icon, HomeIcon } from "@heroicons/react/24/solid";

import useUserProfile from "../hooks/useUserProfile";
import useWeather from "../hooks/useWeather";
import WeatherCard from "../components/WeatherCard";

function Feed() {
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const defaultRegion = profile?.region || "Seoul";
  const [selectedRegion, setSelectedRegion] = useState(defaultRegion);
  const [sortOption, setSortOption] = useState("인기순");

  const { weather, loading: weatherLoading } = useWeather(selectedRegion);

  const regionMap = {
    Seoul: "서울", Busan: "부산", Daegu: "대구", Incheon: "인천",
    Gwangju: "광주", Daejeon: "대전", Ulsan: "울산", Suwon: "수원"
  };
  const regionName = regionMap[selectedRegion] || selectedRegion;

  // ✅ 더미 데이터
  const dummyData = [...Array(30)].map((_, i) => ({
    id: i,
    likes: Math.floor(Math.random() * 100),
    createdAt: Date.now() - i * 1000000,
    feeling: ["steam", "hot", "nice", "cold", "ice"][i % 5]
  }));

  // ✅ 좋아요 상태 + 수 관리
  const [likedOutfits, setLikedOutfits] = useState(
    dummyData.map((item) => ({
      liked: false,
      likeCount: item.likes
    }))
  );

  // ✅ 좋아요 토글 핸들러
  const handleToggleLike = (id) => {
    setLikedOutfits((prev) => {
      const copy = [...prev];
      const current = copy[id];
      copy[id] = {
        liked: !current.liked,
        likeCount: current.liked ? current.likeCount - 1 : current.likeCount + 1
      };
      return copy;
    });
  };

  // ✅ 정렬된 피드 목록 (likeCount 기준)
  const sortedData = dummyData.map((item, i) => ({
    ...item,
    likes: likedOutfits[i]?.likeCount ?? item.likes,
    liked: likedOutfits[i]?.liked ?? false
  })).sort((a, b) => {
    if (sortOption === "인기순") return b.likes - a.likes;
    return b.createdAt - a.createdAt;
  });

  // ✅ 항상 인기순 기준 상위 3개
  const top3Data = [...dummyData.map((item, i) => ({
    ...item,
    likes: likedOutfits[i]?.likeCount ?? item.likes,
    liked: likedOutfits[i]?.liked ?? false
  }))].sort((a, b) => b.likes - a.likes).slice(0, 3);

  const getFeelingEmoji = (feeling) => {
    switch (feeling) {
      case "steam": return "🥟";
      case "hot": return "🥵";
      case "nice": return "👍🏻";
      case "cold": return "💨";
      case "ice": return "🥶";
      default: return "❓";
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* 상단 네비게이션 */}
      <div className="flex justify-between items-center px-4 py-3 bg-blue-100">
        <button className="bg-blue-300 px-3 py-1 rounded-md hover:bg-blue-400">
          <Bars3Icon className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-lg">우리 동네</h2>
        <button
          onClick={() => navigate("/")}
          className="bg-blue-300 px-3 py-1 rounded-md hover:bg-blue-400"
        >
          <HomeIcon className="w-5 h-5" />
        </button>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 px-4 mt-10 flex md:flex-row gap-6 h-[700px]">
        {/* 왼쪽: 날씨 카드 영역 */}
        <div className="w-full md:w-1/4 bg-gray-200 px-6 py-6 text-center overflow-hidden rounded h-[700px] flex flex-col justify-between">
          <h3 className="text-lg font-semibold mb-3">{regionName}</h3>
          {weatherLoading ? (
            <p className="text-sm text-gray-500">날씨 정보를 불러오는 중...</p>
          ) : weather ? (
            <WeatherCard
              region={regionName}
              temp={weather.temp}
              rain={weather.rain}
              desc=""
              icon={weather.icon}
            />
          ) : (
            <p className="text-sm text-red-500">날씨 정보를 가져올 수 없습니다.</p>
          )}

          {/* 드롭다운 */}
          <div className="flex flex-col items-center gap-4 mt-6">
            <div className="flex items-center gap-2">
              <label htmlFor="region">지역</label>
              <select
                id="region"
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="px-3 py-2 rounded bg-white border"
              >
                {Object.entries(regionMap).map(([eng, kor]) => (
                  <option key={eng} value={eng}>{kor}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <label htmlFor="sort">정렬</label>
              <select
                id="sort"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="px-3 py-2 rounded bg-white border"
              >
                <option value="인기순">인기순</option>
                <option value="최신순">최신순</option>
              </select>
            </div>
          </div>

          {/* 로고 */}
          <div className="text-center mt-6">
            <h1 className="text-5xl font-lilita text-indigo-500">Fitweather</h1>
          </div>
        </div>

        {/* 오른쪽: 피드 카드 영역 */}
        <div className="w-full md:w-3/4 bg-white rounded flex flex-col h-[700px]">

          {/* 상단 고정 Top 3 */}
          <div className="w-full h-[300px] bg-gray-200 rounded px-6 pb-6 pt-4">
            <div className="flex justify-center gap-20 h-[270px]">
              {top3Data.map((item, index) => {
                const medals = ["🥇", "🥈", "🥉"];
                const medal = medals[index];
                const feeling = getFeelingEmoji(item.feeling);

                return (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/feed/${item.id}`)}
                    className="w-[220px] bg-white rounded p-2 flex flex-col justify-between overflow-hidden cursor-pointer hover:shadow-md transition"
                  >
                    <div className="flex-1 flex items-center justify-center text-3xl text-gray-400">📷</div>
                    <div className="flex justify-between items-center px-1 pt-2 text-sm">
                      <button onClick={(e) => {
                        e.stopPropagation();
                        handleToggleLike(item.id);
                      }}>
                        {item.liked ? "❤️" : "🖤"} {item.likes}
                      </button>
                      <div className="text-lg mx-auto">{feeling}</div>
                      <div className="text-3xl">{medal}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 아래 피드 카드 목록 */}
          <div className="flex-1 overflow-y-auto px-6 pb-6 mt-6">
            <div className="grid grid-cols-5 gap-4">
              {sortedData.map((item) => {
                const feeling = getFeelingEmoji(item.feeling);

                return (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/feed/${item.id}`)}
                    className="aspect-[3/4] bg-gray-100 rounded p-2 flex flex-col justify-between cursor-pointer hover:shadow-md transition"
                  >
                    <div className="flex flex-col items-center justify-center flex-1">
                      <div className="text-gray-400 text-2xl">📷</div>
                    </div>
                    <div className="flex justify-between items-center px-1 pt-2 text-sm text-gray-600">
                      <button onClick={(e) => {
                        e.stopPropagation();
                        handleToggleLike(item.id);
                      }}>
                        {item.liked ? "❤️" : "🖤"} {item.likes}
                      </button>
                      <div className="text-lg mx-auto">{feeling}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Feed;

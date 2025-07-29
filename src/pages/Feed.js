import React, { useEffect, useState } from "react";
import FeedCard from "../components/FeedCard";
import { getRecords } from "../api/getRecords";
import { toggleLike } from "../api/toggleLike";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Bars3Icon, HomeIcon } from "@heroicons/react/24/solid";
import useWeather from "../hooks/useWeather";
import WeatherCard from "../components/WeatherCard";

function Feed() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [outfits, setOutfits] = useState([]);
  const [order, setOrder] = useState("popular"); // 인기순 or 최신순
  const [region, setRegion] = useState(""); // 초기값 빈 문자열

  // 날씨 데이터 fetch
  const { weather, loading: weatherLoading } = useWeather(region);

  // 사용자 region fetch
  useEffect(() => {
    async function fetchUserRegion() {
      if (!user) return;
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setRegion(userSnap.data().region || "Seoul");
      } else {
        setRegion("Seoul");
      }
    }
    fetchUserRegion();
  }, [user]);

  // region/order 바뀔 때마다 records fetch
  useEffect(() => {
    if (!region) return;
    getRecords(region, order).then(setOutfits);
  }, [region, order]);

  // 좋아요 토글 함수 (Firestore + UI 동기화)
  const handleToggleLike = async (recordId, liked) => {
    if (!user) return;
    await toggleLike(recordId, user.uid);
    setOutfits(prev =>
      prev.map(record =>
        record.id === recordId
          ? {
              ...record,
              likes: liked
                ? record.likes.filter(uid => uid !== user.uid)
                : [...record.likes, user.uid],
            }
          : record
      )
    );
  };

  // 인기순일 때 TOP3 분리
  const isPopular = order === "popular";
  let top3 = [];
  let rest = outfits;
  if (isPopular && outfits.length > 0) {
    const sorted = [...outfits].sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
    top3 = sorted.slice(0, 3);
    rest = sorted.slice(3);
  }

  // regionMap for dropdown (A의 코드 스타일 반영)
  const regionMap = {
    Seoul: "서울", Busan: "부산", Daegu: "대구", Incheon: "인천",
    Gwangju: "광주", Daejeon: "대전", Ulsan: "울산", Suwon: "수원"
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
        {/* 왼쪽: 지역/정렬/날씨 카드 영역 */}
        <div className="w-full md:w-1/4 bg-gray-200 px-6 py-6 text-center overflow-hidden rounded h-[700px]">
          <h3 className="text-lg font-semibold mb-3">{regionMap[region] || region}</h3>
          {/* 날씨 일러스트 (WeatherCard) */}
          <div className="flex justify-center items-center" style={{ minHeight: 120 }}>
            {weatherLoading ? (
              <p className="text-sm text-gray-500">날씨 정보를 불러오는 중...</p>
            ) : weather ? (
              <WeatherCard
                region={regionMap[region] || region}
                temp={weather.temp}
                rain={weather.rain}
                desc=""
                icon={weather.icon}
              />
            ) : (
              <p className="text-sm text-red-500">날씨 정보를 가져올 수 없습니다.</p>
            )}
          </div>
          <div className="flex flex-col items-center gap-4 mt-6">
            <div className="flex items-center gap-2">
              <label htmlFor="region">지역</label>
              <select
                id="region"
                value={region}
                onChange={e => setRegion(e.target.value)}
                className="px-3 py-2 rounded bg-blue-100 border"
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
                value={order}
                onChange={e => setOrder(e.target.value)}
                className="px-3 py-2 rounded bg-blue-100 border"
              >
                <option value="popular">인기순</option>
                <option value="latest">최신순</option>
              </select>
            </div>
          </div>
          {/* 로고 (A의 스타일 반영) */}
          <div className="text-center pt-36">
            <h1 className="text-5xl font-lilita text-indigo-500">Fitweather</h1>
          </div>
        </div>

        {/* 오른쪽: 피드 카드 영역 */}
        <div className="w-full md:w-3/4 bg-white rounded flex flex-col h-[700px]">
          {/* TOP3 강조 */}
          {isPopular && top3.length > 0 && (
            <div className="w-full h-[300px] bg-gray-200 rounded px-6 pb-6 pt-4">
              <div className="flex justify-center gap-20 h-[270px]">
                {top3.map((outfit, idx) => (
                  <FeedCard
                    key={outfit.id}
                    record={outfit}
                    currentUserUid={user?.uid}
                    onToggleLike={handleToggleLike}
                    rank={idx + 1}
                  />
                ))}
              </div>
            </div>
          )}
          {/* 나머지 피드 카드 목록 */}
          <div className="flex-1 overflow-y-auto px-6 pb-6 mt-6">
            <div className="grid grid-cols-5 gap-4">
              {(isPopular ? rest : outfits).map(outfit => (
                <FeedCard
                  key={outfit.id}
                  record={outfit}
                  currentUserUid={user?.uid}
                  onToggleLike={handleToggleLike}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Feed;

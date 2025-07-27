// src/pages/Home.js
import React from "react";
import { useNavigate } from "react-router-dom";
import { Bars3Icon } from "@heroicons/react/24/solid";

<<<<<<< HEAD
import WeatherCard from "../components/WeatherCard";
import Skeleton from "../components/Skeleton";
import { fetchWeather } from "../api/weather";

function Home() {
  const { user, loading } = useAuth();
  const [nickname, setNickname] = useState("");
  const [region, setRegion] = useState("서울");
  const [profileLoading, setProfileLoading] = useState(false);
  const [weather, setWeather] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNickname = async () => {
      if (!user) return;
      setProfileLoading(true);
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setNickname(userSnap.data().nickname);
          setRegion(userSnap.data().region || "서울");
        } else {
          setNickname("");
        }
      } catch (err) {
        console.error("유저 정보 불러오기 실패", err);
        setNickname("");
      }
      setProfileLoading(false);
    };
    fetchNickname();
  }, [user]);

  // 날씨 정보 불러오기
  useEffect(() => {
    const getWeather = async () => {
      if (!region) return;
      try {
        const data = await fetchWeather(region);
        setWeather(data);
      } catch (err) {
        console.error("날씨 데이터 불러오기 실패", err);
      }
    };
    getWeather();
  }, [region]);

  if (loading || profileLoading) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      {user ? (
=======
import useUserProfile from "../hooks/useUserProfile";
import useWeather from "../hooks/useWeather";
import { logout } from "../firebase";

import Skeleton from "../components/Skeleton";
import WeatherCard from "../components/WeatherCard";

function Home() {
  const { profile, loading: profileLoading } = useUserProfile();
  const region = profile?.region || "Seoul";
  const nickname = profile?.nickname || "회원";
  const { weather, loading: weatherLoading } = useWeather(region);
  const navigate = useNavigate();

  const loading = profileLoading || weatherLoading;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      {profile ? (
>>>>>>> 68676bf (날씨 api 연동 및 Home 페이지 리팩터링 완료)
        <div className="w-full min-h-screen bg-gray-100 flex flex-col">
          {/* 상단 네비게이션 */}
          <div className="flex justify-between items-center px-4 py-3 bg-blue-100 shadow">
            <button className="bg-blue-300 px-3 py-1 rounded-md hover:bg-blue-400">
              <Bars3Icon className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-4">
<<<<<<< HEAD
              <button onClick={logout} className="text-sm hover:underline"
              >
                logout
              </button>
              <button onClick={() => navigate("/mypage_userinfo")} className="text-sm hover:underline"
=======
              <button onClick={logout} className="text-sm hover:underline">
                logout
              </button>
              <button
                onClick={() => navigate("/mypage_userinfo")}
                className="text-sm hover:underline"
>>>>>>> 68676bf (날씨 api 연동 및 Home 페이지 리팩터링 완료)
              >
                Mypage
              </button>
              <div className="bg-blue-200 px-2 py-1 rounded text-sm font-medium">
<<<<<<< HEAD
                {nickname || "회원"}님
=======
                {nickname}님
>>>>>>> 68676bf (날씨 api 연동 및 Home 페이지 리팩터링 완료)
              </div>
            </div>
          </div>

<<<<<<< HEAD
=======
          {/* 제목 */}
>>>>>>> 68676bf (날씨 api 연동 및 Home 페이지 리팩터링 완료)
          <div className="mt-10 flex justify-center">
            <h1 className="text-5xl font-lilita text-indigo-500">Fitweather</h1>
          </div>

          {/* 중앙 콘텐츠 */}
<<<<<<< HEAD
          <div className="flex flex-col items-center mt-12 px-4">

            {/* 지역 선택 */}
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="border border-gray-300 bg-white px-4 py-2 rounded mb-6"
            >
              <option value="서울">서울</option>
              <option value="부산">부산</option>
            </select>

            {/* 날씨 카드 또는 로딩 메시지 */}
            {weather ? (
              <WeatherCard
                region={region}
                temp={weather.temp}
                rain={weather.rain}
                icon={weather.icon}
                desc={weather.desc}
              />
            ) : (
              <Skeleton />
            )}

            {/* 기록하기 버튼 */}
            <button onClick={() => navigate("/record")} className="bg-blue-300 hover:bg-blue-400 px-6 py-2 rounded">
=======
          <div className="flex flex-col items-center mt-12 px-4 flex-1">
            {/* 지역 선택 */}
            <select
              value={region}
              disabled
              className="border border-gray-300 bg-white px-4 py-2 rounded mb-6"
            >
              <option value="Seoul">서울</option>
              <option value="Busan">부산</option>
            </select>

            {/* 날씨 카드 */}
            {loading ? (
              <Skeleton />
            ) : weather ? (
              <>
                <WeatherCard
                  region={region}
                  temp={weather.temp}
                  rainProb={weather.rain}
                  iconCode={weather.icon}
                />
                <div className="flex space-x-12 mb-12">
                  <div className="bg-blue-100 px-4 py-2 rounded">
                    {weather.temp}°C
                  </div>
                  <div className="bg-blue-100 px-4 py-2 rounded">
                    {weather.rain}%
                  </div>
                </div>
              </>
            ) : (
              <p>날씨 정보를 불러올 수 없습니다.</p>
            )}

            {/* 기록하기 버튼 */}
            <button className="bg-blue-300 hover:bg-blue-400 px-6 py-2 rounded mt-8">
>>>>>>> 68676bf (날씨 api 연동 및 Home 페이지 리팩터링 완료)
              기록하기
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full h-screen bg-gray-100 flex flex-col">
<<<<<<< HEAD
          {/* 비로그인 단 네비게이션 */}
=======
          {/* 비로그인 네비게이션 */}
>>>>>>> 68676bf (날씨 api 연동 및 Home 페이지 리팩터링 완료)
          <div className="flex justify-end items-center px-4 py-3 bg-blue-100 shadow">
            <button
              onClick={() => navigate("/login")}
              className="bg-blue-300 px-3 py-1 rounded-md text-sm font-medium hover:bg-blue-400"
            >
              login
            </button>
          </div>

<<<<<<< HEAD
          {/* 비로그인 중앙 콘텐츠 */}
=======
          {/* 비로그인 타이틀 */}
>>>>>>> 68676bf (날씨 api 연동 및 Home 페이지 리팩터링 완료)
          <div className="flex flex-1 items-center justify-center">
            <h1 className="text-6xl font-lilita text-indigo-500">Fitweather</h1>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;

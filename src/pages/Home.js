import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Bars3Icon, ArrowPathIcon } from "@heroicons/react/24/solid";
import { BellIcon } from "@heroicons/react/24/outline";
import { getDocs, collection, query, where } from "firebase/firestore";
import { db, logout } from "../firebase";

import useUserProfile from "../hooks/useUserProfile";
import useWeather from "../hooks/useWeather";
import { useAuth } from "../contexts/AuthContext";

import MenuSidebar from "../components/MenuSidebar";
import NotiSidebar from "../components/NotiSidebar";

// 날씨 아이콘 코드에 따른 이모지 반환 함수
function getWeatherEmoji(iconCode) {
  switch (iconCode) {
    case "sunny": return "☀️";
    case "cloudy": return "☁️";
    case "overcast": return "🌥️";
    case "rain": return "🌧️";
    case "snow": return "❄️";
    case "snow_rain": return "🌨️";
    case "shower": return "🌦️";
    default: return "☁️";
  }
}

function Home() {
  const { profile, loading: profileLoading } = useUserProfile();
  const { user } = useAuth();
  const nickname = profile?.nickname || "회원";
  const navigate = useNavigate();

  const [selectedRegion, setSelectedRegion] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alarmOpen, setAlarmOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (profile?.region) {
      setSelectedRegion(profile.region);
    }
  }, [profile?.region]);

  // 샘플 데이터 (백엔드 붙기 전 UI 테스트용)
  useEffect(() => {
    setNotifications([
      // 1) 구독 시작
      {
        id: "n1",
        kind: "follow",
        actorName: "김코디",
        message: "김코디님이 나를 구독하기 시작했어요.",
        createdAt: new Date(),           // 방금
        read: false,
        link: "/follow",
      },
      // 2) 내 기록에 댓글
      {
        id: "n2",
        kind: "comment_on_my_post",
        postId: "post_123",
        message: "홍길동: '이 코디 너무 좋아요!'",
        createdAt: new Date(Date.now() - 3600_000), // 1시간 전
        read: false,
        link: "/feed/123",
      },
      // 3) 내 댓글에 답글
      {
        id: "n3",
        kind: "reply_to_my_comment",
        postId: "post_456",
        commentId: "cmt_789",
        message: "답글: '정보 감사합니다!'",
        createdAt: new Date(Date.now() - 86_400_000), // 1일 전
        read: true,                     // 읽음 예시
        link: "/feed/456",
      },
    ]);
  }, []);


  // UI 전용 액션 콜백들 (백엔드 붙을 때 내부만 교체)
  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const clearAll = () => setNotifications([]);

  const markOneRead = (id) =>
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

  const handleAlarmItemClick = (n) => {
    // 라우팅만 상위에서 처리 (나중에 kind별 분기 교체 가능)
    if (n.link) navigate(n.link);
  };

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const { weather, loading: weatherLoading } = useWeather(selectedRegion);
  const loading = profileLoading || weatherLoading;

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
            onClearAll={clearAll}
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
                className="relative bg-white px-3 py-1 rounded text-gray-600 hover:bg-gray-100 transition-colors"
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
            {/* 지역 선택 드롭다운 */}
            <select
              value={selectedRegion || profile?.region || "Seoul"}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-32 bg-white px-4 py-2 rounded mb-4 text-center"
            >
              <option value="Incheon">인천</option>
              <option value="Seoul">서울</option>
              <option value="Chuncheon">춘천</option>
              <option value="Gangneung">강릉</option>
              <option value="Ulleungdo">울릉도/독도</option>
              <option value="Suwon">수원</option>
              <option value="Cheongju">청주</option>
              <option value="Jeonju">전주</option>
              <option value="Daejeon">대전</option>
              <option value="Daegu">대구</option>
              <option value="Pohang">포항</option>
              <option value="Mokpo">목포</option>
              <option value="Jeju">제주</option>
              <option value="Ulsan">울산</option>
              <option value="Yeosu">여수</option>
              <option value="Busan">부산</option>
              <option value="Gwangju">광주</option>
            </select>

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

            {/* 옷 추천 카드 */}
            <div className="w-full max-w-md mt-6">
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
                {/* 카드 헤더 */}
                <div className="flex items-center justify-between mb-4">
                  <select className="w-32 text-sm font-medium text-gray-700 text-center focus:outline-none">
                    <option value="casual">캐주얼</option>
                    <option value="minimal">미니멀</option>
                    <option value="formal">포멀</option>
                    <option value="sporty">스포티/액티브</option>
                    <option value="street">시크/스트릿</option>
                    <option value="feminine">러블리/페미닌</option>
                  </select>
                  <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
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
                    <div className="inline-block text-xs text-gray-600 bg-blue-100 px-2 py-1 rounded">가디건</div>
                  </div>

                  {/* 하의 */}
                  <div style={{ backgroundColor: "#f3f4f6", borderRadius: "8px", padding: "12px" }}>
                    <div className="text-sm font-medium text-gray-800 mb-1">하의</div>
                    <div className="inline-block text-xs text-gray-600 bg-blue-100 px-2 py-1 rounded">바지</div>
                  </div>

                  {/* 상의 */}
                  <div style={{ backgroundColor: "#f3f4f6", borderRadius: "8px", padding: "12px" }}>
                    <div className="text-sm font-medium text-gray-800 mb-1">상의</div>
                    <div className="inline-block text-xs text-gray-600 bg-blue-100 px-2 py-1 rounded">긴팔티</div>
                  </div>

                  {/* 신발 */}
                  <div style={{ backgroundColor: "#f3f4f6", borderRadius: "8px", padding: "12px" }}>
                    <div className="text-sm font-medium text-gray-800 mb-1">신발</div>
                    <div className="inline-block text-xs text-gray-600 bg-blue-100 px-2 py-1 rounded">스니커즈</div>
                  </div>

                  {/* 악세서리 - 두 열을 모두 차지 */}
                  <div style={{ backgroundColor: "#f3f4f6", borderRadius: "8px", padding: "12px", gridColumn: "1 / -1" }}>
                    <div className="text-sm font-medium text-gray-800 mb-1">악세서리</div>
                    <div className="inline-block text-xs text-gray-600 bg-blue-100 px-2 py-1 rounded">우산</div>
                  </div>
                </div>

                {/* 착장 보기 링크 */}
                <div className="flex justify-end mt-4">
                  <a href="#" className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
                    착장 보기
                  </a>
                </div>
              </div>
            </div>

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

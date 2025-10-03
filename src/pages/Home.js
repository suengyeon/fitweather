import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Bars3Icon, ArrowPathIcon } from "@heroicons/react/24/solid";
import { BellIcon } from "@heroicons/react/24/outline";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db, logout } from "../firebase";

import useUserProfile from "../hooks/useUserProfile";
import useWeather from "../hooks/useWeather";
import { useAuth } from "../contexts/AuthContext";

import MenuSidebar from "../components/MenuSidebar";
import NotiSidebar from "../components/NotiSidebar";
import { getRecommendations } from "../api/getRecommendations";
import { 
  fetchUserNotifications, 
  markAllNotificationsAsReadAPI, 
  markNotificationAsReadAPI, 
  deleteSelectedNotificationsAPI 
} from "../api/notificationAPI";

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
  
  // 추천 관련 상태
  const [recommendations, setRecommendations] = useState([]);
  const [currentRecommendationIndex, setCurrentRecommendationIndex] = useState(0);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
        console.log("🔍 추천 데이터 요청:", selectedRegion);
        const data = await getRecommendations(selectedRegion, 3);
        console.log("📊 추천 데이터 결과:", data);
        setRecommendations(data);
        
        // 새로고침 시 순차적 표시를 위한 인덱스 업데이트
        setCurrentRecommendationIndex(prev => {
          const newIndex = (prev + 1) % Math.max(data.length, 1);
          console.log("🔄 추천 인덱스 변경:", prev, "->", newIndex);
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
  }, [selectedRegion]);

  // 새로고침 버튼 클릭 핸들러
  const handleRefreshRecommendation = () => {
    if (recommendations.length > 0) {
      setIsRefreshing(true);
      setCurrentRecommendationIndex(prev => (prev + 1) % recommendations.length);
      
      // 새로고침 아이콘 애니메이션 완료 후 상태 리셋
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1000); // 새로고침 아이콘 회전 시간
    }
  };

  // 알림 데이터 로드 (실제 API 연동)
  useEffect(() => {
    const loadNotifications = async () => {
      if (!user?.uid) {
        console.log("❌ 사용자 ID가 없습니다:", user);
        return;
      }
      
      console.log("📱 알림 로드 시작:", user.uid);
      
      try {
        const notifications = await fetchUserNotifications(user.uid);
        console.log("📱 알림 데이터 로드 완료:", notifications.length, "개");
        console.log("📱 알림 상세:", notifications);
        
        // 각 알림의 링크 확인
        notifications.forEach((notification, index) => {
          console.log(`📱 알림 ${index + 1}:`, {
            type: notification.type,
            link: notification.link,
            message: notification.message
          });
        });
        
        setNotifications(notifications);
      } catch (error) {
        console.error("❌ 알림 로드 실패:", error);
        // 에러 시 빈 배열로 초기화
        setNotifications([]);
      }
    };

    loadNotifications();
  }, [user?.uid]);

  // 페이지 포커스 시 알림 상태 새로고침 (다른 페이지에서 돌아왔을 때)
  useEffect(() => {
    const handleFocus = async () => {
      if (!user?.uid) return;
      
      try {
        const notifications = await fetchUserNotifications(user.uid);
        setNotifications(notifications);
        console.log("🔄 페이지 포커스 - 알림 상태 새로고침");
      } catch (error) {
        console.error("❌ 포커스 시 알림 로드 실패:", error);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user?.uid]);



  // 알림 API 연동 함수들
  const markAllRead = async () => {
    try {
      await markAllNotificationsAsReadAPI(user.uid);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      console.log("✅ 모든 알림 읽음 처리 완료");
    } catch (error) {
      console.error("❌ 알림 읽음 처리 실패:", error);
    }
  };

  const handleDeleteSelected = async (selectedIds) => {
    try {
      await deleteSelectedNotificationsAPI(selectedIds, user.uid);
      setNotifications((prev) => prev.filter((n) => !selectedIds.includes(n.id)));
      console.log("✅ 선택된 알림 삭제 완료:", selectedIds);
    } catch (error) {
      console.error("❌ 알림 삭제 실패:", error);
    }
  };

  const markOneRead = async (id) => {
    try {
      await markNotificationAsReadAPI(id, user.uid);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      console.log("✅ 개별 알림 읽음 처리 완료:", id);
    } catch (error) {
      console.error("❌ 개별 알림 읽음 처리 실패:", error);
    }
  };

  const handleAlarmItemClick = async (n) => {
    try {
      console.log("🔍 알림 클릭:", { 
        id: n.id, 
        type: n.type, 
        link: n.link,
        message: n.message 
      });
      
      // 개별 알림 읽음 처리
      await markOneRead(n.id);
      
      // 댓글/답글 알림인 경우 내 기록인지 확인
      if ((n.type === 'comment_on_my_post' || n.type === 'reply_to_my_comment') && n.link) {
        // 링크에서 기록 ID 추출 (/feed-detail/ID 형태)
        const recordId = n.link.split('/feed-detail/')[1];
        if (recordId) {
          try {
            // 해당 기록의 작성자 확인
            const recordRef = doc(db, "records", recordId);
            const recordSnap = await getDoc(recordRef);
            
            if (recordSnap.exists()) {
              const recordData = recordSnap.data();
              // 내 기록인 경우 Record 페이지로 이동
              if (recordData.uid === user?.uid) {
                console.log("🔍 내 기록 감지 - Record 페이지로 이동");
                navigate("/record", { state: { existingRecord: { id: recordId, ...recordData } } });
                return;
              }
            }
          } catch (error) {
            console.error("❌ 기록 정보 확인 실패:", error);
          }
        }
      }
      
      // 해당 알림의 링크로 이동
      if (n.link) {
        console.log("🚀 네비게이션 시작:", n.link);
        navigate(n.link);
      } else {
        console.warn("⚠️ 알림에 링크가 없습니다:", n);
      }
    } catch (error) {
      console.error("❌ 알림 클릭 처리 실패:", error);
    }
  };

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const { weather, loading: weatherLoading, apiSource } = useWeather(selectedRegion);
  const loading = profileLoading || weatherLoading;

  // 현재 표시할 추천 데이터 계산
  const currentRecommendation = useMemo(() => {
    console.log("🎯 현재 추천 데이터 계산:", {
      recommendations: recommendations.length,
      currentIndex: currentRecommendationIndex,
      current: recommendations[currentRecommendationIndex]
    });
    if (recommendations.length === 0) return null;
    return recommendations[currentRecommendationIndex];
  }, [recommendations, currentRecommendationIndex]);

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
                    <select className="w-32 text-sm font-medium text-gray-700 text-center focus:outline-none">
                      <option value="casual">캐주얼</option>
                      <option value="minimal">미니멀</option>
                      <option value="formal">포멀</option>
                      <option value="sporty">스포티/액티브</option>
                      <option value="street">시크/스트릿</option>
                      <option value="feminine">러블리/페미닌</option>
                    </select>
               <button 
                 onClick={handleRefreshRecommendation}
                 className={`p-1 text-gray-400 hover:text-gray-600 transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
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
                          <div className="inline-block text-xs text-gray-600 bg-blue-100 px-2 py-1 rounded">
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
                      onClick={() => {
                        // 모든 기록은 FeedDetail로 이동 (내 기록이든 다른 사람 기록이든)
                        navigate(`/feed-detail/${currentRecommendation.id}`);
                      }}
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
                  <div className="text-center text-gray-500">
                    <p>오늘의 추천 착장이 없습니다.</p>
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

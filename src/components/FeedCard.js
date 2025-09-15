import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toggleLike } from "../api/toggleLike";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";

function FeedCard({ record, currentUserUid, onToggleLike, rank, selectedDate, selectedYear, selectedMonth, selectedDay, currentFilters }) {
  const navigate = useNavigate();
  const [imageIndex, setImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(record.likes?.includes(currentUserUid));
  const [likeCount, setLikeCount] = useState(record.likes?.length || 0);
  
  // 새로운 상태 관리
  const [isSaved, setIsSaved] = useState(false); // 저장/구독 상태
  const [thumbsUpCount, setThumbsUpCount] = useState(156); // 좋아요 수 (임시 데이터)
  const [thumbsDownCount, setThumbsDownCount] = useState(15); // 싫어요 수 (임시 데이터)
  const [isThumbsUp, setIsThumbsUp] = useState(false); // 좋아요 상태
  const [isThumbsDown, setIsThumbsDown] = useState(false); // 싫어요 상태

  // 날씨 아이콘 코드에 따른 이모지 반환 함수 (Home, Record와 동일한 로직)
  const getWeatherEmoji = (iconCode) => {
    switch (iconCode) {
      case "sunny": return "☀️";        // 맑음
      case "cloudy": return "☁️";       // 구름많음
      case "overcast": return "🌥️";     // 흐림
      case "rain": return "🌧️";        // 비
      case "snow": return "❄️";        // 눈
      case "snow_rain": return "🌨️";   // 비/눈
      case "shower": return "🌦️";      // 소나기
      default: return "☁️";            // 기본값: 구름
    }
  };

  const feelingEmojiMap = {
    steam: "🥟", hot: "🥵", nice: "👍🏻", cold: "💨", ice: "🥶"
  };
  const feelingEmoji = feelingEmojiMap[record.feeling] || "";

  const getTemp = () => record.temp || record.weather?.temp || null;
  const getRain = () => record.rain || record.weather?.rain || null;
  const getHumidity = () => record.humidity || record.weather?.humidity || null;
  const getRegion = () => record.region || record.regionName || null;

  const handleLikeClick = async (e) => {
    e.stopPropagation();

    setIsLiked(!isLiked); // UI 즉시 반응
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);

    try {
      await toggleLike(record.id, currentUserUid);
    } catch (err) {
      console.error("좋아요 토글 실패:", err);
      // 롤백
      setIsLiked(isLiked);
      setLikeCount(prev => isLiked ? prev + 1 : prev - 1);
    }
  };

  // 저장/구독 핸들러
  const handleSaveClick = (e) => {
    e.stopPropagation();
    setIsSaved(!isSaved);
    // TODO: 실제 저장/구독 API 호출
  };

  // 좋아요 핸들러
  const handleThumbsUpClick = (e) => {
    e.stopPropagation();
    if (isThumbsDown) {
      setIsThumbsDown(false);
      setThumbsDownCount(prev => prev - 1);
    }
    setIsThumbsUp(!isThumbsUp);
    setThumbsUpCount(prev => isThumbsUp ? prev - 1 : prev + 1);
    // TODO: 실제 좋아요 API 호출
  };

  // 싫어요 핸들러
  const handleThumbsDownClick = (e) => {
    e.stopPropagation();
    if (isThumbsUp) {
      setIsThumbsUp(false);
      setThumbsUpCount(prev => prev - 1);
    }
    setIsThumbsDown(!isThumbsDown);
    setThumbsDownCount(prev => isThumbsDown ? prev - 1 : prev + 1);
    // TODO: 실제 싫어요 API 호출
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setImageIndex(prev => (prev - 1 + record.imageUrls.length) % record.imageUrls.length);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setImageIndex(prev => (prev + 1) % record.imageUrls.length);
  };

  const handleClick = () => {
    if (record.uid === currentUserUid) {
      navigate("/record", { state: { existingRecord: record } });
    } else {
      // 현재 페이지가 상세필터인지 확인
      const isFromRecommend = window.location.pathname.includes('/recommend');
      
      navigate(`/FeedDetail/${record.id}`, { 
        state: { 
          fromCard: true,
          fromFeed: !isFromRecommend,
          fromRecommend: isFromRecommend,
          // 지역 정보 전달
          region: record.region,
          date: selectedDate,
          year: selectedYear,
          month: selectedMonth,
          day: selectedDay,
          // 상세필터에서 온 경우 현재 필터 상태 전달
          currentFilters: isFromRecommend ? currentFilters : undefined
        } 
      });
    }
  };

  return (
    <div
      className="rounded-lg cursor-pointer transition-all duration-100 hover:shadow-md"
      style={{
        width: "200px",
        height: "280px",
        backgroundColor: "#d1d5db",
        position: "relative",
        overflow: "hidden"
      }}
      onClick={handleClick}
    >
      {/* TOP3 뱃지 */}
      {rank && (
        <span style={{ position: "absolute", top: 8, left: 8, fontSize: 24, zIndex: 2 }}>
          {rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}
        </span>
      )}

      {/* 저장/구독 하트 아이콘 - 오른쪽 상단 */}
      <button
        onClick={handleSaveClick}
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          background: "rgba(255, 255, 255, 0.8)",
          border: "none",
          borderRadius: "50%",
          width: "32px",
          height: "32px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          cursor: "pointer",
          zIndex: 2,
          transition: "all 0.2s ease"
        }}
        onMouseEnter={(e) => {
          e.target.style.background = "rgba(255, 255, 255, 1)";
        }}
        onMouseLeave={(e) => {
          e.target.style.background = "rgba(255, 255, 255, 0.8)";
        }}
      >
        {isSaved ? (
          <HeartIconSolid className="w-5 h-5 text-red-500" />
        ) : (
          <HeartIcon className="w-5 h-5 text-gray-600" />
        )}
      </button>

      {/* 이미지 영역 */}
      <div style={{ height: "230px", position: "relative" }}>
        {record.imageUrls?.length > 0 ? (
          <>
            <img
              src={record.imageUrls[imageIndex]}
              alt="코디"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />

            {/* 캐러셀 버튼 */}
            {record.imageUrls.length > 1 && (
              <>
                <button onClick={handlePrev} style={navBtnStyle("left")}>‹</button>
                <button onClick={handleNext} style={navBtnStyle("right")}>›</button>

                <div style={indicatorStyle}>
                  {record.imageUrls.map((_, i) => (
                    <div key={i} style={dotStyle(i === imageIndex)} />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div style={{
            width: "100%", height: "100%", background: "#e5e7eb",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#9ca3af", fontSize: "24px"
          }}>
            사진 없음
          </div>
        )}
      </div>

      {/* 정보 영역 */}
      <div style={{ padding: "8px", height: "80px", display: "flex", flexDirection: "column", justifyContent: "flex-start", paddingTop: "12px" }}>
        {/* 체감 정보와 좋아요/싫어요 버튼을 한 줄로 배치 */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between",
          gap: "8px"
        }}>
          {/* 좋아요/싫어요 버튼 (왼쪽) */}
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "6px"
          }}>
            {/* 좋아요 버튼 */}
            <button
              onClick={handleThumbsUpClick}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "2px",
                background: isThumbsUp ? "rgba(59, 130, 246, 0.1)" : "rgba(0, 0, 0, 0.05)",
                border: "1px solid rgba(0, 0, 0, 0.1)",
                cursor: "pointer",
                padding: "2px 4px",
                borderRadius: "8px",
                transition: "all 0.2s ease",
                minWidth: "32px",
                justifyContent: "center"
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = isThumbsUp ? "rgba(59, 130, 246, 0.2)" : "rgba(0, 0, 0, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = isThumbsUp ? "rgba(59, 130, 246, 0.1)" : "rgba(0, 0, 0, 0.05)";
              }}
            >
              <span style={{ fontSize: 10 }}>
                👍
              </span>
              <span style={{ 
                fontSize: 9, 
                fontWeight: 600, 
                color: isThumbsUp ? "#3b82f6" : "#374151" 
              }}>
                {thumbsUpCount}
              </span>
            </button>

            {/* 싫어요 버튼 */}
            <button
              onClick={handleThumbsDownClick}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "2px",
                background: isThumbsDown ? "rgba(239, 68, 68, 0.1)" : "rgba(0, 0, 0, 0.05)",
                border: "1px solid rgba(0, 0, 0, 0.1)",
                cursor: "pointer",
                padding: "2px 4px",
                borderRadius: "8px",
                transition: "all 0.2s ease",
                minWidth: "32px",
                justifyContent: "center"
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = isThumbsDown ? "rgba(239, 68, 68, 0.2)" : "rgba(0, 0, 0, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = isThumbsDown ? "rgba(239, 68, 68, 0.1)" : "rgba(0, 0, 0, 0.05)";
              }}
            >
              <span style={{ fontSize: 10 }}>
                👎
              </span>
              <span style={{ 
                fontSize: 9, 
                fontWeight: 600, 
                color: isThumbsDown ? "#ef4444" : "#374151" 
              }}>
                {thumbsDownCount}
              </span>
            </button>
          </div>

           {/* 날씨/체감 정보 (오른쪽) */}
           <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
             {record.uid === currentUserUid ? (
               <>
                 <span style={{ fontSize: 12, fontWeight: 600 }}>나의 기록</span>
                 <span style={{ fontSize: 16 }}>{feelingEmoji}</span>
               </>
             ) : (
               <>
                 <span style={{ fontSize: 16 }}>
                   {(() => {
                     // 새로운 기록(weather.icon이 있는 경우)은 weather.icon 사용
                     if (record.weather?.icon && record.weather.icon !== "sunny") {
                       return getWeatherEmoji(record.weather.icon);
                     }
                     // 기존 기록(weatherEmojis가 있는 경우)은 weatherEmojis 사용
                     if (record.weatherEmojis && record.weatherEmojis.length > 0) {
                       return record.weatherEmojis[0];
                     }
                     // 기본값
                     return "☁️";
                   })()}
                 </span>
                 <span style={{ fontSize: 16 }}>{feelingEmoji}</span>
               </>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}

// 스타일 함수
const navBtnStyle = (side) => ({
  position: "absolute",
  [side]: "8px",
  top: "50%",
  transform: "translateY(-50%)",
  background: "rgba(0,0,0,0.5)",
  color: "white",
  border: "none",
  borderRadius: "50%",
  width: "28px",
  height: "28px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontSize: "16px",
  zIndex: 10
});

const indicatorStyle = {
  position: "absolute",
  bottom: "8px",
  left: "50%",
  transform: "translateX(-50%)",
  display: "flex",
  gap: "4px",
  zIndex: 10
};

const dotStyle = (active) => ({
  width: "6px",
  height: "6px",
  borderRadius: "50%",
  backgroundColor: active ? "white" : "rgba(255,255,255,0.5)"
});

export default FeedCard;

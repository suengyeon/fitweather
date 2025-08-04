import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toggleLike } from "../api/toggleLike";

function FeedCard({ record, currentUserUid, onToggleLike, rank, selectedDate, selectedYear, selectedMonth, selectedDay, currentFilters }) {
  const navigate = useNavigate();
  const [imageIndex, setImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(record.likes?.includes(currentUserUid));
  const [likeCount, setLikeCount] = useState(record.likes?.length || 0);

  const getWeatherEmoji = (weatherEmojis) => weatherEmojis?.[0] || "🌤️";

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
      <div style={{ padding: "10px", height: "80px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        {/* ♥ 하트 / 날씨 / 체감 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {record.uid === currentUserUid ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ fontSize: 18, color: "red" }}>♥</span>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{likeCount}</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 600 }}>나의 기록</span>
              <span style={{ fontSize: 18 }}>{feelingEmoji}</span>
            </>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <button
                  onClick={handleLikeClick}
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 18,
                    color: isLiked ? "red" : "#ccc",
                    padding: 0
                  }}
                >
                  ♥
                </button>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{likeCount}</span>
              </div>
              <span style={{ fontSize: 18 }}>{getWeatherEmoji(record.weatherEmojis)}</span>
              <span style={{ fontSize: 18 }}>{feelingEmoji}</span>
            </>
          )}
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

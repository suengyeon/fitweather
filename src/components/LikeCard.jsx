import React, { useState, useEffect } from "react";
import { toggleLike } from "../api/toggleLike";
import { auth } from "../firebase";

export default function LikeCard({ outfit, onClick }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(true); // 내가 좋아요한 코디 페이지이므로 기본값은 true
  const [likeCount, setLikeCount] = useState(outfit.likes?.length || 0);

  // 현재 사용자의 UID로 초기 상태 설정
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser && outfit.likes) {
      const userLiked = outfit.likes.includes(currentUser.uid);
      setIsLiked(userLiked);
    }
  }, [outfit.likes]);

  const getWeatherEmoji = (weatherEmojis) => {
    if (!weatherEmojis || weatherEmojis.length === 0) return "🌤️";
    return weatherEmojis[0];
  };

  const getFeelingEmoji = (feeling) => {
    const feelingEmojiMap = {
      steam: "🥟",
      hot: "🥵",
      nice: "👍🏻",
      cold: "💨",
      ice: "🥶",
    };
    return feelingEmojiMap[feeling] || "";
  };

  // 데이터 구조 호환성을 위한 헬퍼 함수들
  const getTemp = (outfit) => {
    return outfit.temp || (outfit.weather && outfit.weather.temp) || null;
  };

  const getRain = (outfit) => {
    return outfit.rain || (outfit.weather && outfit.weather.rain) || null;
  };

  const getHumidity = (outfit) => {
    return outfit.humidity || (outfit.weather && outfit.weather.humidity) || null;
  };

  const getRegion = (outfit) => {
    return outfit.region || outfit.regionName || null;
  };

  const handlePrevImage = (e) => {
    e.stopPropagation();
    if (outfit.imageUrls && outfit.imageUrls.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? outfit.imageUrls.length - 1 : prev - 1
      );
    }
  };

  const handleNextImage = (e) => {
    e.stopPropagation();
    if (outfit.imageUrls && outfit.imageUrls.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === outfit.imageUrls.length - 1 ? 0 : prev + 1
      );
    }
  };

  const handleLikeClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error("사용자가 로그인되지 않았습니다.");
      return;
    }
    
    console.log("하트 클릭됨:", { outfitId: outfit.id, currentUserId: currentUser.uid, isLiked });
    
    // 즉시 UI 업데이트
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    
    try {
      await toggleLike(outfit.id, currentUser.uid);
      console.log("좋아요 토글 성공");
    } catch (error) {
      console.error("좋아요 토글 실패:", error);
      // 실패 시 원래 상태로 되돌리기
      setIsLiked(isLiked);
      setLikeCount(prev => isLiked ? prev + 1 : prev - 1);
    }
  };

  return (
    <div
      className="rounded-lg cursor-pointer transition-all duration-200 hover:shadow-lg"
      style={{
        width: "200px",
        height: "280px",
        backgroundColor: "#f3f4f6",
        position: "relative",
        overflow: "hidden"
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.02)";
        e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "";
      }}
    >
      {/* 이미지 영역 */}
      <div style={{ height: "200px", position: "relative" }}>
        {outfit.imageUrls && outfit.imageUrls.length > 0 ? (
          <>
            <img
              src={outfit.imageUrls[currentImageIndex]}
              alt="코디"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover"
              }}
            />
            
            {/* 화살표 네비게이션 */}
            {outfit.imageUrls.length > 1 && (
              <>
                {/* 이전 버튼 */}
                <button
                  onClick={handlePrevImage}
                  style={{
                    position: "absolute",
                    left: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "rgba(0, 0, 0, 0.5)",
                    color: "white",
                    border: "none",
                    borderRadius: "50%",
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontSize: "16px",
                    zIndex: 10
                  }}
                >
                  ‹
                </button>
                
                {/* 다음 버튼 */}
                <button
                  onClick={handleNextImage}
                  style={{
                    position: "absolute",
                    right: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "rgba(0, 0, 0, 0.5)",
                    color: "white",
                    border: "none",
                    borderRadius: "50%",
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontSize: "16px",
                    zIndex: 10
                  }}
                >
                  ›
                </button>
                
                {/* 이미지 인디케이터 */}
                <div style={{
                  position: "absolute",
                  bottom: "8px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  display: "flex",
                  gap: "4px",
                  zIndex: 10
                }}>
                  {outfit.imageUrls.map((_, index) => (
                    <div
                      key={index}
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor: index === currentImageIndex ? "white" : "rgba(255, 255, 255, 0.5)",
                        transition: "background-color 0.2s"
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div style={{
            width: "100%",
            height: "100%",
            backgroundColor: "#e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#9ca3af",
            fontSize: "24px"
          }}>
            사진 없음
          </div>
        )}
      </div>

      {/* 정보 영역 */}
      <div style={{ padding: "8px", height: "80px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        {/* 첫 번째 줄: 하트, 날씨 이모지, 체감 이모지 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
            <button
              onClick={handleLikeClick}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                color: isLiked ? "red" : "#ccc",
                transition: "color 0.2s",
                borderRadius: "4px",
                minWidth: "24px",
                minHeight: "24px"
              }}
            >
              ♥
            </button>
            <span style={{ fontWeight: "600", fontSize: "14px" }}>{likeCount}</span>
          </div>
          
          <span style={{ fontSize: "18px" }}>
            {getWeatherEmoji(outfit.weatherEmojis)}
          </span>
          
          {outfit.feeling && (
            <span style={{ fontSize: "18px" }}>
              {getFeelingEmoji(outfit.feeling)}
            </span>
          )}
        </div>

        {/* 두 번째 줄: 지역, 온도, 강수량, 습도 */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px", 
          fontSize: "11px", color: "#6b7280", userSelect: "text"
        }}>
          <span style={{ userSelect: "text" }}>📍 {getRegion(outfit) || "_"}</span>
          <span style={{ userSelect: "text" }}>🌡️ {getTemp(outfit) ? `${getTemp(outfit)}°C` : "_°C"}</span>
          <span style={{ userSelect: "text" }}>🌧️ {getRain(outfit) ? `${getRain(outfit)}mm` : "_mm"}</span>
          <span style={{ userSelect: "text" }}>💧 {getHumidity(outfit) && getHumidity(outfit) > 0 ? `${getHumidity(outfit)}%` : "_%"}</span>
        </div>
      </div>
    </div>
  );
} 
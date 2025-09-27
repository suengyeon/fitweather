import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toggleLike } from "../api/toggleLike";
import { toggleSubscription, checkSubscription } from "../api/subscribe";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";

function FeedCard({
  record,
  currentUserUid,
  onToggleLike,
  rank,
  selectedDate,
  selectedYear,
  selectedMonth,
  selectedDay,
  currentFilters,
}) {
  const navigate = useNavigate();
  const [imageIndex, setImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(record.likes?.includes(currentUserUid));
  const [likeCount, setLikeCount] = useState(record.likes?.length || 0);
  
  // 내 기록인지 확인
  const isMyRecord = record.uid === currentUserUid;

  // 구독 상태
  const [isSaved, setIsSaved] = useState(false);
  const [thumbsUpCount, setThumbsUpCount] = useState(0);
  const [thumbsDownCount, setThumbsDownCount] = useState(0);
  const [isThumbsUp, setIsThumbsUp] = useState(false);
  const [isThumbsDown, setIsThumbsDown] = useState(false);

  // 구독 상태 확인
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (!currentUserUid || !record.uid || currentUserUid === record.uid) return;
      
      try {
        const isSubscribed = await checkSubscription(currentUserUid, record.uid);
        setIsSaved(isSubscribed);
      } catch (error) {
        console.error("구독 상태 확인 실패:", error);
      }
    };

    checkSubscriptionStatus();
  }, [currentUserUid, record.uid]);

  // 체감 이모지
  const feelingEmojiMap = {
    steam: "🥟",
    hot: "🥵",
    nice: "👍🏻",
    cold: "💨",
    ice: "🥶",
  };
  const feelingEmoji = feelingEmojiMap[record.feeling] || "";

  const handleLikeClick = async (e) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
    try {
      await toggleLike(record.id, currentUserUid);
    } catch (err) {
      console.error("좋아요 토글 실패:", err);
      // 롤백
      setIsLiked(isLiked);
      setLikeCount((prev) => (isLiked ? prev + 1 : prev - 1));
    }
  };

  const handleSaveClick = async (e) => {
    e.stopPropagation();
    
    console.log("🔍 구독 버튼 클릭:", { currentUserUid, recordUid: record.uid, recordId: record.id });
    
    if (!currentUserUid || !record.uid) {
      console.error("❌ 사용자 정보가 없습니다:", { currentUserUid, recordUid: record.uid });
      return;
    }

    const previousState = isSaved;
    console.log("🔄 구독 상태 변경 전:", { isSaved: previousState });
    setIsSaved(!isSaved);
    
    try {
      console.log("📡 구독 API 호출 시작:", { followerId: currentUserUid, followingId: record.uid });
      const isSubscribed = await toggleSubscription(currentUserUid, record.uid);
      console.log("✅ 구독 토글 성공:", { recordId: record.id, isSubscribed });
    } catch (err) {
      console.error("❌ 구독 API 오류:", err);
      // 롤백
      setIsSaved(previousState);
    }
  };

  const handleThumbsUpClick = async (e) => {
    e.stopPropagation();
    if (isThumbsDown) {
      setIsThumbsDown(false);
      setThumbsDownCount((p) => p - 1);
    }
    setIsThumbsUp(!isThumbsUp);
    setThumbsUpCount((p) => (isThumbsUp ? p - 1 : p + 1));
    
    // TODO: 실제 좋아요 API 호출
    try {
      // await thumbsUpAPI(record.id, currentUserUid);
      console.log("👍 좋아요 API 호출:", record.id);
    } catch (err) {
      console.error("좋아요 API 오류:", err);
      // 롤백
      setIsThumbsUp(isThumbsUp);
      setThumbsUpCount((p) => (isThumbsUp ? p + 1 : p - 1));
    }
  };

  const handleThumbsDownClick = async (e) => {
    e.stopPropagation();
    if (isThumbsUp) {
      setIsThumbsUp(false);
      setThumbsUpCount((p) => p - 1);
    }
    setIsThumbsDown(!isThumbsDown);
    setThumbsDownCount((p) => (isThumbsDown ? p - 1 : p + 1));
    
    // TODO: 실제 싫어요 API 호출
    try {
      // await thumbsDownAPI(record.id, currentUserUid);
      console.log("👎 싫어요 API 호출:", record.id);
    } catch (err) {
      console.error("싫어요 API 오류:", err);
      // 롤백
      setIsThumbsDown(isThumbsDown);
      setThumbsDownCount((p) => (isThumbsDown ? p + 1 : p - 1));
    }
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setImageIndex((prev) => (prev - 1 + record.imageUrls.length) % record.imageUrls.length);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setImageIndex((prev) => (prev + 1) % record.imageUrls.length);
  };

  const handleClick = () => {
    if (record.uid === currentUserUid) {
      navigate("/record", { state: { existingRecord: record } });
    } else {
      const isFromRecommend = window.location.pathname.includes("/recommend");
      navigate(`/FeedDetail/${record.id}`, {
        state: {
          fromCard: true,
          fromFeed: !isFromRecommend,
          fromRecommend: isFromRecommend,
          region: record.region,
          date: selectedDate,
          year: selectedYear,
          month: selectedMonth,
          day: selectedDay,
          currentFilters: isFromRecommend ? currentFilters : undefined,
        },
      });
    }
  };

  return (
    <div
      className="rounded-lg cursor-pointer transition-all duration-100 hover:shadow-md"
      style={{
        width: "200px",
        height: "280px",
        backgroundColor: "rgba(209,213,219,0.6)",
        position: "relative",
        overflow: "hidden",
      }}
      onClick={handleClick}
    >
      {/* TOP3 뱃지 */}
      {rank && (
        <span style={{ position: "absolute", top: 8, left: 8, fontSize: 24, zIndex: 2 }}>
          {rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}
        </span>
      )}

      {/* 저장/구독 하트 - 내 기록이 아닐 때만 표시 */}
      {!isMyRecord && (
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
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "rgba(255, 255, 255, 1)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "rgba(255, 255, 255, 0.8)";
          }}
        >
          {isSaved ? <HeartIconSolid className="w-5 h-5 text-red-500" /> : <HeartIcon className="w-5 h-5 text-gray-600" />}
        </button>
      )}

      {/* 이미지 */}
      <div style={{ height: "230px", position: "relative" }}>
        {record.imageUrls?.length > 0 ? (
          <>
            <img src={record.imageUrls[imageIndex]} alt="코디" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "#e5e7eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#9ca3af",
              fontSize: "24px",
            }}
          >
            사진 없음
          </div>
        )}
      </div>

      {/* 정보 영역 */}
      <div style={{ padding: "10px 12px", height: "80px", display: "flex", flexDirection: "column", justifyContent: "flex-start" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
          {/* 좋아요/싫어요 (호버 = 활성 스타일) */}
          <div className="flex items-center gap-1.5">
            {/* 👍 좋아요 */}
            <button
              onClick={isMyRecord ? undefined : (e) => { e.stopPropagation(); handleThumbsUpClick(e); }}
              onMouseDown={isMyRecord ? undefined : (e) => e.stopPropagation()}
              disabled={isMyRecord}
              className={
                `inline-flex items-center gap-1 rounded-lg px-2 py-1.5 min-w-8 justify-center transition-colors
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400
       ${isMyRecord 
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : isThumbsUp
                    ? "bg-blue-500/20 text-blue-600 hover:bg-blue-500/10 hover:text-blue-600"
                    : "bg-white/70 text-gray-700 hover:bg-blue-500/10 hover:text-blue-600"
                }`
              }
            >
              <span className="text-[10px] pointer-events-none select-none">👍</span>
              <span className="text-[9px] font-semibold pointer-events-none select-none">
                {thumbsUpCount}
              </span>
            </button>

            {/* 👎 싫어요 */}
            <button
              onClick={isMyRecord ? undefined : (e) => { e.stopPropagation(); handleThumbsDownClick(e); }}
              onMouseDown={isMyRecord ? undefined : (e) => e.stopPropagation()}
              disabled={isMyRecord}
              className={
                `inline-flex items-center gap-1 rounded-lg px-2 py-1.5 min-w-8 justify-center transition-colors
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400
       ${isMyRecord
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : isThumbsDown
                    ? "bg-red-500/20 text-red-600 hover:bg-red-500/30 hover:text-red-600"
                    : "bg-white/70 text-gray-700 hover:bg-red-500/30 hover:text-red-600"
                }`
              }
            >
              <span className="text-[10px] pointer-events-none select-none">👎</span>
              <span className="text-[9px] font-semibold pointer-events-none select-none">
                {thumbsDownCount}
              </span>
            </button>
          </div>



          {/* 체감 정보만 */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {record.uid === currentUserUid ? (
              <>
                <span style={{ fontSize: 12, fontWeight: 600 }}>내 기록</span>
                <span style={{ fontSize: 16 }}>{feelingEmoji}</span>
              </>
            ) : (
              <span style={{ fontSize: 18 }}>{feelingEmoji}</span>
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
  zIndex: 10,
});

const indicatorStyle = {
  position: "absolute",
  bottom: "8px",
  left: "50%",
  transform: "translateX(-50%)",
  display: "flex",
  gap: "4px",
  zIndex: 10,
};

const dotStyle = (active) => ({
  width: "6px",
  height: "6px",
  borderRadius: "50%",
  backgroundColor: active ? "white" : "rgba(255,255,255,0.5)",
});

export default FeedCard;

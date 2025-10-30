import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getReactionSummary, getUserReaction, toggleThumbsUp, toggleThumbsDown } from "../api/reactions";
import { toggleSubscription, checkSubscription } from "../api/subscribe";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { HandThumbUpIcon, HandThumbDownIcon } from "@heroicons/react/24/outline";
import { navBtnStyle, indicatorStyle, dotStyle } from "../components/ImageCarouselStyles";

/**
 * 피드 카드 컴포넌트 - 개별 착장 기록 표시, 상호작용 처리
 * @param {Object} props.record - 표시할 착장 기록 데이터
 * @param {string} props.currentUserUid - 현재 로그인한 사용자 UID
 * @param {function} props.onToggleLike - (외부에서 정의된) 좋아요 토글 핸들러
 * @param {number} props.rank - 순위(TOP3 표시)
 */
function FeedCard({
  record,
  currentUserUid,
  rank,
  selectedDate,
  selectedYear,
  selectedMonth,
  selectedDay,
  currentFilters,
}) {
  const navigate = useNavigate();
  const [imageIndex, setImageIndex] = useState(0); // 현재 표시 중인 이미지 인덱스

  // 내 기록인지 확인
  const isMyRecord = record.uid === currentUserUid;

  // 1. 구독 상태(Follow)
  const [isSaved, setIsSaved] = useState(false);

  // 2. 좋아요/싫어요(thumbs up/down) 상태(reactions 컬렉션 기반)
  const [thumbsUpCount, setThumbsUpCount] = useState(0);
  const [thumbsDownCount, setThumbsDownCount] = useState(0);
  const [isThumbsUp, setIsThumbsUp] = useState(false);
  const [isThumbsDown, setIsThumbsDown] = useState(false);

  // --- Effect : 구독 상태 확인(Follow) ---
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      // 내 기록orUID 없으면 확인 불필요
      if (!currentUserUid || !record.uid || currentUserUid === record.uid) return;

      try {
        const isSubscribed = await checkSubscription(currentUserUid, record.uid);
        setIsSaved(isSubscribed); // 구독 상태 업데이트
      } catch (error) {
        console.error("구독 상태 확인 실패:", error);
      }
    };

    checkSubscriptionStatus();
  }, [currentUserUid, record.uid]); // 사용자or기록 작성자 UID 바뀔 때 실행

  // --- Effect : 좋아요/싫어요(Thumbs Reaction) 초기 상태 로드 ---
  useEffect(() => {
    let mounted = true; // 언마운트 시 상태 업데이트 방지 플래그
    const load = async () => {
      try {
        // 반응 요약 정보(카운트)&내 반응 상태 병렬 조회
        const [summary, myReaction] = await Promise.all([
          getReactionSummary(record.id),
          currentUserUid ? getUserReaction(record.id, currentUserUid) : Promise.resolve({ isThumbsUp: false, isThumbsDown: false })
        ]);
        if (!mounted) return;

        console.log('FeedCard - 반응 데이터 로드:', { summary, myReaction, recordId: record.id });

        // 상태 업데이트
        setThumbsUpCount(summary.thumbsUpCount || 0);
        setThumbsDownCount(summary.thumbsDownCount || 0);
        setIsThumbsUp(myReaction.isThumbsUp || false);
        setIsThumbsDown(myReaction.isThumbsDown || false);
      } catch (e) {
        console.error("FeedCard - 반응 정보 로드 실패:", e);
        // 오류 시 기본값 설정
        setThumbsUpCount(0);
        setThumbsDownCount(0);
        setIsThumbsUp(false);
        setIsThumbsDown(false);
      }
    };
    load();
    return () => { mounted = false; }; // Cleanup 함수
  }, [record.id, currentUserUid]); // 기록 ID&사용자 UID 바뀔 때 실행

  // --- 유틸리티 : 체감 이모지 매핑 ---
  const feelingEmojiMap = {
    steam: "🥟",
    hot: "🥵",
    nice: "👍🏻",
    cold: "💨",
    ice: "🥶",
  };
  const feelingEmoji = feelingEmojiMap[record.feeling] || "";

  // --- 핸들러 : 구독(Save/Follow) ---
  const handleSaveClick = async (e) => {
    e.stopPropagation(); // 카드 클릭 이벤트 방지

    if (!currentUserUid || !record.uid) {
      console.error("❌ 사용자 정보가 없습니다:", { currentUserUid, recordUid: record.uid });
      return;
    }

    const previousState = isSaved;
    // Optimistic Update
    setIsSaved(!isSaved);

    try {
      // 구독 상태 토글 API 호출
      await toggleSubscription(currentUserUid, record.uid);
    } catch (err) {
      console.error("❌ 구독 API 오류:", err);
      // Rollback
      setIsSaved(previousState);
    }
  };

  // --- 핸들러 : 좋아요(Thumbs Up) ---
  const handleThumbsUpClick = async (e) => {
    e.stopPropagation();
    if (!currentUserUid) return;

    const prevUp = isThumbsUp;
    const prevDown = isThumbsDown;

    // Optimistic Update
    if (prevDown) { // 싫어요(down) 상태였다면 해제
      setIsThumbsDown(false);
      setThumbsDownCount((p) => Math.max(0, p - 1));
    }
    // 좋아요(up) 상태 토글
    setIsThumbsUp(!prevUp);
    setThumbsUpCount((p) => (prevUp ? Math.max(0, p - 1) : p + 1));

    try {
      const result = await toggleThumbsUp(record.id, currentUserUid); // 서버 API 호출

      // 서버 응답 기반으로 최종 상태 재정규화(롤백 - catch 블록에서 처리)
      if (result === "up") {
        setIsThumbsUp(true);
      } else {
        setIsThumbsUp(false);
      }
      if (prevDown) { // 서버 응답에 의해 싫어요 해제
        setIsThumbsDown(false);
      }

      // 다른 컴포넌트or페이지에 상태 변경 이벤트 전송
      window.dispatchEvent(new CustomEvent('reactionUpdated', {
        detail: {
          recordId: record.id,
          type: 'thumbsUp',
          isActive: result === "up"
        }
      }));
    } catch (err) {
      console.error("FeedCard - 반응(👍) 업데이트 실패:", err);
      // Rollback
      setIsThumbsUp(prevUp);
      setThumbsUpCount((p) => (prevUp ? p + 1 : Math.max(0, p - 1)));
      if (prevDown) {
        setIsThumbsDown(true);
        setThumbsDownCount((p) => p + 1);
      }
    }
  };

  // --- 핸들러 : 싫어요(Thumbs Down) ---
  const handleThumbsDownClick = async (e) => {
    e.stopPropagation();
    if (!currentUserUid) return;

    const prevUp = isThumbsUp;
    const prevDown = isThumbsDown;

    // Optimistic Update
    if (prevUp) { // 좋아요(up) 상태였다면 해제
      setIsThumbsUp(false);
      setThumbsUpCount((p) => Math.max(0, p - 1));
    }
    // 싫어요(down) 상태 토글
    setIsThumbsDown(!prevDown);
    setThumbsDownCount((p) => (prevDown ? Math.max(0, p - 1) : p + 1));

    try {
      const result = await toggleThumbsDown(record.id, currentUserUid); // 서버 API 호출

      // 서버 응답 기반으로 최종 상태 재정규화
      if (result === "down") {
        setIsThumbsDown(true);
      } else {
        setIsThumbsDown(false);
      }
      if (prevUp) {
        setIsThumbsUp(false);
      }

      // 다른 컴포넌트or페이지에 상태 변경 이벤트 전송
      window.dispatchEvent(new CustomEvent('reactionUpdated', {
        detail: {
          recordId: record.id,
          type: 'thumbsDown',
          isActive: result === "down"
        }
      }));
    } catch (err) {
      console.error("FeedCard - 반응(👎) 업데이트 실패:", err);
      // Rollback
      setIsThumbsDown(prevDown);
      setThumbsDownCount((p) => (prevDown ? p + 1 : Math.max(0, p - 1)));
      if (prevUp) {
        setIsThumbsUp(true);
        setThumbsUpCount((p) => p + 1);
      }
    }
  };

  // --- 핸들러 : 이미지 슬라이드 네비게이션 ---
  const handlePrev = (e) => {
    e.stopPropagation();
    setImageIndex((prev) => (prev - 1 + record.imageUrls.length) % record.imageUrls.length);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setImageIndex((prev) => (prev + 1) % record.imageUrls.length);
  };

  // --- 핸들러 : 카드 클릭(상세 페이지 또는 수정 페이지로 이동) ---
  const handleClick = () => {
    if (record.uid === currentUserUid) {
      // 내 기록 : 기록 수정 페이지로 이동
      navigate("/record", { state: { existingRecord: record } });
    } else {
      // 다른 사람 기록 : 상세 피드 페이지로 이동
      const isFromRecommend = window.location.pathname.includes("/recommend");
      navigate(`/feed-detail/${record.id}`, {
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

  // --- 렌더링 ---
  return (
    <div
      className="rounded-lg cursor-pointer transition-all duration-100 hover:shadow-md"
      style={{
        width: "200px",
        height: "280px",
        backgroundColor: "rgba(209,213,219,0.6)", // 카드 배경색
        position: "relative",
        overflow: "hidden",
      }}
      onClick={handleClick} // 카드 본체 클릭 시 이동
    >
      {/* 1. TOP3 뱃지(rank props 있을 경우) */}
      {rank && (
        <span style={{ position: "absolute", top: 8, left: 8, fontSize: 24, zIndex: 2 }}>
          {rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}
        </span>
      )}

      {/* 2. 저장/구독 하트 버튼(내 기록 아닐 때만 표시) */}
      {!isMyRecord && (
        <button
          onClick={handleSaveClick}
          // 마우스 버튼 다운 이벤트 전파를 막아 카드 클릭 이벤트(handleClick) 실행 방지
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
          onMouseEnter={(e) => { e.target.style.background = "rgba(255, 255, 255, 1)"; }}
          onMouseLeave={(e) => { e.target.style.background = "rgba(255, 255, 255, 1)"; }}
        >
          {isSaved ? <HeartIconSolid className="w-5 h-5 text-red-500" /> : <HeartIcon className="w-5 h-5 text-gray-600" />}
        </button>
      )}

      {/* 3. 이미지 슬라이드 영역 */}
      <div style={{ height: "230px", position: "relative" }}>
        {record.imageUrls?.length > 0 ? (
          <>
            <img src={record.imageUrls[imageIndex]} alt="코디" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            {/* 이미지 네비게이션 버튼 및 인디케이터 */}
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
          // 이미지 없을 때 대체 UI
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

      {/* 4. 정보 영역(하단) */}
      <div style={{ padding: "10px 12px", height: "80px", display: "flex", flexDirection: "column", justifyContent: "flex-start" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>

          {/* 좋아요/싫어요 반응 버튼 그룹 */}
          <div className="flex items-center gap-1.5">
            {/* 👍 좋아요 버튼 */}
            <button
              onClick={isMyRecord ? undefined : (e) => { e.stopPropagation(); handleThumbsUpClick(e); }}
              onMouseDown={isMyRecord ? undefined : (e) => e.stopPropagation()}
              disabled={isMyRecord} // 내 기록이면 비활성화
              className={`inline-flex justify-center items-center gap-1 rounded-lg px-2 py-1.5 min-w-8  
                transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400
                ${isMyRecord
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : isThumbsUp
                    ? "bg-blue-500/20 text-blue-600 hover:bg-blue-500/10 hover:text-blue-600"
                    : "bg-white/70 text-gray-700 hover:bg-blue-500/10 hover:text-blue-600"
                }`
              }
            >
              <HandThumbUpIcon className={`w-4 h-4 ${isThumbsUp ? 'text-blue-500' : 'text-gray-500'}`} />
              <span className="text-[9px] font-semibold pointer-events-none select-none">
                {thumbsUpCount}
              </span>
            </button>

            {/* 👎 싫어요 버튼 */}
            <button
              onClick={isMyRecord ? undefined : (e) => { e.stopPropagation(); handleThumbsDownClick(e); }}
              onMouseDown={isMyRecord ? undefined : (e) => e.stopPropagation()}
              disabled={isMyRecord} // 내 기록이면 비활성화
              className={`inline-flex justify-center items-center gap-1 rounded-lg px-2 py-1.5 min-w-8  
                transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400
                ${isMyRecord
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : isThumbsDown
                    ? "bg-red-500/20 text-red-600 hover:bg-red-500/30 hover:text-red-600"
                    : "bg-white/70 text-gray-700 hover:bg-red-500/30 hover:text-red-600"
                }`
              }
            >
              <HandThumbDownIcon className={`w-4 h-4 ${isThumbsDown ? 'text-red-500' : 'text-gray-500'}`} />
              <span className="text-[9px] font-semibold pointer-events-none select-none">
                {thumbsDownCount}
              </span>
            </button>
          </div>

          {/* 체감 이모지 및 내 기록 표시 */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {record.uid === currentUserUid ? (
              <>
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

export default FeedCard;
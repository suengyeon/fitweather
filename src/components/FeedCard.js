import { toggleLike } from "../api/toggleLike";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function FeedCard({ record, currentUserUid, onToggleLike, rank }) {
  const navigate = useNavigate();
  const [imagePreviewIdx, setImagePreviewIdx] = useState(0);
  const liked = record.likes?.includes(currentUserUid);

  // 1. 닉네임: Firestore record에 nickname 필드가 없다면 uid로 대체
  const displayName = record.uid === currentUserUid ? "나의 기록" : (record.nickname || record.uid || "사용자");

  // 2. 메모(피드백)
  const feedback = record.memo || record.feedback || "";

  // 3. 체감 이모지(Record.js의 feeling 필드 기반)
  const feelingEmojiMap = {
    steam: "🥟", // 찐만두
    hot: "🥵",   // 더움
    nice: "👍🏻", // 적당
    cold: "💨",  // 추움
    ice: "🥶",   // 동태
  };
  const feelingEmoji = feelingEmojiMap[record.feeling] || "";

  // 4. 하트(♥️/♡) 아이콘
  const likeIcon = liked ? "♥" : "♡";

  // robust like click handler
  const handleLikeClick = (e) => {
    e.stopPropagation();
    if (onToggleLike) {
      onToggleLike(record.id, liked);
    }
  };

  const handleCardClick = () => {
    if (record.uid === currentUserUid) {
      navigate(`/calendar_record/${record.id}`);
    } else {
      navigate(`/FeedDetail/${record.id}`);
    }
  };

  return (
    <div
      className="aspect-[3/4] bg-gray-100 rounded p-2 flex flex-col justify-between cursor-pointer hover:shadow-md transition"
      style={{ minWidth: 180, maxWidth: 220, minHeight: 240, maxHeight: 320, position: "relative" }}
      onClick={handleCardClick}
    >
      {/* TOP3 순위 뱃지 */}
      {rank && (
        <span style={{
          position: "absolute",
          top: 8,
          left: 8,
          fontSize: 28,
          fontWeight: 700,
          zIndex: 2
        }}>
          {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `${rank}위`}
        </span>
      )}
      {/* 사진 캐러셀 */}
      {record.imageUrls && record.imageUrls.length > 0 ? (
        <div style={{ position: "relative", width: "100%", height: "85%", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img
            src={record.imageUrls[imagePreviewIdx]}
            alt="코디"
            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 10 }}
          />
          {record.imageUrls.length > 1 && (
            <div style={{ position: "absolute", bottom: 2, left: 0, right: 0, display: "flex", justifyContent: "space-between", padding: "0 4px" }}>
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  setImagePreviewIdx(prev => (prev - 1 + record.imageUrls.length) % record.imageUrls.length);
                }}
                style={{ background: "rgba(255,255,255,0.8)", border: "none", borderRadius: "50%", width: 24, height: 24, cursor: "pointer" }}
              >
                ◀
              </button>
              <span style={{ fontSize: 12, color: "#666", background: "rgba(255,255,255,0.8)", padding: "2px 6px", borderRadius: 8 }}>
                {imagePreviewIdx + 1} / {record.imageUrls.length}
              </span>
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  setImagePreviewIdx(prev => (prev + 1) % record.imageUrls.length);
                }}
                style={{ background: "rgba(255,255,255,0.8)", border: "none", borderRadius: "50%", width: 24, height: 24, cursor: "pointer" }}
              >
                ▶
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ width: "100%", height: "70%", background: "#eee", color: "#888", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10, marginBottom: 8, fontSize: 40 }}>
          사진 없음
        </div>
      )}

      {/* 닉네임/uid */}
      {/* (닉네임/피드백은 피드 카드에서 숨김) */}
      {/* 메모/피드백 */}
      {/* (피드백도 피드 카드에서 숨김) */}

      {/* 하트(♥️), 하트수, 체감 이모지 */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
        {/* 내 기록엔 하트 버튼 X, 하트수 O */}
        {record.uid === currentUserUid ? (
          <>
            <span style={{ color: "#111", fontSize: 22 }}>
              {"♥"}
            </span>
            <span style={{ fontWeight: 600 }}>{record.likes?.length || 0}</span>
            {/* 나의 기록 텍스트 */}
            <span style={{ margin: "0 8px", fontWeight: 700, color: "#222", fontSize: 16, letterSpacing: 1 }}>{"나의 기록"}</span>
            {/* 체감 이모지는 여기서만 */}
            <span style={{ fontSize: 20 }}>{feelingEmoji}</span>
          </>
        ) : (
          <button
            onClick={handleLikeClick}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 22,
              padding: 0
            }}
          >
            <span style={{ color: liked ? "red" : "#ccc" }}>
              {likeIcon}
            </span>
            <span style={{ marginLeft: 6, fontWeight: 600 }}>{record.likes?.length || 0}</span>
          </button>
        )}
        {/* 체감 이모지 오른쪽 (남의 기록만) */}
        {record.uid !== currentUserUid && (
          <span style={{ fontSize: 20, marginLeft: "auto" }}>{feelingEmoji}</span>
        )}
      </div>
    </div>
  );
}

export default FeedCard; 
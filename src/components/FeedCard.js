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
      navigate(`/feed_detail/${record.id}`);
    }
  };

  return (
    <div
      style={{ border: "1px solid #ccc", padding: "12px", marginBottom: "14px", cursor: "pointer", position: "relative" }}
      onClick={handleCardClick}
    >
      {/* TOP3 순위 뱃지 */}
      {rank && (
        <span style={{
          position: "absolute",
          top: 8,
          left: 8,
          fontSize: 22,
          fontWeight: 700,
          zIndex: 2
        }}>
          {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `${rank}위`}
        </span>
      )}
      {/* 사진 캐러셀 */}
      {record.imageUrls && record.imageUrls.length > 0 ? (
        <div style={{ position: "relative", width: 120, marginBottom: 8 }}>
          <img
            src={record.imageUrls[imagePreviewIdx]}
            alt="코디"
            style={{ width: 120, borderRadius: 10 }}
          />
          {record.imageUrls.length > 1 && (
            <div style={{ position: "absolute", bottom: 2, left: 0, right: 0, display: "flex", justifyContent: "space-between", padding: "0 4px" }}>
              <button
                onClick={() => setImagePreviewIdx(prev => (prev - 1 + record.imageUrls.length) % record.imageUrls.length)}
                style={{ background: "rgba(255,255,255,0.8)", border: "none", borderRadius: "50%", width: 24, height: 24, cursor: "pointer" }}
              >
                ◀
              </button>
              <span style={{ fontSize: 12, color: "#666", background: "rgba(255,255,255,0.8)", padding: "2px 6px", borderRadius: 8 }}>
                {imagePreviewIdx + 1} / {record.imageUrls.length}
              </span>
              <button
                onClick={() => setImagePreviewIdx(prev => (prev + 1) % record.imageUrls.length)}
                style={{ background: "rgba(255,255,255,0.8)", border: "none", borderRadius: "50%", width: 24, height: 24, cursor: "pointer" }}
              >
                ▶
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ width: 120, height: 80, background: "#eee", color: "#888", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10, marginBottom: 8 }}>
          사진 없음
        </div>
      )}

      {/* 닉네임/uid */}
      <div style={{ fontWeight: "bold", margin: "6px 0 4px 0" }}>
        {displayName}
      </div>

      {/* 메모/피드백 */}
      {feedback && (
        <div style={{ color: "#666", fontSize: 14, marginBottom: 8 }}>
          {feedback}
        </div>
      )}

      {/* 하트(♥️), 하트수, 체감 이모지 */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* 내 기록엔 하트 버튼 X, 하트수 O */}
        {record.uid === currentUserUid ? (
          <>
            <span style={{ color: liked ? "red" : "#ccc", fontSize: 22 }}>
              {likeIcon}
            </span>
            <span style={{ fontWeight: 600 }}>{record.likes?.length || 0}</span>
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

        {/* 체감 이모지 */}
        <span style={{ fontSize: 20 }}>{feelingEmoji}</span>
      </div>
    </div>
  );
}

export default FeedCard; 
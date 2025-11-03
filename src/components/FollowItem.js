// src/components/FollowItem.js

import React from 'react';

const FollowItem = ({ user, isSubscribed, onToggleSubscription, onNicknameClick }) => {
  
  // 닉네임 클릭 핸들러
  const handleNicknameClick = (e) => {
    e.stopPropagation();
    onNicknameClick(user.id, user.nickname); // Follow.js의 navigate 함수 호출
  };

  // 구독 버튼 클릭 핸들러
  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleSubscription(user.id); // useFollowData.js의 handleSubscriptionToggle 호출
  };
  
  // 💡 인라인 스타일 분리 (유지보수를 위해 객체로 관리)
  const buttonStyle = {
    cursor: "pointer",
    fontSize: "24px",
    transition: "all 0.2s ease",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    background: "transparent",
    // 구독 상태에 따른 색상 결정 (♥: 빨강, ♡: 회색)
    color: isSubscribed ? "#dc2626" : "#9ca3af" // Tailwind CSS: text-red-600 : text-gray-400
  };

  return (
    <li className="flex items-center gap-3 text-lg">
      {/* 구독 토글 버튼 */}
      <button
        onClick={handleToggle}
        onMouseDown={(e) => e.stopPropagation()} // 클릭 이벤트 전파 방지
        style={buttonStyle}
        onMouseEnter={(e) => { e.target.style.transform = "scale(1.2)"; }}
        onMouseLeave={(e) => { e.target.style.transform = "scale(1)"; }}
        aria-label={isSubscribed ? `${user.nickname} 구독 취소` : `${user.nickname} 구독하기`}
      >
        {isSubscribed ? "♥" : "♡"}
      </button>

      {/* 닉네임 */}
      <span
        className="font-semibold cursor-pointer hover:text-blue-600 transition-colors"
        onClick={handleNicknameClick}
      >
        {user.nickname}
      </span>
    </li>
  );
};

export default FollowItem;
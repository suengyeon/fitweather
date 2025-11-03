import React from "react";
import { useNavigate, useLocation } from "react-router-dom"; 
import { XMarkIcon } from "@heroicons/react/24/solid"; 

/**
 * MenuSidebar 컴포넌트 - 왼쪽에서 슬라이드 인/아웃 형태의 네비게이션 사이드바 모달
 */
export default function MenuSidebar({ isOpen, onClose }) {
  const navigate = useNavigate(); // 페이지 이동 훅
  const location = useLocation(); // 현재 경로 훅
  const currentPath = location.pathname; // 현재 URL 경로

  /**
   * 메뉴 항목 클릭 시 해당 경로로 이동, 사이드바 닫음
   * @param {string} path - 이동할 라우팅 경로
   */
  const handleMenuClick = (path) => {
    navigate(path);
    onClose(); // 페이지 이동 후 사이드바 닫기
  };

  /**
   * 현재 경로와 주어진 경로의 일치 여부를 확인(활성화 상태 결정)
   */
  const isActive = (path) => {
    return currentPath === path;
  };

  return (
    // 전체 모달 컨테이너 : 닫혀있을 때 클릭 이벤트 무시
    <div className={`fixed inset-0 z-50 flex ${!isOpen ? 'pointer-events-none' : ''}`}>
      
      {/* 1. 배경 오버레이(클릭 시 닫기) */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-500 
          ${isOpen ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'}
          `}
        onClick={onClose} // 오버레이 클릭 시 사이드바 닫기
      ></div>

      {/* 2. 사이드바 본체(왼쪽에서 슬라이드 인/아웃 애니메이션) */}
      <div className={`fixed left-0 top-0 h-full w-64 bg-gray-200 shadow-lg 
        transform transition-transform duration-500 ease-out 
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        ${!isOpen ? 'pointer-events-none' : ''}`}>
        
        <div className="p-6">
          {/* 닫기 버튼 */}
          <div className="flex justify-end mb-6">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-300 rounded"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Mypage */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Mypage</h2>
            <div className="space-y-2">
              {/* 메뉴 항목들 : 클릭 시 handleMenuClick 호출 및 활성화 상태(isActive)에 따라 스타일 변경 */}
              <button
                onClick={() => handleMenuClick("/mypage_userinfo")}
                className={`block w-full text-left px-3 py-2 rounded transition-colors 
                  ${isActive("/mypage_userinfo")
                  ? "text-gray-700 font-bold bg-blue-200" // 활성화 스타일
                  : "text-gray-700 hover:bg-gray-300" 
                  }`}
              >
                회원정보
              </button>
              <button
                onClick={() => handleMenuClick("/calendar")}
                className={`block w-full text-left px-3 py-2 rounded transition-colors 
                  ${isActive("/calendar")
                  ? "text-gray-700 font-bold bg-blue-200"
                  : "text-gray-700 hover:bg-gray-300"
                  }`}
              >
                Calendar
              </button>
              <button
                onClick={() => handleMenuClick("/follow")}
                className={`block w-full text-left px-3 py-2 rounded transition-colors 
                  ${isActive("/follow")
                  ? "text-gray-700 font-bold bg-blue-200"
                  : "text-gray-700 hover:bg-gray-300"
                  }`}
              >
               구독
              </button>
            </div>
          </div>

          {/* 우리동네 */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">우리 동네</h2>
            <div className="space-y-2">
              <button
                onClick={() => handleMenuClick("/feed")}
                className={`block w-full text-left px-3 py-2 rounded transition-colors 
                  ${isActive("/feed")
                  ? "text-gray-700 font-bold bg-blue-200"
                  : "text-gray-700 hover:bg-gray-300"
                  }`}
              >
                지역 피드
              </button>
            </div>
          </div>
          
          {/* 상세 추천 */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">상세 추천</h2>
            <button
              onClick={() => handleMenuClick("/recommend")}
              className={`block w-full text-left px-3 py-2 rounded transition-colors 
                ${isActive("/recommend")
                ? "text-gray-700 font-bold bg-blue-200"
                : "text-gray-700 hover:bg-gray-300"
                }`}
            >
              추천 코디
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
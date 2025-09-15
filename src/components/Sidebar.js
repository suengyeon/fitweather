import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { XMarkIcon } from "@heroicons/react/24/solid";

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const handleMenuClick = (path) => {
    navigate(path);
    onClose();
  };

  const isActive = (path) => {
    return currentPath === path;
  };

  return (
    <div className={`fixed inset-0 z-50 flex ${!isOpen ? 'pointer-events-none' : ''}`}>
      {/* 배경 오버레이 */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-500 ${isOpen ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'
          }`}
        onClick={onClose}
      ></div>

      {/* 사이드바 */}
      <div className={`fixed left-0 top-0 h-full w-64 bg-gray-200 shadow-lg transform transition-transform duration-500 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${!isOpen ? 'pointer-events-none' : ''}`}>
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

          {/* Mypage 섹션 */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Mypage</h2>
            <div className="space-y-2">
              <button
                onClick={() => handleMenuClick("/mypage_userinfo")}
                className={`block w-full text-left px-3 py-2 rounded transition-colors ${isActive("/mypage_userinfo")
                  ? "text-gray-700 font-bold bg-blue-200"
                  : "text-gray-700 hover:bg-gray-300"
                  }`}
              >
                회원정보
              </button>
              <button
                onClick={() => handleMenuClick("/calendar")}
                className={`block w-full text-left px-3 py-2 rounded transition-colors ${isActive("/calendar")
                  ? "text-gray-700 font-bold bg-blue-200"
                  : "text-gray-700 hover:bg-gray-300"
                  }`}
              >
                Calendar
              </button>
              <button
                onClick={() => handleMenuClick("/mypage_likes")}
                className={`block w-full text-left px-3 py-2 rounded transition-colors ${isActive("/mypage_likes")
                  ? "text-gray-700 font-bold bg-blue-200"
                  : "text-gray-700 hover:bg-gray-300"
                  }`}
              >
               구독
              </button>
            </div>
          </div>

          {/* 우리동네 섹션 */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">우리 동네</h2>
            <div className="space-y-2">
              <button
                onClick={() => handleMenuClick("/feed")}
                className={`block w-full text-left px-3 py-2 rounded transition-colors ${isActive("/feed")
                  ? "text-gray-700 font-bold bg-blue-200"
                  : "text-gray-700 hover:bg-gray-300"
                  }`}
              >
                지역 피드
              </button>
            </div>
          </div>
          
          {/* 상세 추천 섹션 */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">상세 추천</h2>
            <button
              onClick={() => handleMenuClick("/recommend")}
              className={`block w-full text-left px-3 py-2 rounded transition-colors ${isActive("/recommend")
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
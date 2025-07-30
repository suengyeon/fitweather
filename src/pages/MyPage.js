import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function MyPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleMenuClick = (path) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* 사이드바 */}
      <div className="w-64 bg-gray-200 p-6">
        {/* Mypage 섹션 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Mypage</h2>
          <div className="space-y-2">
            <button
              onClick={() => handleMenuClick("/mypage_userinfo")}
              className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-300 rounded transition-colors"
            >
              회원정보
            </button>
            <button
              onClick={() => handleMenuClick("/calendar")}
              className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-300 rounded transition-colors"
            >
              Calendar
            </button>
            <button
              onClick={() => handleMenuClick("/mypage_likes")}
              className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-300 rounded transition-colors"
            >
              내가 좋아요 한 코디
            </button>
          </div>
        </div>

        {/* 우리동네 섹션 */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">우리 동네</h2>
          <div className="space-y-2">
            <button
              onClick={() => handleMenuClick("/feed")}
              className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-300 rounded transition-colors"
            >
              피드 보기
            </button>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 p-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">마이페이지</h1>
          <p className="text-gray-600">
            왼쪽 메뉴에서 원하는 기능을 선택해주세요.
          </p>
          
          {user && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">현재 로그인 정보</h3>
              <p className="text-blue-700">이메일: {user.email}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
  
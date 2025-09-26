// src/pages/Follow.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bars3Icon, HomeIcon } from "@heroicons/react/24/solid";
import MenuSidebar from "../components/MenuSidebar";

export default function Follow() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 데모용 샘플 데이터 (추후 Firestore 연동)
  const following = ["바나나우유"];
  const followers = ["뽕따"];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col relative">
      {/* 사이드바 */}
      <MenuSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* 상단 네비게이션 (Feed.js와 동일 톤) */}
      <div className="flex justify-between items-center px-4 py-3 bg-blue-100 shadow">
        <button
          className="bg-blue-200 px-3 py-1 rounded-md hover:bg-blue-300"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Bars3Icon className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-lg">구독</h2>
        <button
          onClick={() => navigate("/")}
          className="bg-blue-200 px-3 py-1 rounded-md hover:bg-blue-300"
        >
          <HomeIcon className="w-5 h-5" />
        </button>
      </div>

      {/* 콘텐츠 */}
      <div className="max-w-6xl w-full mx-auto px-4 py-6 space-y-4">
        {/* 상단 라벨 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl py-2 text-center font-semibold">팔로잉</div>
          <div className="bg-white rounded-xl py-2 text-center font-semibold">팔로우</div>
        </div>

        {/* 2열 카드 영역 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 팔로잉 카드 */}
          <section className="bg-white rounded-2xl min-h-[70vh] p-4">
            <ul className="space-y-4">
              {following.length === 0 ? (
                <li className="text-sm text-gray-500">아직 팔로잉한 사용자가 없어요.</li>
              ) : (
                following.map((name) => (
                  <li key={name} className="flex items-center gap-3 text-lg">
                    <span className="text-xl">♥</span>
                    <span className="font-semibold">{name}</span>
                  </li>
                ))
              )}
            </ul>
          </section>

          {/* 팔로우 카드 */}
          <section className="bg-white rounded-2xl min-h-[60vh] p-4">
            <ul className="space-y-4">
              {followers.length === 0 ? (
                <li className="text-sm text-gray-500">아직 나를 팔로우한 사용자가 없어요.</li>
              ) : (
                followers.map((name) => (
                  <li key={name} className="flex items-center gap-3 text-lg">
                    <span className="text-xl">♡</span>
                    <span className="font-semibold">{name}</span>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import LikeCard from "./LikeCard";

export default function LikedList({ outfits, loading, selectedDate, onCardClick }) {
  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 h-full flex flex-col">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex-shrink-0">좋아요한 코디</h3>
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-3 gap-4 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-[3/4] bg-gray-200 rounded p-2 flex flex-col justify-between">
                <div className="w-full h-4/5 bg-gray-300 rounded mb-2"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-300 rounded"></div>
                  <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!selectedDate) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 h-full flex flex-col">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex-shrink-0">좋아요한 코디</h3>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500">왼쪽에서 날짜를 선택해주세요</p>
          </div>
        </div>
      </div>
    );
  }

  if (outfits.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 h-full flex flex-col">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex-shrink-0">좋아요한 코디</h3>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 mb-2">이 날짜에는 좋아요한 코디가 없습니다</p>
            <p className="text-sm text-gray-400">다른 날짜를 선택해보세요!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 h-full flex flex-col">
      <div className="w-full bg-gray-200 rounded px-4 py-3 mb-6 flex items-center justify-center">
        <h3 className="text-base font-bold text-gray-800">
          좋아요한 코디 ({outfits.length}개)
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-3 gap-4">
          {outfits.map((outfit) => (
            <LikeCard
              key={outfit.id}
              outfit={outfit}
              onClick={() => onCardClick(outfit.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 
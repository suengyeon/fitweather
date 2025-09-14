// 옷 추천 결과 표시 컴포넌트

import React from 'react';

function OutfitRecommendation({ recommendation, onSelectItem }) {
  if (!recommendation) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <p className="text-gray-500 text-center">추천 정보를 불러오는 중...</p>
      </div>
    );
  }

  const { season, feelingTemperature, weather, recommendedItems, confidence, tips, personalization } = recommendation;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* 헤더 정보 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-bold text-gray-800">오늘의 추천</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">신뢰도</span>
            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${confidence * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-700">
              {Math.round(confidence * 100)}%
            </span>
          </div>
        </div>
        
        {/* 절기 및 체감온도 정보 */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{season.emoji}</span>
            <span className="font-semibold text-gray-800">{season.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{feelingTemperature.emoji}</span>
            <span 
              className="font-semibold"
              style={{ color: feelingTemperature.color }}
            >
              {feelingTemperature.label}
            </span>
          </div>
        </div>
      </div>

      {/* 추천 옷 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {Object.entries(recommendedItems).map(([category, items]) => (
          <div key={category} className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-3 capitalize">
              {category === 'outer' ? '아우터' :
               category === 'top' ? '상의' :
               category === 'bottom' ? '하의' :
               category === 'shoes' ? '신발' :
               category === 'acc' ? '액세서리' : category}
            </h4>
            <div className="flex flex-wrap gap-2">
              {items.map((item, index) => (
                <button
                  key={index}
                  onClick={() => onSelectItem && onSelectItem(category, item)}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200 transition-colors"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 스타일 팁 */}
      {tips && tips.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">💡 스타일 팁</h4>
          <ul className="space-y-1">
            {tips.map((tip, index) => (
              <li key={index} className="text-yellow-700 text-sm">
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 개인화 정보 */}
      {personalization && personalization.personalizationScore > 0.3 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-2">🎯 개인화 정보</h4>
          <div className="space-y-2 text-sm">
            {personalization.userPatterns.totalRecords > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">분석된 기록:</span>
                <span className="font-medium">{personalization.userPatterns.totalRecords}개</span>
              </div>
            )}
            {personalization.userPatterns.preferredStyles.length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">선호 스타일:</span>
                <span className="font-medium">
                  {personalization.userPatterns.preferredStyles[0].style}
                </span>
              </div>
            )}
            {personalization.communityPatterns.totalRecords > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">지역 트렌드:</span>
                <span className="font-medium">
                  {personalization.communityPatterns.totalRecords}개 기록 분석
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">개인화 점수:</span>
              <span className="font-medium text-green-600">
                {Math.round(personalization.personalizationScore * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 날씨 정보 */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>날씨 스타일: {weather.style}</span>
          <span>분위기: {weather.mood}</span>
        </div>
      </div>
    </div>
  );
}

export default OutfitRecommendation;

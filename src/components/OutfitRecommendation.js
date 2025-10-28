import React from 'react';

/**
 * OutfitRecommendation 컴포넌트 - 날씨 및 사용자 패턴 분석 기반의 옷 추천 결과 표시 UI
 * * @param {Object} props - 컴포넌트 속성
 * @param {Object} props.recommendation - 옷 추천 결과 데이터 객체
 * @param {(category: string, item: string) => void} props.onSelectItem - 추천 항목 클릭 시 실행할 핸들러
 */
function OutfitRecommendation({ recommendation, onSelectItem }) {
  // 추천 데이터 없을 경우(로딩 중)
  if (!recommendation) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <p className="text-gray-500 text-center">추천 정보를 불러오는 중...</p>
      </div>
    );
  }

  // 추천 결과 객체에서 필요한 정보 구조 분해 할당
  const { season, feelingTemperature, weather, recommendedItems, confidence, tips, personalization } = recommendation;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      
      {/* 1. 헤더 정보 및 신뢰도 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-bold text-gray-800">오늘의 추천</h3>
          
          {/* 신뢰도 표시 바 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">신뢰도</span>
            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
              {/* 신뢰도 값(0.0~1.0)에 따라 채워지는 바 */}
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${confidence * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-700">
              {/* 신뢰도를 백분율로 표시 */}
              {Math.round(confidence * 100)}%
            </span>
          </div>
        </div>
        
        {/* 절기 및 체감온도 정보 */}
        <div className="flex items-center gap-4 mb-4">
          {/* 절기 정보(이모지 + 라벨) */}
          <div className="flex items-center gap-2">
            <span className="text-2xl">{season.emoji}</span>
            <span className="font-semibold text-gray-800">{season.label}</span>
          </div>
          {/* 체감온도 정보(이모지 + 라벨 + 색상) */}
          <div className="flex items-center gap-2">
            <span className="text-2xl">{feelingTemperature.emoji}</span>
            <span 
              className="font-semibold"
              style={{ color: feelingTemperature.color }} // 온도 따른 색상 적용
            >
              {feelingTemperature.label}
            </span>
          </div>
        </div>
      </div>

      {/* 2. 추천 옷 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* 추천 항목(recommendedItems)을 카테고리별로 순회 */}
        {Object.entries(recommendedItems).map(([category, items]) => (
          <div key={category} className="bg-gray-50 rounded-lg p-4">
            {/* 카테고리 제목(영어를 한국어로 매핑) */}
            <h4 className="font-semibold text-gray-800 mb-3 capitalize">
              {category === 'outer' ? '아우터' :
               category === 'top' ? '상의' :
               category === 'bottom' ? '하의' :
               category === 'shoes' ? '신발' :
               category === 'acc' ? '액세서리' : category}
            </h4>
            
            {/* 추천 아이템 태그 목록 */}
            <div className="flex flex-wrap gap-2">
              {items.map((item, index) => (
                <button
                  key={index}
                  // 항목 클릭 시 onSelectItem 핸들러 호출
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

      {/* 3. 스타일 팁 */}
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

      {/* 4. 개인화 정보(개인화 점수가 0.3 초과일 때만 표시) */}
      {personalization && personalization.personalizationScore > 0.3 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-2">🎯 개인화 정보</h4>
          <div className="space-y-2 text-sm">
            {/* 분석된 총 기록 수 */}
            {personalization.userPatterns.totalRecords > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">분석된 기록:</span>
                <span className="font-medium">{personalization.userPatterns.totalRecords}개</span>
              </div>
            )}
            {/* 선호 스타일 */}
            {personalization.userPatterns.preferredStyles.length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">선호 스타일:</span>
                <span className="font-medium">
                  {/* 가장 선호하는 스타일 하나만 표시 */}
                  {personalization.userPatterns.preferredStyles[0].style}
                </span>
              </div>
            )}
            {/* 지역 트렌드 분석 기록 수 */}
            {personalization.communityPatterns.totalRecords > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">지역 트렌드:</span>
                <span className="font-medium">
                  {personalization.communityPatterns.totalRecords}개 기록 분석
                </span>
              </div>
            )}
            {/* 최종 개인화 점수 */}
            <div className="flex justify-between">
              <span className="text-gray-600">개인화 점수:</span>
              <span className="font-medium text-green-600">
                {Math.round(personalization.personalizationScore * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 5. 날씨 분석 정보 */}
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
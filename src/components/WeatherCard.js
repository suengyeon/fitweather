import React from "react";

// --- 유틸리티 함수 ---
/**
 * 날씨 아이콘 코드에 따른 이모지 반환 함수
 * @param {string} iconCode - 날씨 아이콘 코드(예: "sunny", "rain")
 * @returns {string} 해당 날씨 나타내는 이모지
 */
function getWeatherEmoji(iconCode) {
  switch (iconCode) {
    case "sunny": return "☀️";        // 맑음
    case "cloudy": return "☁️";       // 구름많음
    case "overcast": return "🌥️";     // 흐림
    case "rain": return "🌧️";        // 비
    case "snow": return "❄️";        // 눈
    case "snow_rain": return "🌨️";   // 비/눈(진눈깨비)
    case "shower": return "🌦️";      // 소나기
    default: return "☁️";            // 기본값: 구름
  }
}

/**
 * WeatherCard 컴포넌트 - 날씨 정보(아이콘, 온도, 강수량, 습도) 표시하는 카드 UI
 * @param {Object} props - 컴포넌트 속성
 * @param {number} props.temp - 온도 (°C)
 * @param {number} props.rain - 강수량 (mm)
 * @param {number} props.humidity - 습도 (%)
 * @param {string} props.icon - 날씨 아이콘 코드
 * @param {string} [props.bgColor="bg-gray-100"] - 배경색 Tailwind 클래스
 * @param {boolean} [props.isHome=false] - 홈 화면 사용 여부(레이아웃 변경)
 * @param {boolean} [props.labelRight=false] - 라벨 위치(오른쪽 정렬 레이아웃)
 * @param {boolean} [props.isRecord=false] - Record 페이지 사용 여부(부가 정보 숨김)
 * @param {function} [props.onIconClick=null] - 아이콘 클릭 핸들러
 */
export default function WeatherCard({ temp, rain, humidity, icon, bgColor = "bg-gray-100", isHome = false, labelRight = false, isRecord = false, onIconClick = null }) {
    
    // 아이콘 코드 -> 이모지 변환
    const iconText = getWeatherEmoji(icon);
  
    return (
      <div className="flex flex-col items-center">
        
        {/* 1. 날씨 아이콘 박스 */}
        <div 
          // 클릭 핸들러가 있으면 커서/호버 효과 및 클릭 이벤트 적용
          className={`w-60 h-60 ${bgColor} rounded mb-8 flex items-center justify-center text-6xl relative overflow-hidden ${onIconClick ? 'cursor-pointer hover:bg-gray-300 transition-colors' : ''}`}
          onClick={onIconClick}
        >
          {/* 이모지 아이콘(애니메이션 적용) */}
          <div 
            className="absolute text-8xl animate-bounce"
          >
            {iconText}
          </div>
        </div>

        {/* 2. 날씨 상세 정보 */}
        {/* isRecord 플래그==false일 때만 온도, 강수량, 습도 표시 */}
        {!isRecord && (
          <>
            {/* 2-1. labelRight 레이아웃(세부 정보 페이지 등에서 사용) */}
            {labelRight ? (
              <div className="flex flex-col space-y-5 mb-6">
                {/* 온도 */}
                <div className="flex items-center justify-center">
                  <span className="mr-4 text-base font-medium">온도</span>
                  <div className="bg-white px-4 py-2 rounded text-center">
                    <span className="text-base font-semibold">{temp}°C</span>
                  </div>
                </div>
                {/* 강수량 */}
                <div className="flex items-center justify-center">
                  <span className="mr-4 text-base font-medium">강수량</span>
                  <div className="bg-white px-4 py-2 rounded text-center">
                    <span className="text-base font-semibold">{rain}mm</span>
                  </div>
                </div>
                {/* 습도 */}
                <div className="flex items-center justify-center">
                  <span className="mr-4 text-base font-medium">습도</span>
                  <div className="bg-white px-4 py-2 rounded text-center">
                    <span className="text-base font-semibold">{humidity ? `${humidity}%` : "기록 없음"}</span>
                  </div>
                </div>
              </div>
            ) : isHome ? (
              // 2-2. isHome 레이아웃(홈 페이지용 가로 정렬)
              <div className="flex space-x-4 mb-8">
                <div className="bg-blue-100 px-4 py-2 rounded text-center">
                  <div className="text-xs text-gray-600 mb-1">온도</div>
                  <span className="text-lg font-semibold">{temp}°C</span>
                </div>
                <div className="bg-blue-100 px-4 py-2 rounded text-center">
                  <div className="text-xs text-gray-600 mb-1">강수량</div>
                  <span className="text-lg font-semibold">{rain}mm</span>
                </div>
                <div className="bg-blue-100 px-4 py-2 rounded text-center">
                  <div className="text-xs text-gray-600 mb-1">습도</div>
                  <span className="text-lg font-semibold">{humidity ? `${humidity}%` : "기록 없음"}</span>
                </div>
              </div>
            ) : (
              // 2-3. 기본 레이아웃(다른 페이지용 세로 정렬)
              <div className="flex flex-col space-y-4 mb-8">
                <div className="bg-blue-100 px-4 py-2 rounded text-center">
                  <span className="text-lg font-semibold">온도: {temp}°C</span>
                </div>
                <div className="bg-blue-100 px-4 py-2 rounded text-center">
                  <span className="text-lg font-semibold">강수량: {rain}mm</span>
                </div>
                <div className="bg-blue-100 px-4 py-2 rounded text-center">
                  <span className="text-lg font-semibold">습도: {humidity ? `${humidity}%` : "기록 없음"}</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }
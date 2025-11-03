/**
 * 날씨 아이콘 코드에 따른 이모지 반환
 * @param {string} iconCode - 날씨 아이콘 코드
 * @returns {string} 날씨 이모지
 */
export function getWeatherEmoji(iconCode) {
    switch (iconCode) {
        case "sunny": return "☀️";        // 맑음
        case "cloudy": return "☁️";       // 구름많음
        case "overcast": return "🌥️";     // 흐림
        case "rain": return "🌧️";        // 비
        case "snow": return "❄️";        // 눈
        case "snow_rain": return "🌨️";   // 비/눈
        case "shower": return "🌦️";      // 소나기
    }
}

// 1. 매핑 데이터 자체를 상수로 export
export const feelingMap = {
    steam: "🥟 (찐만두)",
    hot: "🥵 (더움)",
    nice: "👍🏻 (적당)",
    cold: "💨 (추움)",
    ice: "🥶 (동태)",
};

// 2. 단일 값 변환 함수
export function feelingToEmoji(feeling) {
    return feelingMap[feeling] || feeling;
}

// 3. 드롭다운 옵션 배열을 동적으로 생성하여 export
export const getFeelingOptions = () => {
    return Object.entries(feelingMap).map(([value, label]) => ({
        value,
        label
    }));
};
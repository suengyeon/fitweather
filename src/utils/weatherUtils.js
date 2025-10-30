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

/**
 * 체감 온도(feeling) 값에 따른 이모지&텍스트 반환
 * @param {string} feeling - 체감 온도 값(steam, hot, nice, cold, ice)
 * @returns {string} 체감 이모지 + 텍스트
 */
export function feelingToEmoji(feeling) {
    const map = {
        steam: "🥟 (찐만두)",
        hot: "🥵 (더움)",
        nice: "👍🏻 (적당)",
        cold: "💨 (추움)",
        ice: "🥶 (동태)",
    };
    return map[feeling] || feeling;
}
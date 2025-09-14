// forecastUtils.js

/**
 * 예보 데이터 배열에서 다음 시간대 예보를 추출하는 함수
 * @param {Array} items - KMA 예보 item 배열
 * @returns {Object|null} - 다음 예보 { temp, rainAmount, humidity, sky, pty, iconCode, fcstTime }
 */
export function selectNextForecast(items) {
    if (!items || !Array.isArray(items)) return null;
  
    const now = new Date();
    const currHour = now.getHours();
    const currTime = `${currHour.toString().padStart(2, "0")}00`;
  
    // 다음 시간대 찾기 (TMP 기준)
    const tmpList = items.filter((item) => item.category === "TMP");
    const nextTmp = tmpList.find((item) => item.fcstTime >= currTime);
  
    if (!nextTmp) return null;
  
    const fcstTime = nextTmp.fcstTime;
  
    // 같은 시간대의 다른 예보값 찾기
    const findValue = (category) =>
      items.find((i) => i.category === category && i.fcstTime === fcstTime)?.fcstValue;
  
    const sky = findValue("SKY") || "1";  // 하늘 상태
    const pty = findValue("PTY") || "0";  // 강수 형태
  
    return {
      temp: nextTmp.fcstValue,
      rainAmount: findValue("RN1") || "0",  // 1시간 강수량
      humidity: findValue("REH") || null,   // 습도 (REH: 상대습도)
      sky: sky,                             // 하늘 상태 (SKY)
      pty: pty,                             // 강수 형태 (PTY)
      iconCode: getWeatherIcon(sky, pty),   // SKY와 PTY를 조합한 아이콘 코드
      fcstTime,
    };
  }

/**
 * SKY(하늘 상태)와 PTY(강수 형태)를 조합하여 날씨 아이콘 코드를 반환
 * @param {string} sky - 하늘 상태 (1: 맑음, 3: 구름많음, 4: 흐림)
 * @param {string} pty - 강수 형태 (0: 없음, 1: 비, 2: 비/눈, 3: 눈, 4: 소나기)
 * @returns {string} - 날씨 아이콘 코드
 */
function getWeatherIcon(sky, pty) {
  // PTY 조건문을 순서대로 실행
  if (pty === "1") {
    return "rain";      // 비 - 🌧️
  }
  
  if (pty === "2") {
    return "snow_rain"; // 비/눈 - 🌨️
  }
  
  if (pty === "3") {
    return "snow";      // 눈 - ❄️
  }
  
  if (pty === "4") {
    return "shower";    // 소나기 - 🌦️
  }
  
  // PTY가 0이고 SKY 조건문 실행
  if (pty === "0" && sky === "1") {
    return "sunny";     // 맑음 - ☀️
  }
  
  if (pty === "0" && sky === "3") {
    return "cloudy";    // 구름 많음 - ☁️
  }
  
  if (pty === "0" && sky === "4") {
    return "overcast";  // 흐림 - 🌥️
  }
  
  // 예외 처리: 위의 어떤 조건에도 해당하지 않으면
  console.error(`날씨 아이콘 조건 오류 - PTY: ${pty}, SKY: ${sky}`);
  return "cloudy";      // 기본값: 구름 - ☁️
}
  
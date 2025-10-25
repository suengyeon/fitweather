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
    const tavg = findValue("TAVG") || nextTmp.fcstValue;  // 일평균 기온 (없으면 현재 기온 사용)
  
    // 계절 구분 로직 실행 (절기 + 온도 조합)
    const season = getSeason(tavg, new Date());
    const weatherExpression = getWeatherExpression(season, nextTmp.fcstValue);
    
    return {
      temp: nextTmp.fcstValue,
      tavg: tavg,                          // 일평균 기온
      rainAmount: findValue("RN1") || "0",  // 1시간 강수량
      humidity: findValue("REH") || null,   // 습도 (REH: 상대습도)
      sky: sky,                             // 하늘 상태 (SKY)
      pty: pty,                             // 강수 형태 (PTY)
      iconCode: getWeatherIcon(sky, pty),   // SKY와 PTY를 조합한 아이콘 코드
      season: season,                       // 계절 분류
      weatherExpression: weatherExpression, // 감성적인 날씨 표현
      seasonColor: getSeasonColor(season),  // 계절별 색상
      expressionColor: getExpressionColor(weatherExpression), // 감성 표현별 색상
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

/**
 * 절기 기준 세부 계절 판별
 * (24절기 기반, 온도 미사용)
 */
export function getDetailedSeasonByLunar(date = new Date()) {
  const y = date.getFullYear();

  // 평균 절기 날짜 (±1일 오차)
  const terms = {
    입춘: new Date(y, 1, 4),
    춘분: new Date(y, 2, 21),
    입하: new Date(y, 4, 6),
    하지: new Date(y, 5, 21),
    소서: new Date(y, 6, 7),
    대서: new Date(y, 6, 22),
    입추: new Date(y, 7, 8),
    추분: new Date(y, 8, 23),
    한로: new Date(y, 9, 8),
    입동: new Date(y, 10, 7),
    대설: new Date(y, 11, 7),
    동지: new Date(y, 11, 22),
  };

  // 순차적 비교
  if (date >= terms.입춘 && date < terms.춘분) return "초봄";
  if (date >= terms.춘분 && date < terms.입하) return "봄";
  if (date >= terms.입하 && date < terms.하지) return "늦봄";
  if (date >= terms.하지 && date < terms.소서) return "초여름";
  if (date >= terms.소서 && date < terms.대서) return "여름";
  if (date >= terms.대서 && date < terms.입추) return "늦여름";
  if (date >= terms.입추 && date < terms.추분) return "초가을";
  if (date >= terms.추분 && date < terms.한로) return "가을";
  if (date >= terms.한로 && date < terms.입동) return "늦가을";
  if (date >= terms.입동 && date < terms.대설) return "초겨울";
  if (date >= terms.대설 && date < terms.동지) return "겨울";
  if (date >= terms.동지 || date < terms.입춘) return "늦겨울";

  return "가을"; // fallback
}

/**
 * 절기 기반 세부 계절 구분 (기존 함수 호환성 유지)
 * @param {string} tavg - 일평균 기온 (사용하지 않음)
 * @param {Date} date - 날짜 객체 (기본값: 현재 날짜)
 * @returns {string} - 계절명
 */
export function getSeason(tavg, date = new Date()) {
  return getDetailedSeasonByLunar(date);
}



/**
 * 계절에 따른 감성적인 날씨 표현을 반환하는 함수
 * @param {string} season - 계절명
 * @param {string} temp - 현재 기온
 * @returns {string} - 감성적인 날씨 표현
 */
function getWeatherExpression(season, temp) {
  const temperature = parseFloat(temp);
  
  // 봄 (초봄, 봄, 늦봄)
  if (season.includes("봄")) {
    if (temperature >= 20) return "따뜻해요";
    if (temperature >= 15) return "포근해요";
    if (temperature >= 10) return "시원해요";
    return "쌀쌀해요";
  }
  
  // 여름 (초여름, 여름, 늦여름)
  if (season.includes("여름")) {
    if (temperature >= 33) return "너무 더워요";
    if (temperature >= 30) return "무척 더워요";
    if (temperature >= 27) return "더워요";
    if (temperature >= 23) return "딱 좋아요";
    return "시원해요";
  }
  
  // 가을 (초가을, 가을, 늦가을)
  if (season.includes("가을")) {
    if (temperature >= 20) return "따뜻해요";
    if (temperature >= 15) return "선선해요";
    if (temperature >= 10) return "시원해요";
    return "쌀쌀해요";
  }
  
  // 겨울 (초겨울, 겨울, 늦겨울)
  if (season.includes("겨울")) {
    if (temperature >= 5) return "쌀쌀해요";
    if (temperature >= 0) return "추워요";
    if (temperature >= -5) return "매우 추워요";
    return "꽁꽁 얼겠어요";
  }
  
  // 예외 처리: 계절을 판단할 수 없는 경우
  console.error(`날씨 표현 조건 오류 - 계절: ${season}, 기온: ${temp}`);
  return "시원해요"; // 기본값
}

/**
 * 계절별 텍스트 색상을 반환하는 함수
 * @param {string} season - 계절명
 * @returns {string} - 색상 코드
 */
function getSeasonColor(season) {
  // 봄 (초봄, 봄, 늦봄): 연두색
  if (season.includes("봄")) {
    return "#8BC34A";
  }
  // 여름 (초여름, 여름, 늦여름): 파란색
  else if (season.includes("여름")) {
    return "#2196F3";
  }
  // 가을 (초가을, 가을, 늦가을): 갈색
  else if (season.includes("가을")) {
    return "#795548";
  }
  // 겨울 (초겨울, 겨울, 늦겨울): 진한 파란색
  else if (season.includes("겨울")) {
    return "#1A237E";
  }
  // 기본값
  else {
    return "#795548";
  }
}

/**
 * 감성 표현별 텍스트 색상을 반환하는 함수
 * @param {string} expression - 감성적인 날씨 표현
 * @returns {string} - 색상 코드
 */
function getExpressionColor(expression) {
  // 강렬한 더위 표현: 빨간색
  if (expression === "너무 더워요" || expression === "무척 더워요") {
    return "#F44336";
  }
  // 따뜻한 표현: 주황색
  else if (expression === "따뜻해요" || expression === "포근해요") {
    return "#FF9800";
  }
  // 시원한 표현: 하늘색
  else if (expression === "시원해요" || expression === "선선해요") {
    return "#03A9F4";
  }
  // 쌀쌀한 표현: 남색
  else if (expression === "쌀쌀해요") {
    return "#3F51B5";
  }
  // 추위 표현: 밝은 파란색
  else if (expression === "추워요" || expression === "꽁꽁 얼겠어요") {
    return "#81D4FA";
  }
  // 기본값
  else {
    return "#03A9F4";
  }
}

// 함수들을 export
export { getWeatherExpression, getExpressionColor };
  
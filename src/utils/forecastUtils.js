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
 * 절기와 온도를 조합한 계절 판별 함수
 * @param {string} tavg - 일평균 기온
 * @param {Date} date - 날짜 객체 (기본값: 현재 날짜)
 * @returns {string} - 계절명
 */
function getSeason(tavg, date = new Date()) {
  const temperature = parseFloat(tavg);
  const currentMonth = date.getMonth() + 1; // 1-12월
  
  // 1차 기준: 절기로 큰 계절 구분
  const seasonBySolarTerm = getSeasonBySolarTerm(date);
  
  // 2차 기준: 온도 세부 구분
  const isRisingSeason = currentMonth >= 2 && currentMonth <= 7;
  
  // 해당 계절 구간 안에서 온도 세부 구분 적용
  if (seasonBySolarTerm === "봄") {
    return getDetailedSeason(temperature, isRisingSeason, "봄");
  } else if (seasonBySolarTerm === "여름") {
    return getDetailedSeason(temperature, isRisingSeason, "여름");
  } else if (seasonBySolarTerm === "가을") {
    return getDetailedSeason(temperature, isRisingSeason, "가을");
  } else if (seasonBySolarTerm === "겨울") {
    return getDetailedSeason(temperature, isRisingSeason, "겨울");
  }
  
  // 예외 처리
  return getDetailedSeason(temperature, isRisingSeason, "겨울");
}

/**
 * 절기를 기준으로 큰 계절을 판별하는 함수
 * @param {Date} date - 날짜 객체
 * @returns {string} - 큰 계절 (봄/여름/가을/겨울)
 */
function getSeasonBySolarTerm(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // 2024년 절기 날짜 (음력 기준)
  const solarTerms = getSolarTerms(year);
  
  // 현재 날짜를 YYYY-MM-DD 형식으로 변환
  const currentDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  
  // 절기별 계절 구분
  if (currentDate >= solarTerms.입동 && currentDate < solarTerms.입춘) {
    return "겨울";
  } else if (currentDate >= solarTerms.입춘 && currentDate < solarTerms.입하) {
    return "봄";
  } else if (currentDate >= solarTerms.입하 && currentDate < solarTerms.입추) {
    return "여름";
  } else if (currentDate >= solarTerms.입추 && currentDate < solarTerms.입동) {
    return "가을";
  } else {
    // 연말/연초 처리 (입동 이후 ~ 입춘 이전)
    return "겨울";
  }
}

/**
 * 해당 연도의 주요 절기 날짜를 반환하는 함수
 * @param {number} year - 연도
 * @returns {Object} - 절기 날짜 객체
 */
function getSolarTerms(year) {
  // 실제 절기 날짜는 천문학적 계산이 필요하지만, 
  // 여기서는 대략적인 양력 날짜로 근사치를 사용
  const terms = {
    2024: {
      입동: "2024-11-07",  // 입동 (11월 7일경)
      입춘: "2025-02-04",  // 입춘 (2월 4일경)
      입하: "2024-05-05",  // 입하 (5월 5일경)
      입추: "2024-08-07"   // 입추 (8월 7일경)
    },
    2025: {
      입동: "2025-11-07",
      입춘: "2026-02-04",
      입하: "2025-05-05",
      입추: "2025-08-07"
    },
    2026: {
      입동: "2026-11-07",
      입춘: "2027-02-04",
      입하: "2026-05-05",
      입추: "2026-08-07"
    }
  };
  
  return terms[year] || terms[2024]; // 기본값으로 2024년 사용
}

/**
 * 온도와 계절 구간을 고려한 세부 계절 판별 함수
 * @param {number} temperature - 온도
 * @param {boolean} isRisingSeason - 올라가는 시기 여부
 * @param {string} baseSeason - 기본 계절 (봄/여름/가을/겨울)
 * @returns {string} - 세부 계절명
 */
function getDetailedSeason(temperature, isRisingSeason, baseSeason) {
  // 올라가는 시기 (2~7월)
  if (isRisingSeason) {
    if (temperature <= -5) return "늦겨울";
    if (temperature <= 0) return "겨울";
    if (temperature <= 5) return "초겨울";
    if (temperature <= 10) return "늦가을";
    if (temperature <= 15) return "가을";
    if (temperature <= 20) return "초가을";
    if (temperature < 25) return "늦봄";
    if (temperature < 28) return "초여름";
    return "여름";
  }
  
  // 내려가는 시기 (8~1월)
  else {
    if (temperature >= 28) return "늦여름";
    if (temperature >= 25) return "여름";
    if (temperature >= 20) return "초여름";
    if (temperature >= 15) return "늦봄";
    if (temperature >= 10) return "봄";
    if (temperature >= 5) return "초봄";
    if (temperature > 0) return "늦겨울";
    if (temperature > -5) return "겨울";
    return "늦겨울";
  }
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
  
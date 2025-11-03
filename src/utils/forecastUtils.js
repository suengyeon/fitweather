/**
 * 예보 데이터 배열에서 다음 시간대 예보 추출하는 함수
 */
export function selectNextForecast(items) {
    if (!items || !Array.isArray(items)) return null;
  
    const now = new Date();
    const currHour = now.getHours();
    // 현재 시간(HH00 형식) 계산
    const currTime = `${currHour.toString().padStart(2, "0")}00`;
  
    // TMP(기온) 기준으로 현재 시각 이후의 다음 예보 찾기
    const tmpList = items.filter((item) => item.category === "TMP");
    const nextTmp = tmpList.find((item) => item.fcstTime >= currTime);
  
    if (!nextTmp) return null;
  
    const fcstTime = nextTmp.fcstTime;
  
    // 같은 시간대 다른 예보값 찾기 헬퍼 함수
    const findValue = (category) =>
      items.find((i) => i.category === category && i.fcstTime === fcstTime)?.fcstValue;
  
    const sky = findValue("SKY") || "1";  // 하늘 상태
    const pty = findValue("PTY") || "0";  // 강수 형태
    const tavg = findValue("TAVG") || nextTmp.fcstValue;  // 일평균 기온(없으면 현재 기온 사용)
  
    // 계절 및 감성 표현 결정
    const season = getSeason(tavg, new Date());
    const weatherExpression = getWeatherExpression(season, nextTmp.fcstValue);
    
    // 표준화된 결과 객체 반환
    return {
      temp: nextTmp.fcstValue,
      tavg: tavg,                          
      rainAmount: findValue("RN1") || "0",  
      humidity: findValue("REH") || null,   
      sky: sky,                             
      pty: pty,                             
      iconCode: getWeatherIcon(sky, pty),   // SKY & PTY 조합 아이콘
      season: season,                       // 절기 기반 계절 분류
      weatherExpression: weatherExpression, 
      seasonColor: getSeasonColor(season),  // 계절별 색상
      expressionColor: getExpressionColor(weatherExpression), // 감성 표현별 색상
      fcstTime,
    };
  }

/**
 * SKY(하늘 상태) & PTY(강수 형태)를 조합하여 날씨 아이콘 코드 반환
 */
function getWeatherIcon(sky, pty) {
  // PTY(강수 형태) 우선 체크
  if (pty === "1") return "rain";      
  if (pty === "2") return "snow_rain"; 
  if (pty === "3") return "snow";      
  if (pty === "4") return "shower";    
  
  // PTY가 0일 때 SKY 조건 체크
  if (pty === "0" && sky === "1") return "sunny";     
  if (pty === "0" && sky === "3") return "cloudy";    
  if (pty === "0" && sky === "4") return "overcast";  
  
  // 예외 처리
  console.error(`날씨 아이콘 조건 오류 - PTY: ${pty}, SKY: ${sky}`);
  return "cloudy";      // 기본값
}

/**
 * 절기 기준 세부 계절 판별 (24절기 기반)
 */
export function getDetailedSeasonByLunar(date = new Date()) {
  const y = date.getFullYear();

  // 평균 절기 날짜(24절기 중 12개)
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

  // 순차적으로 날짜 범위 비교하여 세부 계절 반환
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
 * 절기 기반 세부 계절 구분(기존 함수 호환성 유지)
 */
export function getSeason(tavg, date = new Date()) {
  return getDetailedSeasonByLunar(date);
}

/**
 * 계절에 따른 감성적인 날씨 표현 반환하는 함수(온도 기반)
 */
function getWeatherExpression(season, temp) {
  const temperature = parseFloat(temp);
  
  // 계절별 온도 범위에 따라 표현 결정
  if (season.includes("봄")) {
    if (temperature >= 20) return "따뜻해요";
    if (temperature >= 15) return "포근해요";
    if (temperature >= 10) return "시원해요";
    return "쌀쌀해요";
  }
  
  if (season.includes("여름")) {
    if (temperature >= 33) return "너무 더워요";
    if (temperature >= 30) return "무척 더워요";
    if (temperature >= 27) return "더워요";
    if (temperature >= 23) return "딱 좋아요";
    return "시원해요";
  }
  
  if (season.includes("가을")) {
    if (temperature >= 20) return "따뜻해요";
    if (temperature >= 15) return "선선해요";
    if (temperature >= 10) return "시원해요";
    return "쌀쌀해요";
  }
  
  if (season.includes("겨울")) {
    if (temperature >= 5) return "쌀쌀해요";
    if (temperature >= 0) return "추워요";
    if (temperature >= -5) return "매우 추워요";
    return "꽁꽁 얼겠어요";
  }
  
  // 예외 처리
  console.error(`날씨 표현 조건 오류 - 계절: ${season}, 기온: ${temp}`);
  return "시원해요"; 
}

/**
 * 계절별 텍스트 색상 반환하는 함수
 */
function getSeasonColor(season) {
  // 계절별 색상 코드 반환
  if (season.includes("봄")) return "#8BC34A";      
  else if (season.includes("여름")) return "#2196F3"; 
  else if (season.includes("가을")) return "#795548"; 
  else if (season.includes("겨울")) return "#1A237E"; 
  else return "#795548"; 
}

/**
 * 감성 표현별 텍스트 색상 반환하는 함수
 */
function getExpressionColor(expression) {
  // 감성 표현에 따른 색상 코드 반환
  if (expression === "너무 더워요" || expression === "무척 더워요") return "#F44336"; 
  else if (expression === "따뜻해요" || expression === "포근해요") return "#FF9800"; 
  else if (expression === "시원해요" || expression === "선선해요") return "#03A9F4"; 
  else if (expression === "쌀쌀해요") return "#3F51B5"; 
  else if (expression === "추워요" || expression === "꽁꽁 얼겠어요") return "#81D4FA"; 
  else return "#03A9F4"; 
}

// 함수들을 export
export { getWeatherExpression, getExpressionColor };
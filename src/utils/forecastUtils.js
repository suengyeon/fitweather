// forecastUtils.js

/**
 * 예보 데이터 배열에서 다음 시간대 예보를 추출하는 함수
 * @param {Array} items - KMA 예보 item 배열
 * @returns {Object|null} - 다음 예보 { temp, rainProb, iconCode, fcstTime }
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
  
    // 같은 시간대의 다른 예보도 찾기
    const findValue = (category) =>
      items.find((i) => i.category === category && i.fcstTime === fcstTime)?.fcstValue;
  
    return {
      temp: nextTmp.fcstValue,
      rainProb: findValue("POP") || "-",
      iconCode: findValue("SKY") || "1", // 기본: 맑음
      fcstTime,
    };
  }
  
// src/api/kmaWeather.js

import { regionGrid } from "../constants/regionGrid";
import { getTodayYYYYMMDD, getBaseTime } from "../utils/timeUtils";
console.log("🔑 SERVICE_KEY:", process.env.REACT_APP_KMA_SERVICE_KEY);
console.log("🔑 SERVICE_KEY length:", process.env.REACT_APP_KMA_SERVICE_KEY?.length);
console.log("🔑 SERVICE_KEY type:", typeof process.env.REACT_APP_KMA_SERVICE_KEY);
// CRA 환경변수는 process.env.REACT_APP_… 로 불러옵니다.
const SERVICE_KEY = process.env.REACT_APP_KMA_SERVICE_KEY;

/**
 * 주어진 지역(region)으로 격자(nx, ny)를 찾아
 * 기상청 단기예보 API를 호출하는 함수
 * @param {string} region - "Seoul", "Busan" 등
 * @returns {Promise<object[]|null>} API에서 받은 예보 item 배열
 */
export const fetchKmaForecast = async (region) => {
  // 1) 격자좌표 추출
  const coords = regionGrid[region];
  if (!coords) {
    console.error(`Unknown region: ${region}`);
    return null;
  }
  const { nx, ny } = coords;

  // 2) 날짜/시간 포맷 준비
  const baseDate = getTodayYYYYMMDD(); // ex. "20250727"
  const baseTime = getBaseTime();      // ex. "1400"

  // 3) URL 조립
  const url = 
    `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst` +
    `?serviceKey=${SERVICE_KEY}` +
    `&pageNo=1&numOfRows=1000&dataType=JSON` +
    `&base_date=${baseDate}&base_time=${baseTime}` +
    `&nx=${nx}&ny=${ny}`;

  console.log("🌤️ KMA API URL:", url);

  // 4) API 호출
  try {
      const res = await fetch(url);
      const text = await res.text();
      console.log("🔍 KMA raw response:", text);
      
      // API 오류 시 모의 데이터 반환
      if (text.includes('SERVICE_KEY_IS_NOT_REGISTERED_ERROR') || text.includes('SERVICE ERROR')) {
        console.log("⚠️ 기상청 API 오류, 모의 데이터 사용");
        
        // 현재 시간보다 큰 시간으로 설정
        const now = new Date();
        const nextHour = now.getHours() + 1;
        const fcstTime = `${nextHour.toString().padStart(2, "0")}00`;
        
        return [
          {
            category: "TMP",
            fcstValue: "25",
            fcstTime: fcstTime
          },
          {
            category: "RN1",
            fcstValue: "0",
            fcstTime: fcstTime
          },
          {
            category: "REH",
            fcstValue: "60",
            fcstTime: fcstTime
          },
          {
            category: "SKY",
            fcstValue: "1",
            fcstTime: fcstTime
          },
          {
            category: "PTY",
            fcstValue: "0",
            fcstTime: fcstTime
          }
        ];
      }
      
      const json = JSON.parse(text);

    if (json.response.header.resultCode !== "00") {
      console.error("KMA API error:", json.response.header);
      return null;
    }

    // 5) 결과 리턴 (items.item 배열)
    return json.response.body.items.item;
  } catch (err) {
    console.error("fetchKmaForecast error:", err);
    return null;
  }
};

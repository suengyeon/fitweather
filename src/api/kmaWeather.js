// src/api/kmaWeather.js

import { regionGrid } from "../constants/regionData";
import { getTodayYYYYMMDD, getBaseTime } from "../utils/timeUtils";
console.log("🔑 SERVICE_KEY:", process.env.REACT_APP_KMA_SERVICE_KEY);
console.log("🔑 SERVICE_KEY length:", process.env.REACT_APP_KMA_SERVICE_KEY?.length);
console.log("🔑 SERVICE_KEY type:", typeof process.env.REACT_APP_KMA_SERVICE_KEY);
// CRA 환경변수는 process.env.REACT_APP_… 로 불러옵니다.
const SERVICE_KEY = process.env.REACT_APP_KMA_SERVICE_KEY || "your_actual_kma_api_key_here";

/**
 * 주어진 지역(region)으로 격자(nx, ny)를 찾아
 * 기상청 단기예보 API를 호출하는 함수
 * @param {string} region - "Seoul", "Busan" 등
 * @param {string} date - 날짜 (YYYY-MM-DD 형식, 선택사항)
 * @returns {Promise<object[]|null>} API에서 받은 예보 item 배열
 */
export const fetchKmaForecast = async (region, date = null) => {
  // 1) 격자좌표 추출
  const coords = regionGrid[region];
  if (!coords) {
    console.error(`Unknown region: ${region}`);
    return null;
  }
  const { nx, ny } = coords;

  // 2) 날짜/시간 포맷 준비
  const baseDate = date ? date.replace(/-/g, '') : getTodayYYYYMMDD(); // ex. "20250727"
  const baseTime = getBaseTime();      // ex. "1400"
  
  console.log("📅 요청 날짜:", baseDate, "지역:", region);

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
    
    // HTTP 상태 코드 확인
    if (!res.ok) {
      console.error(`❌ 기상청 API HTTP 오류: ${res.status} ${res.statusText}`);
      throw new Error(`기상청 API HTTP 오류: ${res.status} ${res.statusText}`);
    }
    
    // API 오류 시 실제 오류 던지기 (모의 데이터 사용 안함)
    if (text.includes('SERVICE_KEY_IS_NOT_REGISTERED_ERROR') || text.includes('SERVICE ERROR')) {
      console.error("❌ 기상청 API 오류 - 서비스 키 문제 또는 서비스 오류");
      throw new Error(`기상청 API 오류: ${text}`);
    }
    
    // JSON 파싱 시도 (500 오류 등으로 인한 비JSON 응답 처리)
    let json;
    try {
      json = JSON.parse(text);
    } catch (parseError) {
      console.error("❌ 기상청 API 응답이 JSON이 아님:", text);
      console.error("❌ 파싱 오류:", parseError);
      throw new Error(`기상청 API 응답 오류: ${text}`);
    }

    if (json.response.header.resultCode !== "00") {
      console.error("❌ KMA API 오류:", json.response.header);
      throw new Error(`기상청 API 오류: ${json.response.header.resultMsg}`);
    }

    // 5) 결과 리턴 (items.item 배열)
    return json.response.body.items.item;

  } catch (err) {
    console.error("❌ fetchKmaForecast error:", err);
    
    // 네트워크 오류나 기타 오류 시에도 실제 오류 던지기 (모의 데이터 사용 안함)
    console.error("❌ 네트워크 오류 또는 기타 오류 - 실제 오류 전파");
    throw new Error(`기상청 API 네트워크 오류: ${err.message}`);
  }
};

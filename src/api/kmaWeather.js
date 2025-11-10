import { regionGrid } from "../constants/regionData";
import { getTodayYYYYMMDD, getBaseTime } from "../utils/timeUtils";

// .env 파일에서 서비스 키를 가져옵니다.
const rawKey = process.env.REACT_APP_KMA_SERVICE_KEY;
const SERVICE_KEY = rawKey ? rawKey.trim() : null;

// 개발 서버 시작 시 콘솔에서 키가 올바르게 로드되었는지 확인하세요.
// (배포 시에는 이 로그를 제거하는 것이 좋습니다.)
console.log("🔑 KMA SERVICE_KEY loaded:", SERVICE_KEY ? `${SERVICE_KEY.substring(0, 10)}...` : "Not Found");
console.log("🔑 KMA SERVICE_KEY length:", SERVICE_KEY?.length);

/**
 * 주어진 지역(region)으로 격자(nx, ny) 찾아 기상청 단기예보 API 호출
 */
export const fetchKmaForecast = async (region, date = null) => {
  // 0. API 키가 .env에 설정되었는지 확인
  if (!SERVICE_KEY) {
    console.warn("⚠️ [kmaWeather] 기상청 API 키가 설정되지 않았습니다.");
    console.warn("⚠️ .env 파일에 REACT_APP_KMA_SERVICE_KEY 변수를 확인하고 서버를 재시작하세요.");
    return null;
  }
  
  // 1. 지역명으로 격자 좌표(nx, ny) 추출
  const coords = regionGrid[region];
  if (!coords) {
    console.error(`Unknown region: ${region}`);
    return null;
  }
  const { nx, ny } = coords;

  // 2. API 요청에 필요한 기준 날짜(YYYYMMDD) 및 기준 시간(HHMM) 설정
  const baseDate = date ? date.replace(/-/g, '') : getTodayYYYYMMDD(); 
  const baseTime = getBaseTime();      
  
  console.log("📅 KMA 요청:", baseDate, baseTime, "지역:", region);

  // 3. 기상청 단기예보 API URL 조립
  const apiUrl = `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst`;
  
  // URLSearchParams가 자동으로 키를 인코딩해주지만,
  // data.go.kr은 종종 이중 인코딩이나 특정 인코딩 방식을 요구할 때가 있습니다.
  // fetch가 URLSearchParams를 처리하는 방식이 data.go.kr과 맞지 않을 수 있으므로,
  // serviceKey를 수동으로 인코딩하고 나머지를 .toString()으로 붙이는 것이 안전할 수 있습니다.
  
  // 기존의 안전한 방식 유지 (serviceKey만 별도 인코딩)
  const otherParams = new URLSearchParams({
    pageNo: '1',
    numOfRows: '1000',
    dataType: 'JSON',
    base_date: baseDate,
    base_time: baseTime,
    nx: nx.toString(),
    ny: ny.toString()
  });
  const encodedServiceKey = encodeURIComponent(SERVICE_KEY);
  const url = `${apiUrl}?serviceKey=${encodedServiceKey}&${otherParams.toString()}`;

  console.log("🌤️ KMA API URL (일부):", url.substring(0, url.indexOf('serviceKey=') + 11) + "..."); 

  // API 키 형식 검증 (64자 hex 문자열인지 확인)
  if (SERVICE_KEY.length !== 64 || !/^[0-9a-f]+$/i.test(SERVICE_KEY)) {
    console.warn("⚠️ 기상청 API 키 형식이 올바르지 않을 수 있습니다. 64자 hex 문자열이어야 합니다.");
    console.warn("⚠️ 현재 키 길이:", SERVICE_KEY.length, "형식:", /^[0-9a-f]+$/i.test(SERVICE_KEY) ? "올바름" : "잘못됨");
    // 키 형식이 달라도 일단 요청은 시도합니다. (다른 종류의 키일 수 있으므로)
  }

  // 4. API 호출
  try {
    const res = await fetch(url);
    const text = await res.text(); // 응답을 일단 텍스트로 받음
    
    // HTTP 상태 코드 확인 및 오류 처리
    if (!res.ok) {
      console.warn(`⚠️ 기상청 API HTTP 오류: ${res.status} ${res.statusText}`);
      console.warn(`⚠️ 기상청 API 응답 본문:`, text.substring(0, 500)); // 너무 길 수 있으므로 일부만
      
      if (res.status === 401) {
        console.error("❌ 기상청 API 인증 오류 (401). 서비스 키가 잘못되었거나 만료되었을 수 있습니다.");
        // 401 오류 시 응답 본문에서 상세 오류 확인
        try {
          const errorData = JSON.parse(text);
          console.error("❌ 기상청 API 인증 오류 상세:", errorData);
        } catch (e) {
          // JSON 파싱 실패 시 텍스트 자체를 보여줌
        }
      }
      return null;
    }
    
    // API 내부 오류 메시지 포함 시 오류 처리 (텍스트 응답 기준)
    if (text.includes('SERVICE_KEY_IS_NOT_REGISTERED_ERROR') || text.includes('SERVICE ERROR')) {
      console.warn("⚠️ 기상청 API 오류 - 서비스 키 문제 또는 서비스 오류:", text);
      return null; 
    }
    
    // JSON 파싱 시도 및 오류 처리
    let json;
    try {
      json = JSON.parse(text);
    } catch (parseError) {
      console.warn("⚠️ 기상청 API 응답이 JSON이 아님:", text.substring(0, 200));
      return null;
    }

    // API 응답 코드 확인 (성공 코드 "00")
    if (json.response?.header?.resultCode !== "00") {
      console.warn("⚠️ KMA API 오류 (응답 코드 00 아님):", json.response?.header);
      return null; 
    }
    
    // 데이터가 없는 경우 (body가 없거나 items가 없는 경우)
    if (!json.response.body?.items?.item) {
      console.warn("⚠️ KMA API 응답에 데이터(items)가 없습니다.", json.response.body);
      return null;
    }

    // 5) 예보 데이터 배열(items.item) 리턴
    return json.response.body.items.item;

  } catch (err) {
    // 네트워크 오류 또는 fetch 자체의 실패
    console.warn("⚠️ fetchKmaForecast 네트워크 오류:", err.message);
    return null; 
  }
};

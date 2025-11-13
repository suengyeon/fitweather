import { getSeasonForPastWeather } from "../utils/forecastUtils";

// .env 파일에서 서비스 키를 가져옵니다.
const rawKey = process.env.REACT_APP_KMA_SERVICE_KEY;
const SERVICE_KEY = rawKey ? rawKey.trim() : null;

// 개발 서버 시작 시 콘솔에서 키가 올바르게 로드되었는지 확인하세요.
console.log("🔑 KMA Past Weather SERVICE_KEY loaded:", SERVICE_KEY ? `${SERVICE_KEY.substring(0, 10)}...` : "Not Found");
console.log("🔑 KMA Past Weather SERVICE_KEY length:", SERVICE_KEY?.length);

/**
 * 기상청 관측 데이터 API에서 과거 날씨 데이터를 가져옴
 */
export const fetchKmaPastWeather = async (date, region) => {
  try {
    // 0. API 키가 .env에 설정되었는지 확인
    if (!SERVICE_KEY) {
      console.warn("⚠️ [kmaPastWeather] 기상청 API 키가 설정되지 않았습니다.");
      console.warn("⚠️ .env 파일에 REACT_APP_KMA_SERVICE_KEY 변수를 확인하고 서버를 재시작하세요.");
      return null;
    }

    // 날짜를 YYYYMMDD 형식으로 변환
    const dateStr = date.replace(/-/g, '');
    
    // 지역 코드 매핑(지역명을 기상청 관측소(stnIds) 코드로 변환)
    const regionCodeMap = {
      'Seoul': '108',      // 서울
      'Busan': '159',      // 부산
      'Daegu': '143',      // 대구
      'Incheon': '112',    // 인천
      'Gwangju': '156',    // 광주
      'Daejeon': '133',    // 대전
      'Ulsan': '152',      // 울산
      'Jeju': '184',       // 제주
      'Suwon': '119',      // 수원
      'Cheongju': '131',   // 청주
      'Jeonju': '146',     // 전주
      'Chuncheon': '101',  // 춘천
      'Gangneung': '105',  // 강릉
      'Andong': '136',     // 안동
      'Pohang': '138',     // 포항
      'Mokpo': '165',      // 목포
      'Yeosu': '168',      // 여수
      'Changwon': '155',   // 창원
      'Hongseong': '177',  // 홍성
      'Baengnyeongdo': '102', // 백령도
      'Ulleungdo': '115',  // 울릉도
      'Heuksando': '169'   // 흑산도
    };
    
    // 지역 코드 결정(기본값 : 서울)
    const regionCode = regionCodeMap[region] || '108'; 
    
    // 기상청 과거 관측 데이터 API URL 설정
    const apiUrl = `https://apis.data.go.kr/1360000/AsosDalyInfoService/getWthrDataList`;
    
    // API 요청 파라미터 설정
    // 기상청 API는 serviceKey를 encodeURIComponent로 인코딩해야 할 수 있음
    const otherParams = new URLSearchParams({
      pageNo: '1',
      numOfRows: '1',
      dataType: 'JSON',
      dataCd: 'ASOS',
      dateCd: 'DAY',
      startDt: dateStr,
      endDt: dateStr,
      stnIds: regionCode
    });
    const encodedServiceKey = encodeURIComponent(SERVICE_KEY);
    const url = `${apiUrl}?serviceKey=${encodedServiceKey}&${otherParams.toString()}`;
    
    console.log("🌧️ 기상청 과거 날씨 API 호출:", date, region, "지역코드:", regionCode);
    console.log("🔗 API URL (일부):", url.substring(0, url.indexOf('serviceKey=') + 11) + "...");
    
    // API 호출
    const response = await fetch(url);
    
    console.log("📡 API 응답 상태:", response.status, response.statusText);
    
    const text = await response.text(); // 응답을 일단 텍스트로 받음
    
    // HTTP 상태 코드 확인 및 오류 처리
    if (!response.ok) {
      console.warn(`⚠️ 기상청 과거 날씨 API HTTP 오류: ${response.status} ${response.statusText}`);
      console.warn(`⚠️ 기상청 과거 날씨 API 응답 본문:`, text.substring(0, 500)); // 너무 길 수 있으므로 일부만
      
      if (response.status === 401) {
        console.error("❌ 기상청 과거 날씨 API 인증 오류 (401). 서비스 키가 잘못되었거나 만료되었을 수 있습니다.");
        // 401 오류 시 응답 본문에서 상세 오류 확인
        try {
          const errorData = JSON.parse(text);
          console.error("❌ 기상청 과거 날씨 API 인증 오류 상세:", errorData);
        } catch (e) {
          // JSON 파싱 실패 시 텍스트 자체를 보여줌
        }
      }
      return null; // 에러를 throw하지 않고 null 반환
    }
    
    // API 내부 오류 메시지 포함 시 오류 처리 (텍스트 응답 기준)
    if (text.includes('SERVICE_KEY_IS_NOT_REGISTERED_ERROR') || text.includes('SERVICE ERROR')) {
      console.warn("⚠️ 기상청 과거 날씨 API 오류 - 서비스 키 문제 또는 서비스 오류:", text.substring(0, 200));
      return null;
    }
    
    // 빈 응답 시 null 반환
    if (!text || text.trim() === '') {
      console.warn("⚠️ 기상청 과거 날씨 API 빈 응답");
      return null;
    }
    
    // JSON 파싱
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error("❌ 기상청 과거 날씨 API JSON 파싱 오류:", parseError, "응답:", text.substring(0, 200));
      return null;
    }
    
    // API 응답 에러 확인
    if (data.response?.header?.resultCode !== '0000') {
      console.warn("⚠️ 기상청 과거 날씨 API 에러:", data.response?.header?.resultMsg);
      return null;
    }
    
    // API 응답에서 최종 데이터 추출
    if (data.response?.body?.items?.item) {
      const item = data.response.body.items.item;
      
      // API 응답 구조 확인 (디버깅용)
      console.log("🔍 기상청 API 응답 항목:", Object.keys(item));
      console.log("🔍 기상청 API 온도 관련 필드:", {
        avgTa: item.avgTa,
        minTa: item.minTa,
        maxTa: item.maxTa,
        ta: item.ta
      });
      
      // 최저/최고 기온 확인
      // 기상청 API 필드명: minTa (최저기온), maxTa (최고기온), avgTa (평균기온)
      const avgTemp = item.avgTa || item.ta;
      let minTemp = item.minTa;
      let maxTemp = item.maxTa;
      
      // minTa, maxTa가 있으면 사용, 없으면 null
      if (minTemp && minTemp !== '0') {
        minTemp = parseFloat(minTemp).toFixed(1);
      } else {
        minTemp = null;
      }
      
      if (maxTemp && maxTemp !== '0') {
        maxTemp = parseFloat(maxTemp).toFixed(1);
      } else {
        maxTemp = null;
      }
      
      if (!minTemp || !maxTemp) {
        console.log("⚠️ 기상청 API에서 최저/최고 기온 필드 없음:", { minTa: item.minTa, maxTa: item.maxTa });
      }
      
      // 필요한 관측 데이터를 구조화하고, 유틸리티 함수로 sky, pty, iconCode, season 추정
      const weatherData = {
        avgTemp: avgTemp, // 평균기온 또는 기온
        minTemp: minTemp, // 최저기온
        maxTemp: maxTemp, // 최고기온
        avgRain: item.sumRn || '0',     // 일강수량
        avgHumidity: item.avgRhm || item.rhm, // 평균상대습도 또는 상대습도
        sky: getSkyFromWeather(avgTemp, item.sumRn), // 하늘 상태 추정
        pty: getPtyFromRain(item.sumRn), // 강수 형태 추정
        iconCode: getIconFromData(avgTemp, item.sumRn), // 아이콘 코드 결정
        season: getSeasonForPastWeather(avgTemp, new Date(date)) // 평균 온도와 24절기(음력 기준) 기반으로 계절 결정
      };
      
      console.log("✅ 기상청 과거 날씨 데이터 추출 완료:", weatherData);
      return weatherData;
    } else {
      console.log("❌ 기상청 과거 날씨 API에서 데이터를 찾을 수 없음");
      return null;
    }
    
  } catch (error) {
    console.error("❌ 기상청 과거 날씨 API 오류:", error);
    return null;
  }
};

/**
 * 기온과 강수량을 기반으로 하늘 상태 추정(sky : 1=맑음, 3=구름많음, 4=흐림)
 */
function getSkyFromWeather(temp, rain) {
  const rainAmount = parseFloat(rain) || 0;
  if (rainAmount > 0) {
    return "4"; // 비/흐림
  } else if (parseFloat(temp) > 25) {
    return "1"; // 고온/맑음
  } else {
    return "3"; // 구름많음(기본값)
  }
}

/**
 * 강수량을 기반으로 강수 형태 추정(pty : 0=없음, 1=비)
 */
function getPtyFromRain(rain) {
  const rainAmount = parseFloat(rain) || 0;
  if (rainAmount > 0) {
    return "1"; // 비
  } else {
    return "0"; // 없음
  }
}

/**
 * 기온과 강수량을 기반으로 아이콘 코드 결정
 */
function getIconFromData(temp, rain) {
  const rainAmount = parseFloat(rain) || 0;
  if (rainAmount > 0) {
    return "rain";
  } else if (parseFloat(temp) > 25) {
    return "sunny";
  } else {
    return "cloudy";
  }
}
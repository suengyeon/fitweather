/**
 * 기상청 과거 날씨 관측 데이터 API
 * 과거 날짜에만 사용하는 전용 API
 */

// 기상청 API 키
const SERVICE_KEY = "StCI4VD0mNM52wrGGdkJqHlAh12auErOmKgzJtma0l%2FLsc%2B5QvM10mvkeUpgXxk%2BD7u7scjZjBMEjJfKXOxzWg%3D%3D";

/**
 * 기상청 관측 데이터 API에서 과거 날씨 데이터를 가져옵니다.
 * @param {string} date - 날짜 (YYYY-MM-DD 형식)
 * @param {string} region - 지역 코드
 * @returns {Promise<Object|null>} - 과거 날씨 데이터
 */
export const fetchKmaPastWeather = async (date, region) => {
  try {
    // 날짜를 YYYYMMDD 형식으로 변환
    const dateStr = date.replace(/-/g, '');
    
    // 지역 코드 매핑 (기존 지역명을 기상청 지역 코드로 변환)
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
    
    const regionCode = regionCodeMap[region] || '108'; // 기본값: 서울
    
    // 기상청 관측 데이터 API URL
    const apiUrl = `https://apis.data.go.kr/1360000/AsosDalyInfoService/getWthrDataList`;
    
    const params = new URLSearchParams({
      serviceKey: SERVICE_KEY,
      pageNo: '1',
      numOfRows: '1',
      dataType: 'JSON',
      dataCd: 'ASOS',
      dateCd: 'DAY',
      startDt: dateStr,
      endDt: dateStr,
      stnIds: regionCode
    });
    
    console.log("🌧️ 기상청 과거 날씨 API 호출:", date, region, "지역코드:", regionCode);
    console.log("🔗 API URL:", `${apiUrl}?${params.toString()}`);
    
    const response = await fetch(`${apiUrl}?${params.toString()}`);
    
    console.log("📡 API 응답 상태:", response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const text = await response.text();
    console.log("🔍 기상청 과거 날씨 API 응답:", text);
    
    // API 오류 시 null 반환
    if (text.includes('SERVICE_KEY_IS_NOT_REGISTERED_ERROR') || text.includes('SERVICE ERROR')) {
      console.log("⚠️ 기상청 과거 날씨 API 오류");
      return null;
    }
    
    // 응답이 비어있거나 오류인 경우
    if (!text || text.trim() === '') {
      console.log("⚠️ 기상청 과거 날씨 API 빈 응답");
      return null;
    }
    
    const data = JSON.parse(text);
    
    // API 응답에서 데이터 추출
    if (data.response && data.response.body && data.response.body.items && data.response.body.items.item) {
      const item = data.response.body.items.item;
      
      // 관측 데이터에서 필요한 정보 추출
      const weatherData = {
        avgTemp: item.avgTa || item.ta, // 평균기온 또는 기온
        avgRain: item.sumRn || '0',     // 일강수량
        avgHumidity: item.avgRhm || item.rhm, // 평균상대습도 또는 상대습도
        sky: getSkyFromWeather(item.avgTa, item.sumRn), // 하늘 상태 추정
        pty: getPtyFromRain(item.sumRn), // 강수 형태 추정
        iconCode: getIconFromData(item.avgTa, item.sumRn),
        season: getSeasonFromTemp(item.avgTa || item.ta)
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
 * 기온과 강수량을 기반으로 하늘 상태 추정
 */
function getSkyFromWeather(temp, rain) {
  const rainAmount = parseFloat(rain) || 0;
  if (rainAmount > 0) {
    return "4"; // 흐림
  } else if (parseFloat(temp) > 25) {
    return "1"; // 맑음
  } else {
    return "3"; // 구름많음
  }
}

/**
 * 강수량을 기반으로 강수 형태 추정
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

/**
 * 기온을 기반으로 계절 결정
 */
function getSeasonFromTemp(temp) {
  const temperature = parseFloat(temp) || 20;
  const currentMonth = new Date().getMonth() + 1;
  
  const isRisingSeason = currentMonth >= 2 && currentMonth <= 7;
  
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
  } else {
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

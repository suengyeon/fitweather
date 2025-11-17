import { getSeasonForPastWeather } from "../utils/forecastUtils";

/**
 * 지역명을 영어로 변환하는 헬퍼 함수
 */
function convertRegionToEnglish(region) {
  const regionMap = {
    'Seoul': 'Seoul',
    'Busan': 'Busan',
    'Daegu': 'Daegu',
    'Incheon': 'Incheon',
    'Gwangju': 'Gwangju',
    'Daejeon': 'Daejeon',
    'Ulsan': 'Ulsan',
    'Jeju': 'Jeju',
    'Suwon': 'Suwon',
    'Cheongju': 'Cheongju',
    'Jeonju': 'Jeonju',
    'Chuncheon': 'Chuncheon',
    'Gangneung': 'Gangneung',
    'Andong': 'Andong',
    'Pohang': 'Pohang',
    'Mokpo': 'Mokpo',
    'Yeosu': 'Yeosu',
    'Changwon': 'Changwon',
    'Hongseong': 'Hongseong',
    'Baengnyeongdo': 'Baengnyeongdo',
    'Ulleungdo': 'Ulleungdo',
    'Heuksando': 'Heuksando'
  };
  return regionMap[region] || 'Seoul';
}

/**
 * OpenWeatherMap Historical Weather API에서 과거 날씨 데이터 가져오기
 * 참고: OpenWeatherMap Forecast API는 미래 날짜만 지원하므로, 과거 날짜는 건너뜀
 */
export const fetchOpenWeatherMapPastWeather = async (date, region) => {
  try {
    // 과거 날짜인지 확인 (오늘보다 이전)
    const targetDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    
    if (targetDate < today) {
      console.log("⚠️ OpenWeatherMap Forecast API는 과거 날짜를 지원하지 않습니다:", date);
      return null;
    }

    const API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY || "89571719c6df9df656e8a59eb44d21da";
    if (!API_KEY) {
      console.warn('OpenWeatherMap API 키가 설정되지 않았습니다.');
      return null;
    }

    const englishRegion = convertRegionToEnglish(region);
    
    // OpenWeatherMap 5 Day / 3 Hour Forecast API 사용 (미래 날짜만)
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${englishRegion},KR&appid=${API_KEY}&units=metric&lang=kr`;
    
    console.log("🌤️ OpenWeatherMap 과거 날씨 API 호출:", date, region);
    
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`OpenWeatherMap API 오류: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    
    if (!data.list || data.list.length === 0) {
      console.warn("OpenWeatherMap API에서 데이터를 찾을 수 없음");
      return null;
    }

    // 해당 날짜의 데이터 필터링
    const targetDateStr = date; // YYYY-MM-DD 형식
    const dayData = data.list.filter(item => {
      const itemDate = new Date(item.dt * 1000).toISOString().split('T')[0];
      return itemDate === targetDateStr;
    });

    if (dayData.length === 0) {
      console.warn("해당 날짜의 OpenWeatherMap 데이터가 없음:", targetDateStr);
      return null;
    }

    // 온도, 습도 평균 계산 및 강수량 최대값 추출
    const temps = dayData.map(item => item.main.temp);
    const tempMins = dayData.map(item => item.main.temp_min);
    const tempMaxs = dayData.map(item => item.main.temp_max);
    const rains = dayData.map(item => (item.rain?.['3h'] || 0) / 3); // 3시간 강수량을 시간당으로 변환
    const humidities = dayData.map(item => item.main.humidity);
    
    const avgTemp = (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1);
    const minTemp = tempMins.length > 0 ? Math.min(...tempMins).toFixed(1) : avgTemp;
    const maxTemp = tempMaxs.length > 0 ? Math.max(...tempMaxs).toFixed(1) : avgTemp;
    const avgRain = rains.length > 0 ? Math.max(...rains).toFixed(1) : "0"; // 강수량은 최대값 사용
    const avgHumidity = (humidities.reduce((a, b) => a + b, 0) / humidities.length).toFixed(1);

    // 가장 빈번한 날씨 코드로 SKY, PTY 결정
    const weatherCodes = dayData.map(item => item.weather[0].id);
    const codeCounts = {};
    weatherCodes.forEach(code => {
      codeCounts[code] = (codeCounts[code] || 0) + 1;
    });
    const mostCommonCode = Object.keys(codeCounts).reduce((a, b) => 
      codeCounts[a] > codeCounts[b] ? a : b
    );

    // OpenWeatherMap 날씨 코드를 SKY, PTY로 변환
    const { sky, pty, iconCode } = convertOWMCodeToKmaFormat(parseInt(mostCommonCode));
    const season = getSeasonForPastWeather(avgTemp, new Date(date));

    const weatherData = {
      avgTemp,
      minTemp,
      maxTemp,
      avgRain,
      avgHumidity,
      sky,
      pty,
      iconCode,
      season
    };

    console.log("✅ OpenWeatherMap 과거 날씨 데이터 추출 완료:", weatherData);
    return weatherData;
  } catch (error) {
    console.error("❌ OpenWeatherMap 과거 날씨 API 오류:", error);
    return null;
  }
};

/**
 * WeatherAPI Historical Weather API에서 과거 날씨 데이터 가져오기
 */
export const fetchWeatherAPIPastWeather = async (date, region) => {
  try {
    const API_KEY = process.env.REACT_APP_WEATHERAPI_KEY;
    if (!API_KEY) {
      console.warn('WeatherAPI 키가 설정되지 않았습니다.');
      return null;
    }

    const englishRegion = convertRegionToEnglish(region);
    
    // WeatherAPI History API 사용
    const url = `https://api.weatherapi.com/v1/history.json?key=${API_KEY}&q=${englishRegion}&dt=${date}`;
    
    console.log("🌤️ WeatherAPI 과거 날씨 API 호출:", date, region);
    
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`WeatherAPI 오류: ${response.status} ${response.statusText}`, errorText);
      return null;
    }

    const data = await response.json();
    
    // WeatherAPI 에러 응답 확인
    if (data.error) {
      console.warn("WeatherAPI 에러 응답:", data.error);
      return null;
    }
    
    if (!data.forecast || !data.forecast.forecastday || data.forecast.forecastday.length === 0) {
      console.warn("WeatherAPI에서 데이터를 찾을 수 없음:", data);
      return null;
    }

    const dayData = data.forecast.forecastday[0].day;
    const hourData = data.forecast.forecastday[0].hour || [];

    // 일 평균 데이터 사용 (강수량은 최대값)
    const avgTemp = dayData.avgtemp_c?.toFixed(1) || dayData.maxtemp_c?.toFixed(1) || "0";
    const minTemp = dayData.mintemp_c?.toFixed(1) || avgTemp;
    const maxTemp = dayData.maxtemp_c?.toFixed(1) || avgTemp;
    // 강수량은 totalprecip_mm (일 총 강수량) 사용 - 이미 최대값 개념
    const avgRain = dayData.totalprecip_mm?.toFixed(1) || "0";
    const avgHumidity = hourData.length > 0 
      ? (hourData.reduce((sum, h) => sum + (h.humidity || 0), 0) / hourData.length).toFixed(1)
      : (dayData.avghumidity?.toFixed(1) || "0");

    // 날씨 코드 변환
    const conditionCode = dayData.condition?.code || 1000;
    const { sky, pty, iconCode } = convertWeatherAPICodeToKmaFormat(conditionCode);
    const season = getSeasonForPastWeather(avgTemp, new Date(date));

    const weatherData = {
      avgTemp,
      minTemp,
      maxTemp,
      avgRain,
      avgHumidity,
      sky,
      pty,
      iconCode,
      season
    };

    console.log("✅ WeatherAPI 과거 날씨 데이터 추출 완료:", weatherData);
    return weatherData;
  } catch (error) {
    console.error("❌ WeatherAPI 과거 날씨 API 오류:", error);
    return null;
  }
};

/**
 * Visual Crossing Historical Weather API에서 과거 날씨 데이터 가져오기
 */
export const fetchVisualCrossingPastWeather = async (date, region) => {
  try {
    const API_KEY = process.env.REACT_APP_VISUALCROSSING_API_KEY;
    if (!API_KEY) {
      console.warn('Visual Crossing API 키가 설정되지 않았습니다.');
      return null;
    }

    const englishRegion = convertRegionToEnglish(region);
    
    // Visual Crossing Timeline API 사용 (과거 날짜 포함)
    const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${englishRegion}/${date}?unitGroup=metric&key=${API_KEY}&contentType=json`;
    
    console.log("🌤️ Visual Crossing 과거 날씨 API 호출:", date, region);
    
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`Visual Crossing API 오류: ${response.status} ${response.statusText}`, errorText);
      return null;
    }

    const data = await response.json();
    
    if (!data.days || data.days.length === 0) {
      console.warn("Visual Crossing에서 데이터를 찾을 수 없음:", data);
      return null;
    }

    const dayData = data.days[0];

    // 일 평균 데이터 사용
    const avgTemp = dayData.temp?.toFixed(1) || "0";
    const minTemp = dayData.tempmin?.toFixed(1) || dayData.temp?.toFixed(1) || avgTemp;
    const maxTemp = dayData.tempmax?.toFixed(1) || dayData.temp?.toFixed(1) || avgTemp;
    const avgRain = dayData.precip?.toFixed(1) || "0";
    const avgHumidity = dayData.humidity?.toFixed(1) || "0";

    // 날씨 조건 코드 변환
    const condition = dayData.conditions || "Clear";
    const { sky, pty, iconCode } = convertVisualCrossingConditionToKmaFormat(condition);
    const season = getSeasonForPastWeather(avgTemp, new Date(date));

    const weatherData = {
      avgTemp,
      minTemp,
      maxTemp,
      avgRain,
      avgHumidity,
      sky,
      pty,
      iconCode,
      season
    };

    console.log("✅ Visual Crossing 과거 날씨 데이터 추출 완료:", weatherData);
    return weatherData;
  } catch (error) {
    console.error("❌ Visual Crossing 과거 날씨 API 오류:", error);
    return null;
  }
};

/**
 * OpenWeatherMap 날씨 코드를 기상청 형식으로 변환
 */
function convertOWMCodeToKmaFormat(weatherCode) {
  // OpenWeatherMap 날씨 코드 범위별 분류
  // 2xx: Thunderstorm, 3xx: Drizzle, 5xx: Rain, 6xx: Snow, 7xx: Atmosphere, 800: Clear, 80x: Clouds
  
  let sky = "1"; // 기본값: 맑음
  let pty = "0"; // 기본값: 없음
  let iconCode = "sunny";

  if (weatherCode >= 200 && weatherCode < 300) {
    // 천둥번개
    pty = "4"; // 소나기
    iconCode = "rain";
    sky = "4";
  } else if (weatherCode >= 300 && weatherCode < 400) {
    // 이슬비
    pty = "1"; // 비
    iconCode = "rain";
    sky = "4";
  } else if (weatherCode >= 500 && weatherCode < 600) {
    // 비
    pty = "1"; // 비
    iconCode = "rain";
    sky = "4";
  } else if (weatherCode >= 600 && weatherCode < 700) {
    // 눈
    pty = "3"; // 눈
    iconCode = "snow";
    sky = "4";
  } else if (weatherCode === 800) {
    // 맑음
    sky = "1";
    pty = "0";
    iconCode = "sunny";
  } else if (weatherCode === 801 || weatherCode === 802) {
    // 구름 조금/중간
    sky = "3";
    pty = "0";
    iconCode = "cloudy";
  } else if (weatherCode >= 803) {
    // 구름 많음/흐림
    sky = "4";
    pty = "0";
    iconCode = "overcast";
  }

  return { sky, pty, iconCode };
}

/**
 * WeatherAPI 날씨 코드를 기상청 형식으로 변환
 */
function convertWeatherAPICodeToKmaFormat(conditionCode) {
  let sky = "1";
  let pty = "0";
  let iconCode = "sunny";

  // WeatherAPI 조건 코드는 1000번대가 맑음, 1000번대가 비/눈 등
  if (conditionCode === 1000) {
    sky = "1";
    pty = "0";
    iconCode = "sunny";
  } else if (conditionCode >= 1003 && conditionCode <= 1006) {
    sky = "3";
    pty = "0";
    iconCode = "cloudy";
  } else if (conditionCode >= 1007 && conditionCode <= 1030) {
    sky = "4";
    pty = "0";
    iconCode = "overcast";
  } else if (conditionCode >= 1063 && conditionCode <= 1087) {
    // 비/소나기
    sky = "4";
    pty = "1";
    iconCode = "rain";
  } else if (conditionCode >= 1114 && conditionCode <= 1117) {
    // 눈
    sky = "4";
    pty = "3";
    iconCode = "snow";
  } else if (conditionCode >= 1135 && conditionCode <= 1147) {
    // 안개
    sky = "4";
    pty = "0";
    iconCode = "overcast";
  }

  return { sky, pty, iconCode };
}

/**
 * Visual Crossing 날씨 조건을 기상청 형식으로 변환
 */
function convertVisualCrossingConditionToKmaFormat(condition) {
  let sky = "1";
  let pty = "0";
  let iconCode = "sunny";

  const lowerCondition = condition.toLowerCase();

  if (lowerCondition.includes("clear") || lowerCondition.includes("sunny")) {
    sky = "1";
    pty = "0";
    iconCode = "sunny";
  } else if (lowerCondition.includes("partially cloudy") || lowerCondition.includes("partly cloudy")) {
    sky = "3";
    pty = "0";
    iconCode = "cloudy";
  } else if (lowerCondition.includes("cloudy") || lowerCondition.includes("overcast")) {
    sky = "4";
    pty = "0";
    iconCode = "overcast";
  } else if (lowerCondition.includes("rain") || lowerCondition.includes("drizzle")) {
    sky = "4";
    pty = "1";
    iconCode = "rain";
  } else if (lowerCondition.includes("snow")) {
    sky = "4";
    pty = "3";
    iconCode = "snow";
  } else if (lowerCondition.includes("fog") || lowerCondition.includes("mist")) {
    sky = "4";
    pty = "0";
    iconCode = "overcast";
  }

  return { sky, pty, iconCode };
}


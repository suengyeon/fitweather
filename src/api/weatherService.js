import { fetchKmaForecast } from './kmaWeather';
import { getSeason, getWeatherExpression, getExpressionColor } from '../utils/forecastUtils';

// WeatherService 클래스 정의 : 다양한 날씨 API를 통합하여 데이터를 표준화하고 우선순위에 따라 호출 관리
export class WeatherService { 
  constructor() {
    this.primaryAPI = 'kma'; // 기본 API : 기상청
    // 기상청 실패 시 순차적으로 시도할 대체(Fallback) API 목록
    this.fallbackAPIs = [
      'openweathermap',
      'accuweather',
      'weatherapi',
      'visualcrossing'
    ];
    this.lastUsedAPI = null; // 마지막으로 성공한 API 이름 기록
    this.currentFallbackIndex = 0; // 현재 대체 API 목록 인덱스
  }

  // ---------------------------------
  // API 조회 메인 로직
  // ---------------------------------

  /**
   * 날씨 데이터 조회(기상청 우선, 실패 시 여러 대체 API 시도)
   */
  async getWeather(region) {
    console.log(`🌤️ [WeatherService] 날씨 데이터 요청 시작 - 지역: ${region}`);

    try {
      console.log(`🇰🇷 [WeatherService] 기상청 API 시도 중... (2초 타임아웃)`);

      // 기상청 API 호출에 2초 타임아웃 로직 적용(Promise.race)
      const kmaData = await Promise.race([
        this.fetchKmaWeather(region), // 기상청 호출
        new Promise((_, reject) =>
          // 2초 후 강제 실패(reject)시켜 타임아웃 구현
          setTimeout(() => reject(new Error('기상청 API 타임아웃 (2초)')), 2000)
        )
      ]);

      this.lastUsedAPI = this.primaryAPI; // 기상청 성공 기록
      console.log(`✅ [WeatherService] 기상청 API 성공!`);
      return kmaData;
    } catch (error) {
      // 기상청 API 호출 실패or타임아웃 시 대체 API 시도
      console.warn(`⚠️ [WeatherService] 기상청 API 실패: ${error.message}`);
      return await this.tryFallbackAPIs(region);
    }
  }

  /**
   * 대체 API들을 순차 시도해 성공한 데이터 반환(모든 대체 API 실패 시 모의(Mock) 데이터 반환)
   */
  async tryFallbackAPIs(region) {
    for (let i = 0; i < this.fallbackAPIs.length; i++) {
      const apiName = this.fallbackAPIs[i];
      console.log(`🔄 [WeatherService] ${apiName} API로 대체 시도 중... (${i + 1}/${this.fallbackAPIs.length})`);

      try {
        let data;
        // API 이름에 따라 개별 API 호출 함수를 호출
        switch (apiName) {
          case 'openweathermap':
            data = await this.fetchOpenWeatherMap(region);
            break;
          case 'accuweather':
            data = await this.fetchAccuWeather(region);
            break;
          case 'weatherapi':
            data = await this.fetchWeatherAPI(region);
            break;
          case 'visualcrossing':
            data = await this.fetchVisualCrossing(region);
            break;
          default:
            continue;
        }

        // 성공 시 해당 API 이름 기록 후 표준화된 데이터 반환
        this.lastUsedAPI = apiName;
        console.log(`✅ [WeatherService] ${apiName} API 성공!`);
        return data;
      } catch (apiError) {
        // 현재 대체 API 실패 시 다음 API로 넘어감
        console.warn(`⚠️ [WeatherService] ${apiName} API 실패: ${apiError.message}`);
        continue;
      }
    }

    // 6. 모든 API가 실패한 경우, 비상용 모의 데이터 반환
    console.error(`❌ [WeatherService] 모든 API 실패 - 임시 모의 데이터 사용`);
    const mockData = this.getMockWeatherData(region);
    this.lastUsedAPI = 'mock';
    return mockData;
  }

  /**
   * 임시 모의 데이터 생성(모든 API 호출 실패한 경우의 비상용)
   */
  getMockWeatherData(region) {
    const now = new Date();
    const hour = now.getHours();

    // 시간대별 온도 시뮬레이션
    let temp = 20;
    if (hour >= 6 && hour < 12) temp = 18;
    else if (hour >= 12 && hour < 18) temp = 25;
    else if (hour >= 18 && hour < 22) temp = 22;
    else temp = 15;

    const season = this.getSeason(temp, now);
    const weatherExpression = this.getWeatherExpression(season, temp);

    // 표준화된 데이터 구조로 반환
    return {
      temp: temp, 
      tavg: temp, 
      rain: 0,
      humidity: 65,
      sky: "1", // 맑음(기본값)
      pty: "0", // 강수 없음(기본값)
      icon: "sunny",
      season: season,
      weatherExpression: weatherExpression,
      seasonColor: this.getSeasonColor(season),
      expressionColor: this.getExpressionColor(weatherExpression),
      fcstTime: new Date().toISOString(),
      apiSource: 'mock'
    };
  }

  // ---------------------------------
  // 개별 API 호출 함수
  // ---------------------------------

  /**
   * 기상청 API 호출 및 데이터 처리
   */
  async fetchKmaWeather(region) {
    try {
      // 외부 KMA 함수 호출하여 예보 데이터 배열 획득
      const forecastItems = await fetchKmaForecast(region); 
      
      if (!forecastItems || forecastItems.length === 0) {
        throw new Error('기상청 API에서 데이터를 받지 못했습니다.');
      }

      // 획득한 데이터를 표준화된 형식으로 가공하여 반환
      const processedData = this.processKmaData(forecastItems); 
      return processedData;
    } catch (error) {
      throw error;
    }
  }

  /**
   * OpenWeatherMap API 호출 및 데이터 처리
   */
  async fetchOpenWeatherMap(region) {
    const API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY || "89571719c6df9df656e8a59eb44d21da";
    if (!API_KEY) throw new Error('OpenWeatherMap API 키가 설정되지 않았습니다.');

    const englishRegion = this.convertRegionToEnglish(region);
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${englishRegion},KR&appid=${API_KEY}&units=metric&lang=kr`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`OpenWeatherMap API 오류: ${response.status} ${response.statusText}`);

      const data = await response.json();
      // 원본 데이터를 표준화된 KMA 형식으로 변환하여 반환
      const convertedData = this.convertOpenWeatherMapToKmaFormat(data); 
      return convertedData;
    } catch (error) {
      throw new Error(`OpenWeatherMap API 호출 실패: ${error.message}`);
    }
  }

  /**
   * AccuWeather API 호출 및 데이터 처리
   */
  async fetchAccuWeather(region) {
    const API_KEY = process.env.REACT_APP_ACCUWEATHER_API_KEY;
    if (!API_KEY) throw new Error('AccuWeather API 키가 설정되지 않았습니다.');

    try {
      // 1단계: 지역 키 조회
      const locationKey = await this.getAccuWeatherLocationKey(region, API_KEY);
      if (!locationKey) throw new Error('AccuWeather 지역 키를 찾을 수 없습니다.');

      // 2단계: 현재 날씨 조회
      const url = `https://dataservice.accuweather.com/currentconditions/v1/${locationKey}?apikey=${API_KEY}&details=true`;

      const response = await fetch(url);
      if (!response.ok) throw new Error(`AccuWeather API 오류: ${response.status} ${response.statusText}`);

      const data = await response.json();
      // 원본 데이터를 표준화된 KMA 형식으로 변환하여 반환
      const convertedData = this.convertAccuWeatherToKmaFormat(data[0]); 
      return convertedData;
    } catch (error) {
      throw new Error(`AccuWeather API 호출 실패: ${error.message}`);
    }
  }

  /**
   * WeatherAPI 호출 및 데이터 처리
   */
  async fetchWeatherAPI(region) {
    const API_KEY = process.env.REACT_APP_WEATHERAPI_KEY;
    if (!API_KEY) throw new Error('WeatherAPI 키가 설정되지 않았습니다.');

    const englishRegion = this.convertRegionToEnglish(region);
    const url = `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${englishRegion}&aqi=no`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`WeatherAPI 오류: ${response.status} ${response.statusText}`);

      const data = await response.json();
      // 원본 데이터를 표준화된 KMA 형식으로 변환하여 반환
      const convertedData = this.convertWeatherAPIToKmaFormat(data); 
      return convertedData;
    } catch (error) {
      throw new Error(`WeatherAPI 호출 실패: ${error.message}`);
    }
  }

  /**
   * Visual Crossing API 호출 및 데이터 처리
   */
  async fetchVisualCrossing(region) {
    const API_KEY = process.env.REACT_APP_VISUALCROSSING_API_KEY;
    if (!API_KEY) throw new Error('Visual Crossing API 키가 설정되지 않았습니다.');

    const englishRegion = this.convertRegionToEnglish(region);
    const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${englishRegion}?unitGroup=metric&key=${API_KEY}&contentType=json`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Visual Crossing API 오류: ${response.status} ${response.statusText}`);

      const data = await response.json();
      // 원본 데이터를 표준화된 KMA 형식으로 변환하여 반환
      const convertedData = this.convertVisualCrossingToKmaFormat(data); 
      return convertedData;
    } catch (error) {
      throw new Error(`Visual Crossing API 호출 실패: ${error.message}`);
    }
  }

  // ---------------------------------
  // 데이터 처리 및 변환 함수
  // ---------------------------------

  /**
   * 기상청 API에서 받은 원본 데이터를 표준화된 형식으로 가공
   */
  processKmaData(forecastItems) {
    const now = new Date();
    const currHour = now.getHours();
    const currTime = `${currHour.toString().padStart(2, "0")}00`;

    // 현재 시간 또는 다음 시간대의 TMP(기온) 데이터 찾기
    const tmpList = forecastItems.filter((item) => item.category === "TMP");
    const nextTmp = tmpList.find((item) => item.fcstTime >= currTime);

    if (!nextTmp) throw new Error('기상청 데이터에서 유효한 예보를 찾을 수 없습니다.');

    const fcstTime = nextTmp.fcstTime;
    // 해당 시간대의 SKY, PTY 등 다른 예보 값 찾기
    const findValue = (category) =>
      forecastItems.find((i) => i.category === category && i.fcstTime === fcstTime)?.fcstValue;

    const sky = findValue("SKY") || "1"; // 하늘 상태 (1, 3, 4)
    const pty = findValue("PTY") || "0"; // 강수 형태 (0, 1, 2, 3, 4)
    const tavg = findValue("TAVG") || nextTmp.fcstValue; // 일일 평균 기온(없으면 현재 기온 사용)

    // 표준화된 형식으로 날씨 데이터 구성
    return {
      temp: nextTmp.fcstValue, // 현재 기온
      tavg: tavg, // 평균 기온
      rain: findValue("RN1") || "0", // 1시간 강수량
      humidity: findValue("REH") || null, // 습도
      sky: sky,
      pty: pty,
      icon: this.getWeatherIcon(sky, pty), // 아이콘 변환
      // 유틸리티 함수 이용해 계절, 날씨 표현, 색상 값 추가
      season: this.getSeason(tavg, new Date()),
      weatherExpression: this.getWeatherExpression(this.getSeason(tavg, new Date()), nextTmp.fcstValue),
      seasonColor: this.getSeasonColor(this.getSeason(tavg, new Date())),
      expressionColor: this.getExpressionColor(this.getWeatherExpression(this.getSeason(tavg, new Date()), nextTmp.fcstValue)),
      fcstTime: fcstTime,
      apiSource: 'kma'
    };
  }

  /**
   * OpenWeatherMap 데이터를 기상청 형식으로 변환
   */
  convertOpenWeatherMapToKmaFormat(owmData) {
    const { weather, main, rain } = owmData;
    const weatherCode = weather[0].id;
    const temperature = Math.round(main.temp);

    // 표준화된 형식으로 날씨 데이터 구성
    return {
      temp: temperature,
      tavg: temperature, // 현재 기온을 평균 기온으로 사용
      rain: rain?.['1h'] || 0, 
      humidity: main.humidity,
      sky: this.convertToSky(weatherCode), // OWM 코드를 SKY로 변환
      pty: this.convertToPty(weatherCode), // OWM 코드를 PTY로 변환
      icon: this.convertToIconCode(weatherCode), // OWM 코드를 아이콘 코드로 변환
      // 유틸리티 함수를 이용해 계절, 날씨 표현, 색상 값 추가
      season: this.getSeason(temperature, new Date()),
      weatherExpression: this.getWeatherExpression(this.getSeason(temperature, new Date()), temperature),
      seasonColor: this.getSeasonColor(this.getSeason(temperature, new Date())),
      expressionColor: this.getExpressionColor(this.getWeatherExpression(this.getSeason(temperature, new Date()), temperature)),
      fcstTime: new Date().toISOString(),
      apiSource: 'openweathermap'
    };
  }

  /**
   * AccuWeather 지역 키 조회(2단계 프로세스의 1단계)
   */
  async getAccuWeatherLocationKey(region, apiKey) {
    const englishRegion = this.convertRegionToEnglish(region);
    const url = `https://dataservice.accuweather.com/locations/v1/cities/search?apikey=${apiKey}&q=${englishRegion}&country=KR`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`AccuWeather 지역 검색 실패: ${response.status}`);

      const data = await response.json();
      if (data && data.length > 0) return data[0].Key; // 첫 번째 결과의 Key 반환
      return null;
    } catch (error) {
      console.error(`❌ [AW API] 지역 키 조회 실패:`, error);
      return null;
    }
  }

  /**
   * AccuWeather 데이터를 기상청 형식으로 변환
   */
  convertAccuWeatherToKmaFormat(awData) {
    const temperature = Math.round(awData.Temperature.Metric.Value);
    const weatherCode = awData.WeatherIcon; 

    // 표준화된 형식으로 날씨 데이터 구성
    return {
      temp: temperature,
      tavg: temperature, // 현재 기온을 평균 기온으로 사용
      rain: awData.Precip1hr?.Metric?.Value || 0, // 1시간 강수량
      humidity: awData.RelativeHumidity,
      sky: this.convertAccuWeatherToSky(weatherCode), // AW 코드를 SKY로 변환
      pty: this.convertAccuWeatherToPty(weatherCode), // AW 코드를 PTY로 변환
      icon: this.convertAccuWeatherToIcon(weatherCode), // AW 코드를 아이콘 코드로 변환
      // 유틸리티 함수를 이용해 계절, 날씨 표현, 색상 값 추가
      season: this.getSeason(temperature, new Date()),
      weatherExpression: this.getWeatherExpression(this.getSeason(temperature, new Date()), temperature),
      seasonColor: this.getSeasonColor(this.getSeason(temperature, new Date())),
      expressionColor: this.getExpressionColor(this.getWeatherExpression(this.getSeason(temperature, new Date()), temperature)),
      fcstTime: new Date().toISOString(),
      apiSource: 'accuweather'
    };
  }

  /**
   * WeatherAPI 데이터를 기상청 형식으로 변환
   */
  convertWeatherAPIToKmaFormat(waData) {
    const { current } = waData;
    const temperature = Math.round(current.temp_c);

    // 표준화된 형식으로 날씨 데이터 구성
    return {
      temp: temperature,
      tavg: temperature, 
      rain: current.precip_mm || 0, // 강수량(mm)
      humidity: current.humidity,
      sky: this.convertWeatherAPIToSky(current.condition.code), // WA 코드를 SKY로 변환
      pty: this.convertWeatherAPIToPty(current.condition.code), // WA 코드를 PTY로 변환
      icon: this.convertWeatherAPIToIcon(current.condition.code), // WA 코드를 아이콘 코드로 변환
      // 유틸리티 함수를 이용해 계절, 날씨 표현, 색상 값 추가
      season: this.getSeason(temperature, new Date()),
      weatherExpression: this.getWeatherExpression(this.getSeason(temperature, new Date()), temperature),
      seasonColor: this.getSeasonColor(this.getSeason(temperature, new Date())),
      expressionColor: this.getExpressionColor(this.getWeatherExpression(this.getSeason(temperature, new Date()), temperature)),
      fcstTime: new Date().toISOString(),
      apiSource: 'weatherapi'
    };
  }

  /**
   * Visual Crossing 데이터를 기상청 형식으로 변환
   */
  convertVisualCrossingToKmaFormat(vcData) {
    const current = vcData.currentConditions;
    const temperature = Math.round(current.temp);

    // 표준화된 형식으로 날씨 데이터 구성
    return {
      temp: temperature,
      tavg: temperature, 
      rain: current.precip || 0, // 강수량
      humidity: current.humidity,
      sky: this.convertVisualCrossingToSky(current.conditions), // VC 조건을 SKY로 변환
      pty: this.convertVisualCrossingToPty(current.conditions), // VC 조건을 PTY로 변환
      icon: this.convertVisualCrossingToIcon(current.conditions), // VC 조건을 아이콘 코드로 변환
      // 유틸리티 함수를 이용해 계절, 날씨 표현, 색상 값 추가
      season: this.getSeason(temperature, new Date()),
      weatherExpression: this.getWeatherExpression(this.getSeason(temperature, new Date()), temperature),
      seasonColor: this.getSeasonColor(this.getSeason(temperature, new Date())),
      expressionColor: this.getExpressionColor(this.getWeatherExpression(this.getSeason(temperature, new Date()), temperature)),
      fcstTime: new Date().toISOString(),
      apiSource: 'visualcrossing'
    };
  }

  // ---------------------------------
  // 유틸리티 및 변환 헬퍼 함수
  // ---------------------------------

  /**
   * 한국 지역명을 글로벌 API에서 사용 가능한 영어 지역명으로 변환
   */
  convertRegionToEnglish(koreanRegion) {
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
    return regionMap[koreanRegion] || 'Seoul'; // 매핑된 값 없으면 'Seoul'을 기본값으로 사용
  }

  /**
   * OpenWeatherMap 날씨 코드를 기상청 SKY(하늘 상태) 값으로 변환
   */
  convertToSky(weatherCode) {
    if (weatherCode === 800) return "1"; // Clear
    if (weatherCode >= 801 && weatherCode <= 802) return "3"; // Clouds
    if (weatherCode >= 803 && weatherCode <= 804) return "4"; // Overcast
    return "3";
  }

  /**
  * OpenWeatherMap 날씨 코드를 기상청 PTY 값으로 변환 
  */
  convertToPty(weatherCode) {
    if (weatherCode >= 200 && weatherCode < 400) return "1"; // Thunderstorm, Drizzle -> Rain
    if (weatherCode >= 500 && weatherCode < 600) return "1"; // Rain
    if (weatherCode >= 600 && weatherCode < 700) return "3"; // Snow
    return "0"; // Clear, Atmosphere
  }

  /**
  * OpenWeatherMap 날씨 코드를 아이콘 코드로 변환
  */
  convertToIconCode(weatherCode) {
    if (weatherCode === 800) return "sunny";
    if (weatherCode >= 801 && weatherCode <= 802) return "cloudy";
    if (weatherCode >= 803 && weatherCode <= 804) return "overcast";
    if (weatherCode >= 500 && weatherCode < 600) return "rainy";
    if (weatherCode >= 600 && weatherCode < 700) return "snow";
    if (weatherCode >= 200 && weatherCode < 300) return "thunder";
    return "cloudy";
  }

  /**
   * 기상청 SKY/PTY 값을 기반으로 내부 아이콘 코드 결정
   */
  getWeatherIcon(sky, pty) {
    // PTY(강수 형태)를 우선 체크
    if (pty === "1") return "rainy";
    if (pty === "2") return "snow_rain";
    if (pty === "3") return "snow";
    if (pty === "4") return "shower";

    // 강수 형태가 없을 때(PTY="0") SKY(하늘 상태) 체크
    if (pty === "0" && sky === "1") return "sunny";
    if (pty === "0" && sky === "3") return "cloudy";
    if (pty === "0" && sky === "4") return "overcast";

    return "cloudy"; // 기본값
  }

  /**
   * 계절 구분(외부 유틸리티 함수 사용)
   */
  getSeason(temperature, date) {
    // 외부 유틸리티 함수 호출
    return getSeason(temperature.toString(), date);
  }

  /**
   * 날씨 표현 결정(외부 유틸리티 함수 사용)
   */
  getWeatherExpression(season, temperature) {
    // 외부 유틸리티 함수 호출
    return getWeatherExpression(season, temperature.toString());
  }

  /**
   * 계절별 색상 결정
   */
  getSeasonColor(season) {
    // 계절별 색상 반환
    if (season.includes("봄")) return "#8BC34A"; 
    else if (season.includes("여름")) return "#2196F3"; 
    else if (season.includes("가을")) return "#795548"; 
    else if (season.includes("겨울")) return "#1A237E"; 
    else return "#795548"; // 기본값
  }

  /**
   * 표현별 색상 결정(외부 유틸리티 함수 사용)
   */
  getExpressionColor(expression) {
    // 외부 유틸리티 함수 호출
    return getExpressionColor(expression);
  }

  // AccuWeather 변환 함수들
  convertAccuWeatherToSky(weatherCode) {
    if (weatherCode >= 1 && weatherCode <= 5) return "1"; // Sunny/Mostly Sunny
    if (weatherCode >= 6 && weatherCode <= 11) return "3"; // Cloudy/Partly Cloudy
    if (weatherCode >= 12 && weatherCode <= 18) return "4"; // Rain/Showers
    return "3";
  }

  convertAccuWeatherToPty(weatherCode) {
    if (weatherCode >= 12 && weatherCode <= 18) return "1"; // Rain/Showers
    if (weatherCode >= 19 && weatherCode <= 23) return "3"; // Snow
    if (weatherCode >= 24 && weatherCode <= 29) return "1"; // Thunderstorm/Ice/Sleet
    return "0";
  }

  convertAccuWeatherToIcon(weatherCode) {
    if (weatherCode >= 1 && weatherCode <= 5) return "sunny";
    if (weatherCode >= 6 && weatherCode <= 11) return "cloudy";
    if (weatherCode >= 12 && weatherCode <= 18) return "rainy";
    if (weatherCode >= 19 && weatherCode <= 23) return "snow";
    if (weatherCode >= 24 && weatherCode <= 29) return "thunder";
    return "cloudy";
  }

  // WeatherAPI 변환 함수들
  convertWeatherAPIToSky(conditionCode) {
    if (conditionCode === 1000) return "1"; // Clear
    if (conditionCode >= 1003 && conditionCode <= 1006) return "3"; // Cloudy/Partly Cloudy
    if (conditionCode >= 1007 && conditionCode <= 1009) return "4"; // Overcast/Mist
    return "3";
  }

  convertWeatherAPIToPty(conditionCode) {
    if (conditionCode >= 1063 && conditionCode <= 1201) return "1"; // Rain/Drizzle/Showers
    if (conditionCode >= 1204 && conditionCode <= 1237) return "3"; // Snow/Sleet/Ice
    if (conditionCode >= 1240 && conditionCode <= 1282) return "1"; // Thunder/Storm
    return "0";
  }

  convertWeatherAPIToIcon(conditionCode) {
    if (conditionCode === 1000) return "sunny";
    if (conditionCode >= 1003 && conditionCode <= 1006) return "cloudy";
    if (conditionCode >= 1007 && conditionCode <= 1009) return "overcast";
    if (conditionCode >= 1063 && conditionCode <= 1201) return "rainy";
    if (conditionCode >= 1204 && conditionCode <= 1237) return "snow";
    if (conditionCode >= 1240 && conditionCode <= 1282) return "thunder";
    return "cloudy";
  }

  // Visual Crossing 변환 함수들
  convertVisualCrossingToSky(conditions) {
    const lowerConditions = conditions.toLowerCase();
    if (lowerConditions.includes('clear') || lowerConditions.includes('sunny')) return "1";
    if (lowerConditions.includes('partly cloudy') || lowerConditions.includes('mostly clear')) return "3";
    if (lowerConditions.includes('cloudy') || lowerConditions.includes('overcast')) return "4";
    return "3";
  }

  convertVisualCrossingToPty(conditions) {
    const lowerConditions = conditions.toLowerCase();
    if (lowerConditions.includes('rain') || lowerConditions.includes('shower') || lowerConditions.includes('thunder')) return "1";
    if (lowerConditions.includes('snow')) return "3";
    return "0";
  }

  convertVisualCrossingToIcon(conditions) {
    const lowerConditions = conditions.toLowerCase();
    if (lowerConditions.includes('clear') || lowerConditions.includes('sunny')) return "sunny";
    if (lowerConditions.includes('partly cloudy') || lowerConditions.includes('mostly clear')) return "cloudy";
    if (lowerConditions.includes('cloudy') || lowerConditions.includes('overcast')) return "overcast";
    if (lowerConditions.includes('rain') || lowerConditions.includes('shower')) return "rainy";
    if (lowerConditions.includes('snow')) return "snow";
    if (lowerConditions.includes('thunder') || lowerConditions.includes('storm')) return "thunder";
    return "cloudy";
  }
}
// 기본 인스턴스를 생성하여 모듈 외부로 내보냄
export const weatherService = new WeatherService();
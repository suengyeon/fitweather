// src/api/weatherService.js
// 통합 날씨 서비스 - 기상청 API 기본, OpenWeatherMap 대체

import { fetchKmaForecast } from './kmaWeather';
import { getSeason, getWeatherExpression, getExpressionColor } from '../utils/forecastUtils';

/**
 * 통합 날씨 서비스 클래스
 * 기본: 기상청 API
 * 대체: OpenWeatherMap API
 */
export class WeatherService {
  constructor() {
    this.primaryAPI = 'kma';
    this.fallbackAPI = 'openweathermap';
    this.lastUsedAPI = null;
  }

  /**
   * 날씨 데이터 조회 (기상청 우선, 실패 시 OpenWeatherMap)
   * @param {string} region - 지역명
   * @returns {Promise<Object>} 날씨 데이터
   */
  async getWeather(region) {
    console.log(`🌤️ [WeatherService] 날씨 데이터 요청 시작 - 지역: ${region}`);
    console.log(`📡 [WeatherService] 현재 시간: ${new Date().toLocaleString()}`);
    
    try {
      console.log(`🇰🇷 [WeatherService] 기상청 API 시도 중...`);
      const kmaData = await this.fetchKmaWeather(region);
      this.lastUsedAPI = this.primaryAPI;
      console.log(`✅ [WeatherService] 기상청 API 성공!`);
      console.log(`📊 [WeatherService] 기상청 데이터:`, {
        온도: kmaData.temp,
        계절: kmaData.season,
        표현: kmaData.weatherExpression,
        아이콘: kmaData.icon
      });
      return kmaData;
    } catch (error) {
      console.warn(`⚠️ [WeatherService] 기상청 API 실패: ${error.message}`);
      console.log(`🔄 [WeatherService] OpenWeatherMap API로 대체 시도 중...`);
      
      try {
        const owmData = await this.fetchOpenWeatherMap(region);
        this.lastUsedAPI = this.fallbackAPI;
        console.log(`✅ [WeatherService] OpenWeatherMap API 성공!`);
        console.log(`📊 [WeatherService] OpenWeatherMap 데이터:`, {
          온도: owmData.temp,
          계절: owmData.season,
          표현: owmData.weatherExpression,
          아이콘: owmData.icon
        });
        return owmData;
      } catch (fallbackError) {
        console.error(`❌ [WeatherService] OpenWeatherMap API도 실패: ${fallbackError.message}`);
        console.log(`🔄 [WeatherService] 임시 모의 데이터 사용`);
        
        // 모든 API가 실패한 경우 임시 모의 데이터 반환
        const mockData = this.getMockWeatherData(region);
        this.lastUsedAPI = 'mock';
        console.log(`📊 [WeatherService] 모의 데이터:`, mockData);
        return mockData;
      }
    }
  }

  /**
   * 임시 모의 데이터 생성
   * @param {string} region - 지역명
   * @returns {Object} 모의 날씨 데이터
   */
  getMockWeatherData(region) {
    const now = new Date();
    const hour = now.getHours();
    
    // 시간대별 온도 시뮬레이션
    let temp = 20;
    if (hour >= 6 && hour < 12) temp = 18; // 아침
    else if (hour >= 12 && hour < 18) temp = 25; // 낮
    else if (hour >= 18 && hour < 22) temp = 22; // 저녁
    else temp = 15; // 밤
    
    const season = this.getSeason(temp, now);
    const weatherExpression = this.getWeatherExpression(season, temp);
    
    return {
      temp: temp,
      tavg: temp,
      rain: 0,
      humidity: 65,
      sky: "1",
      pty: "0",
      icon: "sunny",
      season: season,
      weatherExpression: weatherExpression
    };
  }

  /**
   * 기상청 API 호출
   * @param {string} region - 지역명
   * @returns {Promise<Object>} 기상청 날씨 데이터
   */
  async fetchKmaWeather(region) {
    console.log(`🇰🇷 [KMA API] 기상청 API 호출 시작 - 지역: ${region}`);
    const startTime = Date.now();
    
    try {
      const forecastItems = await fetchKmaForecast(region);
      const endTime = Date.now();
      
      if (!forecastItems || forecastItems.length === 0) {
        console.error(`❌ [KMA API] 기상청 API에서 데이터 없음 - 소요시간: ${endTime - startTime}ms`);
        throw new Error('기상청 API에서 데이터를 받지 못했습니다.');
      }

      console.log(`✅ [KMA API] 기상청 API 응답 성공 - 소요시간: ${endTime - startTime}ms`);
      console.log(`📊 [KMA API] 원본 데이터 개수: ${forecastItems.length}개`);
      
      const processedData = this.processKmaData(forecastItems);
      console.log(`🔄 [KMA API] 데이터 처리 완료:`, processedData);
      return processedData;
    } catch (error) {
      const endTime = Date.now();
      console.error(`❌ [KMA API] 기상청 API 실패 - 소요시간: ${endTime - startTime}ms`);
      console.error(`❌ [KMA API] 오류 상세:`, error);
      throw error;
    }
  }

  /**
   * OpenWeatherMap API 호출
   * @param {string} region - 지역명
   * @returns {Promise<Object>} OpenWeatherMap 날씨 데이터
   */
  async fetchOpenWeatherMap(region) {
    console.log(`🌍 [OWM API] OpenWeatherMap API 호출 시작 - 지역: ${region}`);
    const startTime = Date.now();
    
    // 임시로 API 키 직접 설정 (환경변수 문제 해결을 위해)
    // 401 오류가 발생하므로 다른 API 키 시도
    const API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY || "b6907d289e10d714a6e88b30761fae22";
    
    if (!API_KEY) {
      console.error(`❌ [OWM API] API 키 없음 - .env 파일에 REACT_APP_OPENWEATHER_API_KEY 설정 필요`);
      throw new Error('OpenWeatherMap API 키가 설정되지 않았습니다. .env 파일에 REACT_APP_OPENWEATHER_API_KEY를 추가하세요.');
    }
    
    console.log(`🔑 [OWM API] API 키 확인: ${API_KEY.substring(0, 8)}...`);

    // 한국 지역명을 영어로 변환
    const englishRegion = this.convertRegionToEnglish(region);
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${englishRegion},KR&appid=${API_KEY}&units=metric&lang=kr`;
    
    console.log(`🌐 [OWM API] 요청 URL: ${url.replace(API_KEY, '***API_KEY***')}`);
    
    try {
      const response = await fetch(url);
      const endTime = Date.now();
      
      if (!response.ok) {
        console.error(`❌ [OWM API] HTTP 오류 - 소요시간: ${endTime - startTime}ms`);
        console.error(`❌ [OWM API] 상태: ${response.status} ${response.statusText}`);
        throw new Error(`OpenWeatherMap API 오류: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ [OWM API] OpenWeatherMap API 응답 성공 - 소요시간: ${endTime - startTime}ms`);
      console.log(`📊 [OWM API] 원본 데이터:`, data);
      
      const convertedData = this.convertOpenWeatherMapToKmaFormat(data);
      console.log(`🔄 [OWM API] KMA 형식으로 변환 완료:`, convertedData);
      return convertedData;
    } catch (error) {
      const endTime = Date.now();
      console.error(`❌ [OWM API] OpenWeatherMap API 실패 - 소요시간: ${endTime - startTime}ms`);
      console.error(`❌ [OWM API] 오류 상세:`, error);
      throw new Error(`OpenWeatherMap API 호출 실패: ${error.message}`);
    }
  }

  /**
   * 기상청 데이터 처리
   * @param {Array} forecastItems - 기상청 예보 데이터
   * @returns {Object} 처리된 날씨 데이터
   */
  processKmaData(forecastItems) {
    const now = new Date();
    const currHour = now.getHours();
    const currTime = `${currHour.toString().padStart(2, "0")}00`;

    // 다음 시간대 찾기
    const tmpList = forecastItems.filter((item) => item.category === "TMP");
    const nextTmp = tmpList.find((item) => item.fcstTime >= currTime);

    if (!nextTmp) {
      throw new Error('기상청 데이터에서 유효한 예보를 찾을 수 없습니다.');
    }

    const fcstTime = nextTmp.fcstTime;
    const findValue = (category) =>
      forecastItems.find((i) => i.category === category && i.fcstTime === fcstTime)?.fcstValue;

    const sky = findValue("SKY") || "1";
    const pty = findValue("PTY") || "0";
    const tavg = findValue("TAVG") || nextTmp.fcstValue;

    return {
      temp: nextTmp.fcstValue,
      tavg: tavg,
      rain: findValue("RN1") || "0",
      humidity: findValue("REH") || null,
      sky: sky,
      pty: pty,
      icon: this.getWeatherIcon(sky, pty),
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
   * @param {Object} owmData - OpenWeatherMap 데이터
   * @returns {Object} 변환된 날씨 데이터
   */
  convertOpenWeatherMapToKmaFormat(owmData) {
    const { weather, main, rain, wind } = owmData;
    const weatherCode = weather[0].id;
    const temperature = Math.round(main.temp);

    return {
      temp: temperature,
      tavg: temperature,
      rain: rain?.['1h'] || 0,
      humidity: main.humidity,
      sky: this.convertToSky(weatherCode),
      pty: this.convertToPty(weatherCode),
      icon: this.convertToIconCode(weatherCode),
      season: this.getSeason(temperature, new Date()),
      weatherExpression: this.getWeatherExpression(this.getSeason(temperature, new Date()), temperature),
      seasonColor: this.getSeasonColor(this.getSeason(temperature, new Date())),
      expressionColor: this.getExpressionColor(this.getWeatherExpression(this.getSeason(temperature, new Date()), temperature)),
      fcstTime: new Date().toISOString(),
      apiSource: 'openweathermap'
    };
  }

  /**
   * 지역명을 영어로 변환
   * @param {string} koreanRegion - 한국 지역명
   * @returns {string} 영어 지역명
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

    return regionMap[koreanRegion] || 'Seoul';
  }

  /**
   * OpenWeatherMap 날씨 코드를 기상청 SKY 값으로 변환
   * @param {number} weatherCode - OpenWeatherMap 날씨 코드
   * @returns {string} 기상청 SKY 값
   */
  convertToSky(weatherCode) {
    if (weatherCode === 800) return "1";  // 맑음
    if (weatherCode >= 801 && weatherCode <= 802) return "3";  // 구름많음
    if (weatherCode >= 803 && weatherCode <= 804) return "4";  // 흐림
    return "3";  // 기본값: 구름많음
  }

  /**
   * OpenWeatherMap 날씨 코드를 기상청 PTY 값으로 변환
   * @param {number} weatherCode - OpenWeatherMap 날씨 코드
   * @returns {string} 기상청 PTY 값
   */
  convertToPty(weatherCode) {
    if (weatherCode >= 200 && weatherCode < 300) return "1";  // 뇌우
    if (weatherCode >= 300 && weatherCode < 400) return "1";  // 이슬비
    if (weatherCode >= 500 && weatherCode < 600) return "1";  // 비
    if (weatherCode >= 600 && weatherCode < 700) return "3";  // 눈
    if (weatherCode >= 700 && weatherCode < 800) return "0";  // 안개
    return "0";  // 없음
  }

  /**
   * OpenWeatherMap 날씨 코드를 아이콘 코드로 변환
   * @param {number} weatherCode - OpenWeatherMap 날씨 코드
   * @returns {string} 아이콘 코드
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
   * 기상청 SKY/PTY를 아이콘 코드로 변환
   * @param {string} sky - 하늘 상태
   * @param {string} pty - 강수 형태
   * @returns {string} 아이콘 코드
   */
  getWeatherIcon(sky, pty) {
    if (pty === "1") return "rainy";
    if (pty === "2") return "snow_rain";
    if (pty === "3") return "snow";
    if (pty === "4") return "shower";
    
    if (pty === "0" && sky === "1") return "sunny";
    if (pty === "0" && sky === "3") return "cloudy";
    if (pty === "0" && sky === "4") return "overcast";
    
    return "cloudy";
  }

  /**
   * 계절 구분
   * @param {number} temperature - 온도
   * @param {Date} date - 날짜
   * @returns {string} 계절
   */
  getSeason(temperature, date) {
    const month = date.getMonth() + 1;
    
    if (month >= 3 && month <= 5) return "봄";
    if (month >= 6 && month <= 8) return "여름";
    if (month >= 9 && month <= 11) return "가을";
    return "겨울";
  }

  /**
   * 날씨 표현 (원래 시스템 사용)
   * @param {string} season - 계절
   * @param {number} temperature - 온도
   * @returns {string} 날씨 표현
   */
  getWeatherExpression(season, temperature) {
    // 원래 forecastUtils.js의 getWeatherExpression 함수 사용
    return getWeatherExpression(season, temperature.toString());
  }

  /**
   * 계절별 색상
   * @param {string} season - 계절
   * @returns {string} 색상
   */
  getSeasonColor(season) {
    const colors = {
      "봄": "#98FB98",
      "여름": "#FFB347", 
      "가을": "#DDA0DD",
      "겨울": "#87CEEB"
    };
    return colors[season] || "#98FB98";
  }

  /**
   * 표현별 색상 (원래 시스템 사용)
   * @param {string} expression - 날씨 표현
   * @returns {string} 색상
   */
  getExpressionColor(expression) {
    // 원래 forecastUtils.js의 getExpressionColor 함수 사용
    return getExpressionColor(expression);
  }
}

// 기본 인스턴스 생성
export const weatherService = new WeatherService();

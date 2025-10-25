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
    this.fallbackAPIs = [
      'openweathermap',
      'accuweather', 
      'weatherapi',
      'visualcrossing'
    ];
    this.lastUsedAPI = null;
    this.currentFallbackIndex = 0;
  }

  /**
   * 날씨 데이터 조회 (기상청 우선, 실패 시 여러 대체 API 시도)
   * @param {string} region - 지역명
   * @returns {Promise<Object>} 날씨 데이터
   */
  async getWeather(region) {
    console.log(`🌤️ [WeatherService] 날씨 데이터 요청 시작 - 지역: ${region}`);
    console.log(`📡 [WeatherService] 현재 시간: ${new Date().toLocaleString()}`);
    
    try {
      console.log(`🇰🇷 [WeatherService] 기상청 API 시도 중... (2초 타임아웃)`);
      console.log(`🔑 [WeatherService] 기상청 API 키 확인:`, process.env.REACT_APP_KMA_SERVICE_KEY ? '설정됨' : '없음');
      
      // 기상청 API에 2초 타임아웃 설정
      const kmaData = await Promise.race([
        this.fetchKmaWeather(region),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('기상청 API 타임아웃 (2초)')), 2000)
        )
      ]);
      
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
      console.warn(`⚠️ [WeatherService] 기상청 API 오류 상세:`, error);
      return await this.tryFallbackAPIs(region);
    }
  }

  /**
   * 대체 API들을 순차적으로 시도
   * @param {string} region - 지역명
   * @returns {Promise<Object>} 날씨 데이터
   */
  async tryFallbackAPIs(region) {
    for (let i = 0; i < this.fallbackAPIs.length; i++) {
      const apiName = this.fallbackAPIs[i];
      console.log(`🔄 [WeatherService] ${apiName} API로 대체 시도 중... (${i + 1}/${this.fallbackAPIs.length})`);
      
      try {
        let data;
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
        
        this.lastUsedAPI = apiName;
        console.log(`✅ [WeatherService] ${apiName} API 성공!`);
        console.log(`📊 [WeatherService] ${apiName} 데이터:`, {
          온도: data.temp,
          계절: data.season,
          표현: data.weatherExpression,
          아이콘: data.icon
        });
        return data;
      } catch (apiError) {
        console.warn(`⚠️ [WeatherService] ${apiName} API 실패: ${apiError.message}`);
        continue;
      }
    }
    
    // 모든 API가 실패한 경우
    console.error(`❌ [WeatherService] 모든 API 실패 - 임시 모의 데이터 사용`);
    const mockData = this.getMockWeatherData(region);
    this.lastUsedAPI = 'mock';
    console.log(`📊 [WeatherService] 모의 데이터:`, mockData);
    return mockData;
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
      weatherExpression: weatherExpression,
      seasonColor: this.getSeasonColor(season),
      expressionColor: this.getExpressionColor(weatherExpression),
      fcstTime: new Date().toISOString(),
      apiSource: 'mock'
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
    
    const API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY || "89571719c6df9df656e8a59eb44d21da";
    
    if (!API_KEY) {
      console.error(`❌ [OWM API] API 키 없음 - .env 파일에 REACT_APP_OPENWEATHER_API_KEY 설정 필요`);
      console.error(`❌ [OWM API] 현재 환경변수:`, {
        REACT_APP_OPENWEATHER_API_KEY: process.env.REACT_APP_OPENWEATHER_API_KEY,
        NODE_ENV: process.env.NODE_ENV
      });
      throw new Error('OpenWeatherMap API 키가 설정되지 않았습니다.');
    }
    
    console.log(`🔑 [OWM API] API 키 확인: ${API_KEY.substring(0, 8)}...`);

    // 한국 지역명을 영어로 변환
    const englishRegion = this.convertRegionToEnglish(region);
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${englishRegion},KR&appid=${API_KEY}&units=metric&lang=kr`;
    
    console.log(`🌐 [OWM API] 요청 URL: ${url.replace(API_KEY, '***API_KEY***')}`);
    
    try {
      console.log(`🌐 [OWM API] 실제 요청 URL: ${url}`);
      const response = await fetch(url);
      const endTime = Date.now();
      
      console.log(`📡 [OWM API] 응답 상태: ${response.status} ${response.statusText}`);
      console.log(`📡 [OWM API] 응답 헤더:`, Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        console.error(`❌ [OWM API] HTTP 오류 - 소요시간: ${endTime - startTime}ms`);
        console.error(`❌ [OWM API] 상태: ${response.status} ${response.statusText}`);
        
        // 응답 본문도 확인
        try {
          const errorText = await response.text();
          console.error(`❌ [OWM API] 오류 응답 본문:`, errorText);
        } catch (e) {
          console.error(`❌ [OWM API] 오류 응답 본문 읽기 실패:`, e);
        }
        
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
      console.error(`❌ [OWM API] 오류 스택:`, error.stack);
      throw new Error(`OpenWeatherMap API 호출 실패: ${error.message}`);
    }
  }

  /**
   * AccuWeather API 호출
   * @param {string} region - 지역명
   * @returns {Promise<Object>} AccuWeather 날씨 데이터
   */
  async fetchAccuWeather(region) {
    console.log(`🌤️ [AW API] AccuWeather API 호출 시작 - 지역: ${region}`);
    const startTime = Date.now();
    
    // AccuWeather는 API 키가 없으면 건너뛰기
    const API_KEY = process.env.REACT_APP_ACCUWEATHER_API_KEY;
    
    if (!API_KEY) {
      console.warn(`⚠️ [AW API] API 키 없음 - AccuWeather 건너뛰기`);
      throw new Error('AccuWeather API 키가 설정되지 않았습니다.');
    }
    
    console.log(`🔑 [AW API] API 키 확인: ${API_KEY.substring(0, 8)}...`);

    try {
      // 1단계: 지역 키 조회
      const locationKey = await this.getAccuWeatherLocationKey(region, API_KEY);
      if (!locationKey) {
        throw new Error('AccuWeather 지역 키를 찾을 수 없습니다.');
      }
      
      // 2단계: 현재 날씨 조회
      const url = `https://dataservice.accuweather.com/currentconditions/v1/${locationKey}?apikey=${API_KEY}&details=true`;
      console.log(`🌐 [AW API] 요청 URL: ${url.replace(API_KEY, '***API_KEY***')}`);
      
      const response = await fetch(url);
      const endTime = Date.now();
      
      if (!response.ok) {
        console.error(`❌ [AW API] HTTP 오류 - 소요시간: ${endTime - startTime}ms`);
        console.error(`❌ [AW API] 상태: ${response.status} ${response.statusText}`);
        throw new Error(`AccuWeather API 오류: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ [AW API] AccuWeather API 응답 성공 - 소요시간: ${endTime - startTime}ms`);
      console.log(`📊 [AW API] 원본 데이터:`, data);
      
      const convertedData = this.convertAccuWeatherToKmaFormat(data[0]);
      console.log(`🔄 [AW API] KMA 형식으로 변환 완료:`, convertedData);
      return convertedData;
    } catch (error) {
      const endTime = Date.now();
      console.error(`❌ [AW API] AccuWeather API 실패 - 소요시간: ${endTime - startTime}ms`);
      console.error(`❌ [AW API] 오류 상세:`, error);
      throw new Error(`AccuWeather API 호출 실패: ${error.message}`);
    }
  }

  /**
   * WeatherAPI 호출
   * @param {string} region - 지역명
   * @returns {Promise<Object>} WeatherAPI 날씨 데이터
   */
  async fetchWeatherAPI(region) {
    console.log(`🌦️ [WA API] WeatherAPI 호출 시작 - 지역: ${region}`);
    const startTime = Date.now();
    
    // WeatherAPI는 API 키가 없으면 건너뛰기
    const API_KEY = process.env.REACT_APP_WEATHERAPI_KEY;
    
    if (!API_KEY) {
      console.warn(`⚠️ [WA API] API 키 없음 - WeatherAPI 건너뛰기`);
      throw new Error('WeatherAPI 키가 설정되지 않았습니다.');
    }
    
    console.log(`🔑 [WA API] API 키 확인: ${API_KEY.substring(0, 8)}...`);

    // 한국 지역명을 영어로 변환
    const englishRegion = this.convertRegionToEnglish(region);
    const url = `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${englishRegion}&aqi=no`;
    
    console.log(`🌐 [WA API] 요청 URL: ${url.replace(API_KEY, '***API_KEY***')}`);
    
    try {
      const response = await fetch(url);
      const endTime = Date.now();
      
      if (!response.ok) {
        console.error(`❌ [WA API] HTTP 오류 - 소요시간: ${endTime - startTime}ms`);
        console.error(`❌ [WA API] 상태: ${response.status} ${response.statusText}`);
        throw new Error(`WeatherAPI 오류: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ [WA API] WeatherAPI 응답 성공 - 소요시간: ${endTime - startTime}ms`);
      console.log(`📊 [WA API] 원본 데이터:`, data);
      
      const convertedData = this.convertWeatherAPIToKmaFormat(data);
      console.log(`🔄 [WA API] KMA 형식으로 변환 완료:`, convertedData);
      return convertedData;
    } catch (error) {
      const endTime = Date.now();
      console.error(`❌ [WA API] WeatherAPI 실패 - 소요시간: ${endTime - startTime}ms`);
      console.error(`❌ [WA API] 오류 상세:`, error);
      throw new Error(`WeatherAPI 호출 실패: ${error.message}`);
    }
  }

  /**
   * Visual Crossing API 호출
   * @param {string} region - 지역명
   * @returns {Promise<Object>} Visual Crossing 날씨 데이터
   */
  async fetchVisualCrossing(region) {
    console.log(`🌍 [VC API] Visual Crossing API 호출 시작 - 지역: ${region}`);
    const startTime = Date.now();
    
    // Visual Crossing은 API 키가 없으면 건너뛰기
    const API_KEY = process.env.REACT_APP_VISUALCROSSING_API_KEY;
    
    if (!API_KEY) {
      console.warn(`⚠️ [VC API] API 키 없음 - Visual Crossing 건너뛰기`);
      throw new Error('Visual Crossing API 키가 설정되지 않았습니다.');
    }
    
    console.log(`🔑 [VC API] API 키 확인: ${API_KEY.substring(0, 8)}...`);

    // 한국 지역명을 영어로 변환
    const englishRegion = this.convertRegionToEnglish(region);
    const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${englishRegion}?unitGroup=metric&key=${API_KEY}&contentType=json`;
    
    console.log(`🌐 [VC API] 요청 URL: ${url.replace(API_KEY, '***API_KEY***')}`);
    
    try {
      const response = await fetch(url);
      const endTime = Date.now();
      
      if (!response.ok) {
        console.error(`❌ [VC API] HTTP 오류 - 소요시간: ${endTime - startTime}ms`);
        console.error(`❌ [VC API] 상태: ${response.status} ${response.statusText}`);
        throw new Error(`Visual Crossing API 오류: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ [VC API] Visual Crossing API 응답 성공 - 소요시간: ${endTime - startTime}ms`);
      console.log(`📊 [VC API] 원본 데이터:`, data);
      
      const convertedData = this.convertVisualCrossingToKmaFormat(data);
      console.log(`🔄 [VC API] KMA 형식으로 변환 완료:`, convertedData);
      return convertedData;
    } catch (error) {
      const endTime = Date.now();
      console.error(`❌ [VC API] Visual Crossing API 실패 - 소요시간: ${endTime - startTime}ms`);
      console.error(`❌ [VC API] 오류 상세:`, error);
      throw new Error(`Visual Crossing API 호출 실패: ${error.message}`);
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
   * AccuWeather 지역 키 조회
   * @param {string} region - 지역명
   * @param {string} apiKey - API 키
   * @returns {Promise<string>} 지역 키
   */
  async getAccuWeatherLocationKey(region, apiKey) {
    const englishRegion = this.convertRegionToEnglish(region);
    const url = `https://dataservice.accuweather.com/locations/v1/cities/search?apikey=${apiKey}&q=${englishRegion}&country=KR`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`AccuWeather 지역 검색 실패: ${response.status}`);
      }
      
      const data = await response.json();
      if (data && data.length > 0) {
        return data[0].Key;
      }
      return null;
    } catch (error) {
      console.error(`❌ [AW API] 지역 키 조회 실패:`, error);
      return null;
    }
  }

  /**
   * AccuWeather 데이터를 기상청 형식으로 변환
   * @param {Object} awData - AccuWeather 데이터
   * @returns {Object} 변환된 날씨 데이터
   */
  convertAccuWeatherToKmaFormat(awData) {
    const temperature = Math.round(awData.Temperature.Metric.Value);
    const weatherCode = awData.WeatherIcon;

    return {
      temp: temperature,
      tavg: temperature,
      rain: awData.Precip1hr?.Metric?.Value || 0,
      humidity: awData.RelativeHumidity,
      sky: this.convertAccuWeatherToSky(weatherCode),
      pty: this.convertAccuWeatherToPty(weatherCode),
      icon: this.convertAccuWeatherToIcon(weatherCode),
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
   * @param {Object} waData - WeatherAPI 데이터
   * @returns {Object} 변환된 날씨 데이터
   */
  convertWeatherAPIToKmaFormat(waData) {
    const { current } = waData;
    const temperature = Math.round(current.temp_c);

    return {
      temp: temperature,
      tavg: temperature,
      rain: current.precip_mm || 0,
      humidity: current.humidity,
      sky: this.convertWeatherAPIToSky(current.condition.code),
      pty: this.convertWeatherAPIToPty(current.condition.code),
      icon: this.convertWeatherAPIToIcon(current.condition.code),
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
   * @param {Object} vcData - Visual Crossing 데이터
   * @returns {Object} 변환된 날씨 데이터
   */
  convertVisualCrossingToKmaFormat(vcData) {
    const current = vcData.currentConditions;
    const temperature = Math.round(current.temp);

    return {
      temp: temperature,
      tavg: temperature,
      rain: current.precip || 0,
      humidity: current.humidity,
      sky: this.convertVisualCrossingToSky(current.conditions),
      pty: this.convertVisualCrossingToPty(current.conditions),
      icon: this.convertVisualCrossingToIcon(current.conditions),
      season: this.getSeason(temperature, new Date()),
      weatherExpression: this.getWeatherExpression(this.getSeason(temperature, new Date()), temperature),
      seasonColor: this.getSeasonColor(this.getSeason(temperature, new Date())),
      expressionColor: this.getExpressionColor(this.getWeatherExpression(this.getSeason(temperature, new Date()), temperature)),
      fcstTime: new Date().toISOString(),
      apiSource: 'visualcrossing'
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
   * 계절 구분 (온도와 절기를 고려한 정확한 계산)
   * @param {number} temperature - 온도
   * @param {Date} date - 날짜
   * @returns {string} 계절
   */
  getSeason(temperature, date) {
    // forecastUtils.js의 정확한 getSeason 함수 사용
    return getSeason(temperature.toString(), date);
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
    // forecastUtils.js의 색상과 동일하게 설정
    if (season.includes("봄")) {
      return "#8BC34A"; // 연두색
    }
    else if (season.includes("여름")) {
      return "#2196F3"; // 파란색
    }
    else if (season.includes("가을")) {
      return "#795548"; // 갈색
    }
    else if (season.includes("겨울")) {
      return "#1A237E"; // 진한 파란색
    }
    else {
      return "#795548"; // 기본값 (갈색)
    }
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

  // AccuWeather 변환 함수들
  convertAccuWeatherToSky(weatherCode) {
    if (weatherCode >= 1 && weatherCode <= 5) return "1";  // 맑음
    if (weatherCode >= 6 && weatherCode <= 11) return "3"; // 구름많음
    if (weatherCode >= 12 && weatherCode <= 18) return "4"; // 흐림
    return "3";
  }

  convertAccuWeatherToPty(weatherCode) {
    if (weatherCode >= 12 && weatherCode <= 18) return "1"; // 비
    if (weatherCode >= 19 && weatherCode <= 23) return "3"; // 눈
    if (weatherCode >= 24 && weatherCode <= 29) return "1"; // 뇌우
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
    if (conditionCode === 1000) return "1";  // 맑음
    if (conditionCode >= 1003 && conditionCode <= 1006) return "3"; // 구름많음
    if (conditionCode >= 1007 && conditionCode <= 1009) return "4"; // 흐림
    return "3";
  }

  convertWeatherAPIToPty(conditionCode) {
    if (conditionCode >= 1063 && conditionCode <= 1201) return "1"; // 비
    if (conditionCode >= 1204 && conditionCode <= 1237) return "3"; // 눈
    if (conditionCode >= 1240 && conditionCode <= 1282) return "1"; // 뇌우
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
    if (lowerConditions.includes('rain') || lowerConditions.includes('shower')) return "1";
    if (lowerConditions.includes('snow')) return "3";
    if (lowerConditions.includes('thunder') || lowerConditions.includes('storm')) return "1";
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

// 기본 인스턴스 생성
export const weatherService = new WeatherService();

/**
 * WeatherService 단위 테스트
 */
import { WeatherService } from '../../../api/weatherService';
import { fetchKmaForecast } from '../../../api/kmaWeather';

// kmaWeather 모크
jest.mock('../../../api/kmaWeather', () => ({
  fetchKmaForecast: jest.fn()
}));

describe('WeatherService', () => {
  let weatherService;

  beforeEach(() => {
    weatherService = new WeatherService();
    jest.clearAllMocks();
    // 실제 타이머 사용 (비동기 테스트를 위해)
  });

  afterEach(() => {
    // 정리
  });

  describe('constructor', () => {
    test('기본 API가 kma로 설정되는지 확인', () => {
      expect(weatherService.primaryAPI).toBe('kma');
    });

    test('fallback API 목록이 올바르게 설정되는지 확인', () => {
      expect(weatherService.fallbackAPIs).toEqual([
        'openweathermap',
        'accuweather',
        'weatherapi',
        'visualcrossing'
      ]);
    });

    test('초기 상태값이 올바르게 설정되는지 확인', () => {
      expect(weatherService.lastUsedAPI).toBeNull();
      expect(weatherService.currentFallbackIndex).toBe(0);
    });
  });

  describe('getWeather', () => {
    test('기상청 API 성공 시 데이터 반환', async () => {
      const mockWeatherData = {
        temp: 20,
        sky: '1',
        pty: '0',
        icon: 'sunny',
        season: '봄',
        weatherExpression: '따뜻해요',
        seasonColor: '#8BC34A',
        expressionColor: '#FF9800',
        apiSource: 'kma',
        tavg: 20,
        rain: 0,
        humidity: 60,
        fcstTime: '1200'
      };

      // fetchKmaWeather 메서드를 직접 모크
      weatherService.fetchKmaWeather = jest.fn().mockResolvedValue(mockWeatherData);

      const result = await weatherService.getWeather('Seoul');

      expect(result).toEqual(mockWeatherData);
      expect(weatherService.lastUsedAPI).toBe('kma');
      expect(weatherService.fetchKmaWeather).toHaveBeenCalledWith('Seoul');
    }, 10000);

    test('기상청 API 타임아웃 시 fallback API 시도', async () => {
      // 타임아웃을 시뮬레이션하기 위해 reject하는 Promise 반환
      weatherService.fetchKmaWeather = jest.fn().mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('기상청 API 타임아웃 (2초)')), 2000)
        )
      );

      // Mock fallback API
      weatherService.fetchOpenWeatherMap = jest.fn().mockResolvedValue({
        temp: 20,
        icon: 'cloudy',
        apiSource: 'openweathermap'
      });

      const result = await weatherService.getWeather('Seoul');

      expect(result).toBeDefined();
      expect(weatherService.fetchOpenWeatherMap).toHaveBeenCalled();
    }, 10000);

    test('기상청 API 실패 시 fallback API 시도', async () => {
      weatherService.fetchKmaWeather = jest.fn().mockRejectedValue(new Error('API Error'));

      weatherService.tryFallbackAPIs = jest.fn().mockResolvedValue({
        temp: 20,
        icon: 'cloudy',
        apiSource: 'openweathermap'
      });

      await weatherService.getWeather('Seoul');

      expect(weatherService.tryFallbackAPIs).toHaveBeenCalledWith('Seoul');
    });
  });

  describe('getMockWeatherData', () => {
    test('모의 데이터가 올바른 구조를 가지고 있는지 확인', () => {
      const mockData = weatherService.getMockWeatherData('Seoul');

      expect(mockData).toHaveProperty('temp');
      expect(mockData).toHaveProperty('icon'); // iconCode가 아니라 icon
      expect(mockData).toHaveProperty('season');
      expect(mockData).toHaveProperty('apiSource');
      expect(mockData.apiSource).toBe('mock');
    });

    test('모의 데이터의 온도가 합리적인 범위 내에 있는지 확인', () => {
      const mockData = weatherService.getMockWeatherData('Seoul');
      const temp = parseFloat(mockData.temp);

      expect(temp).toBeGreaterThanOrEqual(-10);
      expect(temp).toBeLessThanOrEqual(40);
    });
  });

  describe('getSeason', () => {
    test('온도와 날짜를 기반으로 계절 반환', () => {
      const date = new Date(2024, 3, 15); // 4월
      const season = weatherService.getSeason(15, date);
      
      expect(season).toBeDefined();
      expect(typeof season).toBe('string');
    });
  });

  describe('getWeatherExpression', () => {
    test('계절과 온도를 기반으로 날씨 표현 반환', () => {
      const expression = weatherService.getWeatherExpression('봄', 20);
      
      expect(expression).toBeDefined();
      expect(typeof expression).toBe('string');
    });
  });

  describe('getExpressionColor', () => {
    test('날씨 표현에 대한 색상 반환', () => {
      const color = weatherService.getExpressionColor('따뜻해요');
      
      expect(color).toBeDefined();
      expect(typeof color).toBe('string');
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
    });
  });

  describe('getSeasonColor', () => {
    test('계절에 대한 색상 반환', () => {
      const color = weatherService.getSeasonColor('봄');
      
      expect(color).toBeDefined();
      expect(typeof color).toBe('string');
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
    });
  });
});


/**
 * 날씨 API 통합 테스트
 */
import { WeatherService } from '../../../api/weatherService';
import { fetchKmaForecast } from '../../../api/kmaWeather';

jest.mock('../../../api/kmaWeather', () => ({
  fetchKmaForecast: jest.fn()
}));

describe('Weather API Integration', () => {
  let weatherService;

  beforeEach(() => {
    weatherService = new WeatherService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    // 정리
  });

  describe('날씨 데이터 조회 플로우', () => {
    test('기상청 API 성공 시 전체 플로우', async () => {
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
    }, 10000);

    test('기상청 API 실패 후 Fallback API 성공 플로우', async () => {
      weatherService.fetchKmaWeather = jest.fn().mockRejectedValue(new Error('KMA API Error'));

      // Mock fallback API
      weatherService.fetchOpenWeatherMap = jest.fn().mockResolvedValue({
        temp: 22,
        icon: 'cloudy',
        season: '봄',
        apiSource: 'openweathermap'
      });

      const result = await weatherService.getWeather('Seoul');

      expect(result).toBeDefined();
      expect(result.temp).toBe(22);
      expect(weatherService.lastUsedAPI).toBe('openweathermap');
    }, 10000);

    test('모든 API 실패 후 Mock 데이터 반환 플로우', async () => {
      weatherService.fetchKmaWeather = jest.fn().mockRejectedValue(new Error('KMA API Error'));

      // 모든 fallback API 실패
      weatherService.fetchOpenWeatherMap = jest.fn().mockRejectedValue(new Error('OWM Error'));
      weatherService.fetchAccuWeather = jest.fn().mockRejectedValue(new Error('AccuWeather Error'));
      weatherService.fetchWeatherAPI = jest.fn().mockRejectedValue(new Error('WeatherAPI Error'));
      weatherService.fetchVisualCrossing = jest.fn().mockRejectedValue(new Error('VC Error'));

      const result = await weatherService.getWeather('Seoul');

      expect(result).toBeDefined();
      expect(result.apiSource).toBe('mock');
      expect(weatherService.lastUsedAPI).toBe('mock');
    }, 10000);
  });

  describe('날씨 데이터 표준화', () => {
    test('다양한 API에서 받은 데이터가 표준 형식으로 변환되는지 확인', async () => {
      const mockKmaData = {
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
      weatherService.fetchKmaWeather = jest.fn().mockResolvedValue(mockKmaData);

      const result = await weatherService.getWeather('Seoul');

      expect(result).toHaveProperty('temp');
      expect(result).toHaveProperty('icon');
      expect(typeof result.temp).toBe('number');
    }, 10000);
  });
});


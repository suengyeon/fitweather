/**
 * forecastUtils 단위 테스트
 */
import {
  selectNextForecast,
  getSeason,
  getDetailedSeasonByLunar,
  getSeasonForPastWeather,
  getWeatherExpression,
  getExpressionColor
} from '../../../utils/forecastUtils';

describe('forecastUtils', () => {
  describe('selectNextForecast', () => {
    test('유효한 예보 데이터에서 다음 시간대 예보 추출', () => {
      const now = new Date();
      const currentHour = now.getHours();
      const nextHour = (currentHour + 1) % 24;
      const nextTime = `${nextHour.toString().padStart(2, '0')}00`;

      const items = [
        { category: 'TMP', fcstTime: nextTime, fcstValue: '20' },
        { category: 'SKY', fcstTime: nextTime, fcstValue: '1' },
        { category: 'PTY', fcstTime: nextTime, fcstValue: '0' },
        { category: 'REH', fcstTime: nextTime, fcstValue: '60' },
        { category: 'RN1', fcstTime: nextTime, fcstValue: '0' }
      ];

      const result = selectNextForecast(items);
      
      expect(result).toBeDefined();
      expect(result.temp).toBe('20');
      expect(result.sky).toBe('1');
      expect(result.pty).toBe('0');
    });

    test('빈 배열이 주어지면 null 반환', () => {
      expect(selectNextForecast([])).toBeNull();
    });

    test('null이 주어지면 null 반환', () => {
      expect(selectNextForecast(null)).toBeNull();
    });

    test('배열이 아닌 값이 주어지면 null 반환', () => {
      expect(selectNextForecast('invalid')).toBeNull();
    });

    test('다음 시간대 예보가 없으면 null 반환', () => {
      const pastTime = '0000';
      const items = [
        { category: 'TMP', fcstTime: pastTime, fcstValue: '20' }
      ];
      expect(selectNextForecast(items)).toBeNull();
    });
  });

  describe('getDetailedSeasonByLunar', () => {
    test('봄 날짜에 대해 올바른 계절 반환', () => {
      const springDate = new Date(2024, 3, 15); // 4월 15일
      const season = getDetailedSeasonByLunar(springDate);
      expect(season).toContain('봄');
    });

    test('여름 날짜에 대해 올바른 계절 반환', () => {
      const summerDate = new Date(2024, 6, 15); // 7월 15일
      const season = getDetailedSeasonByLunar(summerDate);
      expect(season).toContain('여름');
    });

    test('가을 날짜에 대해 올바른 계절 반환', () => {
      const autumnDate = new Date(2024, 9, 15); // 10월 15일
      const season = getDetailedSeasonByLunar(autumnDate);
      expect(season).toContain('가을');
    });

    test('겨울 날짜에 대해 올바른 계절 반환', () => {
      const winterDate = new Date(2024, 11, 15); // 12월 15일
      const season = getDetailedSeasonByLunar(winterDate);
      expect(season).toContain('겨울');
    });

    test('기본값으로 현재 날짜 사용', () => {
      const season = getDetailedSeasonByLunar();
      expect(season).toBeDefined();
      expect(typeof season).toBe('string');
    });
  });

  describe('getSeason', () => {
    test('날짜를 기반으로 계절 반환', () => {
      const date = new Date(2024, 3, 15);
      const season = getSeason(20, date);
      expect(season).toBeDefined();
      expect(typeof season).toBe('string');
    });

    test('기본값으로 현재 날짜 사용', () => {
      const season = getSeason(20);
      expect(season).toBeDefined();
    });
  });

  describe('getSeasonForPastWeather', () => {
    test('봄 온도와 날짜에 대해 올바른 계절 반환', () => {
      const springDate = new Date(2024, 3, 15);
      const season = getSeasonForPastWeather(15, springDate);
      expect(season).toContain('봄');
    });

    test('여름 온도와 날짜에 대해 올바른 계절 반환', () => {
      const summerDate = new Date(2024, 6, 15);
      const season = getSeasonForPastWeather(28, summerDate);
      expect(season).toContain('여름');
    });

    test('매우 높은 온도로 계절 조정', () => {
      const winterDate = new Date(2024, 11, 15);
      const season = getSeasonForPastWeather(30, winterDate);
      // 온도가 매우 높으면 계절이 조정될 수 있음
      expect(season).toBeDefined();
    });

    test('매우 낮은 온도로 계절 조정', () => {
      const summerDate = new Date(2024, 6, 15);
      const season = getSeasonForPastWeather(0, summerDate);
      expect(season).toBeDefined();
    });
  });

  describe('getWeatherExpression', () => {
    test('봄 계절에 대한 날씨 표현 반환', () => {
      expect(getWeatherExpression('봄', 20)).toBe('따뜻해요');
      expect(getWeatherExpression('봄', 15)).toBe('포근해요');
      expect(getWeatherExpression('봄', 10)).toBe('시원해요');
      expect(getWeatherExpression('봄', 5)).toBe('쌀쌀해요');
    });

    test('여름 계절에 대한 날씨 표현 반환', () => {
      expect(getWeatherExpression('여름', 35)).toBe('너무 더워요');
      expect(getWeatherExpression('여름', 30)).toBe('무척 더워요');
      expect(getWeatherExpression('여름', 27)).toBe('더워요');
      expect(getWeatherExpression('여름', 23)).toBe('딱 좋아요');
    });

    test('가을 계절에 대한 날씨 표현 반환', () => {
      expect(getWeatherExpression('가을', 20)).toBe('따뜻해요');
      expect(getWeatherExpression('가을', 15)).toBe('선선해요');
      expect(getWeatherExpression('가을', 10)).toBe('시원해요');
    });

    test('겨울 계절에 대한 날씨 표현 반환', () => {
      expect(getWeatherExpression('겨울', 5)).toBe('쌀쌀해요');
      expect(getWeatherExpression('겨울', 0)).toBe('추워요');
      expect(getWeatherExpression('겨울', -3)).toBe('매우 추워요');
      expect(getWeatherExpression('겨울', -10)).toBe('꽁꽁 얼겠어요');
    });
  });

  describe('getExpressionColor', () => {
    test('더운 날씨 표현에 대한 색상 반환', () => {
      expect(getExpressionColor('너무 더워요')).toBe('#F44336');
      expect(getExpressionColor('무척 더워요')).toBe('#F44336');
    });

    test('따뜻한 날씨 표현에 대한 색상 반환', () => {
      expect(getExpressionColor('따뜻해요')).toBe('#FF9800');
      expect(getExpressionColor('포근해요')).toBe('#FF9800');
    });

    test('시원한 날씨 표현에 대한 색상 반환', () => {
      expect(getExpressionColor('시원해요')).toBe('#03A9F4');
      expect(getExpressionColor('선선해요')).toBe('#03A9F4');
    });

    test('추운 날씨 표현에 대한 색상 반환', () => {
      expect(getExpressionColor('추워요')).toBe('#81D4FA');
      expect(getExpressionColor('꽁꽁 얼겠어요')).toBe('#81D4FA');
    });

    test('기본 색상 반환', () => {
      expect(getExpressionColor('unknown')).toBe('#03A9F4');
    });
  });
});


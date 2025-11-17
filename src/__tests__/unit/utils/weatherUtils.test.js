/**
 * weatherUtils 단위 테스트
 */
import { getWeatherEmoji, feelingToEmoji, getFeelingOptions, feelingMap } from '../../../utils/weatherUtils';

describe('weatherUtils', () => {
  describe('getWeatherEmoji', () => {
    test('맑은 날씨 아이콘 코드를 이모지로 변환', () => {
      expect(getWeatherEmoji('sunny')).toBe('☀️');
    });

    test('구름 많은 날씨 아이콘 코드를 이모지로 변환', () => {
      expect(getWeatherEmoji('cloudy')).toBe('☁️');
    });

    test('흐린 날씨 아이콘 코드를 이모지로 변환', () => {
      expect(getWeatherEmoji('overcast')).toBe('🌥️');
    });

    test('비 오는 날씨 아이콘 코드를 이모지로 변환', () => {
      expect(getWeatherEmoji('rain')).toBe('🌧️');
    });

    test('눈 오는 날씨 아이콘 코드를 이모지로 변환', () => {
      expect(getWeatherEmoji('snow')).toBe('❄️');
    });

    test('비/눈 날씨 아이콘 코드를 이모지로 변환', () => {
      expect(getWeatherEmoji('snow_rain')).toBe('🌨️');
    });

    test('소나기 날씨 아이콘 코드를 이모지로 변환', () => {
      expect(getWeatherEmoji('shower')).toBe('🌦️');
    });

    test('알 수 없는 아이콘 코드는 undefined 반환', () => {
      expect(getWeatherEmoji('unknown')).toBeUndefined();
    });
  });

  describe('feelingToEmoji', () => {
    test('steam 감정을 이모지로 변환', () => {
      expect(feelingToEmoji('steam')).toBe('🥟 (찐만두)');
    });

    test('hot 감정을 이모지로 변환', () => {
      expect(feelingToEmoji('hot')).toBe('🥵 (더움)');
    });

    test('nice 감정을 이모지로 변환', () => {
      expect(feelingToEmoji('nice')).toBe('👍🏻 (적당)');
    });

    test('cold 감정을 이모지로 변환', () => {
      expect(feelingToEmoji('cold')).toBe('💨 (추움)');
    });

    test('ice 감정을 이모지로 변환', () => {
      expect(feelingToEmoji('ice')).toBe('🥶 (동태)');
    });

    test('알 수 없는 감정은 원본 반환', () => {
      expect(feelingToEmoji('unknown')).toBe('unknown');
    });
  });

  describe('getFeelingOptions', () => {
    test('감정 옵션 배열을 올바르게 생성', () => {
      const options = getFeelingOptions();
      expect(Array.isArray(options)).toBe(true);
      expect(options.length).toBe(Object.keys(feelingMap).length);
      
      options.forEach(option => {
        expect(option).toHaveProperty('value');
        expect(option).toHaveProperty('label');
        expect(feelingMap[option.value]).toBe(option.label);
      });
    });

    test('모든 감정 옵션이 포함되어 있는지 확인', () => {
      const options = getFeelingOptions();
      const values = options.map(opt => opt.value);
      
      Object.keys(feelingMap).forEach(key => {
        expect(values).toContain(key);
      });
    });
  });

  describe('feelingMap', () => {
    test('feelingMap이 올바른 구조를 가지고 있는지 확인', () => {
      expect(feelingMap).toHaveProperty('steam');
      expect(feelingMap).toHaveProperty('hot');
      expect(feelingMap).toHaveProperty('nice');
      expect(feelingMap).toHaveProperty('cold');
      expect(feelingMap).toHaveProperty('ice');
    });
  });
});


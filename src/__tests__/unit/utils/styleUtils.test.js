/**
 * styleUtils 단위 테스트
 */
import { getStyleLabel, getStyleCode, getAllStyleOptions } from '../../../utils/styleUtils';

describe('styleUtils', () => {
  describe('getStyleLabel', () => {
    test('casual 스타일 코드를 한국어로 변환', () => {
      expect(getStyleLabel('casual')).toBe('캐주얼');
    });

    test('formal 스타일 코드를 한국어로 변환', () => {
      expect(getStyleLabel('formal')).toBe('포멀');
    });

    test('basic 스타일 코드를 한국어로 변환', () => {
      expect(getStyleLabel('basic')).toBe('베이직/놈코어');
    });

    test('sporty 스타일 코드를 한국어로 변환', () => {
      expect(getStyleLabel('sporty')).toBe('스포티/액티브');
    });

    test('feminine 스타일 코드를 한국어로 변환', () => {
      expect(getStyleLabel('feminine')).toBe('러블리/페미닌');
    });

    test('street 스타일 코드를 한국어로 변환', () => {
      expect(getStyleLabel('street')).toBe('시크/스트릿');
    });

    test('알 수 없는 스타일 코드는 원본 반환', () => {
      expect(getStyleLabel('unknown')).toBe('unknown');
    });
  });

  describe('getStyleCode', () => {
    test('캐주얼 라벨을 코드로 변환', () => {
      expect(getStyleCode('캐주얼')).toBe('casual');
    });

    test('포멀 라벨을 코드로 변환', () => {
      expect(getStyleCode('포멀')).toBe('formal');
    });

    test('베이직/놈코어 라벨을 코드로 변환', () => {
      expect(getStyleCode('베이직/놈코어')).toBe('basic');
    });

    test('스포티/액티브 라벨을 코드로 변환', () => {
      expect(getStyleCode('스포티/액티브')).toBe('sporty');
    });

    test('러블리/페미닌 라벨을 코드로 변환', () => {
      expect(getStyleCode('러블리/페미닌')).toBe('feminine');
    });

    test('시크/스트릿 라벨을 코드로 변환', () => {
      expect(getStyleCode('시크/스트릿')).toBe('street');
    });

    test('알 수 없는 라벨은 원본 반환', () => {
      expect(getStyleCode('알 수 없음')).toBe('알 수 없음');
    });
  });

  describe('getAllStyleOptions', () => {
    test('모든 스타일 옵션 배열 반환', () => {
      const options = getAllStyleOptions();
      
      expect(Array.isArray(options)).toBe(true);
      expect(options.length).toBe(6);
    });

    test('각 옵션이 올바른 구조를 가지고 있는지 확인', () => {
      const options = getAllStyleOptions();
      
      options.forEach(option => {
        expect(option).toHaveProperty('value');
        expect(option).toHaveProperty('label');
        expect(typeof option.value).toBe('string');
        expect(typeof option.label).toBe('string');
      });
    });

    test('모든 스타일 코드가 포함되어 있는지 확인', () => {
      const options = getAllStyleOptions();
      const values = options.map(opt => opt.value);
      
      expect(values).toContain('casual');
      expect(values).toContain('formal');
      expect(values).toContain('basic');
      expect(values).toContain('sporty');
      expect(values).toContain('feminine');
      expect(values).toContain('street');
    });

    test('getStyleLabel과 getAllStyleOptions의 일관성 확인', () => {
      const options = getAllStyleOptions();
      
      options.forEach(option => {
        expect(getStyleLabel(option.value)).toBe(option.label);
      });
    });

    test('getStyleCode와 getAllStyleOptions의 일관성 확인', () => {
      const options = getAllStyleOptions();
      
      options.forEach(option => {
        expect(getStyleCode(option.label)).toBe(option.value);
      });
    });
  });
});


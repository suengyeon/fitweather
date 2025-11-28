/**
 * seasonUtils 단위 테스트
 */
import { getSeasonInfo } from '../../../utils/seasonUtils';

describe('seasonUtils', () => {
  describe('getSeasonInfo', () => {
    test('3월(초봄)에 대한 계절 정보 반환', () => {
      const date = new Date(2024, 2, 15); // 3월 15일
      const info = getSeasonInfo(date);
      
      expect(info.season).toBe('spring');
      expect(info.period).toBe('early');
      expect(info.label).toBe('초봄');
      expect(info.emoji).toBe('🌸');
    });

    test('4월(늦봄)에 대한 계절 정보 반환', () => {
      const date = new Date(2024, 3, 15); // 4월 15일
      const info = getSeasonInfo(date);
      
      expect(info.season).toBe('spring');
      expect(info.period).toBe('mid');
      expect(info.label).toBe('늦봄');
      expect(info.emoji).toBe('🌺');
    });

    test('5월(늦봄)에 대한 계절 정보 반환', () => {
      const date = new Date(2024, 4, 15); // 5월 15일
      const info = getSeasonInfo(date);
      
      expect(info.season).toBe('spring');
      expect(info.period).toBe('late');
      expect(info.label).toBe('늦봄');
      expect(info.emoji).toBe('🌺');
    });

    test('6월(초여름)에 대한 계절 정보 반환', () => {
      const date = new Date(2024, 5, 15); // 6월 15일
      const info = getSeasonInfo(date);
      
      expect(info.season).toBe('summer');
      expect(info.period).toBe('early');
      expect(info.label).toBe('초여름');
      expect(info.emoji).toBe('☀️');
    });

    test('7월(한여름)에 대한 계절 정보 반환', () => {
      const date = new Date(2024, 6, 15); // 7월 15일
      const info = getSeasonInfo(date);
      
      expect(info.season).toBe('summer');
      expect(info.period).toBe('mid');
      expect(info.label).toBe('한여름');
      expect(info.emoji).toBe('🔥');
    });

    test('8월(늦여름)에 대한 계절 정보 반환', () => {
      const date = new Date(2024, 7, 15); // 8월 15일
      const info = getSeasonInfo(date);
      
      expect(info.season).toBe('summer');
      expect(info.period).toBe('late');
      expect(info.label).toBe('늦여름');
      expect(info.emoji).toBe('🌞');
    });

    test('9월(초가을)에 대한 계절 정보 반환', () => {
      const date = new Date(2024, 8, 15); // 9월 15일
      const info = getSeasonInfo(date);
      
      expect(info.season).toBe('autumn');
      expect(info.period).toBe('early');
      expect(info.label).toBe('초가을');
      expect(info.emoji).toBe('🍂');
    });

    test('10월(초가을)에 대한 계절 정보 반환', () => {
      const date = new Date(2024, 9, 15); // 10월 15일
      const info = getSeasonInfo(date);
      
      expect(info.season).toBe('autumn');
      expect(info.period).toBe('early');
      expect(info.label).toBe('초가을');
      expect(info.emoji).toBe('🍂');
    });

    test('11월(늦가을)에 대한 계절 정보 반환', () => {
      const date = new Date(2024, 10, 15); // 11월 15일
      const info = getSeasonInfo(date);
      
      expect(info.season).toBe('autumn');
      expect(info.period).toBe('late');
      expect(info.label).toBe('늦가을');
      expect(info.emoji).toBe('🍁');
    });

    test('12월(초겨울)에 대한 계절 정보 반환', () => {
      const date = new Date(2024, 11, 15); // 12월 15일
      const info = getSeasonInfo(date);
      
      expect(info.season).toBe('winter');
      expect(info.period).toBe('early');
      expect(info.label).toBe('초겨울');
      expect(info.emoji).toBe('❄️');
    });

    test('1월(한겨울)에 대한 계절 정보 반환', () => {
      const date = new Date(2024, 0, 15); // 1월 15일
      const info = getSeasonInfo(date);
      
      expect(info.season).toBe('winter');
      expect(info.period).toBe('mid');
      expect(info.label).toBe('한겨울');
      expect(info.emoji).toBe('🥶');
    });

    test('2월(늦겨울)에 대한 계절 정보 반환', () => {
      const date = new Date(2024, 1, 15); // 2월 15일
      const info = getSeasonInfo(date);
      
      expect(info.season).toBe('winter');
      expect(info.period).toBe('late');
      expect(info.label).toBe('늦겨울');
      expect(info.emoji).toBe('🌨️');
    });

    test('기본값으로 현재 날짜 사용', () => {
      const info = getSeasonInfo();
      
      expect(info).toHaveProperty('season');
      expect(info).toHaveProperty('period');
      expect(info).toHaveProperty('label');
      expect(info).toHaveProperty('emoji');
    });

    test('모든 반환값이 올바른 구조를 가지고 있는지 확인', () => {
      const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      
      months.forEach(month => {
        const date = new Date(2024, month - 1, 15);
        const info = getSeasonInfo(date);
        
        expect(info).toHaveProperty('season');
        expect(info).toHaveProperty('period');
        expect(info).toHaveProperty('label');
        expect(info).toHaveProperty('emoji');
        expect(typeof info.season).toBe('string');
        expect(typeof info.period).toBe('string');
        expect(typeof info.label).toBe('string');
        expect(typeof info.emoji).toBe('string');
      });
    });
  });
});


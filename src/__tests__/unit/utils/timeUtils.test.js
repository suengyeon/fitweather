/**
 * timeUtils 단위 테스트
 */
import { getTodayYYYYMMDD, getBaseTime } from '../../../utils/timeUtils';

describe('timeUtils', () => {
  // Date 모킹을 위한 헬퍼
  const mockDate = (year, month, day, hour, minute) => {
    const date = new Date(year, month - 1, day, hour, minute);
    jest.useFakeTimers();
    jest.setSystemTime(date);
    return date;
  };

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getTodayYYYYMMDD', () => {
    test('02:00 이후 시간에 대해 오늘 날짜 반환', () => {
      mockDate(2024, 3, 15, 10, 30); // 2024년 3월 15일 10:30
      const result = getTodayYYYYMMDD();
      expect(result).toBe('20240315');
    });

    test('02:00 이전 시간에 대해 어제 날짜 반환', () => {
      mockDate(2024, 3, 15, 1, 30); // 2024년 3월 15일 01:30
      const result = getTodayYYYYMMDD();
      expect(result).toBe('20240314'); // 어제 날짜
    });

    test('정확히 02:00에 대해 오늘 날짜 반환 (02:00 이상이면 오늘)', () => {
      mockDate(2024, 3, 15, 2, 0); // 2024년 3월 15일 02:00
      const result = getTodayYYYYMMDD();
      expect(result).toBe('20240315'); // 오늘 날짜 (02:00 이상이면 오늘)
    });

    test('날짜 형식이 YYYYMMDD인지 확인', () => {
      mockDate(2024, 12, 25, 15, 0);
      const result = getTodayYYYYMMDD();
      expect(result).toMatch(/^\d{8}$/);
      expect(result.length).toBe(8);
    });

    test('월과 일이 2자리로 패딩되는지 확인', () => {
      mockDate(2024, 1, 5, 15, 0); // 2024년 1월 5일
      const result = getTodayYYYYMMDD();
      expect(result).toBe('20240105');
    });
  });

  describe('getBaseTime', () => {
    test('00:00 ~ 01:59 사이에 대해 2300 반환', () => {
      mockDate(2024, 3, 15, 0, 30);
      expect(getBaseTime()).toBe('2300');

      mockDate(2024, 3, 15, 1, 59);
      expect(getBaseTime()).toBe('2300');
    });

    test('02:00 ~ 04:59 사이에 대해 0200 반환', () => {
      mockDate(2024, 3, 15, 2, 0);
      expect(getBaseTime()).toBe('0200');

      mockDate(2024, 3, 15, 4, 59);
      expect(getBaseTime()).toBe('0200');
    });

    test('05:00 ~ 07:59 사이에 대해 0500 반환', () => {
      mockDate(2024, 3, 15, 5, 0);
      expect(getBaseTime()).toBe('0500');

      mockDate(2024, 3, 15, 7, 59);
      expect(getBaseTime()).toBe('0500');
    });

    test('08:00 ~ 10:59 사이에 대해 0800 반환', () => {
      mockDate(2024, 3, 15, 8, 0);
      expect(getBaseTime()).toBe('0800');

      mockDate(2024, 3, 15, 10, 59);
      expect(getBaseTime()).toBe('0800');
    });

    test('11:00 ~ 13:59 사이에 대해 1100 반환', () => {
      mockDate(2024, 3, 15, 11, 0);
      expect(getBaseTime()).toBe('1100');

      mockDate(2024, 3, 15, 13, 59);
      expect(getBaseTime()).toBe('1100');
    });

    test('14:00 ~ 16:59 사이에 대해 1400 반환', () => {
      mockDate(2024, 3, 15, 14, 0);
      expect(getBaseTime()).toBe('1400');

      mockDate(2024, 3, 15, 16, 59);
      expect(getBaseTime()).toBe('1400');
    });

    test('17:00 ~ 19:59 사이에 대해 1700 반환', () => {
      mockDate(2024, 3, 15, 17, 0);
      expect(getBaseTime()).toBe('1700');

      mockDate(2024, 3, 15, 19, 59);
      expect(getBaseTime()).toBe('1700');
    });

    test('20:00 ~ 22:59 사이에 대해 2000 반환', () => {
      mockDate(2024, 3, 15, 20, 0);
      expect(getBaseTime()).toBe('2000');

      mockDate(2024, 3, 15, 22, 59);
      expect(getBaseTime()).toBe('2000');
    });

    test('23:00 ~ 23:59 사이에 대해 2300 반환', () => {
      mockDate(2024, 3, 15, 23, 0);
      expect(getBaseTime()).toBe('2300');

      mockDate(2024, 3, 15, 23, 59);
      expect(getBaseTime()).toBe('2300');
    });

    test('반환값이 HHMM 형식인지 확인', () => {
      mockDate(2024, 3, 15, 12, 0);
      const result = getBaseTime();
      expect(result).toMatch(/^\d{4}$/);
      expect(result.length).toBe(4);
    });
  });
});


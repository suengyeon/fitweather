/**
 * 테스트 유틸리티 함수들
 */

/**
 * Firebase 모크 헬퍼
 */
export const createMockFirestoreDoc = (id, data) => ({
  id,
  data: () => data,
  exists: () => true,
  ref: { id }
});

export const createMockFirestoreSnapshot = (docs) => ({
  docs,
  empty: docs.length === 0,
  size: docs.length,
  forEach: (callback) => docs.forEach(callback)
});

/**
 * 날짜 모크 헬퍼
 */
export const mockDate = (year, month, day, hour = 0, minute = 0) => {
  const date = new Date(year, month - 1, day, hour, minute);
  jest.spyOn(global, 'Date').mockImplementation(() => date);
  return date;
};

export const restoreDate = () => {
  jest.restoreAllMocks();
};

/**
 * 비동기 함수 테스트 헬퍼
 */
export const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 에러 캐치 헬퍼
 */
export const expectToThrow = async (fn, errorMessage) => {
  try {
    await fn();
    throw new Error('Expected function to throw');
  } catch (error) {
    if (errorMessage) {
      expect(error.message).toContain(errorMessage);
    }
  }
};


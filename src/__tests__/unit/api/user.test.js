/**
 * user API 단위 테스트
 */
import { fetchUserRegion } from '../../../api/user';
import { doc, getDoc } from '../../../__tests__/__mocks__/firebase';

// Firebase 모크 설정
jest.mock('../../../firebase', () => ({
  db: require('../../../__tests__/__mocks__/firebase').db
}));

jest.mock('firebase/firestore', () => 
  require('../../../__tests__/__mocks__/firebase')
);

describe('user API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchUserRegion', () => {
    test('사용자 지역 정보 조회 성공', async () => {
      const mockUserDoc = {
        exists: () => true,
        data: () => ({ region: 'Seoul' })
      };

      getDoc.mockResolvedValue(mockUserDoc);

      const result = await fetchUserRegion('user123');

      expect(result).toBe('Seoul');
      expect(doc).toHaveBeenCalledWith(expect.anything(), 'users', 'user123');
      expect(getDoc).toHaveBeenCalled();
    });

    test('사용자 문서가 존재하지 않으면 null 반환', async () => {
      const mockUserDoc = {
        exists: () => false
      };

      getDoc.mockResolvedValue(mockUserDoc);

      const result = await fetchUserRegion('user123');

      expect(result).toBeNull();
    });

    test('에러 발생 시 null 반환', async () => {
      getDoc.mockRejectedValue(new Error('Firestore error'));

      const result = await fetchUserRegion('user123');

      expect(result).toBeNull();
    });

    test('region 필드가 없으면 undefined 반환', async () => {
      const mockUserDoc = {
        exists: () => true,
        data: () => ({}) // region 필드 없음
      };

      getDoc.mockResolvedValue(mockUserDoc);

      const result = await fetchUserRegion('user123');

      expect(result).toBeUndefined();
    });
  });
});


/**
 * toggleLike API 단위 테스트
 */
import { toggleLike } from '../../../api/toggleLike';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from '../../../__tests__/__mocks__/firebase';

// Firebase 모크 설정
jest.mock('../../../firebase', () => ({
  db: require('../../../__tests__/__mocks__/firebase').db
}));

jest.mock('firebase/firestore', () => 
  require('../../../__tests__/__mocks__/firebase')
);

describe('toggleLike API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('좋아요 추가 (이전에 좋아요하지 않은 경우)', async () => {
    const mockRecordDoc = {
      exists: () => true,
      data: () => ({ likes: [] })
    };

    const mockUpdatedRecordDoc = {
      exists: () => true,
      data: () => ({ likes: ['user123'] })
    };

    getDoc
      .mockResolvedValueOnce(mockRecordDoc) // 첫 번째 호출: 현재 상태 확인
      .mockResolvedValueOnce(mockUpdatedRecordDoc); // 두 번째 호출: 업데이트 후 상태

    updateDoc.mockResolvedValue();

    const result = await toggleLike('record123', 'user123');

    expect(result).toEqual(['user123']);
    expect(updateDoc).toHaveBeenCalledTimes(2); // record와 user 모두 업데이트
  });

  test('좋아요 취소 (이미 좋아요한 경우)', async () => {
    const mockRecordDoc = {
      exists: () => true,
      data: () => ({ likes: ['user123', 'user456'] })
    };

    const mockUpdatedRecordDoc = {
      exists: () => true,
      data: () => ({ likes: ['user456'] })
    };

    getDoc
      .mockResolvedValueOnce(mockRecordDoc) // 첫 번째 호출: 현재 상태 확인
      .mockResolvedValueOnce(mockUpdatedRecordDoc); // 두 번째 호출: 업데이트 후 상태

    updateDoc.mockResolvedValue();

    const result = await toggleLike('record123', 'user123');

    expect(result).toEqual(['user456']);
    expect(updateDoc).toHaveBeenCalledTimes(2); // record와 user 모두 업데이트
  });

  test('레코드가 존재하지 않으면 에러 발생', async () => {
    const mockRecordDoc = {
      exists: () => false
    };

    getDoc.mockResolvedValue(mockRecordDoc);

    await expect(toggleLike('record123', 'user123')).rejects.toThrow('데이터 없음');
  });

  test('likes 배열이 없으면 빈 배열로 처리', async () => {
    const mockRecordDoc = {
      exists: () => true,
      data: () => ({}) // likes 필드 없음
    };

    const mockUpdatedRecordDoc = {
      exists: () => true,
      data: () => ({ likes: ['user123'] })
    };

    getDoc
      .mockResolvedValueOnce(mockRecordDoc)
      .mockResolvedValueOnce(mockUpdatedRecordDoc);

    updateDoc.mockResolvedValue();

    const result = await toggleLike('record123', 'user123');

    expect(result).toEqual(['user123']);
  });
});


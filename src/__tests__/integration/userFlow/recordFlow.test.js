/**
 * 착장 기록 생성 플로우 통합 테스트
 */
import { saveOutfitRecord } from '../../../api/saveOutfitRecord';
import { toggleLike } from '../../../api/toggleLike';
import { collection, addDoc, doc, getDoc, updateDoc } from '../../../__tests__/__mocks__/firebase';

// Firebase 모크 설정
jest.mock('../../../firebase', () => ({
  db: require('../../../__tests__/__mocks__/firebase').db
}));

jest.mock('firebase/firestore', () => 
  require('../../../__tests__/__mocks__/firebase')
);

describe('Record Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('착장 기록 생성 및 좋아요 플로우', () => {
    test('1. 착장 기록 생성 → 2. 좋아요 추가 전체 플로우', async () => {
      // 1. 착장 기록 생성
      const mockRecordRef = { id: 'record123' };
      addDoc.mockResolvedValue(mockRecordRef);

      const record = {
        uid: 'user123',
        region: 'Seoul',
        date: '2024-03-15',
        temp: 20,
        rain: 0,
        feeling: 'nice',
        weatherEmojis: '☀️',
        imageUrls: ['image1.jpg'],
        feedback: 'Good weather today',
        outfit: { top: 'T-shirt', bottom: 'Jeans' },
        styles: ['casual'],
        season: '봄',
        isPublic: true
      };

      const recordId = await saveOutfitRecord(record);
      expect(recordId).toBe('record123');

      // 2. 좋아요 추가
      const mockRecordDoc = {
        exists: () => true,
        data: () => ({ likes: [] })
      };

      const mockUpdatedRecordDoc = {
        exists: () => true,
        data: () => ({ likes: ['user456'] })
      };

      getDoc
        .mockResolvedValueOnce(mockRecordDoc)
        .mockResolvedValueOnce(mockUpdatedRecordDoc);

      updateDoc.mockResolvedValue();

      const likes = await toggleLike(recordId, 'user456');
      expect(likes).toEqual(['user456']);
    });

    test('여러 사용자가 같은 기록에 좋아요 추가', async () => {
      const recordId = 'record123';
      const user1 = 'user1';
      const user2 = 'user2';

      // User1 좋아요
      const mockRecordDoc1 = {
        exists: () => true,
        data: () => ({ likes: [] })
      };

      const mockUpdatedRecordDoc1 = {
        exists: () => true,
        data: () => ({ likes: [user1] })
      };

      getDoc
        .mockResolvedValueOnce(mockRecordDoc1)
        .mockResolvedValueOnce(mockUpdatedRecordDoc1);

      updateDoc.mockResolvedValue();

      const likes1 = await toggleLike(recordId, user1);
      expect(likes1).toEqual([user1]);

      // User2 좋아요
      const mockRecordDoc2 = {
        exists: () => true,
        data: () => ({ likes: [user1] })
      };

      const mockUpdatedRecordDoc2 = {
        exists: () => true,
        data: () => ({ likes: [user1, user2] })
      };

      getDoc
        .mockResolvedValueOnce(mockRecordDoc2)
        .mockResolvedValueOnce(mockUpdatedRecordDoc2);

      const likes2 = await toggleLike(recordId, user2);
      expect(likes2).toEqual([user1, user2]);
    });
  });

  describe('에러 처리 플로우', () => {
    test('기록 저장 실패 시 에러 처리', async () => {
      addDoc.mockRejectedValue(new Error('Storage error'));

      const record = {
        uid: 'user123',
        region: 'Seoul',
        date: '2024-03-15',
        temp: 20,
        rain: 0,
        feeling: 'nice',
        weatherEmojis: '☀️',
        imageUrls: [],
        feedback: '',
        outfit: {},
        styles: [],
        season: '봄',
        isPublic: false
      };

      await expect(saveOutfitRecord(record)).rejects.toThrow('Storage error');
    });

    test('존재하지 않는 기록에 좋아요 시도 시 에러 처리', async () => {
      const mockRecordDoc = {
        exists: () => false
      };

      getDoc.mockResolvedValue(mockRecordDoc);

      await expect(toggleLike('nonexistent', 'user123')).rejects.toThrow('데이터 없음');
    });
  });
});


/**
 * saveOutfitRecord API 단위 테스트
 */
import { saveOutfitRecord } from '../../../api/saveOutfitRecord';
import { collection, addDoc } from '../../../__tests__/__mocks__/firebase';

// Firebase 모크 설정
jest.mock('../../../firebase', () => ({
  db: require('../../../__tests__/__mocks__/firebase').db
}));

jest.mock('firebase/firestore', () => 
  require('../../../__tests__/__mocks__/firebase')
);

describe('saveOutfitRecord API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('착장 레코드 저장 성공', async () => {
    const mockDocRef = { id: 'record123' };
    addDoc.mockResolvedValue(mockDocRef);

    const record = {
      uid: 'user123',
      region: 'Seoul',
      date: '2024-03-15',
      temp: 20,
      rain: 0,
      feeling: 'nice',
      weatherEmojis: '☀️',
      imageUrls: ['image1.jpg'],
      feedback: 'Good',
      outfit: { top: 'T-shirt', bottom: 'Jeans' },
      styles: ['casual'],
      season: '봄',
      isPublic: true
    };

    const result = await saveOutfitRecord(record);

    expect(result).toBe('record123');
    expect(collection).toHaveBeenCalledWith(expect.anything(), 'outfits');
    expect(addDoc).toHaveBeenCalled();
  });

  test('필수 필드만 있는 레코드 저장', async () => {
    const mockDocRef = { id: 'record456' };
    addDoc.mockResolvedValue(mockDocRef);

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

    const result = await saveOutfitRecord(record);

    expect(result).toBe('record456');
    expect(addDoc).toHaveBeenCalled();
  });

  test('저장 실패 시 에러 발생', async () => {
    addDoc.mockRejectedValue(new Error('Firestore error'));

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

    await expect(saveOutfitRecord(record)).rejects.toThrow('Firestore error');
  });
});


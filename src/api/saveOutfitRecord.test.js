// src/api/saveOutfitRecord.test.js
import { saveOutfitRecord } from './saveOutfitRecord';

jest.mock('../firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => ({})),
  addDoc: jest.fn(() => Promise.resolve({ id: 'mocked-id' })),
}));

describe('saveOutfitRecord', () => {
  it('성공 시 문서 ID를 반환한다', async () => {
    const record = {
      uid: 'testuid',
      region: 'Seoul',
      date: '2024-07-28',
      temp: 25,
      rain: 0,
      feeling: '좋음',
      weatherEmojis: ['☀️'],
      imageUrls: ['https://mocked-url.com/image.jpg'],
      feedback: '테스트',
      outfit: { outer: [], top: [], bottom: [], shoes: [], acc: [] },
      isPublic: true,
    };
    const id = await saveOutfitRecord(record);
    expect(id).toBe('mocked-id');
  });

  it('실패 시 에러를 throw한다', async () => {
    const { addDoc } = require('firebase/firestore');
    addDoc.mockImplementationOnce(() => { throw new Error('fail'); });
    await expect(saveOutfitRecord({})).rejects.toThrow('fail');
  });
}); 
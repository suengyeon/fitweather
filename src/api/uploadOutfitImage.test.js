// src/api/uploadOutfitImage.test.js
import { uploadOutfitImage } from './uploadOutfitImage';

jest.mock('../firebase', () => ({
  storage: {},
}));

// Firebase Storage 관련 함수 mocking
jest.mock('firebase/storage', () => ({
  ref: jest.fn(() => ({})),
  uploadBytes: jest.fn(() => Promise.resolve({ ref: {} })),
  getDownloadURL: jest.fn(() => Promise.resolve('https://mocked-url.com/image.jpg')),
}));

describe('uploadOutfitImage', () => {
  it('성공 시 다운로드 URL을 반환한다', async () => {
    const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
    const url = await uploadOutfitImage(file, 'testuid');
    expect(url).toBe('https://mocked-url.com/image.jpg');
  });

  it('실패 시 Blob URL을 반환한다', async () => {
    // uploadBytes가 실패하도록 mocking
    const { uploadBytes } = require('firebase/storage');
    uploadBytes.mockImplementationOnce(() => { throw new Error('fail'); });
    const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
    const url = await uploadOutfitImage(file, 'testuid');
    expect(url.startsWith('blob:')).toBe(true);
  });
}); 
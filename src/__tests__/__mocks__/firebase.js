/**
 * Firebase 모크 설정
 */

// Firestore 모크
const mockDoc = jest.fn();
const mockCollection = jest.fn();
const mockQuery = jest.fn();
const mockWhere = jest.fn();
const mockOrderBy = jest.fn();
const mockLimit = jest.fn();
const mockGetDocs = jest.fn();
const mockGetDoc = jest.fn();
const mockAddDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockWriteBatch = jest.fn();
const mockServerTimestamp = jest.fn(() => ({ seconds: Date.now() / 1000 }));
const mockStartAfter = jest.fn();
const mockGetCountFromServer = jest.fn();
const mockArrayUnion = jest.fn((...elements) => elements);
const mockArrayRemove = jest.fn((...elements) => elements);
const mockIncrement = jest.fn((n) => n);

// Auth 모크
const mockSignInWithPopup = jest.fn();
const mockSignOut = jest.fn();
const mockGoogleAuthProvider = jest.fn();

// Storage 모크
const mockRef = jest.fn();
const mockUploadBytes = jest.fn();
const mockGetDownloadURL = jest.fn();

export const db = {
  collection: mockCollection,
  doc: mockDoc,
  batch: mockWriteBatch
};

export const auth = {
  currentUser: null,
  signInWithPopup: mockSignInWithPopup,
  signOut: mockSignOut
};

export const storage = {
  ref: mockRef
};

// Firestore 함수들
export const collection = mockCollection;
export const doc = mockDoc;
export const query = mockQuery;
export const where = mockWhere;
export const orderBy = mockOrderBy;
export const limit = mockLimit;
export const getDocs = mockGetDocs;
export const getDoc = mockGetDoc;
export const addDoc = mockAddDoc;
export const updateDoc = mockUpdateDoc;
export const deleteDoc = mockDeleteDoc;
export const setDoc = mockSetDoc;
export const writeBatch = mockWriteBatch;
export const serverTimestamp = mockServerTimestamp;
export const startAfter = mockStartAfter;
export const getCountFromServer = mockGetCountFromServer;
export const arrayUnion = mockArrayUnion;
export const arrayRemove = mockArrayRemove;
export const increment = mockIncrement;

// Auth 함수들
export const getAuth = jest.fn(() => auth);
export const GoogleAuthProvider = mockGoogleAuthProvider;
export const signInWithPopup = mockSignInWithPopup;
export const signOut = mockSignOut;

// Storage 함수들
export const ref = mockRef;
export const uploadBytes = mockUploadBytes;
export const getDownloadURL = mockGetDownloadURL;

// Firebase 초기화 모크
export const initializeApp = jest.fn(() => ({}));
export const getApps = jest.fn(() => []);
export const getFirestore = jest.fn(() => db);
export const getStorage = jest.fn(() => storage);
export const enableIndexedDbPersistence = jest.fn(() => Promise.resolve());

// 모크 리셋 헬퍼
export const resetFirebaseMocks = () => {
  mockDoc.mockClear();
  mockCollection.mockClear();
  mockQuery.mockClear();
  mockWhere.mockClear();
  mockOrderBy.mockClear();
  mockLimit.mockClear();
  mockGetDocs.mockClear();
  mockGetDoc.mockClear();
  mockAddDoc.mockClear();
  mockUpdateDoc.mockClear();
  mockDeleteDoc.mockClear();
  mockSetDoc.mockClear();
  mockWriteBatch.mockClear();
  mockServerTimestamp.mockClear();
  mockStartAfter.mockClear();
  mockGetCountFromServer.mockClear();
  mockArrayUnion.mockClear();
  mockArrayRemove.mockClear();
  mockIncrement.mockClear();
  mockSignInWithPopup.mockClear();
  mockSignOut.mockClear();
  mockRef.mockClear();
  mockUploadBytes.mockClear();
  mockGetDownloadURL.mockClear();
};


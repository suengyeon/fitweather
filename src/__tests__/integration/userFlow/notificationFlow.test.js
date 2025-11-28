/**
 * 알림 플로우 통합 테스트
 */
import {
  createFollowNotification,
  createCommentNotification,
  markNotificationAsRead,
  getUserNotifications,
  getUnreadNotificationCount
} from '../../../services/notificationService';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  doc,
  getCountFromServer
} from '../../../__tests__/__mocks__/firebase';
import { NOTIFICATION_TYPES } from '../../../models/Notification';

// Firebase 모크 설정
jest.mock('../../../firebase', () => ({
  db: require('../../../__tests__/__mocks__/firebase').db
}));

jest.mock('firebase/firestore', () => 
  require('../../../__tests__/__mocks__/firebase')
);

describe('Notification Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('팔로우 알림 플로우', () => {
    test('1. 팔로우 알림 생성 → 2. 알림 조회 → 3. 읽음 처리', async () => {
      // 1. 팔로우 알림 생성
      const mockFollowNotifRef = { id: 'followNotif123' };
      addDoc.mockResolvedValue(mockFollowNotifRef);

      const notifId = await createFollowNotification(
        'follower123',
        'Follower',
        'following123',
        'avatar.jpg'
      );

      expect(notifId).toBe('followNotif123');

      // 2. 알림 조회
      const mockNotifDoc = {
        id: 'followNotif123',
        data: () => ({
          recipient: 'following123',
          type: NOTIFICATION_TYPES.FOLLOW,
          isRead: false,
          createdAt: { seconds: Date.now() / 1000 }
        })
      };

      const mockSnapshot = {
        docs: [mockNotifDoc],
        empty: false,
        size: 1
      };

      getDocs.mockResolvedValue(mockSnapshot);
      getCountFromServer.mockResolvedValue({
        data: () => ({ count: 1 })
      });

      const result = await getUserNotifications('following123');
      expect(result.notifications.length).toBe(1);
      expect(result.unreadCount).toBe(1);

      // 3. 읽음 처리
      const mockReadDoc = {
        exists: () => true,
        data: () => ({ recipient: 'following123' })
      };

      getDoc.mockResolvedValue(mockReadDoc);
      updateDoc.mockResolvedValue();

      const readResult = await markNotificationAsRead('followNotif123', 'following123');
      expect(readResult).toBe(true);
    });
  });

  describe('댓글 알림 플로우', () => {
    test('댓글 작성 → 알림 생성 → 알림 조회', async () => {
      // 댓글 알림 생성
      const mockCommentNotifRef = { id: 'commentNotif123' };
      addDoc.mockResolvedValue(mockCommentNotifRef);

      const notifId = await createCommentNotification(
        'commenter123',
        'Commenter',
        'postOwner123',
        'post123',
        'Great post!',
        'avatar.jpg'
      );

      expect(notifId).toBe('commentNotif123');

      // 알림 조회
      const mockNotifDoc = {
        id: 'commentNotif123',
        data: () => ({
          recipient: 'postOwner123',
          type: NOTIFICATION_TYPES.COMMENT_ON_MY_POST,
          isRead: false,
          message: 'Great post!',
          createdAt: { seconds: Date.now() / 1000 }
        })
      };

      const mockSnapshot = {
        docs: [mockNotifDoc],
        empty: false,
        size: 1
      };

      getDocs.mockResolvedValue(mockSnapshot);
      getCountFromServer.mockResolvedValue({
        data: () => ({ count: 1 })
      });

      const result = await getUserNotifications('postOwner123');
      expect(result.notifications.length).toBe(1);
      expect(result.notifications[0].type).toBe(NOTIFICATION_TYPES.COMMENT_ON_MY_POST);
    });
  });

  describe('읽지 않은 알림 개수 조회', () => {
    test('여러 알림 중 읽지 않은 알림 개수 조회', async () => {
      getCountFromServer.mockResolvedValue({
        data: () => ({ count: 3 })
      });

      const unreadCount = await getUnreadNotificationCount('user123');
      expect(unreadCount).toBe(3);
    });
  });
});


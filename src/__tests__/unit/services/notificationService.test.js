/**
 * NotificationService 단위 테스트
 */
import {
  createNotification,
  getUserNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  deleteNotifications,
  createFollowNotification,
  createCommentNotification,
  createReplyNotification,
  createReportNotification
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
  deleteDoc,
  doc,
  writeBatch,
  serverTimestamp,
  startAfter,
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

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    test('유효한 알림 데이터로 알림 생성', async () => {
      const mockDocRef = { id: 'notification123' };
      addDoc.mockResolvedValue(mockDocRef);
      serverTimestamp.mockReturnValue({ seconds: Date.now() / 1000 });

      const notificationData = {
        recipient: 'user123',
        sender: {
          id: 'user456',
          nickname: 'TestUser'
        },
        type: NOTIFICATION_TYPES.FOLLOW,
        link: '/profile/user456',
        message: 'Test notification'
      };

      const result = await createNotification(notificationData);

      expect(result).toBe('notification123');
      expect(addDoc).toHaveBeenCalled();
      expect(collection).toHaveBeenCalledWith(expect.anything(), 'notifications');
    });

    test('유효하지 않은 알림 데이터로 알림 생성 시도 시 에러 발생', async () => {
      const invalidData = {
        recipient: '', // 빈 recipient
        sender: { id: 'user456' },
        type: NOTIFICATION_TYPES.FOLLOW
      };

      await expect(createNotification(invalidData)).rejects.toThrow();
    });
  });

  describe('getUserNotifications', () => {
    test('사용자 알림 목록 조회', async () => {
      const mockDocs = [
        {
          id: 'notif1',
          data: () => ({
            recipient: 'user123',
            type: NOTIFICATION_TYPES.FOLLOW,
            isRead: false,
            createdAt: { seconds: Date.now() / 1000 }
          })
        },
        {
          id: 'notif2',
          data: () => ({
            recipient: 'user123',
            type: NOTIFICATION_TYPES.COMMENT_ON_MY_POST,
            isRead: true,
            createdAt: { seconds: Date.now() / 1000 - 100 }
          })
        }
      ];

      const mockSnapshot = {
        docs: mockDocs,
        empty: false,
        size: 2
      };

      getDocs.mockResolvedValue(mockSnapshot);
      getCountFromServer.mockResolvedValue({
        data: () => ({ count: 2 })
      });

      const result = await getUserNotifications('user123');

      expect(result).toHaveProperty('notifications');
      expect(result).toHaveProperty('totalCount');
      expect(result).toHaveProperty('unreadCount');
      expect(result).toHaveProperty('hasMore');
      expect(result.notifications.length).toBe(2);
    });

    test('페이징 옵션과 함께 알림 조회', async () => {
      const mockSnapshot = {
        docs: [],
        empty: true,
        size: 0
      };

      getDocs.mockResolvedValue(mockSnapshot);
      getCountFromServer.mockResolvedValue({
        data: () => ({ count: 0 })
      });

      const startAfterDoc = { id: 'lastDoc' };
      const result = await getUserNotifications('user123', {
        limit: 20,
        startAfter: startAfterDoc
      });

      expect(startAfter).toHaveBeenCalled();
    });
  });

  describe('getUnreadNotificationCount', () => {
    test('읽지 않은 알림 개수 조회', async () => {
      getCountFromServer.mockResolvedValue({
        data: () => ({ count: 5 })
      });

      const result = await getUnreadNotificationCount('user123');

      expect(result).toBe(5);
      expect(getCountFromServer).toHaveBeenCalled();
    });
  });

  describe('markAllNotificationsAsRead', () => {
    test('모든 읽지 않은 알림을 읽음 처리', async () => {
      const mockDocs = [
        { id: 'notif1', ref: { id: 'notif1' } },
        { id: 'notif2', ref: { id: 'notif2' } }
      ];

      const mockSnapshot = {
        docs: mockDocs,
        empty: false
      };

      getDocs.mockResolvedValue(mockSnapshot);
      const mockBatch = {
        update: jest.fn(),
        commit: jest.fn().mockResolvedValue()
      };
      writeBatch.mockReturnValue(mockBatch);

      const result = await markAllNotificationsAsRead('user123');

      expect(result).toBe(2);
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    test('읽지 않은 알림이 없으면 0 반환', async () => {
      const mockSnapshot = {
        docs: [],
        empty: true
      };

      getDocs.mockResolvedValue(mockSnapshot);

      const result = await markAllNotificationsAsRead('user123');

      expect(result).toBe(0);
    });
  });

  describe('markNotificationAsRead', () => {
    test('특정 알림을 읽음 처리', async () => {
      const mockDoc = {
        exists: () => true,
        data: () => ({ recipient: 'user123' })
      };

      getDoc.mockResolvedValue(mockDoc);
      updateDoc.mockResolvedValue();

      const result = await markNotificationAsRead('notif123', 'user123');

      expect(result).toBe(true);
      expect(updateDoc).toHaveBeenCalled();
    });

    test('존재하지 않는 알림 읽음 처리 시도 시 에러 발생', async () => {
      const mockDoc = {
        exists: () => false
      };

      getDoc.mockResolvedValue(mockDoc);

      await expect(
        markNotificationAsRead('notif123', 'user123')
      ).rejects.toThrow();
    });

    test('권한이 없는 사용자가 알림 읽음 처리 시도 시 에러 발생', async () => {
      const mockDoc = {
        exists: () => true,
        data: () => ({ recipient: 'otherUser' })
      };

      getDoc.mockResolvedValue(mockDoc);

      await expect(
        markNotificationAsRead('notif123', 'user123')
      ).rejects.toThrow();
    });
  });

  describe('deleteNotifications', () => {
    test('여러 알림 삭제', async () => {
      const mockDocs = [
        {
          exists: () => true,
          data: () => ({ recipient: 'user123' })
        },
        {
          exists: () => true,
          data: () => ({ recipient: 'user123' })
        }
      ];

      getDoc
        .mockResolvedValueOnce(mockDocs[0])
        .mockResolvedValueOnce(mockDocs[1]);

      const mockBatch = {
        delete: jest.fn(),
        commit: jest.fn().mockResolvedValue()
      };
      writeBatch.mockReturnValue(mockBatch);

      const result = await deleteNotifications(['notif1', 'notif2'], 'user123');

      expect(result).toBe(2);
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    test('빈 배열이 주어지면 0 반환', async () => {
      const result = await deleteNotifications([], 'user123');
      expect(result).toBe(0);
    });
  });

  describe('createFollowNotification', () => {
    test('구독 알림 생성', async () => {
      const mockDocRef = { id: 'followNotif123' };
      addDoc.mockResolvedValue(mockDocRef);

      const result = await createFollowNotification(
        'follower123',
        'Follower',
        'following123',
        'avatar.jpg'
      );

      expect(result).toBe('followNotif123');
      expect(addDoc).toHaveBeenCalled();
    });
  });

  describe('createCommentNotification', () => {
    test('댓글 알림 생성', async () => {
      const mockDocRef = { id: 'commentNotif123' };
      addDoc.mockResolvedValue(mockDocRef);

      const result = await createCommentNotification(
        'commenter123',
        'Commenter',
        'postOwner123',
        'post123',
        'Great post!',
        'avatar.jpg'
      );

      expect(result).toBe('commentNotif123');
    });
  });

  describe('createReplyNotification', () => {
    test('답글 알림 생성', async () => {
      const mockDocRef = { id: 'replyNotif123' };
      addDoc.mockResolvedValue(mockDocRef);

      const result = await createReplyNotification(
        'replier123',
        'Replier',
        'commentOwner123',
        'post123',
        'Thanks!',
        'avatar.jpg'
      );

      expect(result).toBe('replyNotif123');
    });
  });

  describe('createReportNotification', () => {
    test('신고 알림 생성', async () => {
      const mockDocRef = { id: 'reportNotif123' };
      addDoc.mockResolvedValue(mockDocRef);

      const result = await createReportNotification('targetUser123');

      expect(result).toBe('reportNotif123');
    });
  });
});


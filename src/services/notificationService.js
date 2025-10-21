/**
 * 알림 서비스
 * 알림 CRUD 및 비즈니스 로직 처리
 */

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
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  NOTIFICATION_TYPES, 
  validateNotificationData, 
  formatNotificationResponse 
} from '../models/Notification';

/**
 * 알림 생성
 * @param {Object} notificationData - 알림 생성 데이터
 * @returns {Promise<string>} 생성된 알림 ID
 */
export async function createNotification(notificationData) {
  try {
    // 유효성 검사
    const validation = validateNotificationData(notificationData);
    if (!validation.isValid) {
      throw new Error(`Invalid notification data: ${validation.errors.join(', ')}`);
    }

    // 알림 데이터 준비
    const notification = {
      recipient: notificationData.recipient,
      sender: {
        id: notificationData.sender.id,
        nickname: notificationData.sender.nickname || '알 수 없음', // nickname 필드만 사용, 없으면 기본값
        avatarUrl: notificationData.sender.avatarUrl || null,
        profilePictureUrl: notificationData.sender.profilePictureUrl || notificationData.sender.avatarUrl || null
      },
      type: notificationData.type,
      isRead: false,
      read: false, // UI에서 사용하는 필드 추가
      link: notificationData.link,
      message: notificationData.message || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Firestore에 저장
    const docRef = await addDoc(collection(db, 'notifications'), notification);
    
    console.log(`✅ 알림 생성 완료: ${docRef.id}`, {
      type: notificationData.type,
      recipient: notificationData.recipient,
      sender: notificationData.sender.name
    });

    return docRef.id;
  } catch (error) {
    console.error('❌ 알림 생성 실패:', error);
    throw error;
  }
}

/**
 * 사용자의 모든 알림 조회 (최신순)
 * @param {string} userId - 사용자 ID
 * @param {Object} options - 조회 옵션
 * @param {number} [options.limit=50] - 조회할 알림 개수
 * @param {string} [options.startAfter] - 페이징을 위한 시작점
 * @returns {Promise<Object>} 알림 목록과 메타데이터
 */
export async function getUserNotifications(userId, options = {}) {
  try {
    const { limit: limitCount = 50, startAfter: startAfterDoc } = options;

    // 알림 조회 쿼리 구성
    let q = query(
      collection(db, 'notifications'),
      where('recipient', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    // 페이징 처리
    if (startAfterDoc) {
      q = query(q, startAfter(startAfterDoc));
    }

    // 알림 조회
    const snapshot = await getDocs(q);
    const notifications = snapshot.docs.map(doc => formatNotificationResponse(doc));

    // 전체 개수 및 읽지 않은 개수 조회
    const totalCountQuery = query(
      collection(db, 'notifications'),
      where('recipient', '==', userId)
    );
    const unreadCountQuery = query(
      collection(db, 'notifications'),
      where('recipient', '==', userId),
      where('isRead', '==', false)
    );

    const [totalCountSnapshot, unreadCountSnapshot] = await Promise.all([
      getCountFromServer(totalCountQuery),
      getCountFromServer(unreadCountQuery)
    ]);

    return {
      notifications,
      totalCount: totalCountSnapshot.data().count,
      unreadCount: unreadCountSnapshot.data().count,
      hasMore: snapshot.docs.length === limitCount
    };
  } catch (error) {
    console.error('❌ 알림 조회 실패:', error);
    throw error;
  }
}

/**
 * 읽지 않은 알림 개수 조회
 * @param {string} userId - 사용자 ID
 * @returns {Promise<number>} 읽지 않은 알림 개수
 */
export async function getUnreadNotificationCount(userId) {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('recipient', '==', userId),
      where('isRead', '==', false)
    );

    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  } catch (error) {
    console.error('❌ 읽지 않은 알림 개수 조회 실패:', error);
    throw error;
  }
}

/**
 * 모든 읽지 않은 알림을 읽음 처리
 * @param {string} userId - 사용자 ID
 * @returns {Promise<number>} 읽음 처리된 알림 개수
 */
export async function markAllNotificationsAsRead(userId) {
  try {
    // 읽지 않은 알림 조회
    const q = query(
      collection(db, 'notifications'),
      where('recipient', '==', userId),
      where('isRead', '==', false)
    );

    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return 0;
    }

    // 배치 업데이트
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        isRead: true,
        read: true, // UI에서 사용하는 필드도 함께 업데이트
        updatedAt: serverTimestamp()
      });
    });

    await batch.commit();

    console.log(`✅ ${snapshot.docs.length}개 알림 읽음 처리 완료`);
    return snapshot.docs.length;
  } catch (error) {
    console.error('❌ 알림 읽음 처리 실패:', error);
    throw error;
  }
}

/**
 * 특정 알림을 읽음 처리
 * @param {string} notificationId - 알림 ID
 * @param {string} userId - 사용자 ID (권한 확인용)
 * @returns {Promise<boolean>} 처리 성공 여부
 */
export async function markNotificationAsRead(notificationId, userId) {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    
    // 알림 존재 여부 및 권한 확인
    const notificationDoc = await getDoc(notificationRef);

    if (!notificationDoc.exists() || notificationDoc.data().recipient !== userId) {
      throw new Error('Notification not found or access denied');
    }

    // 읽음 처리
    await updateDoc(notificationRef, {
      isRead: true,
      read: true, // UI에서 사용하는 필드도 함께 업데이트
      updatedAt: serverTimestamp()
    });

    console.log(`✅ 알림 ${notificationId} 읽음 처리 완료`);
    return true;
  } catch (error) {
    console.error('❌ 알림 읽음 처리 실패:', error);
    throw error;
  }
}

/**
 * 알림 삭제
 * @param {string[]} notificationIds - 삭제할 알림 ID 목록
 * @param {string} userId - 사용자 ID (권한 확인용)
 * @returns {Promise<number>} 삭제된 알림 개수
 */
export async function deleteNotifications(notificationIds, userId) {
  try {
    if (!notificationIds || notificationIds.length === 0) {
      return 0;
    }

    // 권한 확인 및 배치 삭제
    const batch = writeBatch(db);
    let deletedCount = 0;

    for (const notificationId of notificationIds) {
      const notificationRef = doc(db, 'notifications', notificationId);
      const notificationDoc = await getDoc(notificationRef);
      
      if (notificationDoc.exists() && notificationDoc.data().recipient === userId) {
        batch.delete(notificationRef);
        deletedCount++;
      }
    }

    if (deletedCount === 0) {
      return 0;
    }

    await batch.commit();

    console.log(`✅ ${deletedCount}개 알림 삭제 완료`);
    return deletedCount;
  } catch (error) {
    console.error('❌ 알림 삭제 실패:', error);
    throw error;
  }
}

/**
 * 구독 알림 생성
 * @param {string} followerId - 구독한 사용자 ID
 * @param {string} followerNickname - 구독한 사용자 닉네임
 * @param {string} followingId - 구독받은 사용자 ID
 * @param {string} [followerAvatarUrl] - 구독한 사용자 프로필 사진 URL
 */
export async function createFollowNotification(followerId, followerNickname, followingId, followerAvatarUrl = null) {
  try {
    const notificationData = {
      recipient: followingId,
      sender: {
        id: followerId,
        nickname: followerNickname, // nickname 필드만 사용
        avatarUrl: followerAvatarUrl,
        profilePictureUrl: followerAvatarUrl
      },
      type: NOTIFICATION_TYPES.FOLLOW,
      link: `/calendar/${followerId}`,
      message: null
    };

    console.log('📤 구독 알림 생성:', {
      recipient: followingId,
      sender: followerNickname,
      followerId: followerId
    });

    return await createNotification(notificationData);
  } catch (error) {
    console.error('❌ 구독 알림 생성 실패:', error);
    throw error;
  }
}

/**
 * 댓글 알림 생성
 * @param {string} commenterId - 댓글 작성자 ID
 * @param {string} commenterNickname - 댓글 작성자 닉네임
 * @param {string} postOwnerId - 게시물 소유자 ID
 * @param {string} postId - 게시물 ID
 * @param {string} commentContent - 댓글 내용
 * @param {string} [commenterAvatarUrl] - 댓글 작성자 프로필 사진 URL
 */
export async function createCommentNotification(commenterId, commenterNickname, postOwnerId, postId, commentContent, commenterAvatarUrl = null) {
  try {
    const notificationData = {
      recipient: postOwnerId,
      sender: {
        id: commenterId,
        nickname: commenterNickname, // nickname 필드만 사용
        avatarUrl: commenterAvatarUrl,
        profilePictureUrl: commenterAvatarUrl
      },
      type: NOTIFICATION_TYPES.COMMENT_ON_MY_POST,
      link: `/feed-detail/${postId}`,
      message: commentContent
    };

    return await createNotification(notificationData);
  } catch (error) {
    console.error('❌ 댓글 알림 생성 실패:', error);
    throw error;
  }
}

/**
 * 답글 알림 생성
 * @param {string} replierId - 답글 작성자 ID
 * @param {string} replierNickname - 답글 작성자 닉네임
 * @param {string} commentOwnerId - 댓글 소유자 ID
 * @param {string} postId - 게시물 ID
 * @param {string} replyContent - 답글 내용
 * @param {string} [replierAvatarUrl] - 답글 작성자 프로필 사진 URL
 */
export async function createReplyNotification(replierId, replierNickname, commentOwnerId, postId, replyContent, replierAvatarUrl = null) {
  try {
    const notificationData = {
      recipient: commentOwnerId,
      sender: {
        id: replierId,
        nickname: replierNickname, // nickname 필드만 사용
        avatarUrl: replierAvatarUrl,
        profilePictureUrl: replierAvatarUrl
      },
      type: NOTIFICATION_TYPES.REPLY_TO_MY_COMMENT,
      link: `/feed-detail/${postId}`,
      message: replyContent
    };

    return await createNotification(notificationData);
  } catch (error) {
    console.error('❌ 답글 알림 생성 실패:', error);
    throw error;
  }
}

/**
 * 구독한 사용자의 새 기록 알림 생성
 * @param {string} postAuthorId - 기록 작성자 ID
 * @param {string} postAuthorName - 기록 작성자 이름
 * @param {string} followerId - 구독자 ID (알림을 받을 사용자)
 * @param {string} postId - 새로 작성된 기록 ID
 * @param {string} [postAuthorAvatarUrl] - 기록 작성자 프로필 사진 URL
 */
export async function createNewPostNotification(postAuthorId, postAuthorName, followerId, postId, postAuthorAvatarUrl = null) {
  try {
    const notificationData = {
      recipient: followerId,
      sender: {
        id: postAuthorId,
        name: postAuthorName,
        nickname: postAuthorName, // UI에서 사용하는 필드명 추가
        avatarUrl: postAuthorAvatarUrl,
        profilePictureUrl: postAuthorAvatarUrl // UI에서 사용하는 필드명 추가
      },
      type: NOTIFICATION_TYPES.NEW_POST_FROM_FOLLOWING,
      link: `/feed-detail/${postId}`,
      message: null
    };

    console.log('📤 새 기록 알림 생성:', {
      recipient: followerId,
      sender: postAuthorName,
      postId: postId
    });

    return await createNotification(notificationData);
  } catch (error) {
    console.error('❌ 새 기록 알림 생성 실패:', error);
    throw error;
  }
}

/**
 * 특정 사용자의 구독자 목록 조회
 * @param {string} userId - 구독자 목록을 조회할 사용자 ID
 * @returns {Promise<Array>} 구독자 ID 목록
 */
export async function getFollowers(userId) {
  try {
    console.log(`🔍 ${userId}의 구독자 목록 조회 중...`);
    
    const q = query(
      collection(db, 'follows'),
      where('followingId', '==', userId)
    );

    const snapshot = await getDocs(q);
    console.log(`📊 구독 관계 문서 ${snapshot.docs.length}개 발견`);
    
    const followers = [];
    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`📄 구독 관계 ${index + 1}:`, {
        docId: doc.id,
        followerId: data.followerId,
        followingId: data.followingId,
        createdAt: data.createdAt
      });
      followers.push(data.followerId);
    });

    console.log(`✅ ${userId}의 구독자 ${followers.length}명 조회 완료:`, followers);
    return followers;
  } catch (error) {
    console.error('❌ 구독자 목록 조회 실패:', error);
    throw error;
  }
}

/**
 * 새 기록 작성 시 구독자들에게 알림 전송
 * @param {string} postAuthorId - 기록 작성자 ID
 * @param {string} postId - 새로 작성된 기록 ID
 * @returns {Promise<number>} 전송된 알림 개수
 */
export async function notifyFollowersAboutNewPost(postAuthorId, postId) {
  try {
    console.log('🚀 새 기록 알림 전송 시작:', { postAuthorId, postId });
    
    // 기록 작성자 정보 조회
    const authorDocRef = doc(db, 'users', postAuthorId);
    const authorDoc = await getDoc(authorDocRef);

    if (!authorDoc.exists()) {
      console.error('❌ 기록 작성자 정보를 찾을 수 없습니다:', postAuthorId);
      return 0;
    }

    const authorData = authorDoc.data();
    const authorName = authorData.nickname || authorData.name || postAuthorId;
    const authorAvatarUrl = authorData.profilePictureUrl || null;
    
    console.log('👤 기록 작성자 정보:', {
      id: postAuthorId,
      name: authorName,
      avatarUrl: authorAvatarUrl
    });

    // 구독자 목록 조회
    const followers = await getFollowers(postAuthorId);
    console.log('👥 구독자 목록:', followers);

    if (followers.length === 0) {
      console.log('📝 구독자가 없어 알림을 전송하지 않습니다.');
      return 0;
    }

    // 각 구독자에게 알림 전송
    console.log('📤 구독자들에게 알림 전송 중...');
    const notificationPromises = followers.map(async (followerId, index) => {
      try {
        console.log(`📤 ${index + 1}/${followers.length} - ${followerId}에게 알림 전송 중...`);
        const notificationId = await createNewPostNotification(
          postAuthorId,
          authorName,
          followerId,
          postId,
          authorAvatarUrl
        );
        console.log(`✅ ${followerId}에게 알림 전송 완료: ${notificationId}`);
        return notificationId;
      } catch (error) {
        console.error(`❌ ${followerId}에게 알림 전송 실패:`, error);
        throw error;
      }
    });

    const notificationIds = await Promise.all(notificationPromises);

    console.log(`✅ ${followers.length}명의 구독자에게 새 기록 알림 전송 완료`);
    console.log('📋 전송된 알림 ID들:', notificationIds);
    return followers.length;
  } catch (error) {
    console.error('❌ 구독자 알림 전송 실패:', error);
    throw error;
  }
}
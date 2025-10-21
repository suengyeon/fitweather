/**
 * 알림 문제 해결을 위한 유틸리티
 */

import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';

/**
 * 현재 사용자의 모든 알림 확인 (디버깅용)
 */
export async function checkAllNotifications(userId) {
  try {
    console.log('🔍 모든 알림 확인 중...');
    
    const q = query(
      collection(db, 'notifications'),
      where('recipient', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    const notifications = [];
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      notifications.push({
        id: doc.id,
        type: data.type,
        isRead: data.isRead,
        read: data.read, // UI에서 사용하는 필드
        sender: data.sender,
        createdAt: data.createdAt,
        link: data.link,
        message: data.message
      });
    });
    
    console.log('📢 모든 알림:', notifications);
    
    // 새 기록 알림만 필터링
    const newPostNotifications = notifications.filter(n => n.type === 'new_post_from_following');
    console.log('📢 새 기록 알림만:', newPostNotifications);
    
    return {
      all: notifications,
      newPost: newPostNotifications
    };
  } catch (error) {
    console.error('❌ 알림 확인 실패:', error);
    return { all: [], newPost: [] };
  }
}

/**
 * 알림 데이터 구조 수정 (isRead -> read)
 */
export async function fixNotificationDataStructure(userId) {
  try {
    console.log('🔧 알림 데이터 구조 수정 중...');
    
    const q = query(
      collection(db, 'notifications'),
      where('recipient', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    let fixedCount = 0;
    
    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      
      // isRead 필드가 있지만 read 필드가 없는 경우
      if (data.isRead !== undefined && data.read === undefined) {
        await updateDoc(doc(db, 'notifications', docSnapshot.id), {
          read: data.isRead
        });
        fixedCount++;
        console.log(`✅ 알림 ${docSnapshot.id} 수정 완료`);
      }
    }
    
    console.log(`🔧 ${fixedCount}개 알림 데이터 구조 수정 완료`);
    return fixedCount;
  } catch (error) {
    console.error('❌ 알림 데이터 구조 수정 실패:', error);
    return 0;
  }
}

/**
 * 새 기록 알림 수동 생성 (테스트용)
 */
export async function createTestNewPostNotification(userId) {
  try {
    console.log('📤 테스트 새 기록 알림 생성 중...');
    
    const { addDoc, collection: firestoreCollection, serverTimestamp } = await import('firebase/firestore');
    
    const notificationData = {
      recipient: userId,
      sender: {
        id: 'test-user-id',
        name: '테스트 사용자',
        nickname: '테스트 사용자',
        avatarUrl: null,
        profilePictureUrl: null
      },
      type: 'new_post_from_following',
      isRead: false,
      read: false, // UI에서 사용하는 필드도 추가
      link: '/feed-detail/test-record-id',
      message: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(firestoreCollection(db, 'notifications'), notificationData);
    console.log('✅ 테스트 알림 생성 완료:', docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('❌ 테스트 알림 생성 실패:', error);
    throw error;
  }
}

/**
 * 알림 새로고침 강제 실행
 */
export async function forceRefreshNotifications() {
  try {
    console.log('🔄 알림 새로고침 강제 실행...');
    
    // 페이지 새로고침
    window.location.reload();
  } catch (error) {
    console.error('❌ 알림 새로고침 실패:', error);
  }
}

// 개발 환경에서만 전역으로 노출
if (process.env.NODE_ENV === 'development') {
  window.notificationFix = {
    checkAllNotifications,
    fixNotificationDataStructure,
    createTestNewPostNotification,
    forceRefreshNotifications
  };
  
  console.log('🔧 알림 수정 도구가 전역으로 등록되었습니다.');
  console.log('사용법:');
  console.log('- window.notificationFix.checkAllNotifications("사용자ID") - 모든 알림 확인');
  console.log('- window.notificationFix.fixNotificationDataStructure("사용자ID") - 데이터 구조 수정');
  console.log('- window.notificationFix.createTestNewPostNotification("사용자ID") - 테스트 알림 생성');
  console.log('- window.notificationFix.forceRefreshNotifications() - 강제 새로고침');
}


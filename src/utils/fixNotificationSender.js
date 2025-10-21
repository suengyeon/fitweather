/**
 * 알림 sender 데이터 구조 수정 도구
 */

import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';

/**
 * 모든 알림의 sender 데이터 구조 수정
 */
export async function fixAllNotificationSenders() {
  try {
    console.log('🔧 모든 알림의 sender 데이터 구조 수정 중...');
    
    const q = query(collection(db, 'notifications'));
    const snapshot = await getDocs(q);
    
    let fixedCount = 0;
    
    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      const sender = data.sender;
      
      if (sender && !sender.nickname) {
        // nickname 필드가 없으면 name을 nickname으로 복사
        await updateDoc(doc(db, 'notifications', docSnapshot.id), {
          'sender.nickname': sender.name || '알 수 없음',
          'sender.profilePictureUrl': sender.avatarUrl || null
        });
        fixedCount++;
        console.log(`✅ 알림 ${docSnapshot.id} sender 수정 완료`);
      }
    }
    
    console.log(`🔧 ${fixedCount}개 알림의 sender 데이터 구조 수정 완료`);
    return fixedCount;
  } catch (error) {
    console.error('❌ 알림 sender 데이터 구조 수정 실패:', error);
    return 0;
  }
}

/**
 * 특정 사용자의 알림 sender 데이터 구조 수정
 */
export async function fixUserNotificationSenders(userId) {
  try {
    console.log(`🔧 ${userId}의 알림 sender 데이터 구조 수정 중...`);
    
    const q = query(
      collection(db, 'notifications'),
      where('recipient', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    let fixedCount = 0;
    
    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      const sender = data.sender;
      
      if (sender && !sender.nickname) {
        // nickname 필드가 없으면 name을 nickname으로 복사
        await updateDoc(doc(db, 'notifications', docSnapshot.id), {
          'sender.nickname': sender.name || '알 수 없음',
          'sender.profilePictureUrl': sender.avatarUrl || null
        });
        fixedCount++;
        console.log(`✅ 알림 ${docSnapshot.id} sender 수정 완료`);
      }
    }
    
    console.log(`🔧 ${fixedCount}개 알림의 sender 데이터 구조 수정 완료`);
    return fixedCount;
  } catch (error) {
    console.error('❌ 사용자 알림 sender 데이터 구조 수정 실패:', error);
    return 0;
  }
}

/**
 * 구독 알림만 수정
 */
export async function fixFollowNotificationSenders() {
  try {
    console.log('🔧 구독 알림의 sender 데이터 구조 수정 중...');
    
    const q = query(
      collection(db, 'notifications'),
      where('type', '==', 'follow')
    );
    
    const snapshot = await getDocs(q);
    let fixedCount = 0;
    
    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      const sender = data.sender;
      
      if (sender && !sender.nickname) {
        await updateDoc(doc(db, 'notifications', docSnapshot.id), {
          'sender.nickname': sender.name || '알 수 없음',
          'sender.profilePictureUrl': sender.avatarUrl || null
        });
        fixedCount++;
        console.log(`✅ 구독 알림 ${docSnapshot.id} sender 수정 완료`);
      }
    }
    
    console.log(`🔧 ${fixedCount}개 구독 알림의 sender 데이터 구조 수정 완료`);
    return fixedCount;
  } catch (error) {
    console.error('❌ 구독 알림 sender 데이터 구조 수정 실패:', error);
    return 0;
  }
}

/**
 * 알림 sender 데이터 확인
 */
export async function checkNotificationSenders(userId) {
  try {
    console.log(`🔍 ${userId}의 알림 sender 데이터 확인 중...`);
    
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
        sender: data.sender,
        hasNickname: !!data.sender?.nickname,
        hasName: !!data.sender?.name
      });
    });
    
    console.log('📊 알림 sender 데이터:', notifications);
    
    const followNotifications = notifications.filter(n => n.type === 'follow');
    console.log('📊 구독 알림 sender 데이터:', followNotifications);
    
    return {
      all: notifications,
      follow: followNotifications
    };
  } catch (error) {
    console.error('❌ 알림 sender 데이터 확인 실패:', error);
    return { all: [], follow: [] };
  }
}

// 개발 환경에서만 전역으로 노출
if (process.env.NODE_ENV === 'development') {
  window.fixNotificationSender = {
    fixAllNotificationSenders,
    fixUserNotificationSenders,
    fixFollowNotificationSenders,
    checkNotificationSenders
  };
  
  console.log('🔧 알림 sender 수정 도구가 전역으로 등록되었습니다.');
  console.log('사용법:');
  console.log('- window.fixNotificationSender.checkNotificationSenders("사용자ID") - sender 데이터 확인');
  console.log('- window.fixNotificationSender.fixUserNotificationSenders("사용자ID") - 사용자 알림 수정');
  console.log('- window.fixNotificationSender.fixFollowNotificationSenders() - 구독 알림만 수정');
  console.log('- window.fixNotificationSender.fixAllNotificationSenders() - 모든 알림 수정');
}


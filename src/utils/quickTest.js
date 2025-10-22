/**
 * 빠른 알림 테스트를 위한 유틸리티
 */

import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { notifyFollowersAboutNewPost } from '../services/notificationService';

/**
 * 실제 사용자 ID로 빠른 테스트 실행
 */
export async function quickNotificationTest() {
  try {
    console.log('🚀 빠른 알림 테스트 시작...');
    
    // 현재 사용자 ID
    const currentUserId = 'p01xohFFhnUeSeIZ4P7xpKw8esP2';
    console.log('👤 현재 사용자 ID:', currentUserId);
    
    // 1. 사용자 존재 확인
    console.log('1️⃣ 사용자 존재 확인...');
    const userDoc = await getDoc(doc(db, 'users', currentUserId));
    if (!userDoc.exists()) {
      console.error('❌ 사용자가 존재하지 않습니다.');
      return;
    }
    console.log('✅ 사용자 존재 확인');
    
    // 2. 구독 관계 생성 (자기 자신을 구독)
    console.log('2️⃣ 구독 관계 생성...');
    const followData = {
      followerId: currentUserId,
      followingId: currentUserId,
      createdAt: new Date()
    };
    
    // 기존 구독 관계 확인
    const existingQuery = query(
      collection(db, 'follows'),
      where('followerId', '==', currentUserId),
      where('followingId', '==', currentUserId)
    );
    
    const existingSnapshot = await getDocs(existingQuery);
    if (existingSnapshot.empty) {
      await addDoc(collection(db, 'follows'), followData);
      console.log('✅ 구독 관계 생성 완료');
    } else {
      console.log('✅ 구독 관계 이미 존재');
    }
    
    // 3. 구독자 목록 확인
    console.log('3️⃣ 구독자 목록 확인...');
    const followersQuery = query(
      collection(db, 'follows'),
      where('followingId', '==', currentUserId)
    );
    
    const followersSnapshot = await getDocs(followersQuery);
    const followers = followersSnapshot.docs.map(doc => doc.data().followerId);
    console.log('👥 구독자 목록:', followers);
    
    // 4. 테스트 기록 생성
    console.log('4️⃣ 테스트 기록 생성...');
    const testRecord = {
      uid: currentUserId,
      region: 'Seoul',
      date: new Date().toISOString(),
      temp: 20,
      rain: 0,
      feeling: '😊',
      weatherEmojis: ['☀️'],
      imageUrls: [],
      feedback: '알림 테스트용 기록입니다.',
      outfit: {
        outer: ['가디건'],
        top: ['티셔츠'],
        bottom: ['청바지'],
        shoes: ['운동화'],
        acc: []
      },
      styles: ['캐주얼'],
      season: '봄',
      isPublic: true
    };
    
    const recordRef = await addDoc(collection(db, 'outfits'), testRecord);
    console.log('✅ 테스트 기록 생성 완료:', recordRef.id);
    
    // 5. 알림 전송
    console.log('5️⃣ 알림 전송...');
    const notificationCount = await notifyFollowersAboutNewPost(currentUserId, recordRef.id);
    console.log(`✅ ${notificationCount}명에게 알림 전송 완료`);
    
    // 6. 알림 확인
    console.log('6️⃣ 알림 확인...');
    const notificationQuery = query(
      collection(db, 'notifications'),
      where('recipient', '==', currentUserId),
      where('type', '==', 'new_post_from_following')
    );
    
    const notificationSnapshot = await getDocs(notificationQuery);
    const notifications = notificationSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('📢 생성된 알림:', notifications);
    
    if (notifications.length > 0) {
      console.log('🎉 알림 테스트 성공!');
      return {
        success: true,
        recordId: recordRef.id,
        notificationCount: notifications.length,
        notifications: notifications
      };
    } else {
      console.log('❌ 알림이 생성되지 않았습니다.');
      return {
        success: false,
        message: '알림이 생성되지 않았습니다.'
      };
    }
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 두 사용자 간의 구독 관계 테스트
 */
export async function testTwoUsersNotification(user1Id, user2Id) {
  try {
    console.log('🚀 두 사용자 알림 테스트 시작...');
    console.log('👤 사용자1 (구독자):', user1Id);
    console.log('👤 사용자2 (작성자):', user2Id);
    
    // 1. 사용자 존재 확인
    const user1Doc = await getDoc(doc(db, 'users', user1Id));
    const user2Doc = await getDoc(doc(db, 'users', user2Id));
    
    if (!user1Doc.exists() || !user2Doc.exists()) {
      console.error('❌ 사용자가 존재하지 않습니다.');
      return { success: false, message: '사용자가 존재하지 않습니다.' };
    }
    
    // 2. 구독 관계 생성 (user1이 user2를 구독)
    const followData = {
      followerId: user1Id,
      followingId: user2Id,
      createdAt: new Date()
    };
    
    await addDoc(collection(db, 'follows'), followData);
    console.log('✅ 구독 관계 생성 완료');
    
    // 3. user2가 기록 작성
    const testRecord = {
      uid: user2Id,
      region: 'Seoul',
      date: new Date().toISOString(),
      temp: 20,
      rain: 0,
      feeling: '😊',
      weatherEmojis: ['☀️'],
      imageUrls: [],
      feedback: '두 사용자 테스트용 기록입니다.',
      outfit: {
        outer: ['가디건'],
        top: ['티셔츠'],
        bottom: ['청바지'],
        shoes: ['운동화'],
        acc: []
      },
      styles: ['캐주얼'],
      season: '봄',
      isPublic: true
    };
    
    const recordRef = await addDoc(collection(db, 'outfits'), testRecord);
    console.log('✅ 테스트 기록 생성 완료:', recordRef.id);
    
    // 4. 알림 전송
    const notificationCount = await notifyFollowersAboutNewPost(user2Id, recordRef.id);
    console.log(`✅ ${notificationCount}명에게 알림 전송 완료`);
    
    // 5. user1의 알림 확인
    const notificationQuery = query(
      collection(db, 'notifications'),
      where('recipient', '==', user1Id),
      where('type', '==', 'new_post_from_following')
    );
    
    const notificationSnapshot = await getDocs(notificationQuery);
    const notifications = notificationSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('📢 user1이 받은 알림:', notifications);
    
    return {
      success: notifications.length > 0,
      recordId: recordRef.id,
      notificationCount: notifications.length,
      notifications: notifications
    };
    
  } catch (error) {
    console.error('❌ 두 사용자 테스트 실패:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 개발 환경에서만 전역으로 노출
if (process.env.NODE_ENV === 'development') {
  window.quickTest = {
    quickNotificationTest,
    testTwoUsersNotification
  };
  
  console.log('⚡ 빠른 테스트 함수가 전역으로 등록되었습니다.');
  console.log('사용법:');
  console.log('- window.quickTest.quickNotificationTest() - 현재 사용자로 빠른 테스트');
  console.log('- window.quickTest.testTwoUsersNotification("user1Id", "user2Id") - 두 사용자 테스트');
}



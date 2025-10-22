/**
 * 알림 문제 심층 디버깅 도구
 */

import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { fetchUserNotifications } from '../api/notificationAPI';

/**
 * 알림 시스템 전체 디버깅
 */
export async function deepDebugNotifications(userId) {
  try {
    console.log('🔍 알림 시스템 심층 디버깅 시작...');
    console.log('👤 사용자 ID:', userId);
    
    // 1. Firestore에서 직접 알림 조회
    console.log('\n1️⃣ Firestore 직접 조회...');
    const directQuery = query(
      collection(db, 'notifications'),
      where('recipient', '==', userId)
    );
    
    const directSnapshot = await getDocs(directQuery);
    const directNotifications = [];
    
    directSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      directNotifications.push({
        id: doc.id,
        type: data.type,
        isRead: data.isRead,
        read: data.read,
        sender: data.sender,
        createdAt: data.createdAt,
        link: data.link,
        message: data.message
      });
    });
    
    console.log('📊 Firestore 직접 조회 결과:', directNotifications.length, '개');
    directNotifications.forEach((notif, index) => {
      console.log(`${index + 1}. ${notif.type} - isRead: ${notif.isRead}, read: ${notif.read}`);
    });
    
    // 2. API 함수로 알림 조회
    console.log('\n2️⃣ API 함수로 조회...');
    const apiNotifications = await fetchUserNotifications(userId);
    console.log('📊 API 조회 결과:', apiNotifications.length, '개');
    apiNotifications.forEach((notif, index) => {
      console.log(`${index + 1}. ${notif.type} - read: ${notif.read}`);
    });
    
    // 3. 새 기록 알림만 필터링
    console.log('\n3️⃣ 새 기록 알림만 필터링...');
    const newPostDirect = directNotifications.filter(n => n.type === 'new_post_from_following');
    const newPostAPI = apiNotifications.filter(n => n.type === 'new_post_from_following');
    
    console.log('📊 직접 조회 새 기록 알림:', newPostDirect.length, '개');
    console.log('📊 API 조회 새 기록 알림:', newPostAPI.length, '개');
    
    // 4. 데이터 구조 비교
    console.log('\n4️⃣ 데이터 구조 비교...');
    if (directNotifications.length > 0 && apiNotifications.length > 0) {
      const direct = directNotifications[0];
      const api = apiNotifications[0];
      
      console.log('📋 직접 조회 데이터 구조:', Object.keys(direct));
      console.log('📋 API 조회 데이터 구조:', Object.keys(api));
      
      console.log('📋 직접 조회 샘플:', direct);
      console.log('📋 API 조회 샘플:', api);
    }
    
    // 5. 문제 진단
    console.log('\n5️⃣ 문제 진단...');
    const issues = [];
    
    if (directNotifications.length === 0) {
      issues.push('❌ Firestore에 알림이 없습니다.');
    }
    
    if (apiNotifications.length === 0 && directNotifications.length > 0) {
      issues.push('❌ API 함수가 알림을 조회하지 못합니다.');
    }
    
    if (newPostDirect.length === 0) {
      issues.push('❌ 새 기록 알림이 생성되지 않았습니다.');
    }
    
    if (newPostAPI.length === 0 && newPostDirect.length > 0) {
      issues.push('❌ API가 새 기록 알림을 조회하지 못합니다.');
    }
    
    // 6. 해결 방안 제시
    console.log('\n6️⃣ 해결 방안...');
    if (issues.length === 0) {
      console.log('✅ 모든 것이 정상입니다. UI 문제일 수 있습니다.');
    } else {
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
    }
    
    return {
      directNotifications,
      apiNotifications,
      newPostDirect,
      newPostAPI,
      issues
    };
    
  } catch (error) {
    console.error('❌ 심층 디버깅 실패:', error);
    return null;
  }
}

/**
 * UI 상태 확인
 */
export async function checkUIState() {
  try {
    console.log('🖥️ UI 상태 확인...');
    
    // React DevTools에서 확인할 수 있는 정보들
    console.log('📋 확인할 사항들:');
    console.log('1. useNotiSidebar 훅의 notifications 상태');
    console.log('2. NotiSidebar 컴포넌트의 props');
    console.log('3. 알림 사이드바가 열려있는지');
    console.log('4. 알림 개수 표시');
    
    // 현재 페이지 정보
    console.log('📍 현재 페이지:', window.location.pathname);
    console.log('📍 현재 URL:', window.location.href);
    
    // 로컬 스토리지 확인
    const authData = localStorage.getItem('firebase:authUser');
    if (authData) {
      const user = JSON.parse(authData);
      console.log('👤 로컬 스토리지 사용자:', user.uid);
    }
    
    return true;
  } catch (error) {
    console.error('❌ UI 상태 확인 실패:', error);
    return false;
  }
}

/**
 * 강제 알림 새로고침
 */
export async function forceNotificationRefresh(userId) {
  try {
    console.log('🔄 강제 알림 새로고침...');
    
    // 1. API로 최신 알림 조회
    const notifications = await fetchUserNotifications(userId);
    console.log('📊 최신 알림 조회:', notifications.length, '개');
    
    // 2. 새 기록 알림만 필터링
    const newPostNotifications = notifications.filter(n => n.type === 'new_post_from_following');
    console.log('📊 새 기록 알림:', newPostNotifications.length, '개');
    
    // 3. 각 알림 상세 정보 출력
    newPostNotifications.forEach((notif, index) => {
      console.log(`${index + 1}. ${notif.sender?.nickname || notif.sender?.name} - ${notif.createdAt}`);
    });
    
    // 4. 페이지 새로고침 제안
    console.log('💡 페이지를 새로고침해보세요: window.location.reload()');
    
    return {
      total: notifications.length,
      newPost: newPostNotifications.length,
      notifications: newPostNotifications
    };
    
  } catch (error) {
    console.error('❌ 강제 새로고침 실패:', error);
    return null;
  }
}

/**
 * 알림 생성 테스트 (최신 구조)
 */
export async function createLatestNotification(userId) {
  try {
    console.log('📤 최신 구조로 알림 생성...');
    
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
      read: false,
      link: '/feed-detail/test-record-id',
      message: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(firestoreCollection(db, 'notifications'), notificationData);
    console.log('✅ 최신 구조 알림 생성 완료:', docRef.id);
    
    // 즉시 조회해서 확인
    const notifications = await fetchUserNotifications(userId);
    const newNotifications = notifications.filter(n => n.type === 'new_post_from_following');
    console.log('📊 생성 후 새 기록 알림 개수:', newNotifications.length);
    
    return docRef.id;
  } catch (error) {
    console.error('❌ 최신 구조 알림 생성 실패:', error);
    throw error;
  }
}

// 개발 환경에서만 전역으로 노출
if (process.env.NODE_ENV === 'development') {
  window.deepDebug = {
    deepDebugNotifications,
    checkUIState,
    forceNotificationRefresh,
    createLatestNotification
  };
  
  console.log('🔍 심층 디버깅 도구가 전역으로 등록되었습니다.');
  console.log('사용법:');
  console.log('- window.deepDebug.deepDebugNotifications("사용자ID") - 전체 시스템 디버깅');
  console.log('- window.deepDebug.checkUIState() - UI 상태 확인');
  console.log('- window.deepDebug.forceNotificationRefresh("사용자ID") - 강제 새로고침');
  console.log('- window.deepDebug.createLatestNotification("사용자ID") - 최신 구조 알림 생성');
}



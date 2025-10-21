/**
 * 알림 문제 진단을 위한 디버깅 유틸리티
 */

import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc, addDoc } from 'firebase/firestore';
import { notifyFollowersAboutNewPost, getFollowers } from '../services/notificationService';

/**
 * 알림 문제 진단 함수
 * @param {string} postAuthorId - 기록 작성자 ID
 * @param {string} followerId - 구독자 ID (알림을 받아야 할 사용자)
 * @returns {Promise<Object>} 진단 결과
 */
export async function diagnoseNotificationIssue(postAuthorId, followerId) {
  console.log('🔍 알림 문제 진단 시작...');
  
  const diagnosis = {
    step1_userExists: false,
    step2_followRelationship: false,
    step3_publicRecord: false,
    step4_notificationSent: false,
    step5_notificationReceived: false,
    issues: [],
    recommendations: []
  };

  try {
    // 1단계: 사용자 존재 여부 확인
    console.log('1️⃣ 사용자 존재 여부 확인...');
    const authorDoc = await getDoc(doc(db, 'users', postAuthorId));
    const followerDoc = await getDoc(doc(db, 'users', followerId));
    
    if (!authorDoc.exists()) {
      diagnosis.issues.push(`기록 작성자(${postAuthorId})가 존재하지 않습니다.`);
      diagnosis.recommendations.push('사용자 ID를 확인해주세요.');
    } else {
      diagnosis.step1_userExists = true;
      console.log('✅ 기록 작성자 존재 확인');
    }
    
    if (!followerDoc.exists()) {
      diagnosis.issues.push(`구독자(${followerId})가 존재하지 않습니다.`);
      diagnosis.recommendations.push('구독자 ID를 확인해주세요.');
    } else {
      console.log('✅ 구독자 존재 확인');
    }

    // 2단계: 구독 관계 확인
    console.log('2️⃣ 구독 관계 확인...');
    const followQuery = query(
      collection(db, 'follows'),
      where('followerId', '==', followerId),
      where('followingId', '==', postAuthorId)
    );
    
    const followSnapshot = await getDocs(followQuery);
    if (followSnapshot.empty) {
      diagnosis.issues.push(`${followerId}가 ${postAuthorId}를 구독하지 않았습니다.`);
      diagnosis.recommendations.push('구독 관계를 먼저 설정해주세요.');
    } else {
      diagnosis.step2_followRelationship = true;
      console.log('✅ 구독 관계 확인');
    }

    // 3단계: 구독자 목록 조회 테스트
    console.log('3️⃣ 구독자 목록 조회 테스트...');
    const followers = await getFollowers(postAuthorId);
    console.log(`📊 ${postAuthorId}의 구독자 목록:`, followers);
    
    if (!followers.includes(followerId)) {
      diagnosis.issues.push('getFollowers 함수에서 구독자를 찾지 못했습니다.');
      diagnosis.recommendations.push('구독 데이터 구조를 확인해주세요.');
    } else {
      console.log('✅ 구독자 목록에 포함됨');
    }

    // 4단계: 알림 전송 테스트
    console.log('4️⃣ 알림 전송 테스트...');
    try {
      const testPostId = 'test-post-' + Date.now();
      const notificationCount = await notifyFollowersAboutNewPost(postAuthorId, testPostId);
      
      if (notificationCount > 0) {
        diagnosis.step4_notificationSent = true;
        console.log(`✅ ${notificationCount}명에게 알림 전송 성공`);
      } else {
        diagnosis.issues.push('알림 전송 함수가 0을 반환했습니다.');
        diagnosis.recommendations.push('구독자가 없거나 알림 전송 로직에 문제가 있습니다.');
      }
    } catch (error) {
      diagnosis.issues.push(`알림 전송 실패: ${error.message}`);
      diagnosis.recommendations.push('알림 서비스 로직을 확인해주세요.');
    }

    // 5단계: 실제 알림 수신 확인
    console.log('5️⃣ 알림 수신 확인...');
    const notificationQuery = query(
      collection(db, 'notifications'),
      where('recipient', '==', followerId),
      where('type', '==', 'new_post_from_following')
    );
    
    const notificationSnapshot = await getDocs(notificationQuery);
    const notifications = notificationSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`📢 ${followerId}의 새 기록 알림:`, notifications);
    
    if (notifications.length > 0) {
      diagnosis.step5_notificationReceived = true;
      console.log('✅ 알림 수신 확인');
    } else {
      diagnosis.issues.push('구독자의 알림 컬렉션에 새 기록 알림이 없습니다.');
      diagnosis.recommendations.push('알림 생성 로직을 확인해주세요.');
    }

    // 진단 결과 출력
    console.log('\n📋 진단 결과:');
    console.log('='.repeat(50));
    console.log(`1. 사용자 존재: ${diagnosis.step1_userExists ? '✅' : '❌'}`);
    console.log(`2. 구독 관계: ${diagnosis.step2_followRelationship ? '✅' : '❌'}`);
    console.log(`3. 구독자 목록: ${followers.length > 0 ? '✅' : '❌'}`);
    console.log(`4. 알림 전송: ${diagnosis.step4_notificationSent ? '✅' : '❌'}`);
    console.log(`5. 알림 수신: ${diagnosis.step5_notificationReceived ? '✅' : '❌'}`);
    
    if (diagnosis.issues.length > 0) {
      console.log('\n❌ 발견된 문제들:');
      diagnosis.issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
      
      console.log('\n💡 해결 방안:');
      diagnosis.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    } else {
      console.log('\n✅ 모든 단계가 정상적으로 작동합니다!');
    }

    return diagnosis;

  } catch (error) {
    console.error('❌ 진단 중 오류 발생:', error);
    diagnosis.issues.push(`진단 중 오류: ${error.message}`);
    return diagnosis;
  }
}

/**
 * 구독 관계 생성 테스트
 * @param {string} followerId - 구독자 ID
 * @param {string} followingId - 구독받을 사용자 ID
 */
export async function testFollowRelationship(followerId, followingId) {
  console.log('🧪 구독 관계 생성 테스트...');
  
  try {
    // 구독 관계 생성
    await addDoc(collection(db, 'follows'), {
      followerId: followerId,
      followingId: followingId,
      createdAt: new Date()
    });
    
    console.log(`✅ 구독 관계 생성 완료: ${followerId} → ${followingId}`);
    
    // 구독자 목록 확인
    const followers = await getFollowers(followingId);
    console.log(`📊 ${followingId}의 구독자 목록:`, followers);
    
    return true;
  } catch (error) {
    console.error('❌ 구독 관계 생성 실패:', error);
    return false;
  }
}

/**
 * 수동으로 새 기록 알림 전송
 * @param {string} postAuthorId - 기록 작성자 ID
 * @param {string} postId - 기록 ID
 */
export async function manuallySendNotification(postAuthorId, postId) {
  console.log('📤 수동 알림 전송...');
  
  try {
    const notificationCount = await notifyFollowersAboutNewPost(postAuthorId, postId);
    console.log(`✅ ${notificationCount}명에게 알림 전송 완료`);
    return notificationCount;
  } catch (error) {
    console.error('❌ 수동 알림 전송 실패:', error);
    throw error;
  }
}

// 개발 환경에서만 전역으로 노출
if (process.env.NODE_ENV === 'development') {
  window.debugNotifications = {
    diagnoseNotificationIssue,
    testFollowRelationship,
    manuallySendNotification
  };
  
  console.log('🔧 알림 디버깅 도구가 전역으로 등록되었습니다.');
  console.log('사용법:');
  console.log('- window.debugNotifications.diagnoseNotificationIssue("작성자ID", "구독자ID")');
  console.log('- window.debugNotifications.testFollowRelationship("구독자ID", "작성자ID")');
  console.log('- window.debugNotifications.manuallySendNotification("작성자ID", "기록ID")');
}

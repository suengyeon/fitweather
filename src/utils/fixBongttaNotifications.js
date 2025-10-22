/**
 * 뽕따의 구독 알림 수정 도구
 */

import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';

/**
 * 뽕따의 구독 알림들에 nickname 필드 추가
 */
export async function fixBongttaFollowNotifications() {
  try {
    console.log('🔧 뽕따의 구독 알림들 수정 중...');
    
    const bongttaUserId = 'cCsBSfwcfTRkf55T9ADVyHmB5R03';
    
    // 뽕따가 sender인 follow 알림들 조회
    const q = query(
      collection(db, 'notifications'),
      where('sender.id', '==', bongttaUserId),
      where('type', '==', 'follow')
    );
    
    const snapshot = await getDocs(q);
    console.log(`📊 뽕따의 구독 알림 ${snapshot.docs.length}개 발견`);
    
    let fixedCount = 0;
    
    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      const sender = data.sender;
      
      // nickname 필드가 없으면 추가
      if (!sender.nickname && sender.name) {
        await updateDoc(doc(db, 'notifications', docSnapshot.id), {
          'sender.nickname': sender.name,
          'sender.profilePictureUrl': sender.avatarUrl || null
        });
        fixedCount++;
        console.log(`✅ 구독 알림 ${docSnapshot.id} 수정 완료`);
      } else {
        console.log(`⏭️ 구독 알림 ${docSnapshot.id}는 이미 nickname이 있음`);
      }
    }
    
    console.log(`🔧 ${fixedCount}개 구독 알림 수정 완료`);
    return fixedCount;
  } catch (error) {
    console.error('❌ 뽕따 구독 알림 수정 실패:', error);
    return 0;
  }
}

/**
 * 뽕따 사용자 정보에 name 필드 추가
 */
export async function fixBongttaUserData() {
  try {
    console.log('🔧 뽕따 사용자 정보 수정 중...');
    
    const bongttaUserId = 'cCsBSfwcfTRkf55T9ADVyHmB5R03';
    
    // 뽕따 사용자 문서 업데이트
    await updateDoc(doc(db, 'users', bongttaUserId), {
      name: '뽕따' // nickname을 name으로도 복사
    });
    
    console.log('✅ 뽕따 사용자 정보 수정 완료');
    return true;
  } catch (error) {
    console.error('❌ 뽕따 사용자 정보 수정 실패:', error);
    return false;
  }
}

/**
 * 뽕따 관련 모든 문제 수정
 */
export async function fixAllBongttaIssues() {
  try {
    console.log('🔧 뽕따 관련 모든 문제 수정 시작...');
    
    // 1. 사용자 정보 수정
    console.log('1️⃣ 뽕따 사용자 정보 수정...');
    await fixBongttaUserData();
    
    // 2. 구독 알림 수정
    console.log('2️⃣ 뽕따의 구독 알림 수정...');
    const fixedNotifications = await fixBongttaFollowNotifications();
    
    console.log('🎉 뽕따 관련 모든 문제 수정 완료!');
    console.log(`📊 수정된 구독 알림: ${fixedNotifications}개`);
    
    return {
      userFixed: true,
      notificationsFixed: fixedNotifications
    };
  } catch (error) {
    console.error('❌ 뽕따 문제 수정 실패:', error);
    return {
      userFixed: false,
      notificationsFixed: 0
    };
  }
}

/**
 * 수정 결과 확인
 */
export async function verifyBongttaFix() {
  try {
    console.log('🔍 뽕따 수정 결과 확인...');
    
    const bongttaUserId = 'cCsBSfwcfTRkf55T9ADVyHmB5R03';
    
    // 1. 사용자 정보 확인
    const { getDoc } = await import('firebase/firestore');
    const userDoc = await getDoc(doc(db, 'users', bongttaUserId));
    const userData = userDoc.data();
    
    console.log('👤 뽕따 사용자 정보:');
    console.log(`   nickname: ${userData.nickname}`);
    console.log(`   name: ${userData.name}`);
    
    // 2. 구독 알림 확인
    const q = query(
      collection(db, 'notifications'),
      where('sender.id', '==', bongttaUserId),
      where('type', '==', 'follow')
    );
    
    const snapshot = await getDocs(q);
    console.log(`📊 뽕따의 구독 알림 ${snapshot.docs.length}개 확인:`);
    
    let allFixed = true;
    snapshot.docs.forEach((docSnapshot, index) => {
      const data = docSnapshot.data();
      const sender = data.sender;
      const hasNickname = !!sender.nickname;
      const hasName = !!sender.name;
      
      console.log(`   ${index + 1}. ${hasNickname ? '✅' : '❌'} nickname: ${sender.nickname || '없음'}`);
      console.log(`      ${hasName ? '✅' : '❌'} name: ${sender.name || '없음'}`);
      
      if (!hasNickname) {
        allFixed = false;
      }
    });
    
    if (allFixed) {
      console.log('🎉 모든 구독 알림이 올바르게 수정되었습니다!');
    } else {
      console.log('⚠️ 일부 구독 알림이 아직 수정되지 않았습니다.');
    }
    
    return {
      userFixed: !!userData.name,
      notificationsFixed: allFixed,
      totalNotifications: snapshot.docs.length
    };
  } catch (error) {
    console.error('❌ 뽕따 수정 결과 확인 실패:', error);
    return null;
  }
}

// 개발 환경에서만 전역으로 노출
if (process.env.NODE_ENV === 'development') {
  window.fixBongtta = {
    fixBongttaFollowNotifications,
    fixBongttaUserData,
    fixAllBongttaIssues,
    verifyBongttaFix
  };
  
  console.log('🔧 뽕따 수정 도구가 전역으로 등록되었습니다.');
  console.log('사용법:');
  console.log('- window.fixBongtta.fixAllBongttaIssues() - 모든 문제 수정');
  console.log('- window.fixBongtta.verifyBongttaFix() - 수정 결과 확인');
}



/**
 * 알림 데이터 분석 도구
 */

import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

/**
 * 알림 데이터 상세 분석
 */
export async function analyzeNotificationData(userId) {
  try {
    console.log('🔍 알림 데이터 상세 분석 시작...');
    
    const q = query(
      collection(db, 'notifications'),
      where('recipient', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const notifications = [];
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      notifications.push({
        id: doc.id,
        type: data.type,
        sender: data.sender,
        createdAt: data.createdAt,
        isRead: data.isRead,
        read: data.read
      });
    });
    
    console.log(`📊 총 ${notifications.length}개의 알림 분석 중...`);
    
    // 타입별 분석
    const typeAnalysis = {};
    notifications.forEach(notif => {
      if (!typeAnalysis[notif.type]) {
        typeAnalysis[notif.type] = {
          count: 0,
          withNickname: 0,
          withName: 0,
          withBoth: 0,
          withNeither: 0,
          samples: []
        };
      }
      
      const analysis = typeAnalysis[notif.type];
      analysis.count++;
      
      const hasNickname = !!notif.sender?.nickname;
      const hasName = !!notif.sender?.name;
      
      if (hasNickname) analysis.withNickname++;
      if (hasName) analysis.withName++;
      if (hasNickname && hasName) analysis.withBoth++;
      if (!hasNickname && !hasName) analysis.withNeither++;
      
      // 샘플 데이터 (최대 3개)
      if (analysis.samples.length < 3) {
        analysis.samples.push({
          id: notif.id,
          sender: notif.sender,
          hasNickname,
          hasName,
          createdAt: notif.createdAt
        });
      }
    });
    
    // 결과 출력
    console.log('\n📋 타입별 분석 결과:');
    console.log('='.repeat(60));
    
    Object.entries(typeAnalysis).forEach(([type, analysis]) => {
      console.log(`\n🔸 ${type}:`);
      console.log(`   총 개수: ${analysis.count}`);
      console.log(`   nickname 있음: ${analysis.withNickname} (${Math.round(analysis.withNickname/analysis.count*100)}%)`);
      console.log(`   name 있음: ${analysis.withName} (${Math.round(analysis.withName/analysis.count*100)}%)`);
      console.log(`   둘 다 있음: ${analysis.withBoth} (${Math.round(analysis.withBoth/analysis.count*100)}%)`);
      console.log(`   둘 다 없음: ${analysis.withNeither} (${Math.round(analysis.withNeither/analysis.count*100)}%)`);
      
      console.log(`   샘플 데이터:`);
      analysis.samples.forEach((sample, index) => {
        console.log(`     ${index + 1}. ID: ${sample.id}`);
        console.log(`        sender: ${JSON.stringify(sample.sender)}`);
        console.log(`        nickname: ${sample.hasNickname ? '✅' : '❌'}`);
        console.log(`        name: ${sample.hasName ? '✅' : '❌'}`);
        console.log(`        createdAt: ${sample.createdAt?.toDate?.()?.toISOString() || sample.createdAt}`);
      });
    });
    
    // 문제가 있는 알림들 식별
    console.log('\n🚨 문제가 있는 알림들:');
    console.log('='.repeat(60));
    
    const problematicNotifications = notifications.filter(notif => {
      const hasNickname = !!notif.sender?.nickname;
      const hasName = !!notif.sender?.name;
      return !hasNickname || !hasName;
    });
    
    if (problematicNotifications.length === 0) {
      console.log('✅ 모든 알림이 올바른 데이터 구조를 가지고 있습니다.');
    } else {
      console.log(`❌ ${problematicNotifications.length}개의 알림에 문제가 있습니다:`);
      
      problematicNotifications.forEach((notif, index) => {
        console.log(`\n${index + 1}. ${notif.type} 알림 (ID: ${notif.id})`);
        console.log(`   sender: ${JSON.stringify(notif.sender)}`);
        console.log(`   nickname: ${notif.sender?.nickname || '❌ 없음'}`);
        console.log(`   name: ${notif.sender?.name || '❌ 없음'}`);
        console.log(`   createdAt: ${notif.createdAt?.toDate?.()?.toISOString() || notif.createdAt}`);
      });
    }
    
    return {
      total: notifications.length,
      typeAnalysis,
      problematic: problematicNotifications
    };
    
  } catch (error) {
    console.error('❌ 알림 데이터 분석 실패:', error);
    return null;
  }
}

/**
 * 특정 알림 ID의 상세 정보 확인
 */
export async function getNotificationDetails(notificationId) {
  try {
    console.log(`🔍 알림 ${notificationId} 상세 정보 확인...`);
    
    const { doc, getDoc } = await import('firebase/firestore');
    const notificationDoc = await getDoc(doc(db, 'notifications', notificationId));
    
    if (!notificationDoc.exists()) {
      console.log('❌ 알림을 찾을 수 없습니다.');
      return null;
    }
    
    const data = notificationDoc.data();
    console.log('📋 알림 상세 정보:');
    console.log('='.repeat(40));
    console.log(`ID: ${notificationId}`);
    console.log(`Type: ${data.type}`);
    console.log(`Recipient: ${data.recipient}`);
    console.log(`Sender: ${JSON.stringify(data.sender, null, 2)}`);
    console.log(`Link: ${data.link}`);
    console.log(`Message: ${data.message}`);
    console.log(`isRead: ${data.isRead}`);
    console.log(`read: ${data.read}`);
    console.log(`CreatedAt: ${data.createdAt?.toDate?.()?.toISOString() || data.createdAt}`);
    console.log(`UpdatedAt: ${data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt}`);
    
    return data;
  } catch (error) {
    console.error('❌ 알림 상세 정보 확인 실패:', error);
    return null;
  }
}

/**
 * 문제가 있는 알림들 일괄 수정
 */
export async function fixProblematicNotifications(userId) {
  try {
    console.log('🔧 문제가 있는 알림들 일괄 수정 중...');
    
    const analysis = await analyzeNotificationData(userId);
    if (!analysis || analysis.problematic.length === 0) {
      console.log('✅ 수정할 알림이 없습니다.');
      return 0;
    }
    
    const { updateDoc, doc } = await import('firebase/firestore');
    let fixedCount = 0;
    
    for (const notif of analysis.problematic) {
      const sender = notif.sender;
      const updates = {};
      
      // nickname이 없으면 name을 nickname으로 복사
      if (!sender.nickname && sender.name) {
        updates['sender.nickname'] = sender.name;
      }
      
      // name이 없으면 nickname을 name으로 복사
      if (!sender.name && sender.nickname) {
        updates['sender.name'] = sender.nickname;
      }
      
      // profilePictureUrl이 없으면 avatarUrl을 복사
      if (!sender.profilePictureUrl && sender.avatarUrl) {
        updates['sender.profilePictureUrl'] = sender.avatarUrl;
      }
      
      // avatarUrl이 없으면 profilePictureUrl을 복사
      if (!sender.avatarUrl && sender.profilePictureUrl) {
        updates['sender.avatarUrl'] = sender.profilePictureUrl;
      }
      
      if (Object.keys(updates).length > 0) {
        await updateDoc(doc(db, 'notifications', notif.id), updates);
        fixedCount++;
        console.log(`✅ 알림 ${notif.id} 수정 완료`);
      }
    }
    
    console.log(`🔧 ${fixedCount}개 알림 수정 완료`);
    return fixedCount;
  } catch (error) {
    console.error('❌ 문제 알림 수정 실패:', error);
    return 0;
  }
}

// 개발 환경에서만 전역으로 노출
if (process.env.NODE_ENV === 'development') {
  window.analyzeNotifications = {
    analyzeNotificationData,
    getNotificationDetails,
    fixProblematicNotifications
  };
  
  console.log('🔍 알림 분석 도구가 전역으로 등록되었습니다.');
  console.log('사용법:');
  console.log('- window.analyzeNotifications.analyzeNotificationData("사용자ID") - 알림 데이터 분석');
  console.log('- window.analyzeNotifications.getNotificationDetails("알림ID") - 특정 알림 상세 확인');
  console.log('- window.analyzeNotifications.fixProblematicNotifications("사용자ID") - 문제 알림 일괄 수정');
}



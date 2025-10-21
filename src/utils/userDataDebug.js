/**
 * 사용자 데이터 디버깅 도구
 */

import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

/**
 * 특정 사용자 정보 상세 확인
 */
export async function getUserDetails(userId) {
  try {
    console.log(`🔍 사용자 ${userId} 정보 상세 확인...`);
    
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      console.log('❌ 사용자를 찾을 수 없습니다.');
      return null;
    }
    
    const userData = userDoc.data();
    console.log('👤 사용자 상세 정보:');
    console.log('='.repeat(50));
    console.log(`ID: ${userId}`);
    console.log(`Email: ${userData.email || '없음'}`);
    console.log(`Nickname: ${userData.nickname || '없음'}`);
    console.log(`Name: ${userData.name || '없음'}`);
    console.log(`Display Name: ${userData.displayName || '없음'}`);
    console.log(`Profile Picture URL: ${userData.profilePictureUrl || '없음'}`);
    console.log(`Avatar URL: ${userData.avatarUrl || '없음'}`);
    console.log(`Photo URL: ${userData.photoURL || '없음'}`);
    console.log(`전체 데이터:`, userData);
    
    return userData;
  } catch (error) {
    console.error('❌ 사용자 정보 확인 실패:', error);
    return null;
  }
}

/**
 * 닉네임으로 사용자 찾기
 */
export async function findUserByNickname(nickname) {
  try {
    console.log(`🔍 닉네임 "${nickname}"으로 사용자 찾기...`);
    
    const q = query(
      collection(db, 'users'),
      where('nickname', '==', nickname)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('❌ 해당 닉네임의 사용자를 찾을 수 없습니다.');
      return null;
    }
    
    const users = [];
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      users.push({
        id: doc.id,
        nickname: data.nickname,
        name: data.name,
        email: data.email
      });
    });
    
    console.log(`✅ ${users.length}명의 사용자를 찾았습니다:`, users);
    return users;
  } catch (error) {
    console.error('❌ 닉네임으로 사용자 찾기 실패:', error);
    return null;
  }
}

/**
 * 특정 사용자의 알림에서 sender 정보 확인
 */
export async function checkUserAsSender(userId) {
  try {
    console.log(`🔍 ${userId}가 sender인 알림들 확인...`);
    
    const q = query(
      collection(db, 'notifications'),
      where('sender.id', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    const notifications = [];
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      notifications.push({
        id: doc.id,
        type: data.type,
        recipient: data.recipient,
        sender: data.sender,
        createdAt: data.createdAt
      });
    });
    
    console.log(`📊 ${userId}가 sender인 알림 ${notifications.length}개:`);
    
    notifications.forEach((notif, index) => {
      console.log(`\n${index + 1}. ${notif.type} 알림 (ID: ${notif.id})`);
      console.log(`   recipient: ${notif.recipient}`);
      console.log(`   sender: ${JSON.stringify(notif.sender, null, 2)}`);
      console.log(`   nickname: ${notif.sender?.nickname || '❌ 없음'}`);
      console.log(`   name: ${notif.sender?.name || '❌ 없음'}`);
      console.log(`   createdAt: ${notif.createdAt?.toDate?.()?.toISOString() || notif.createdAt}`);
    });
    
    return notifications;
  } catch (error) {
    console.error('❌ 사용자 sender 정보 확인 실패:', error);
    return [];
  }
}

/**
 * 특정 사용자의 알림에서 recipient 정보 확인
 */
export async function checkUserAsRecipient(userId) {
  try {
    console.log(`🔍 ${userId}가 recipient인 알림들 확인...`);
    
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
        senderId: data.sender?.id,
        createdAt: data.createdAt
      });
    });
    
    console.log(`📊 ${userId}가 recipient인 알림 ${notifications.length}개:`);
    
    // sender별로 그룹화
    const senderGroups = {};
    notifications.forEach(notif => {
      const senderId = notif.senderId;
      if (!senderGroups[senderId]) {
        senderGroups[senderId] = {
          sender: notif.sender,
          count: 0,
          notifications: []
        };
      }
      senderGroups[senderId].count++;
      senderGroups[senderId].notifications.push(notif);
    });
    
    console.log('\n📋 sender별 그룹화:');
    Object.entries(senderGroups).forEach(([senderId, group]) => {
      console.log(`\n👤 Sender ID: ${senderId}`);
      console.log(`   알림 개수: ${group.count}`);
      console.log(`   nickname: ${group.sender?.nickname || '❌ 없음'}`);
      console.log(`   name: ${group.sender?.name || '❌ 없음'}`);
      console.log(`   전체 sender 데이터: ${JSON.stringify(group.sender, null, 2)}`);
    });
    
    return notifications;
  } catch (error) {
    console.error('❌ 사용자 recipient 정보 확인 실패:', error);
    return [];
  }
}

/**
 * 뽕따와 메로나 사용자 정보 비교
 */
export async function compareUsers() {
  try {
    console.log('🔍 뽕따와 메로나 사용자 정보 비교...');
    
    // 뽕따 사용자 찾기
    const bongttaUsers = await findUserByNickname('뽕따');
    const meronaUsers = await findUserByNickname('메로나');
    
    if (!bongttaUsers || bongttaUsers.length === 0) {
      console.log('❌ 뽕따 사용자를 찾을 수 없습니다.');
      return;
    }
    
    if (!meronaUsers || meronaUsers.length === 0) {
      console.log('❌ 메로나 사용자를 찾을 수 없습니다.');
      return;
    }
    
    const bongtta = bongttaUsers[0];
    const merona = meronaUsers[0];
    
    console.log('\n👤 뽕따 사용자 정보:');
    console.log('='.repeat(30));
    console.log(`ID: ${bongtta.id}`);
    console.log(`Nickname: ${bongtta.nickname}`);
    console.log(`Name: ${bongtta.name}`);
    console.log(`Email: ${bongtta.email}`);
    
    console.log('\n👤 메로나 사용자 정보:');
    console.log('='.repeat(30));
    console.log(`ID: ${merona.id}`);
    console.log(`Nickname: ${merona.nickname}`);
    console.log(`Name: ${merona.name}`);
    console.log(`Email: ${merona.email}`);
    
    // 각각의 알림 정보 확인
    console.log('\n📊 뽕따가 sender인 알림들:');
    await checkUserAsSender(bongtta.id);
    
    console.log('\n📊 메로나가 sender인 알림들:');
    await checkUserAsSender(merona.id);
    
    return {
      bongtta,
      merona
    };
  } catch (error) {
    console.error('❌ 사용자 비교 실패:', error);
    return null;
  }
}

// 개발 환경에서만 전역으로 노출
if (process.env.NODE_ENV === 'development') {
  window.userDataDebug = {
    getUserDetails,
    findUserByNickname,
    checkUserAsSender,
    checkUserAsRecipient,
    compareUsers
  };
  
  console.log('👤 사용자 데이터 디버깅 도구가 전역으로 등록되었습니다.');
  console.log('사용법:');
  console.log('- window.userDataDebug.findUserByNickname("뽕따") - 닉네임으로 사용자 찾기');
  console.log('- window.userDataDebug.getUserDetails("사용자ID") - 사용자 상세 정보');
  console.log('- window.userDataDebug.checkUserAsSender("사용자ID") - sender로 사용된 알림들');
  console.log('- window.userDataDebug.compareUsers() - 뽕따와 메로나 비교');
}


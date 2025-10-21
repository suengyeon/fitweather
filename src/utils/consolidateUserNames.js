import { db } from '../firebase';
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';

/**
 * 사용자 데이터에서 name을 nickname으로 통합하고 name 필드를 제거하는 유틸리티
 */
export const consolidateUserNames = {
  
  /**
   * 모든 사용자의 name을 nickname으로 통합
   */
  async consolidateAllUsers() {
    console.log('🔄 사용자 데이터 통합 시작...');
    
    try {
      // 1. 모든 사용자 조회
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = [];
      
      usersSnapshot.forEach(doc => {
        users.push({ id: doc.id, ...doc.data() });
      });
      
      console.log(`👥 총 ${users.length}명의 사용자 발견`);
      
      let updatedCount = 0;
      
      for (const user of users) {
        const updates = {};
        let needsUpdate = false;
        
        // name이 있고 nickname이 없는 경우
        if (user.name && !user.nickname) {
          updates.nickname = user.name;
          updates.name = null; // name 필드 제거
          needsUpdate = true;
          console.log(`📝 ${user.id}: name("${user.name}") → nickname("${user.name}")`);
        }
        // name과 nickname이 모두 있는 경우 (nickname 우선)
        else if (user.name && user.nickname && user.name !== user.nickname) {
          updates.name = null; // name 필드만 제거
          needsUpdate = true;
          console.log(`📝 ${user.id}: nickname("${user.nickname}") 유지, name("${user.name}") 제거`);
        }
        // name만 있고 nickname이 없는 경우는 이미 위에서 처리됨
        else if (user.name && !user.nickname) {
          // 이미 처리됨
        }
        
        if (needsUpdate) {
          await updateDoc(doc(db, 'users', user.id), updates);
          updatedCount++;
        }
      }
      
      console.log(`✅ ${updatedCount}명의 사용자 데이터 통합 완료`);
      return { total: users.length, updated: updatedCount };
      
    } catch (error) {
      console.error('❌ 사용자 데이터 통합 실패:', error);
      throw error;
    }
  },

  /**
   * 모든 알림의 sender 객체에서 name을 nickname으로 통합
   */
  async consolidateAllNotifications() {
    console.log('🔄 알림 데이터 통합 시작...');
    
    try {
      // 모든 알림 조회
      const notificationsSnapshot = await getDocs(collection(db, 'notifications'));
      const notifications = [];
      
      notificationsSnapshot.forEach(doc => {
        notifications.push({ id: doc.id, ...doc.data() });
      });
      
      console.log(`📢 총 ${notifications.length}개의 알림 발견`);
      
      let updatedCount = 0;
      
      for (const notification of notifications) {
        if (!notification.sender) continue;
        
        const updates = {};
        let needsUpdate = false;
        
        // sender.name이 있고 sender.nickname이 없는 경우
        if (notification.sender.name && !notification.sender.nickname) {
          updates['sender.nickname'] = notification.sender.name;
          updates['sender.name'] = null; // name 필드 제거
          needsUpdate = true;
          console.log(`📝 알림 ${notification.id}: sender.name("${notification.sender.name}") → sender.nickname("${notification.sender.name}")`);
        }
        // sender.name과 sender.nickname이 모두 있는 경우 (nickname 우선)
        else if (notification.sender.name && notification.sender.nickname && notification.sender.name !== notification.sender.nickname) {
          updates['sender.name'] = null; // name 필드만 제거
          needsUpdate = true;
          console.log(`📝 알림 ${notification.id}: sender.nickname("${notification.sender.nickname}") 유지, sender.name("${notification.sender.name}") 제거`);
        }
        
        if (needsUpdate) {
          await updateDoc(doc(db, 'notifications', notification.id), updates);
          updatedCount++;
        }
      }
      
      console.log(`✅ ${updatedCount}개의 알림 데이터 통합 완료`);
      return { total: notifications.length, updated: updatedCount };
      
    } catch (error) {
      console.error('❌ 알림 데이터 통합 실패:', error);
      throw error;
    }
  },

  /**
   * 전체 통합 작업 실행
   */
  async runFullConsolidation() {
    console.log('🚀 전체 데이터 통합 시작...');
    console.log('=====================================');
    
    try {
      // 1. 사용자 데이터 통합
      console.log('1️⃣ 사용자 데이터 통합...');
      const userResult = await this.consolidateAllUsers();
      
      console.log('\n2️⃣ 알림 데이터 통합...');
      const notificationResult = await this.consolidateAllNotifications();
      
      console.log('\n🎉 전체 통합 완료!');
      console.log('=====================================');
      console.log(`👥 사용자: ${userResult.updated}/${userResult.total}명 업데이트`);
      console.log(`📢 알림: ${notificationResult.updated}/${notificationResult.total}개 업데이트`);
      
      return {
        users: userResult,
        notifications: notificationResult
      };
      
    } catch (error) {
      console.error('❌ 전체 통합 실패:', error);
      throw error;
    }
  },

  /**
   * 통합 전 미리보기 (실제 변경하지 않고 확인만)
   */
  async previewConsolidation() {
    console.log('👀 통합 미리보기 시작...');
    
    try {
      // 사용자 데이터 미리보기
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const userChanges = [];
      
      usersSnapshot.forEach(doc => {
        const user = { id: doc.id, ...doc.data() };
        
        if (user.name && !user.nickname) {
          userChanges.push({
            id: user.id,
            type: 'name → nickname',
            current: { name: user.name, nickname: user.nickname },
            after: { name: null, nickname: user.name }
          });
        } else if (user.name && user.nickname && user.name !== user.nickname) {
          userChanges.push({
            id: user.id,
            type: 'name 제거',
            current: { name: user.name, nickname: user.nickname },
            after: { name: null, nickname: user.nickname }
          });
        }
      });
      
      // 알림 데이터 미리보기
      const notificationsSnapshot = await getDocs(collection(db, 'notifications'));
      const notificationChanges = [];
      
      notificationsSnapshot.forEach(doc => {
        const notification = { id: doc.id, ...doc.data() };
        
        if (notification.sender?.name && !notification.sender?.nickname) {
          notificationChanges.push({
            id: notification.id,
            type: 'sender.name → sender.nickname',
            current: { name: notification.sender.name, nickname: notification.sender.nickname },
            after: { name: null, nickname: notification.sender.name }
          });
        } else if (notification.sender?.name && notification.sender?.nickname && notification.sender.name !== notification.sender.nickname) {
          notificationChanges.push({
            id: notification.id,
            type: 'sender.name 제거',
            current: { name: notification.sender.name, nickname: notification.sender.nickname },
            after: { name: null, nickname: notification.sender.nickname }
          });
        }
      });
      
      console.log(`👥 사용자 변경 예정: ${userChanges.length}명`);
      userChanges.forEach(change => {
        console.log(`  - ${change.id}: ${change.type}`);
        console.log(`    현재: name="${change.current.name}", nickname="${change.current.nickname}"`);
        console.log(`    이후: name="${change.after.name}", nickname="${change.after.nickname}"`);
      });
      
      console.log(`\n📢 알림 변경 예정: ${notificationChanges.length}개`);
      notificationChanges.forEach(change => {
        console.log(`  - ${change.id}: ${change.type}`);
        console.log(`    현재: name="${change.current.name}", nickname="${change.current.nickname}"`);
        console.log(`    이후: name="${change.after.name}", nickname="${change.after.nickname}"`);
      });
      
      return {
        users: userChanges,
        notifications: notificationChanges
      };
      
    } catch (error) {
      console.error('❌ 미리보기 실패:', error);
      throw error;
    }
  }
};

// 개발 환경에서 전역으로 사용할 수 있도록 설정
if (process.env.NODE_ENV === 'development') {
  window.consolidateUserNames = consolidateUserNames;
}

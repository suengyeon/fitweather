import { subscribeUser } from '../api/subscribe';
import { auth } from '../firebase';
import { db } from '../firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

/**
 * 빠른 구독 테스트 유틸리티
 */
export const quickFollowTest = {
  
  /**
   * 현재 로그인한 사용자와 다른 사용자들 목록 표시
   */
  async showAvailableUsers() {
    console.log('👥 사용 가능한 사용자 목록 조회 중...');
    
    try {
      // 현재 로그인한 사용자
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('❌ 로그인된 사용자가 없습니다.');
        return;
      }
      
      console.log(`👤 현재 로그인한 사용자: ${currentUser.uid}`);
      
      // 모든 사용자 조회
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = [];
      
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        users.push({
          id: doc.id,
          nickname: userData.nickname || '닉네임 없음',
          email: userData.email || '이메일 없음'
        });
      });
      
      console.log(`📋 총 ${users.length}명의 사용자:`);
      users.forEach((user, index) => {
        const isCurrentUser = user.id === currentUser.uid;
        console.log(`${index + 1}. ${user.nickname} (${user.id}) ${isCurrentUser ? '👈 현재 사용자' : ''}`);
      });
      
      // 현재 사용자가 아닌 사용자들만 필터링
      const otherUsers = users.filter(user => user.id !== currentUser.uid);
      console.log(`\n🎯 구독 가능한 사용자 (${otherUsers.length}명):`);
      otherUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.nickname} (${user.id})`);
      });
      
      return { currentUser: currentUser.uid, allUsers: users, otherUsers };
      
    } catch (error) {
      console.error('❌ 사용자 목록 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 특정 사용자 정보 상세 조회
   */
  async getUserDetails(userId) {
    console.log(`👤 사용자 상세 정보 조회: ${userId}`);
    
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        console.error(`❌ 사용자 ${userId}를 찾을 수 없습니다.`);
        return null;
      }
      
      const userData = userDoc.data();
      console.log('📋 사용자 정보:');
      console.log(`  - ID: ${userId}`);
      console.log(`  - 닉네임: ${userData.nickname || '없음'}`);
      console.log(`  - 이메일: ${userData.email || '없음'}`);
      console.log(`  - 이름: ${userData.name || '없음'}`);
      console.log(`  - 프로필 사진: ${userData.profilePictureUrl || '없음'}`);
      
      return { id: userId, ...userData };
      
    } catch (error) {
      console.error('❌ 사용자 정보 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 구독 테스트 실행 (실제 사용자 ID 사용)
   */
  async testFollowWithRealIds() {
    console.log('🧪 실제 사용자 ID로 구독 테스트...');
    
    try {
      // 1. 사용자 목록 표시
      const { currentUser, otherUsers } = await this.showAvailableUsers();
      
      if (otherUsers.length === 0) {
        console.log('❌ 구독할 수 있는 다른 사용자가 없습니다.');
        return;
      }
      
      // 2. 첫 번째 다른 사용자를 대상으로 구독 테스트
      const targetUser = otherUsers[0];
      console.log(`\n🎯 테스트 대상: ${targetUser.nickname} (${targetUser.id})`);
      
      // 3. 구독 실행
      console.log('📤 구독 실행 중...');
      const result = await subscribeUser(currentUser, targetUser.id);
      
      if (result) {
        console.log('✅ 구독 성공!');
        console.log('📱 알림 사이드바를 확인해보세요.');
        
        // 4. 구독자 정보 확인
        console.log('\n🔍 구독자 정보 확인:');
        await this.getUserDetails(currentUser);
        
        console.log('\n🔍 구독 대상 정보 확인:');
        await this.getUserDetails(targetUser.id);
        
      } else {
        console.log('❌ 구독 실패');
      }
      
    } catch (error) {
      console.error('❌ 구독 테스트 실패:', error);
      console.error('상세 오류:', error.message);
      
      if (error.message.includes('이미 구독 중')) {
        console.log('💡 이미 구독 중인 사용자입니다.');
      }
    }
  },

  /**
   * 특정 사용자 ID로 구독 테스트
   */
  async testFollowSpecificUser(targetUserId) {
    console.log(`🧪 특정 사용자 구독 테스트: ${targetUserId}`);
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('❌ 로그인된 사용자가 없습니다.');
        return;
      }
      
      // 대상 사용자 정보 확인
      const targetUser = await this.getUserDetails(targetUserId);
      if (!targetUser) {
        return;
      }
      
      // 구독 실행
      console.log('📤 구독 실행 중...');
      const result = await subscribeUser(currentUser.uid, targetUserId);
      
      if (result) {
        console.log('✅ 구독 성공!');
        console.log('📱 알림 사이드바를 확인해보세요.');
      } else {
        console.log('❌ 구독 실패');
      }
      
    } catch (error) {
      console.error('❌ 구독 테스트 실패:', error);
      console.error('상세 오류:', error.message);
    }
  }
};

// 개발 환경에서 전역으로 사용할 수 있도록 설정
if (process.env.NODE_ENV === 'development') {
  window.quickFollowTest = quickFollowTest;
}


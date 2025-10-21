import { subscribeUser } from '../api/subscribe';
import { auth } from '../firebase';

/**
 * 구독 알림 테스트 유틸리티
 */
export const testFollowNotification = {
  
  /**
   * 구독 알림 테스트 실행
   */
  async testFollowNotificationFlow() {
    console.log('🧪 구독 알림 테스트 시작...');
    
    try {
      // 현재 로그인한 사용자 확인
      if (!auth.currentUser) {
        console.error('❌ 로그인된 사용자가 없습니다.');
        return;
      }
      
      const currentUserId = auth.currentUser.uid;
      console.log(`👤 현재 사용자 ID: ${currentUserId}`);
      
      // 테스트용 다른 사용자 ID (실제 사용자 ID로 변경 필요)
      const testTargetUserId = 'test-target-user-id'; // 실제 사용자 ID로 변경
      
      console.log(`🎯 테스트 대상 사용자 ID: ${testTargetUserId}`);
      console.log('⚠️ 실제 사용자 ID로 변경 후 테스트하세요!');
      
      // 구독 실행
      console.log('📤 구독 실행 중...');
      const result = await subscribeUser(currentUserId, testTargetUserId);
      
      if (result) {
        console.log('✅ 구독 성공! 알림이 생성되었는지 확인하세요.');
      } else {
        console.log('❌ 구독 실패');
      }
      
    } catch (error) {
      console.error('❌ 구독 알림 테스트 실패:', error);
      console.error('상세 오류:', error.message);
    }
  },

  /**
   * 실제 사용자 ID로 구독 테스트
   */
  async testWithRealUserIds(followerId, followingId) {
    console.log('🧪 실제 사용자 ID로 구독 알림 테스트...');
    console.log(`👤 구독자 ID: ${followerId}`);
    console.log(`🎯 구독 대상 ID: ${followingId}`);
    
    try {
      const result = await subscribeUser(followerId, followingId);
      
      if (result) {
        console.log('✅ 구독 성공! 알림이 생성되었는지 확인하세요.');
        console.log('📱 알림 사이드바를 확인해보세요.');
      } else {
        console.log('❌ 구독 실패');
      }
      
    } catch (error) {
      console.error('❌ 구독 알림 테스트 실패:', error);
      console.error('상세 오류:', error.message);
      
      if (error.message.includes('이미 구독 중')) {
        console.log('💡 이미 구독 중인 사용자입니다. 구독 취소 후 다시 시도하세요.');
      }
    }
  },

  /**
   * 구독 취소 테스트
   */
  async testUnsubscribe(followerId, followingId) {
    console.log('🧪 구독 취소 테스트...');
    
    try {
      const { unsubscribeUser } = await import('../api/subscribe');
      const result = await unsubscribeUser(followerId, followingId);
      
      if (result) {
        console.log('✅ 구독 취소 성공!');
      } else {
        console.log('❌ 구독 취소 실패');
      }
      
    } catch (error) {
      console.error('❌ 구독 취소 테스트 실패:', error);
    }
  }
};

// 개발 환경에서 전역으로 사용할 수 있도록 설정
if (process.env.NODE_ENV === 'development') {
  window.testFollowNotification = testFollowNotification;
}


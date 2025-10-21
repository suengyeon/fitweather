import { unsubscribeUser } from '../api/subscribe';
import { auth } from '../firebase';

/**
 * 구독 취소 도우미 유틸리티
 */
export const unsubscribeHelper = {
  
  /**
   * 현재 사용자의 모든 구독 관계 확인
   */
  async showMySubscriptions() {
    console.log('👥 내 구독 목록 조회 중...');
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('❌ 로그인된 사용자가 없습니다.');
        return;
      }
      
      const { db } = await import('../firebase');
      const { collection, getDocs, query, where, doc, getDoc } = await import('firebase/firestore');
      
      // 내가 구독한 사용자들 조회
      const subscriptionsQuery = query(
        collection(db, 'follows'),
        where('followerId', '==', currentUser.uid)
      );
      
      const subscriptionsSnapshot = await getDocs(subscriptionsQuery);
      const subscriptions = [];
      
      for (const docSnapshot of subscriptionsSnapshot.docs) {
        const followData = docSnapshot.data();
        const followingUserDoc = await getDoc(doc(db, 'users', followData.followingId));
        
        if (followingUserDoc.exists()) {
          const userData = followingUserDoc.data();
          subscriptions.push({
            followId: docSnapshot.id,
            userId: followData.followingId,
            nickname: userData.nickname || '닉네임 없음',
            createdAt: followData.createdAt
          });
        }
      }
      
      console.log(`📋 내가 구독한 사용자 (${subscriptions.length}명):`);
      subscriptions.forEach((sub, index) => {
        console.log(`${index + 1}. ${sub.nickname} (${sub.userId})`);
      });
      
      return subscriptions;
      
    } catch (error) {
      console.error('❌ 구독 목록 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 특정 사용자 구독 취소
   */
  async unsubscribeFromUser(targetUserId) {
    console.log(`🚫 구독 취소: ${targetUserId}`);
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('❌ 로그인된 사용자가 없습니다.');
        return;
      }
      
      const result = await unsubscribeUser(currentUser.uid, targetUserId);
      
      if (result) {
        console.log('✅ 구독 취소 성공!');
      } else {
        console.log('❌ 구독 취소 실패');
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ 구독 취소 실패:', error);
      console.error('상세 오류:', error.message);
      throw error;
    }
  },

  /**
   * 모든 구독 취소 (테스트용)
   */
  async unsubscribeFromAll() {
    console.log('🚫 모든 구독 취소 중...');
    
    try {
      const subscriptions = await this.showMySubscriptions();
      
      if (subscriptions.length === 0) {
        console.log('📭 구독한 사용자가 없습니다.');
        return;
      }
      
      let successCount = 0;
      
      for (const subscription of subscriptions) {
        try {
          await this.unsubscribeFromUser(subscription.userId);
          successCount++;
        } catch (error) {
          console.error(`❌ ${subscription.nickname} 구독 취소 실패:`, error.message);
        }
      }
      
      console.log(`✅ ${successCount}/${subscriptions.length}명 구독 취소 완료`);
      
    } catch (error) {
      console.error('❌ 전체 구독 취소 실패:', error);
    }
  },

  /**
   * 테스트로 생성된 구독 취소 (63빌딩)
   */
  async cancelTestSubscription() {
    console.log('🧪 테스트 구독 취소 중...');
    
    try {
      const result = await this.unsubscribeFromUser("6GBsh2YnreWRkQrAa1mSyHbksqm2");
      
      if (result) {
        console.log('✅ 테스트 구독 취소 완료!');
        console.log('📱 알림도 함께 삭제되었습니다.');
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ 테스트 구독 취소 실패:', error);
    }
  }
};

// 개발 환경에서 전역으로 사용할 수 있도록 설정
if (process.env.NODE_ENV === 'development') {
  window.unsubscribeHelper = unsubscribeHelper;
}


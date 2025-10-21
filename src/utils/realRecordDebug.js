import { db } from '../firebase';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { auth } from '../firebase';

/**
 * 실제 기록 저장 디버깅 유틸리티
 */
export const realRecordDebug = {
  
  /**
   * 최근 기록들 확인 (실제 저장된 기록)
   */
  async checkRecentRecords() {
    console.log('📝 최근 기록들 확인 중...');
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('❌ 로그인된 사용자가 없습니다.');
        return;
      }
      
      // 최근 10개 기록 조회 (인덱스 없이 단순 쿼리)
      const recordsQuery = query(
        collection(db, 'outfits'),
        where('uid', '==', currentUser.uid),
        limit(10)
      );
      
      const recordsSnapshot = await getDocs(recordsQuery);
      const records = [];
      
      recordsSnapshot.forEach(doc => {
        const data = doc.data();
        records.push({
          id: doc.id,
          date: data.date,
          isPublic: data.isPublic,
          createdAt: data.createdAt,
          region: data.region,
          feeling: data.feeling
        });
      });
      
      console.log(`📝 최근 ${records.length}개 기록:`);
      records.forEach((record, index) => {
        const time = record.createdAt ? 
          (record.createdAt.toDate ? record.createdAt.toDate().toLocaleString() : new Date(record.createdAt).toLocaleString()) 
          : '시간 없음';
        const visibility = record.isPublic ? '🌐 공개' : '🔒 비공개';
        console.log(`  ${index + 1}. ${visibility} - ${record.region} (${time})`);
      });
      
      // 공개 기록 통계
      const publicRecords = records.filter(record => record.isPublic);
      const privateRecords = records.filter(record => !record.isPublic);
      
      console.log(`\n📊 통계:`);
      console.log(`  🌐 공개 기록: ${publicRecords.length}개`);
      console.log(`  🔒 비공개 기록: ${privateRecords.length}개`);
      
      return records;
      
    } catch (error) {
      console.error('❌ 최근 기록 확인 실패:', error);
      throw error;
    }
  },

  /**
   * 특정 기록의 알림 전송 상태 확인
   */
  async checkRecordNotificationStatus(recordId) {
    console.log(`🔍 기록 ${recordId}의 알림 상태 확인 중...`);
    
    try {
      // 해당 기록의 정보 조회
      const { doc, getDoc } = await import('firebase/firestore');
      const recordDoc = await getDoc(doc(db, 'outfits', recordId));
      
      if (!recordDoc.exists()) {
        console.error(`❌ 기록 ${recordId}를 찾을 수 없습니다.`);
        return;
      }
      
      const recordData = recordDoc.data();
      console.log(`📝 기록 정보:`);
      console.log(`  - ID: ${recordId}`);
      console.log(`  - 작성자: ${recordData.uid}`);
      console.log(`  - 공개 여부: ${recordData.isPublic ? '🌐 공개' : '🔒 비공개'}`);
      console.log(`  - 생성 시간: ${recordData.createdAt ? recordData.createdAt.toDate().toLocaleString() : '없음'}`);
      
      if (!recordData.isPublic) {
        console.log(`⚠️ 비공개 기록이므로 알림이 전송되지 않았습니다.`);
        return;
      }
      
      // 해당 기록 작성자의 구독자들 조회
      const { collection, getDocs, query, where } = await import('firebase/firestore');
      const followersQuery = query(
        collection(db, 'follows'),
        where('followingId', '==', recordData.uid)
      );
      
      const followersSnapshot = await getDocs(followersQuery);
      const followers = [];
      
      followersSnapshot.forEach(doc => {
        followers.push(doc.data().followerId);
      });
      
      console.log(`👥 구독자 수: ${followers.length}명`);
      followers.forEach((followerId, index) => {
        console.log(`  ${index + 1}. ${followerId}`);
      });
      
      // 구독자들의 알림 확인
      if (followers.length > 0) {
        console.log(`\n📱 구독자들의 알림 확인 중...`);
        
        for (const followerId of followers) {
          const notificationsQuery = query(
            collection(db, 'notifications'),
            where('recipient', '==', followerId),
            where('type', '==', 'new_post_from_following')
          );
          
          const notificationsSnapshot = await getDocs(notificationsQuery);
          const notifications = [];
          
          notificationsSnapshot.forEach(doc => {
            const data = doc.data();
            notifications.push({
              id: doc.id,
              sender: data.sender,
              createdAt: data.createdAt
            });
          });
          
          console.log(`👤 ${followerId}의 새 기록 알림: ${notifications.length}개`);
          notifications.forEach((noti, index) => {
            const time = noti.createdAt ? 
              (noti.createdAt.toDate ? noti.createdAt.toDate().toLocaleString() : new Date(noti.createdAt).toLocaleString()) 
              : '시간 없음';
            console.log(`  ${index + 1}. ${noti.sender?.nickname || '알 수 없음'} - ${time}`);
          });
        }
      }
      
    } catch (error) {
      console.error('❌ 기록 알림 상태 확인 실패:', error);
      throw error;
    }
  },

  /**
   * 실제 기록 저장 모니터링
   */
  async monitorRecordSaving() {
    console.log('👀 기록 저장 모니터링 시작...');
    console.log('💡 이제 실제로 기록을 저장해보세요!');
    console.log('📝 기록 저장 시 콘솔에서 다음 로그들을 확인하세요:');
    console.log('  1. "📢 공개 기록이므로 구독자들에게 알림 전송 시작..."');
    console.log('  2. "📢 X명의 구독자에게 새 기록 알림 전송 완료"');
    console.log('  3. 또는 오류 메시지들');
    console.log('\n🔍 기록 저장 후 다음 명령어로 확인하세요:');
    console.log('  window.realRecordDebug.checkRecentRecords()');
  }
};

// 개발 환경에서 전역으로 사용할 수 있도록 설정
if (process.env.NODE_ENV === 'development') {
  window.realRecordDebug = realRecordDebug;
}

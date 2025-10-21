import { db } from '../firebase';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { auth } from '../firebase';

/**
 * 추천 시스템 디버깅 유틸리티
 */
export const debugRecommendations = {
  
  /**
   * 모든 공개 기록 확인
   */
  async checkAllPublicRecords() {
    console.log('📝 모든 공개 기록 확인 중...');
    
    try {
      // 모든 공개 기록 조회
      const publicRecordsQuery = query(
        collection(db, 'outfits'),
        where('isPublic', '==', true)
      );
      
      const publicRecordsSnapshot = await getDocs(publicRecordsQuery);
      const publicRecords = [];
      
      publicRecordsSnapshot.forEach(doc => {
        const data = doc.data();
        publicRecords.push({
          id: doc.id,
          uid: data.uid,
          region: data.region,
          date: data.date,
          temp: data.temp,
          createdAt: data.createdAt,
          isPublic: data.isPublic
        });
      });
      
      console.log(`📝 총 ${publicRecords.length}개의 공개 기록:`);
      
      if (publicRecords.length === 0) {
        console.log('❌ 공개 기록이 없습니다!');
        return [];
      }
      
      // 최신순으로 정렬
      publicRecords.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          const aTime = a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const bTime = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return bTime - aTime;
        }
        return 0;
      });
      
      publicRecords.forEach((record, index) => {
        const time = record.createdAt ? 
          (record.createdAt.toDate ? record.createdAt.toDate().toLocaleString() : new Date(record.createdAt).toLocaleString()) 
          : '시간 없음';
        console.log(`  ${index + 1}. ${record.region} - ${record.temp}°C (${time})`);
      });
      
      return publicRecords;
      
    } catch (error) {
      console.error('❌ 공개 기록 확인 실패:', error);
      throw error;
    }
  },

  /**
   * 특정 지역의 공개 기록 확인
   */
  async checkPublicRecordsByRegion(region) {
    console.log(`📝 ${region} 지역의 공개 기록 확인 중...`);
    
    try {
      const regionRecordsQuery = query(
        collection(db, 'outfits'),
        where('isPublic', '==', true),
        where('region', '==', region)
      );
      
      const regionRecordsSnapshot = await getDocs(regionRecordsQuery);
      const regionRecords = [];
      
      regionRecordsSnapshot.forEach(doc => {
        const data = doc.data();
        regionRecords.push({
          id: doc.id,
          uid: data.uid,
          region: data.region,
          date: data.date,
          temp: data.temp,
          createdAt: data.createdAt
        });
      });
      
      console.log(`📝 ${region} 지역의 공개 기록: ${regionRecords.length}개`);
      
      regionRecords.forEach((record, index) => {
        const time = record.createdAt ? 
          (record.createdAt.toDate ? record.createdAt.toDate().toLocaleString() : new Date(record.createdAt).toLocaleString()) 
          : '시간 없음';
        console.log(`  ${index + 1}. ${record.temp}°C (${time})`);
      });
      
      return regionRecords;
      
    } catch (error) {
      console.error(`❌ ${region} 지역 기록 확인 실패:`, error);
      throw error;
    }
  },

  /**
   * 오늘 날짜의 공개 기록 확인
   */
  async checkTodayPublicRecords() {
    console.log('📅 오늘 날짜의 공개 기록 확인 중...');
    
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 형식
      console.log(`📅 오늘 날짜: ${today}`);
      
      // 모든 공개 기록 조회 후 오늘 날짜 필터링
      const allPublicRecords = await this.checkAllPublicRecords();
      
      const todayRecords = allPublicRecords.filter(record => {
        if (!record.date) return false;
        const recordDate = record.date.split('T')[0]; // YYYY-MM-DD 형식으로 변환
        return recordDate === today;
      });
      
      console.log(`📅 오늘 날짜의 공개 기록: ${todayRecords.length}개`);
      
      if (todayRecords.length === 0) {
        console.log('❌ 오늘 날짜의 공개 기록이 없습니다!');
        console.log('💡 다른 날짜의 기록들이 있는지 확인해보세요.');
      } else {
        todayRecords.forEach((record, index) => {
          const time = record.createdAt ? 
            (record.createdAt.toDate ? record.createdAt.toDate().toLocaleString() : new Date(record.createdAt).toLocaleString()) 
            : '시간 없음';
          console.log(`  ${index + 1}. ${record.region} - ${record.temp}°C (${time})`);
        });
      }
      
      return todayRecords;
      
    } catch (error) {
      console.error('❌ 오늘 날짜 기록 확인 실패:', error);
      throw error;
    }
  },

  /**
   * 추천 시스템 전체 진단
   */
  async diagnoseRecommendationSystem() {
    console.log('🔍 추천 시스템 전체 진단 시작...');
    console.log('=====================================');
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('❌ 로그인된 사용자가 없습니다.');
        return;
      }
      
      // 사용자 정보 확인
      const { doc, getDoc } = await import('firebase/firestore');
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      
      if (!userDoc.exists()) {
        console.error('❌ 사용자 정보를 찾을 수 없습니다.');
        return;
      }
      
      const userData = userDoc.data();
      console.log(`👤 현재 사용자: ${userData.nickname} (${userData.region})`);
      
      // 1. 모든 공개 기록 확인
      console.log('\n1️⃣ 모든 공개 기록 확인...');
      const allPublicRecords = await this.checkAllPublicRecords();
      
      // 2. 현재 사용자 지역의 공개 기록 확인
      console.log(`\n2️⃣ ${userData.region} 지역의 공개 기록 확인...`);
      const regionRecords = await this.checkPublicRecordsByRegion(userData.region);
      
      // 3. 오늘 날짜의 공개 기록 확인
      console.log('\n3️⃣ 오늘 날짜의 공개 기록 확인...');
      const todayRecords = await this.checkTodayPublicRecords();
      
      // 4. 진단 결과
      console.log('\n📊 진단 결과:');
      console.log('=====================================');
      console.log(`📝 전체 공개 기록: ${allPublicRecords.length}개`);
      console.log(`🌍 ${userData.region} 지역 기록: ${regionRecords.length}개`);
      console.log(`📅 오늘 날짜 기록: ${todayRecords.length}개`);
      
      if (allPublicRecords.length === 0) {
        console.log('\n❌ 문제: 공개 기록이 전혀 없습니다!');
        console.log('💡 해결방법: 사용자들이 공개 기록을 올려야 합니다.');
      } else if (regionRecords.length === 0) {
        console.log(`\n❌ 문제: ${userData.region} 지역의 공개 기록이 없습니다!`);
        console.log('💡 해결방법: 해당 지역 사용자들이 공개 기록을 올려야 합니다.');
      } else if (todayRecords.length === 0) {
        console.log('\n❌ 문제: 오늘 날짜의 공개 기록이 없습니다!');
        console.log('💡 해결방법: 오늘 공개 기록을 올려야 합니다.');
      } else {
        console.log('\n✅ 추천 시스템에 필요한 데이터가 있습니다!');
        console.log('💡 UI나 로직에 문제가 있을 수 있습니다.');
      }
      
      return {
        allPublicRecords,
        regionRecords,
        todayRecords,
        userRegion: userData.region
      };
      
    } catch (error) {
      console.error('❌ 추천 시스템 진단 실패:', error);
      throw error;
    }
  }
};

// 개발 환경에서 전역으로 사용할 수 있도록 설정
if (process.env.NODE_ENV === 'development') {
  window.debugRecommendations = debugRecommendations;
}


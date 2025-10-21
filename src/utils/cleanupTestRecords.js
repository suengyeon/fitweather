import { db } from '../firebase';
import { collection, getDocs, query, where, doc, deleteDoc } from 'firebase/firestore';
import { auth } from '../firebase';

/**
 * 테스트 기록 정리 유틸리티
 */
export const cleanupTestRecords = {
  
  /**
   * 테스트 기록 식별 및 삭제
   */
  async deleteTestRecords() {
    console.log('🗑️ 테스트 기록 정리 시작...');
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('❌ 로그인된 사용자가 없습니다.');
        return;
      }
      
      console.log(`👤 현재 사용자: ${currentUser.uid}`);
      
      // 현재 사용자의 모든 기록 조회
      const recordsQuery = query(
        collection(db, 'outfits'),
        where('uid', '==', currentUser.uid)
      );
      
      const recordsSnapshot = await getDocs(recordsQuery);
      const records = [];
      
      recordsSnapshot.forEach(doc => {
        const data = doc.data();
        records.push({
          id: doc.id,
          region: data.region,
          date: data.date,
          temp: data.temp,
          isPublic: data.isPublic,
          createdAt: data.createdAt,
          // 테스트 기록 식별을 위한 필드들
          weather: data.weather,
          outfit: data.outfit,
          feeling: data.feeling
        });
      });
      
      console.log(`📝 현재 사용자의 기록: ${records.length}개`);
      
      if (records.length === 0) {
        console.log('📭 삭제할 기록이 없습니다.');
        return;
      }
      
      // 테스트 기록 식별 (특정 패턴으로 식별)
      const testRecords = records.filter(record => {
        // 테스트 기록 식별 조건들
        const isTestWeather = record.weather === '맑음' && record.temp === 25;
        const isTestRegion = record.region === 'Seoul';
        const isTestOutfit = record.outfit && 
          record.outfit.top && 
          record.outfit.top.includes('반팔티') &&
          record.outfit.bottom && 
          record.outfit.bottom.includes('반바지');
        const isTestFeeling = record.feeling === '👍';
        
        return isTestWeather || isTestRegion || isTestOutfit || isTestFeeling;
      });
      
      console.log(`🧪 테스트 기록으로 식별된 기록: ${testRecords.length}개`);
      
      if (testRecords.length === 0) {
        console.log('✅ 테스트 기록이 없습니다.');
        return;
      }
      
      // 테스트 기록 상세 정보 표시
      testRecords.forEach((record, index) => {
        const time = record.createdAt ? 
          (record.createdAt.toDate ? record.createdAt.toDate().toLocaleString() : new Date(record.createdAt).toLocaleString()) 
          : '시간 없음';
        console.log(`\n${index + 1}. 테스트 기록 ID: ${record.id}`);
        console.log(`   📅 시간: ${time}`);
        console.log(`   🌍 지역: ${record.region}`);
        console.log(`   🌡️ 온도: ${record.temp}°C`);
        console.log(`   🌤️ 날씨: ${record.weather}`);
        console.log(`   ${record.isPublic ? '🌐 공개' : '🔒 비공개'}`);
      });
      
      // 삭제 확인
      console.log(`\n🗑️ ${testRecords.length}개의 테스트 기록을 삭제하시겠습니까?`);
      console.log('💡 이 작업은 되돌릴 수 없습니다!');
      
      // 자동 삭제 (개발 환경에서만)
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 개발 환경에서 자동 삭제를 시작합니다...');
        
        let deletedCount = 0;
        for (const record of testRecords) {
          try {
            await deleteDoc(doc(db, 'outfits', record.id));
            console.log(`✅ 삭제 완료: ${record.id}`);
            deletedCount++;
          } catch (error) {
            console.error(`❌ 삭제 실패: ${record.id}`, error);
          }
        }
        
        console.log(`\n🎉 테스트 기록 정리 완료!`);
        console.log(`📊 삭제된 기록: ${deletedCount}/${testRecords.length}개`);
        
        return { deleted: deletedCount, total: testRecords.length };
      } else {
        console.log('⚠️ 프로덕션 환경에서는 수동으로 삭제해야 합니다.');
        return { deleted: 0, total: testRecords.length };
      }
      
    } catch (error) {
      console.error('❌ 테스트 기록 정리 실패:', error);
      throw error;
    }
  },

  /**
   * 모든 테스트 기록 삭제 (강제)
   */
  async deleteAllTestRecords() {
    console.log('🗑️ 모든 테스트 기록 강제 삭제 시작...');
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('❌ 로그인된 사용자가 없습니다.');
        return;
      }
      
      // 현재 사용자의 모든 기록 조회
      const recordsQuery = query(
        collection(db, 'outfits'),
        where('uid', '==', currentUser.uid)
      );
      
      const recordsSnapshot = await getDocs(recordsQuery);
      const records = [];
      
      recordsSnapshot.forEach(doc => {
        const data = doc.data();
        records.push({
          id: doc.id,
          region: data.region,
          date: data.date,
          temp: data.temp,
          isPublic: data.isPublic,
          createdAt: data.createdAt
        });
      });
      
      console.log(`📝 현재 사용자의 모든 기록: ${records.length}개`);
      
      if (records.length === 0) {
        console.log('📭 삭제할 기록이 없습니다.');
        return;
      }
      
      // 모든 기록 삭제
      console.log('🚀 모든 기록을 삭제합니다...');
      
      let deletedCount = 0;
      for (const record of records) {
        try {
          await deleteDoc(doc(db, 'outfits', record.id));
          console.log(`✅ 삭제 완료: ${record.id}`);
          deletedCount++;
        } catch (error) {
          console.error(`❌ 삭제 실패: ${record.id}`, error);
        }
      }
      
      console.log(`\n🎉 모든 기록 삭제 완료!`);
      console.log(`📊 삭제된 기록: ${deletedCount}/${records.length}개`);
      
      return { deleted: deletedCount, total: records.length };
      
    } catch (error) {
      console.error('❌ 모든 기록 삭제 실패:', error);
      throw error;
    }
  },

  /**
   * 특정 기록 삭제
   */
  async deleteSpecificRecord(recordId) {
    console.log(`🗑️ 특정 기록 삭제: ${recordId}`);
    
    try {
      await deleteDoc(doc(db, 'outfits', recordId));
      console.log(`✅ 기록 삭제 완료: ${recordId}`);
      return true;
    } catch (error) {
      console.error(`❌ 기록 삭제 실패: ${recordId}`, error);
      throw error;
    }
  }
};

// 개발 환경에서 전역으로 사용할 수 있도록 설정
if (process.env.NODE_ENV === 'development') {
  window.cleanupTestRecords = cleanupTestRecords;
}


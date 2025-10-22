import { db } from '../firebase';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { auth } from '../firebase';

/**
 * 기록의 사용자 정보 확인 유틸리티
 */
export const checkRecordUserInfo = {
  
  /**
   * 모든 기록의 사용자 정보 필드 확인
   */
  async checkAllRecordsUserInfo() {
    console.log('👤 모든 기록의 사용자 정보 확인 중...');
    
    try {
      // 모든 기록 조회
      const recordsSnapshot = await getDocs(collection(db, 'outfits'));
      const records = [];
      
      recordsSnapshot.forEach(doc => {
        const data = doc.data();
        records.push({
          id: doc.id,
          uid: data.uid,
          region: data.region,
          date: data.date,
          temp: data.temp,
          isPublic: data.isPublic,
          createdAt: data.createdAt,
          // 사용자 정보 필드들
          name: data.name,
          nickname: data.nickname,
          userName: data.userName,
          userNickname: data.userNickname,
          authorName: data.authorName,
          authorNickname: data.authorNickname,
          // 모든 필드 확인
          allFields: Object.keys(data)
        });
      });
      
      console.log(`📝 총 ${records.length}개의 기록:`);
      
      if (records.length === 0) {
        console.log('❌ 기록이 없습니다.');
        return [];
      }
      
      // 최신순으로 정렬
      records.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          const aTime = a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const bTime = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return bTime - aTime;
        }
        return 0;
      });
      
      records.forEach((record, index) => {
        const time = record.createdAt ? 
          (record.createdAt.toDate ? record.createdAt.toDate().toLocaleString() : new Date(record.createdAt).toLocaleString()) 
          : '시간 없음';
        const visibility = record.isPublic ? '🌐 공개' : '🔒 비공개';
        
        console.log(`\n${index + 1}. 기록 ID: ${record.id}`);
        console.log(`   📅 시간: ${time}`);
        console.log(`   👤 작성자 UID: ${record.uid}`);
        console.log(`   🌍 지역: ${record.region}`);
        console.log(`   🌡️ 온도: ${record.temp}°C`);
        console.log(`   ${visibility}`);
        
        // 사용자 정보 필드들 확인
        console.log(`   📋 사용자 정보 필드들:`);
        console.log(`     - name: ${record.name || '없음'}`);
        console.log(`     - nickname: ${record.nickname || '없음'}`);
        console.log(`     - userName: ${record.userName || '없음'}`);
        console.log(`     - userNickname: ${record.userNickname || '없음'}`);
        console.log(`     - authorName: ${record.authorName || '없음'}`);
        console.log(`     - authorNickname: ${record.authorNickname || '없음'}`);
        
        // 모든 필드 표시
        console.log(`   📝 모든 필드: ${record.allFields.join(', ')}`);
      });
      
      return records;
      
    } catch (error) {
      console.error('❌ 기록 사용자 정보 확인 실패:', error);
      throw error;
    }
  },

  /**
   * 특정 기록의 상세 정보 확인
   */
  async checkRecordDetails(recordId) {
    console.log(`🔍 기록 ${recordId}의 상세 정보 확인 중...`);
    
    try {
      const recordDoc = await getDoc(doc(db, 'outfits', recordId));
      
      if (!recordDoc.exists()) {
        console.error(`❌ 기록 ${recordId}를 찾을 수 없습니다.`);
        return null;
      }
      
      const data = recordDoc.data();
      console.log(`📝 기록 ${recordId}의 모든 데이터:`);
      console.log(JSON.stringify(data, null, 2));
      
      return data;
      
    } catch (error) {
      console.error('❌ 기록 상세 정보 확인 실패:', error);
      throw error;
    }
  },

  /**
   * 사용자 정보가 포함된 기록 찾기
   */
  async findRecordsWithUserInfo() {
    console.log('🔍 사용자 정보가 포함된 기록 찾기...');
    
    try {
      const allRecords = await this.checkAllRecordsUserInfo();
      
      const recordsWithUserInfo = allRecords.filter(record => {
        return record.name || record.nickname || record.userName || 
               record.userNickname || record.authorName || record.authorNickname;
      });
      
      console.log(`\n📊 사용자 정보가 포함된 기록: ${recordsWithUserInfo.length}개`);
      
      if (recordsWithUserInfo.length > 0) {
        console.log('✅ 사용자 정보가 포함된 기록들:');
        recordsWithUserInfo.forEach((record, index) => {
          console.log(`  ${index + 1}. ${record.id} - ${record.name || record.nickname || record.userName || record.userNickname || '이름 없음'}`);
        });
      } else {
        console.log('❌ 사용자 정보가 포함된 기록이 없습니다.');
      }
      
      return recordsWithUserInfo;
      
    } catch (error) {
      console.error('❌ 사용자 정보 포함 기록 찾기 실패:', error);
      throw error;
    }
  }
};

// 개발 환경에서 전역으로 사용할 수 있도록 설정
if (process.env.NODE_ENV === 'development') {
  window.checkRecordUserInfo = checkRecordUserInfo;
}



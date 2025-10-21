import { db } from '../firebase';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { auth } from '../firebase';

/**
 * 기록 데이터 디버깅 유틸리티
 */
export const debugRecordData = {
  
  /**
   * 모든 기록의 데이터 구조 확인
   */
  async checkAllRecordsDataStructure() {
    console.log('📝 모든 기록의 데이터 구조 확인 중...');
    
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
          // 사용자 정보 확인을 위한 필드들
          userNickname: data.userNickname,
          userName: data.userName,
          nickname: data.nickname,
          name: data.name
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
        console.log(`   👤 작성자: ${record.uid}`);
        console.log(`   🌍 지역: ${record.region}`);
        console.log(`   🌡️ 온도: ${record.temp}°C`);
        console.log(`   ${visibility}`);
        
        // 사용자 정보 필드들 확인
        console.log(`   📋 사용자 정보 필드들:`);
        console.log(`     - userNickname: ${record.userNickname || '없음'}`);
        console.log(`     - userName: ${record.userName || '없음'}`);
        console.log(`     - nickname: ${record.nickname || '없음'}`);
        console.log(`     - name: ${record.name || '없음'}`);
      });
      
      return records;
      
    } catch (error) {
      console.error('❌ 기록 데이터 구조 확인 실패:', error);
      throw error;
    }
  },

  /**
   * 특정 사용자의 기록과 사용자 정보 비교
   */
  async compareUserDataWithRecords(userId) {
    console.log(`👤 사용자 ${userId}의 데이터와 기록 비교 중...`);
    
    try {
      // 사용자 정보 조회
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        console.error(`❌ 사용자 ${userId}를 찾을 수 없습니다.`);
        return;
      }
      
      const userData = userDoc.data();
      console.log(`👤 사용자 정보:`);
      console.log(`  - ID: ${userId}`);
      console.log(`  - nickname: ${userData.nickname || '없음'}`);
      console.log(`  - name: ${userData.name || '없음'}`);
      console.log(`  - email: ${userData.email || '없음'}`);
      console.log(`  - region: ${userData.region || '없음'}`);
      
      // 해당 사용자의 기록들 조회
      const recordsQuery = query(
        collection(db, 'outfits'),
        where('uid', '==', userId)
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
          userNickname: data.userNickname,
          userName: data.userName,
          nickname: data.nickname,
          name: data.name
        });
      });
      
      console.log(`\n📝 해당 사용자의 기록 (${records.length}개):`);
      
      if (records.length === 0) {
        console.log('  📭 기록이 없습니다.');
        return;
      }
      
      records.forEach((record, index) => {
        const time = record.createdAt ? 
          (record.createdAt.toDate ? record.createdAt.toDate().toLocaleString() : new Date(record.createdAt).toLocaleString()) 
          : '시간 없음';
        
        console.log(`\n  ${index + 1}. 기록 ID: ${record.id}`);
        console.log(`     📅 시간: ${time}`);
        console.log(`     🌍 지역: ${record.region}`);
        console.log(`     🌡️ 온도: ${record.temp}°C`);
        console.log(`     ${record.isPublic ? '🌐 공개' : '🔒 비공개'}`);
        
        // 사용자 정보 불일치 확인
        const mismatches = [];
        if (record.userNickname && record.userNickname !== userData.nickname) {
          mismatches.push(`userNickname: "${record.userNickname}" vs "${userData.nickname}"`);
        }
        if (record.userName && record.userName !== userData.name) {
          mismatches.push(`userName: "${record.userName}" vs "${userData.name}"`);
        }
        if (record.nickname && record.nickname !== userData.nickname) {
          mismatches.push(`nickname: "${record.nickname}" vs "${userData.nickname}"`);
        }
        if (record.name && record.name !== userData.name) {
          mismatches.push(`name: "${record.name}" vs "${userData.name}"`);
        }
        
        if (mismatches.length > 0) {
          console.log(`     ⚠️ 데이터 불일치:`);
          mismatches.forEach(mismatch => {
            console.log(`       - ${mismatch}`);
          });
        } else {
          console.log(`     ✅ 사용자 정보 일치`);
        }
      });
      
      return { userData, records };
      
    } catch (error) {
      console.error('❌ 사용자 데이터와 기록 비교 실패:', error);
      throw error;
    }
  },

  /**
   * 현재 사용자의 기록 데이터 확인
   */
  async checkCurrentUserRecords() {
    console.log('👤 현재 사용자의 기록 데이터 확인 중...');
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('❌ 로그인된 사용자가 없습니다.');
        return;
      }
      
      return await this.compareUserDataWithRecords(currentUser.uid);
      
    } catch (error) {
      console.error('❌ 현재 사용자 기록 확인 실패:', error);
      throw error;
    }
  },

  /**
   * 기록 데이터 문제 진단
   */
  async diagnoseRecordDataIssues() {
    console.log('🔍 기록 데이터 문제 진단 시작...');
    console.log('=====================================');
    
    try {
      // 1. 모든 기록의 데이터 구조 확인
      console.log('1️⃣ 모든 기록의 데이터 구조 확인...');
      const allRecords = await this.checkAllRecordsDataStructure();
      
      // 2. 현재 사용자의 기록 확인
      console.log('\n2️⃣ 현재 사용자의 기록 확인...');
      const currentUserData = await this.checkCurrentUserRecords();
      
      // 3. 문제점 분석
      console.log('\n3️⃣ 문제점 분석...');
      
      const issues = [];
      
      // 온도 데이터 문제 확인
      const tempIssues = allRecords.filter(record => record.temp === undefined);
      if (tempIssues.length > 0) {
        issues.push(`온도 데이터 누락: ${tempIssues.length}개`);
      }
      
      // 지역 데이터 문제 확인
      const regionIssues = allRecords.filter(record => !record.region);
      if (regionIssues.length > 0) {
        issues.push(`지역 데이터 누락: ${regionIssues.length}개`);
      }
      
      // 공개 설정 문제 확인
      const publicIssues = allRecords.filter(record => record.isPublic === undefined);
      if (publicIssues.length > 0) {
        issues.push(`공개 설정 누락: ${publicIssues.length}개`);
      }
      
      console.log('\n📊 진단 결과:');
      console.log('=====================================');
      console.log(`📝 전체 기록: ${allRecords.length}개`);
      
      if (issues.length === 0) {
        console.log('✅ 기록 데이터에 문제가 없습니다.');
      } else {
        console.log('❌ 발견된 문제들:');
        issues.forEach(issue => {
          console.log(`  - ${issue}`);
        });
      }
      
      return {
        allRecords,
        currentUserData,
        issues
      };
      
    } catch (error) {
      console.error('❌ 기록 데이터 문제 진단 실패:', error);
      throw error;
    }
  }
};

// 개발 환경에서 전역으로 사용할 수 있도록 설정
if (process.env.NODE_ENV === 'development') {
  window.debugRecordData = debugRecordData;
}


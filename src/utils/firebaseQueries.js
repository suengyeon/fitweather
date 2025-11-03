/**
 * Firebase 쿼리 공통 유틸리티
 */
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase"; 

/**
 * 오늘 날짜 공개 기록 조회(outfits 컬렉션 기준)
 */
export async function getTodayPublicRecords(region = null, maxCount = 100) {
  try {
    const today = new Date();
    // 현재 날짜를 'YYYY-MM-DD' 형식의 문자열로 변환
    const todayStr = today.toISOString().split('T')[0];
    
    let q;
    
    // 1. 지역 조건 O
    if (region) {
      q = query(
        collection(db, "outfits"),
        where("region", "==", region), // 지역 필터
        where("date", "==", todayStr),  // 오늘 날짜 필터
        where("isPublic", "==", true), // 공개 기록 필터
        limit(maxCount)
      );
    } 
    // 2. 지역 조건 X(전체 지역)
    else {
      q = query(
        collection(db, "outfits"),
        where("date", "==", todayStr),  
        where("isPublic", "==", true), 
        limit(maxCount)
      );
    }
    
    const querySnapshot = await getDocs(q);
    const records = [];
    
    // 문서 ID와 데이터 합쳐 배열에 추가
    querySnapshot.forEach((doc) => {
      records.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return records;
  } catch (error) {
    console.error("오늘 공개 기록 조회 실패:", error);
    return [];
  }
}

/**
 * 모든 공개 기록 조회(outfits + records 컬렉션)
 */
export async function getAllPublicRecords(maxCount = 1000) {
  try {
    console.log("🔍 모든 공개 기록 조회 시작...");
    
    // 1. outfits 컬렉션에서 조회
    const outfitsQuery = query(
      collection(db, "outfits"),
      where("isPublic", "==", true),
      limit(maxCount)
    );
    
    const outfitsSnapshot = await getDocs(outfitsQuery);
    const outfitsRecords = [];
    
    outfitsSnapshot.forEach((doc) => {
      outfitsRecords.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log("📊 outfits 컬렉션:", outfitsRecords.length, "개");
    
    // 2. records 컬렉션에서 조회
    const recordsQuery = query(
      collection(db, "records"),
      where("isPublic", "==", true),
      limit(maxCount)
    );
    
    const recordsSnapshot = await getDocs(recordsQuery);
    const recordsRecords = [];
    
    recordsSnapshot.forEach((doc) => {
      recordsRecords.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log("📊 records 컬렉션:", recordsRecords.length, "개");
    
    // 3. 두 컬렉션 결과 합치기
    const allRecords = [...outfitsRecords, ...recordsRecords];
    console.log("📊 전체 합계:", allRecords.length, "개");
    
    return allRecords;
  } catch (error) {
    console.error("모든 공개 기록 조회 실패:", error);
    return [];
  }
}

/**
 * 특정 기록을 ID로 조회(outfits 컬렉션에서만 시도)
 */
export async function getRecordById(recordId) {
  try {
    const ref = doc(db, "outfits", recordId); // 'outfits' 컬렉션 문서 참조
    const snapshot = await getDoc(ref);
    
    if (snapshot.exists()) {
      return {
        id: snapshot.id,
        ...snapshot.data()
      };
    }
    
    return null;
  } catch (error) {
    console.error("기록 조회 실패:", error);
    return null;
  }
}

/**
 * 지역별 공개 기록 조회(outfits 컬렉션 기준)
 */
export async function getPublicRecordsByRegion(region, maxCount = 100) {
  try {
    const q = query(
      collection(db, "outfits"),
      where("region", "==", region),   
      where("isPublic", "==", true),  
      limit(maxCount)
    );
    
    const querySnapshot = await getDocs(q);
    const records = [];
    
    querySnapshot.forEach((doc) => {
      records.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return records;
  } catch (error) {
    console.error("지역별 공개 기록 조회 실패:", error);
    return [];
  }
}

/**
 * 사용자별 기록 조회(outfits 컬렉션 기준)
 */
export async function getRecordsByUser(userId, maxCount = 100) {
  try {
    const q = query(
      collection(db, "outfits"),
      where("uid", "==", userId),             // 사용자 ID 필터
      orderBy("createdAt", "desc"),          // 생성일 기준 내림차순 정렬
      limit(maxCount)
    );
    
    const querySnapshot = await getDocs(q);
    const records = [];
    
    querySnapshot.forEach((doc) => {
      records.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return records;
  } catch (error) {
    console.error("사용자별 기록 조회 실패:", error);
    return [];
  }
}
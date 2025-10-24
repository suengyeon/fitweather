/**
 * Firebase 쿼리 공통 유틸리티
 */

import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

/**
 * 오늘 날짜의 공개 기록 조회
 * @param {string} region - 지역 (선택사항)
 * @param {number} maxCount - 최대 개수
 * @returns {Promise<Array>} 기록 배열
 */
export async function getTodayPublicRecords(region = null, maxCount = 100) {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    let q;
    if (region) {
      q = query(
        collection(db, "outfits"),
        where("region", "==", region),
        where("date", "==", todayStr),
        where("isPublic", "==", true),
        limit(maxCount)
      );
    } else {
      q = query(
        collection(db, "outfits"),
        where("date", "==", todayStr),
        where("isPublic", "==", true),
        limit(maxCount)
      );
    }
    
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
    console.error("오늘 공개 기록 조회 실패:", error);
    return [];
  }
}

/**
 * 모든 공개 기록 조회 (outfits + records 컬렉션)
 * @param {number} maxCount - 최대 개수
 * @returns {Promise<Array>} 기록 배열
 */
export async function getAllPublicRecords(maxCount = 1000) {
  try {
    console.log("🔍 모든 공개 기록 조회 시작...");
    
    // outfits 컬렉션에서 조회
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
    
    // records 컬렉션에서도 조회
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
    
    // 두 컬렉션 결과 합치기
    const allRecords = [...outfitsRecords, ...recordsRecords];
    console.log("📊 전체 합계:", allRecords.length, "개");
    
    return allRecords;
  } catch (error) {
    console.error("모든 공개 기록 조회 실패:", error);
    return [];
  }
}

/**
 * 특정 기록 조회
 * @param {string} recordId - 기록 ID
 * @returns {Promise<Object|null>} 기록 데이터
 */
export async function getRecordById(recordId) {
  try {
    const ref = doc(db, "outfits", recordId);
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
 * 지역별 공개 기록 조회
 * @param {string} region - 지역
 * @param {number} maxCount - 최대 개수
 * @returns {Promise<Array>} 기록 배열
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
 * 사용자별 기록 조회
 * @param {string} userId - 사용자 ID
 * @param {number} maxCount - 최대 개수
 * @returns {Promise<Array>} 기록 배열
 */
export async function getRecordsByUser(userId, maxCount = 100) {
  try {
    const q = query(
      collection(db, "outfits"),
      where("uid", "==", userId),
      orderBy("createdAt", "desc"),
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

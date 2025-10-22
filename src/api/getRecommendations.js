import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";
import { sortRecords } from "../utils/sortingUtils";

/**
 * 추천 데이터를 가져오는 함수
 * @param {string} region - 지역
 * @param {number} limitCount - 가져올 개수 (기본값: 3)
 * @returns {Promise<Array>} 정렬된 추천 데이터 배열
 */
export async function getRecommendations(region, limitCount = 3) {
  try {
    // 오늘 날짜 계산
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    console.log("🔍 getRecommendations 요청:", { region, todayStr, limitCount });
    
    // 해당 지역의 오늘 기록들을 가져오기
    let q = query(
      collection(db, "outfits"),
      where("region", "==", region),
      where("date", "==", todayStr),
      where("isPublic", "==", true),
      limit(100) // 최대 100개까지 가져오기
    );
    
    let querySnapshot = await getDocs(q);
    let records = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      records.push({
        id: doc.id,
        ...data
      });
    });
    
    console.log("📊 지역 일치 오늘 기록:", records.length, "개");
    
    // 지역 일치 기록이 없으면 모든 오늘 기록에서 추천
    if (records.length === 0) {
      console.log("지역 일치 기록 없음, 모든 오늘 기록에서 추천");
      q = query(
        collection(db, "outfits"),
        where("date", "==", todayStr),
        where("isPublic", "==", true),
        limit(100)
      );
      
      querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        records.push({
          id: doc.id,
          ...data
        });
      });
      
      console.log("📊 전체 오늘 기록:", records.length, "개");
    }
    
    console.log("📋 최종 레코드:", records.length, "개");
    
    // 오늘 기록이 없으면 과거 기록에서 추천
    if (records.length === 0) {
      console.log("오늘 기록 없음, 과거 기록에서 추천");
      
      // 인덱스 없이도 작동하도록 단순한 쿼리 사용
      q = query(
        collection(db, "outfits"),
        where("isPublic", "==", true),
        limit(100)
      );
      
      querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        records.push({
          id: doc.id,
          ...data
        });
      });
      
      console.log("📊 과거 기록:", records.length, "개");
    }
    
    // 정렬 유틸리티 사용
    const sortedRecords = sortRecords(records, "popular");
    
    console.log("🏆 정렬 후 상위 3개:", sortedRecords.slice(0, limitCount).map(r => ({ 
      id: r.id, 
      likes: r.likes?.length, 
      outfit: r.outfit 
    })));
    
    // 상위 limitCount개만 반환
    return sortedRecords.slice(0, limitCount);
    
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return [];
  }
}

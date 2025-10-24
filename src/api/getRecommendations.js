import { sortRecords } from "../utils/sortingUtils";
import { getTodayPublicRecords, getAllPublicRecords } from "../utils/firebaseQueries";

/**
 * 추천 데이터를 가져오는 함수
 * @param {string} region - 지역
 * @param {number} limitCount - 가져올 개수 (기본값: 3)
 * @returns {Promise<Array>} 정렬된 추천 데이터 배열
 */
export async function getRecommendations(region, limitCount = 3) {
  try {
    console.log("🔍 getRecommendations 요청:", { region, limitCount });
    
    // 1단계: 해당 지역의 오늘 기록 조회
    let records = await getTodayPublicRecords(region, 100);
    console.log("📊 지역 일치 오늘 기록:", records.length, "개");
    
    // 2단계: 지역 일치 기록이 없으면 모든 오늘 기록 조회
    if (records.length === 0) {
      console.log("지역 일치 기록 없음, 모든 오늘 기록에서 추천");
      records = await getTodayPublicRecords(null, 100);
      console.log("📊 전체 오늘 기록:", records.length, "개");
    }
    
    // 3단계: 오늘 기록이 없으면 과거 기록 조회
    if (records.length === 0) {
      console.log("오늘 기록 없음, 과거 기록에서 추천");
      records = await getAllPublicRecords(100);
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

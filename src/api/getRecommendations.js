import { sortRecords } from "../utils/sortingUtils";
import { getTodayPublicRecords, getAllPublicRecords } from "../utils/firebaseQueries";

/**
 * 추천 데이터를 가져오는 함수
 */
export async function getRecommendations(region, limitCount = 3) {
  try {
    console.log("🔍 getRecommendations 요청:", { region, limitCount });
    
    // 1. 해당 지역의 오늘 기록 조회(최대 100개)
    let records = await getTodayPublicRecords(region, 100);
    console.log("📊 지역 일치 오늘 기록:", records.length, "개");
    
    // 2. 지역 일치 기록이 없으면 모든 오늘 기록 조회(지역 무시, 최대 100개)
    if (records.length === 0) {
      console.log("지역 일치 기록 없음, 모든 오늘 기록에서 추천");
      records = await getTodayPublicRecords(null, 100);
      console.log("📊 전체 오늘 기록:", records.length, "개");
    }
    
    // 3. 오늘 기록이 없으면 과거 기록 조회(모든 공개 기록, 최대 100개)
    if (records.length === 0) {
      console.log("오늘 기록 없음, 과거 기록에서 추천");
      records = await getAllPublicRecords(100);
      console.log("📊 과거 기록:", records.length, "개");
    }
    
    // 가져온 기록을 'popular' 기준(인기순)으로 정렬
    const sortedRecords = sortRecords(records, "popular");
    
    console.log("🏆 정렬 후 상위 3개:", sortedRecords.slice(0, limitCount).map(r => ({ 
      id: r.id, 
      likes: r.likes?.length, 
      outfit: r.outfit 
    })));
    
    // 상위 limitCount개만 잘라서 반환
    return sortedRecords.slice(0, limitCount);
    
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    // 에러 발생 시 빈 배열 반환
    return [];
  }
}
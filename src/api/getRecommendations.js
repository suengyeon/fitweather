import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";

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
    const q = query(
      collection(db, "outfits"),
      where("region", "==", region),
      where("date", "==", todayStr),
      where("isPublic", "==", true),
      limit(100) // 최대 100개까지 가져오기
    );
    
    const querySnapshot = await getDocs(q);
    const records = [];
    
    console.log("📊 Firestore 쿼리 결과:", querySnapshot.size, "개 문서");
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log("📄 레코드 데이터:", { id: doc.id, outfit: data.outfit, likes: data.likes?.length });
      records.push({
        id: doc.id,
        ...data
      });
    });
    
    console.log("📋 전체 레코드:", records.length, "개");
    
    // 정렬: 1차 좋아요 내림차순, 2차 싫어요 오름차순
    records.sort((a, b) => {
      const aLikes = a.likes?.length || 0;
      const bLikes = b.likes?.length || 0;
      const aDislikes = a.dislikes?.length || 0;
      const bDislikes = b.dislikes?.length || 0;
      
      // 1차: 좋아요 개수 내림차순
      if (aLikes !== bLikes) {
        return bLikes - aLikes;
      }
      // 2차: 싫어요 개수 오름차순 (적은 순서대로)
      return aDislikes - bDislikes;
    });
    
    console.log("🏆 정렬 후 상위 3개:", records.slice(0, limitCount).map(r => ({ 
      id: r.id, 
      likes: r.likes?.length, 
      outfit: r.outfit 
    })));
    
    // 상위 limitCount개만 반환
    return records.slice(0, limitCount);
    
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return [];
  }
}

import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";

export const getAllRecords = async () => {
  try {
    // 전체 기록 가져오기 (날짜 제한 없음)
    const q = query(
      collection(db, "records"),
      where("isPublic", "==", true),
      limit(1000) // 최대 1000개까지 가져오기
    );
    
    const querySnapshot = await getDocs(q);
    const records = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // 모든 공개 기록 포함 (날짜 필터링 제거)
      records.push({
        id: doc.id,
        ...data
      });
    });
    
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
    
    return records;
  } catch (error) {
    console.error("Error fetching all records:", error);
    return [];
  }
}; 
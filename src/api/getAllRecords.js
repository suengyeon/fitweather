import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";
import { sortRecords } from "../utils/sortingUtils";

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
    
    // 정렬 유틸리티 사용
    return sortRecords(records, "popular");
  } catch (error) {
    console.error("Error fetching all records:", error);
    return [];
  }
}; 
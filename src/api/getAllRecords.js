import { sortRecords } from "../utils/sortingUtils";
import { getAllPublicRecords } from "../utils/firebaseQueries";

export const getAllRecords = async () => {
  try {
    // 공통 쿼리 함수 사용
    const records = await getAllPublicRecords(1000);
    
    // 정렬 유틸리티 사용
    return sortRecords(records, "popular");
  } catch (error) {
    console.error("Error fetching all records:", error);
    return [];
  }
}; 
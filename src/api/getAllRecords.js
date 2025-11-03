import { sortRecords } from "../utils/sortingUtils";
import { getAllPublicRecords } from "../utils/firebaseQueries"; 

/**
 * 모든 공개 레코드(게시물 등)를 백엔드로부터 가져와 인기순 정렬하여 반환
 */
export const getAllRecords = async () => {
  try {
    // 1. 모든 공개 레코드(최대 1000개)를 비동기적으로 가져옴
    const records = await getAllPublicRecords(1000);

    // 2. 가져온 레코드를 'popular' 기준(인기순)으로 정렬하여 반환
    return sortRecords(records, "popular");
  } catch (error) {
    // 레코드 가져오기/정렬 중 오류 발생 시 콘솔에 에러 출력
    console.error("Error fetching all records:", error);
    // 에러 발생 시 빈 배열을 반환
    return [];
  }
};
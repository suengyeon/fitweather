import { sortRecords } from "../utils/sortingUtils";
import { getAllPublicRecords } from "../utils/firebaseQueries"; 

/**
 * 모든 공개 레코드(게시물 등)를 백엔드로부터 가져와 인기순 정렬하여 반환
 * @returns {Promise<Array<Object>>} 
 */
export const getAllRecords = async () => {
  try {
    // 1. 공통 쿼리 함수 사용 - 모든 공개 레코드(최대 1000개)를 비동기적으로 가져옴
    // getAllPublicRecords 함수 : DB에서 데이터를 조회
    const records = await getAllPublicRecords(1000);

    // 2. 정렬 유틸리티 함수 사용 - 가져온 레코드를 'popular' 기준(인기순)으로 정렬
    return sortRecords(records, "popular");
  } catch (error) {
    // 레코드를 가져오는 과정이나 정렬 과정에서 오류 발생 시 콘솔에 에러 출력
    console.error("Error fetching all records:", error);
    // 에러 발생 시 사용자에게 빈 배열을 반환하여 서비스 중단 방지
    return [];
  }
};
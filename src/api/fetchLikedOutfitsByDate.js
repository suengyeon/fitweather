import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";

/**
 * 특정 날짜에 사용자가 좋아요한 코디들 조회
 */
export async function fetchLikedOutfitsByDate(uid, date) {
  try {
    // 'records' 컬렉션을 대상으로 쿼리 생성
    const q = query(
      collection(db, "records"),
      // 'likes' 배열에 현재 사용자 UID가 포함된 문서 필터링
      where("likes", "array-contains", uid),
      // 'date' 필드가 주어진 날짜와 일치하는 문서 필터링
      where("date", "==", date)
    );

    // 쿼리 실행 및 스냅샷 가져오기
    const snapshot = await getDocs(q);
    const likedOutfits = [];
    
    // 스냅샷을 순회하며 데이터 추출
    snapshot.forEach(doc => {
      likedOutfits.push({ 
        // 문서 ID와 문서 데이터 병합
        id: doc.id, 
        ...doc.data() 
      });
    });

    // 결과 배열 반환
    return likedOutfits;
  } catch (error) {
    console.error("🔥 fetchLikedOutfitsByDate error:", error);
    // 에러 발생 시 throw
    throw error;
  }
}
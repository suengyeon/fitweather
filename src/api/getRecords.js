import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../firebase";

/**
 * region: ex) "서울"
 * order: "popular" | "latest"
 * date: "YYYY-MM-DD" 형식의 날짜 (선택사항, 기본값은 오늘)
 */
export async function getRecords(region, order, date = null) {
  // 날짜가 제공되지 않으면 오늘 날짜 사용 (로컬 시간 기준)
  const targetDate = date || (() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();
  
  let q = query(
    collection(db, "records"),
    where("region", "==", region),
    where("date", "==", targetDate),
    where("isPublic", "==", true)
  );

  // 최신순 정렬 (createdAt)
  if (order === "latest") {
    q = query(q, orderBy("createdAt", "desc"));
  }

  // Firestore 쿼리 실행
  const snapshot = await getDocs(q);
  let records = [];
  snapshot.forEach(doc => {
    records.push({ id: doc.id, ...doc.data() });
  });

  // 인기순 정렬: 1차 좋아요 내림차순, 2차 싫어요 오름차순
  if (order === "popular") {
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
  }

  return records;
} 
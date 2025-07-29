import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../firebase";

/**
 * region: ex) "서울"
 * order: "popular" | "latest"
 */
export async function getRecords(region, order) {
  const todayStr = new Date().toISOString().slice(0, 10);
  let q = query(
    collection(db, "records"),
    where("region", "==", region),
    where("date", "==", todayStr),
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

  // 인기순 정렬 (likes 배열 길이 내림차순)
  if (order === "popular") {
    records.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
  }

  return records;
} 
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { sortRecords } from "../utils/sortingUtils";

export async function getRecords(region, order, date = null) {
  // 날짜가 제공되지 않으면 오늘 날짜 사용(로컬 시간 기준)
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

  // 최신순 정렬(createdAt)
  if (order === "latest") {
    q = query(q, orderBy("createdAt", "desc"));
  }

  // Firestore 쿼리 실행
  const snapshot = await getDocs(q);
  let records = [];
  snapshot.forEach(doc => {
    records.push({ id: doc.id, ...doc.data() });
  });

  // 정렬 유틸리티 사용
  return sortRecords(records, order);
} 
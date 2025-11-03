import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { sortRecords } from "../utils/sortingUtils";

/**
 * 특정 지역, 특정 날짜의 공개 기록들을 조회하고 정렬하여 반환
 */
export async function getRecords(region, order, date = null) {
  // 날짜가 제공되지 않으면 오늘 날짜 사용(로컬 시간 기준 YYYY-MM-DD 형식)
  const targetDate = date || (() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();
  
  // 기본 쿼리 설정 : records 컬렉션, 지역/날짜 일치, 공개 설정된 문서 필터링
  let q = query(
    collection(db, "records"),
    where("region", "==", region),
    where("date", "==", targetDate),
    where("isPublic", "==", true)
  );

  // 'latest' 정렬 요청 시, Firestore에서 'createdAt' 기준으로 내림차순 정렬 추가
  if (order === "latest") {
    q = query(q, orderBy("createdAt", "desc"));
  }

  // Firestore 쿼리 실행
  const snapshot = await getDocs(q);
  let records = [];
  // 스냅샷에서 문서 ID와 데이터를 추출하여 배열에 저장
  snapshot.forEach(doc => {
    records.push({ id: doc.id, ...doc.data() });
  });

  // 추가적인 정렬 기준(예: "popular")에 따라 유틸리티 함수를 사용하여 정렬 후 반환
  return sortRecords(records, order);
}
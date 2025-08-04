import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";

export const getAllRecords = async (days = 30) => {
  try {
    // 30일 전 날짜 계산
    const today = new Date();
    const startDate = new Date(today.getTime() - (days * 24 * 60 * 60 * 1000));
    const startDateStr = startDate.toISOString().split('T')[0];
    
    // 인덱스 없이 작동하도록 단순한 쿼리 사용
    const q = query(
      collection(db, "records"),
      where("isPublic", "==", true),
      limit(1000) // 최대 1000개까지 가져오기
    );
    
    const querySnapshot = await getDocs(q);
    const records = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // 클라이언트에서 날짜 필터링
      if (data.date && data.date >= startDateStr) {
        records.push({
          id: doc.id,
          ...data
        });
      }
    });
    
    // 하트순으로 정렬
    records.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
    
    return records;
  } catch (error) {
    console.error("Error fetching all records:", error);
    return [];
  }
}; 
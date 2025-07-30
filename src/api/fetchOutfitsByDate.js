import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";

/**
 * 특정 날짜의 사용자 기록을 조회합니다.
 * @param {string} uid - 사용자 ID
 * @param {string} date - 날짜 (YYYY-MM-DD 형식)
 * @returns {Promise<Array>} 해당 날짜의 기록 배열
 */
export async function fetchOutfitsByDate(uid, date) {
  try {
    const q = query(
      collection(db, "records"),
      where("uid", "==", uid),
      where("date", "==", date)
    );

    const snapshot = await getDocs(q);
    const records = [];
    
    snapshot.forEach(doc => {
      records.push({ 
        id: doc.id, 
        ...doc.data() 
      });
    });

    return records;
  } catch (error) {
    console.error("🔥 fetchOutfitsByDate error:", error);
    throw error;
  }
} 
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";

/**
 * 특정 날짜에 사용자가 좋아요한 코디들을 조회합니다.
 * @param {string} uid - 사용자 ID
 * @param {string} date - 날짜 (YYYY-MM-DD 형식)
 * @returns {Promise<Array>} 해당 날짜의 좋아요한 코디 배열
 */
export async function fetchLikedOutfitsByDate(uid, date) {
  try {
    const q = query(
      collection(db, "records"),
      where("likes", "array-contains", uid),
      where("date", "==", date)
    );

    const snapshot = await getDocs(q);
    const likedOutfits = [];
    
    snapshot.forEach(doc => {
      likedOutfits.push({ 
        id: doc.id, 
        ...doc.data() 
      });
    });

    return likedOutfits;
  } catch (error) {
    console.error("🔥 fetchLikedOutfitsByDate error:", error);
    throw error;
  }
} 
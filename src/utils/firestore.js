import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
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

/**
 * 특정 ID의 코디 상세 정보를 조회합니다.
 * @param {string} outfitId - 코디 ID
 * @returns {Promise<Object|null>} 코디 상세 정보 또는 null
 */
export async function fetchOutfitById(outfitId) {
  try {
    const outfitRef = doc(db, "records", outfitId);
    const outfitSnap = await getDoc(outfitRef);
    
    if (outfitSnap.exists()) {
      return { 
        id: outfitSnap.id, 
        ...outfitSnap.data() 
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error("🔥 fetchOutfitById error:", error);
    throw error;
  }
}

/**
 * 사용자가 좋아요한 모든 코디의 날짜 목록을 조회합니다.
 * @param {string} uid - 사용자 ID
 * @returns {Promise<Array>} 좋아요한 코디의 날짜 배열 (중복 제거)
 */
export async function fetchLikedOutfitDates(uid) {
  try {
    const q = query(
      collection(db, "records"),
      where("likes", "array-contains", uid)
    );

    const snapshot = await getDocs(q);
    const dates = new Set();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.date) {
        dates.add(data.date);
      }
    });

    return Array.from(dates).sort().reverse(); // 최신 날짜부터 정렬
  } catch (error) {
    console.error("🔥 fetchLikedOutfitDates error:", error);
    throw error;
  }
} 
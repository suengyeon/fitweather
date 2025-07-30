import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

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
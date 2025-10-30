import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";

/**
 * 기록 삭제(Firestore 문서만 - Base64 이미지는 자동 삭제)
 * @param {string} recordId - 기록 ID
 * @param {Array} imageUrls - 삭제할 이미지 URL 배열(Base64는 자동 삭제)
 * @returns {Promise<void>}
 */
export async function deleteRecord(recordId, imageUrls = []) {
  try {
    // Base64 이미지 : Firestore 문서와 함께 자동 삭제
    console.log("📸 Base64 이미지는 Firestore 문서와 함께 자동 삭제됩니다.");

    // Firestore에서 문서 삭제
    const recordRef = doc(db, "records", recordId);
    await deleteDoc(recordRef);
    
    console.log("✅ Record deleted successfully:", recordId);
  } catch (error) {
    console.error("🔥 deleteRecord error:", error);
    throw error;
  }
} 
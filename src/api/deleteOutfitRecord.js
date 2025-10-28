import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";

/**
 * 기록 삭제(outfits 컬렉션만 - Base64 이미지는 자동 삭제)
 * @param {string} recordId - 기록 ID
 * @param {Array} imageUrls - 삭제할 이미지 URL 배열(Base64는 자동 삭제)
 * @returns {Promise<void>}
 */
export async function deleteOutfitRecord(recordId, imageUrls = []) {
  try {
    // Base64 이미지 : Firestore 문서와 함께 자동 삭제
    console.log("📸 Base64 이미지는 Firestore 문서와 함께 자동 삭제됩니다.");

    // Firestore에서 outfits 문서 삭제
    const outfitRef = doc(db, "outfits", recordId);
    await deleteDoc(outfitRef);
    
    console.log("✅ Outfit record deleted successfully:", recordId);
  } catch (error) {
    console.error("🔥 deleteOutfitRecord error:", error);
    throw error;
  }
}

/**
 * 기록 삭제 (records 컬렉션만 - Base64 이미지는 자동 삭제)
 * @param {string} recordId - 기록 ID
 * @param {Array} imageUrls - 삭제할 이미지 URL 배열 (Base64는 자동 삭제)
 * @returns {Promise<void>}
 */
export async function deleteRecordRecord(recordId, imageUrls = []) {
  try {
    // Base64 이미지 : Firestore 문서와 함께 자동 삭제
    console.log("📸 Base64 이미지는 Firestore 문서와 함께 자동 삭제됩니다.");

    // Firestore에서 records 문서 삭제
    const recordRef = doc(db, "records", recordId);
    await deleteDoc(recordRef);
    
    console.log("✅ Record deleted successfully:", recordId);
  } catch (error) {
    console.error("🔥 deleteRecordRecord error:", error);
    throw error;
  }
}

/**
 * 통합 기록 삭제 함수(outfits와 records 컬렉션 모두 시도)
 * @param {string} recordId - 기록 ID
 * @param {Array} imageUrls - 삭제할 이미지 URL 배열(Base64는 자동 삭제)
 * @returns {Promise<void>}
 */
export async function deleteAnyRecord(recordId, imageUrls = []) {
  try {
    // Base64 이미지 : Firestore 문서와 함께 자동 삭제
    console.log("📸 Base64 이미지는 Firestore 문서와 함께 자동 삭제됩니다.");

    // Firestore에서 문서 삭제(outfits 먼저 시도, 없으면 records 시도)
    try {
      const outfitRef = doc(db, "outfits", recordId);
      await deleteDoc(outfitRef);
      console.log("✅ Outfit record deleted successfully:", recordId);
    } catch (outfitError) {
      console.log("outfits 컬렉션에서 삭제 실패, records 컬렉션에서 시도");
      const recordRef = doc(db, "records", recordId);
      await deleteDoc(recordRef);
      console.log("✅ Record deleted successfully:", recordId);
    }
  } catch (error) {
    console.error("🔥 deleteAnyRecord error:", error);
    throw error;
  }
}

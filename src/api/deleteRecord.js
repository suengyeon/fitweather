import { doc, deleteDoc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "../firebase";

/**
 * 기록을 삭제합니다. (Firestore 문서 + Storage 이미지)
 * @param {string} recordId - 기록 ID
 * @param {Array} imageUrls - 삭제할 이미지 URL 배열
 * @returns {Promise<void>}
 */
export async function deleteRecord(recordId, imageUrls = []) {
  try {
    // 1. Storage에서 이미지 삭제
    if (imageUrls && imageUrls.length > 0) {
      const deleteImagePromises = imageUrls.map(async (imageUrl) => {
        try {
          // URL에서 경로 추출
          const imageRef = ref(storage, imageUrl);
          await deleteObject(imageRef);
          console.log("✅ Image deleted:", imageUrl);
        } catch (error) {
          console.warn("⚠️ Failed to delete image:", imageUrl, error);
          // 이미지 삭제 실패해도 계속 진행
        }
      });
      
      await Promise.all(deleteImagePromises);
    }

    // 2. Firestore에서 문서 삭제
    const recordRef = doc(db, "records", recordId);
    await deleteDoc(recordRef);
    
    console.log("✅ Record deleted successfully:", recordId);
  } catch (error) {
    console.error("🔥 deleteRecord error:", error);
    throw error;
  }
} 
import { doc, deleteDoc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "../firebase";

/**
 * 기록을 삭제합니다. (outfits 컬렉션 + Storage 이미지)
 * @param {string} recordId - 기록 ID
 * @param {Array} imageUrls - 삭제할 이미지 URL 배열
 * @returns {Promise<void>}
 */
export async function deleteOutfitRecord(recordId, imageUrls = []) {
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

    // 2. Firestore에서 outfits 문서 삭제
    const outfitRef = doc(db, "outfits", recordId);
    await deleteDoc(outfitRef);
    
    console.log("✅ Outfit record deleted successfully:", recordId);
  } catch (error) {
    console.error("🔥 deleteOutfitRecord error:", error);
    throw error;
  }
}

/**
 * 기록을 삭제합니다. (records 컬렉션 + Storage 이미지)
 * @param {string} recordId - 기록 ID
 * @param {Array} imageUrls - 삭제할 이미지 URL 배열
 * @returns {Promise<void>}
 */
export async function deleteRecordRecord(recordId, imageUrls = []) {
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

    // 2. Firestore에서 records 문서 삭제
    const recordRef = doc(db, "records", recordId);
    await deleteDoc(recordRef);
    
    console.log("✅ Record deleted successfully:", recordId);
  } catch (error) {
    console.error("🔥 deleteRecordRecord error:", error);
    throw error;
  }
}

/**
 * 통합 기록 삭제 함수 (outfits와 records 컬렉션 모두 시도)
 * @param {string} recordId - 기록 ID
 * @param {Array} imageUrls - 삭제할 이미지 URL 배열
 * @returns {Promise<void>}
 */
export async function deleteAnyRecord(recordId, imageUrls = []) {
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

    // 2. Firestore에서 문서 삭제 (outfits 먼저 시도, 없으면 records 시도)
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

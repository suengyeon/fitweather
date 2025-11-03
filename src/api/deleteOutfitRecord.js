import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";

/**
 * 기록 삭제(outfits 컬렉션만 - Base64 이미지는 자동 삭제)
 */
export async function deleteOutfitRecord(recordId, imageUrls = []) {
  try {
    // Base64 이미지 : Firestore 문서와 함께 자동 삭제
    console.log("📸 Base64 이미지는 Firestore 문서와 함께 자동 삭제됩니다.");

    // Firestore에서 outfits 문서 참조 설정
    const outfitRef = doc(db, "outfits", recordId);
    // Firestore 문서 삭제 실행
    await deleteDoc(outfitRef);
    
    console.log("✅ Outfit record deleted successfully:", recordId);
  } catch (error) {
    console.error("🔥 deleteOutfitRecord error:", error);
    // 에러 발생 시 throw
    throw error;
  }
}

/**
 * 기록 삭제 (records 컬렉션만 - Base64 이미지는 자동 삭제)
 */
export async function deleteRecordRecord(recordId, imageUrls = []) {
  try {
    // Base64 이미지 : Firestore 문서와 함께 자동 삭제
    console.log("📸 Base64 이미지는 Firestore 문서와 함께 자동 삭제됩니다.");

    // Firestore에서 records 문서 참조 설정
    const recordRef = doc(db, "records", recordId);
    // Firestore 문서 삭제 실행
    await deleteDoc(recordRef);
    
    console.log("✅ Record deleted successfully:", recordId);
  } catch (error) {
    console.error("🔥 deleteRecordRecord error:", error);
    // 에러 발생 시 throw
    throw error;
  }
}

/**
 * 통합 기록 삭제 함수(outfits&records 컬렉션 모두 시도)
 */
export async function deleteAnyRecord(recordId, imageUrls = []) {
  try {
    // Base64 이미지 : Firestore 문서와 함께 자동 삭제
    console.log("📸 Base64 이미지는 Firestore 문서와 함께 자동 삭제됩니다.");

    // Firestore에서 문서 삭제 시도(outfits 먼저 시도)
    try {
      // outfits 컬렉션 문서 참조 설정
      const outfitRef = doc(db, "outfits", recordId);
      // outfits 문서 삭제 시도
      await deleteDoc(outfitRef);
      console.log("✅ Outfit record deleted successfully:", recordId);
    } catch (outfitError) {
      // outfits 삭제 실패 시 records 컬렉션에서 시도
      console.log("outfits 컬렉션에서 삭제 실패, records 컬렉션에서 시도");
      // records 컬렉션 문서 참조 설정
      const recordRef = doc(db, "records", recordId);
      // records 문서 삭제 실행
      await deleteDoc(recordRef);
      console.log("✅ Record deleted successfully:", recordId);
    }
  } catch (error) {
    console.error("🔥 deleteAnyRecord error:", error);
    // 에러 발생 시 throw
    throw error;
  }
}
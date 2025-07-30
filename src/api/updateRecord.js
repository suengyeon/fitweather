import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

/**
 * 기존 기록을 수정합니다.
 * @param {string} recordId - 기록 ID
 * @param {Object} updatedData - 수정할 데이터
 * @returns {Promise<void>}
 */
export async function updateRecord(recordId, updatedData) {
  try {
    const recordRef = doc(db, "records", recordId);
    
    // 수정 시간 추가
    const dataToUpdate = {
      ...updatedData,
      updatedAt: new Date()
    };

    await updateDoc(recordRef, dataToUpdate);
    console.log("✅ Record updated successfully:", recordId);
  } catch (error) {
    console.error("🔥 updateRecord error:", error);
    throw error;
  }
} 
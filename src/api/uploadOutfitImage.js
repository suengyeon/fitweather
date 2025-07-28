// src/api/uploadOutfitImage.js
import { storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

/**
 * Firebase Storage에 이미지 업로드 후 다운로드 URL 반환
 * 개발 중 CORS 에러 등으로 업로드가 실패하면
 * Blob URL을 반환하여 스토리지를 우회합니다.
 *
 * @param {File} file
 * @param {string} uid
 * @returns {Promise<string>}
 */
export const uploadOutfitImage = async (file, uid) => {
  try {
    const timestamp = Date.now();
    const storageRef = ref(storage, `images/${uid}/${timestamp}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.warn("⚠️ 이미지 업로드 실패, Blob URL로 대체:", error);
    // CORS 문제 시 blob URL로 대체
    return URL.createObjectURL(file);
  }
};

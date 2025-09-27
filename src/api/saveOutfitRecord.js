// src/api/saveOutfitRecord.js
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

/**
 * 착장 레코드를 Firestore outfits 컬렉션에 저장합니다.
 *
 * @param {Object} record
 * @param {string} record.uid           - 사용자 UID
 * @param {string} record.region        - 지역명 (예: "Seoul")
 * @param {string} record.date          - 날짜 (ISO 문자열 등)
 * @param {string} record.feeling       - 체감 이모지 (예: "👍")
 * @param {string[]} record.weatherEmojis - 날씨 이모지 배열 (최대 2개)
 * @param {string[]} record.imageUrls   - 업로드된 이미지 URL 배열
 * @param {string} record.feedback      - 피드백 텍스트
 * @param {Object} record.outfit        - 옷 항목 객체
 * @param {string[]} record.outfit.outer
 * @param {string[]} record.outfit.top
 * @param {string[]} record.outfit.bottom
 * @param {string[]} record.outfit.shoes
 * @param {string[]} record.outfit.acc
 * @param {boolean} record.isPublic     - 지역피드 공개 여부
 * @returns {Promise<string>} 문서 ID
 */
export const saveOutfitRecord = async (record) => {
  try {
    const docRef = await addDoc(collection(db, "outfits"), {
      uid:           record.uid,
      region:        record.region,
      date:          record.date,
      temp:          record.temp, // 추가
      rain:          record.rain, // 추가
      feeling:       record.feeling,
      weatherEmojis: record.weatherEmojis,
      imageUrls:     record.imageUrls,
      feedback:      record.feedback,
      outfit:        record.outfit,
      styles:        record.styles, // 스타일 정보 추가
      season:        record.season, // 계절 정보 추가
      isPublic:      record.isPublic
    });
    return docRef.id;
  } catch (error) {
    console.error("⚠️ 레코드 저장 실패:", error);
    throw error;
  }
};

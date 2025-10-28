import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore"; 
import { notifyFollowersAboutNewPost } from "../services/notificationService";

/**
 * 착장 레코드를 Firestore 'outfits' 컬렉션에 새 문서로 저장
 * 저장 완료 후, 레코드가 공개(isPublic: true)일 경우 팔로워에 알림 전송
 *
 * @param {Object} record - 저장할 착장 기록 데이터 객체
 * @param {string} record.uid           - 사용자 UID(작성자)
 * @param {string} record.region        - 기록된 지역명(예: "Seoul")
 * @param {string} record.date          - 기록 날짜(ISO 문자열 등)
 * @param {number} record.temp          - 기록 당시의 기온(추가된 필드)
 * @param {number} record.rain          - 기록 당시의 강수량(추가된 필드)
 * @param {string} record.feeling       - 체감 이모지(예: "👍")
 * @param {string[]} record.weatherEmojis - 날씨 이모지 배열(최대 2개)
 * @param {string[]} record.imageUrls   - 업로드된 이미지 URL 배열
 * @param {string} record.feedback      - 사용자의 피드백 텍스트
 * @param {Object} record.outfit        - 옷 항목 객체(outer, top, bottom, shoes, acc 등의 배열 포함)
 * @param {string[]} record.styles      - 착장의 스타일 태그 배열(추가된 필드)
 * @param {string[]} record.season      - 착장의 계절 정보 배열(추가된 필드)
 * @param {boolean} record.isPublic     - 지역피드 공개 여부
 * @returns {Promise<string>} 새로 생성된 Firestore 문서의 ID
 */
export const saveOutfitRecord = async (record) => {
  try {
    // 개발 환경일 때만 전달되는 데이터를 콘솔에 출력
    if (process.env.NODE_ENV === 'development') {
      console.log('📝 기록 저장 데이터:', {
        uid: record.uid,
        region: record.region,
        date: record.date,
        temp: record.temp,
        rain: record.rain,
        feeling: record.feeling,
        weatherEmojis: record.weatherEmojis,
        imageUrls: record.imageUrls,
        feedback: record.feedback,
        outfit: record.outfit,
        styles: record.styles,
        season: record.season,
        isPublic: record.isPublic
      });
    }

    // 1. Firestore 'outfits' 컬렉션에 새 문서(레코드) 추가
    const docRef = await addDoc(collection(db, "outfits"), {
      uid: record.uid,
      region: record.region,
      date: record.date,
      temp: record.temp, // 기온
      rain: record.rain, // 강수량
      feeling: record.feeling,
      weatherEmojis: record.weatherEmojis,
      imageUrls: record.imageUrls,
      feedback: record.feedback,
      outfit: record.outfit,
      styles: record.styles, // 스타일 정보
      season: record.season, // 계절 정보
      isPublic: record.isPublic // 공개 여부
    });

    // 2. 레코드가 공개 : 팔로워에 알림 전송
    if (record.isPublic) {
      console.log('📢 공개 기록이므로 구독자들에게 알림 전송 시작...');
      try {
        // notificationService를 호출하여 알림 전송
        const notificationCount = await notifyFollowersAboutNewPost(record.uid, docRef.id);
        console.log(`📢 ${notificationCount}명의 구독자에게 새 기록 알림 전송 완료`);
      } catch (notificationError) {
        // 알림 전송 실패 시 기록 저장은 성공으로 간주 후 진행
        console.error("⚠️ 알림 전송 실패 (기록 저장은 성공):", notificationError);
        console.error("⚠️ 오류 상세:", notificationError.message);
        console.error("⚠️ 스택 트레이스:", notificationError.stack);
      }
    } else {
      console.log('🔒 비공개 기록이므로 알림을 전송하지 않습니다.');
    }

    // 3. 새로 저장된 문서 ID 반환
    return docRef.id;
  } catch (error) {
    // 레코드 저장 과정에서 심각한 오류가 발생 시 에러 출력 후 다시 던짐
    console.error("⚠️ 레코드 저장 실패:", error);
    throw error;
  }
};
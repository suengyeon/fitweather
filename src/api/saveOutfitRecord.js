import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore"; 

/**
 * 착장 레코드를 Firestore 'outfits' 컬렉션에 새 문서로 저장
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

    // 1. Firestore 'outfits' 컬렉션 참조 및 새 문서 추가
    const docRef = await addDoc(collection(db, "outfits"), {
      uid: record.uid,
      region: record.region,
      date: record.date,
      temp: record.temp, // 기온 저장
      rain: record.rain, // 강수량 저장
      feeling: record.feeling,
      weatherEmojis: record.weatherEmojis,
      imageUrls: record.imageUrls,
      feedback: record.feedback,
      outfit: record.outfit,
      styles: record.styles, // 스타일 정보 저장
      season: record.season, // 계절 정보 저장
      isPublic: record.isPublic // 공개 여부 저장
    });

    // 2. 새로 저장된 문서 ID 반환
    return docRef.id;
  } catch (error) {
    // 레코드 저장 실패 시 에러 출력 후 다시 던짐
    console.error("⚠️ 레코드 저장 실패:", error);
    throw error;
  }
};
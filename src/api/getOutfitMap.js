import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";

/**
 * 캘린더용 날짜별 요약 데이터를 가져옵니다.
 * @param {string} uid - 사용자 ID
 * @param {string} year - 연도 (YYYY)
 * @param {string} month - 월 (MM)
 * @returns {Promise<Object>} 날짜별 요약 데이터
 */
export async function getOutfitMap(uid, year, month) {
  try {
    // 해당 월의 시작일과 끝일 계산
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${month.padStart(2, '0')}-${lastDay}`;

    const q = query(
      collection(db, "records"),
      where("uid", "==", uid),
      where("date", ">=", startDate),
      where("date", "<=", endDate)
    );

    const snapshot = await getDocs(q);
    const outfitMap = {};

    snapshot.forEach(doc => {
      const data = doc.data();
      const date = data.date;
      
      outfitMap[date] = {
        id: doc.id,
        emoji: {
          weather: data.weatherEmojis || [],
          feel: data.feeling || ""
        },
        hasRecord: true
      };
    });

    return outfitMap;
  } catch (error) {
    console.error("🔥 getOutfitMap error:", error);
    throw error;
  }
} 
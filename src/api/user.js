import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase"; 

/**
 * Firestore 'users' 컬렉션에서 로그인한 사용자의 region 정보 가져옴
 */
export const fetchUserRegion = async (uid) => {
  try {
    // 1. 'users' 컬렉션에서 UID를 문서 ID로 하는 문서 참조 생성
    const userRef = doc(db, "users", uid);
    
    // 2. 사용자 문서 데이터 조회 실행
    const userSnap = await getDoc(userRef);
    
    // 3. 문서 존재 여부 확인 후 'region' 필드 값 반환
    if (userSnap.exists()) {
      return userSnap.data().region; 
    } else {
      // 사용자 문서가 없는 경우 경고 출력
      console.warn("No region found for user:", uid);
      return null;
    }
  } catch (err) {
    // 조회 과정에서 오류 발생 시 에러 출력
    console.error("fetchUserRegion error:", err);
    return null;
  }
};
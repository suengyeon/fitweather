import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase"; 

/**
 * Firestore 'users' 컬렉션에서 로그인한 사용자의 region 정보 가져옴
 * @param {string} uid - Firebase Auth의 currentUser.uid (현재 사용자 ID)
 * @returns {Promise<string|null>} 사용자의 region 문자열 또는 해당 정보가 없거나 오류 발생 시 null
 */
export const fetchUserRegion = async (uid) => {
  try {
    // 1. 'users' 컬렉션에서 해당 UID를 문서 ID로 하는 문서 참조 생성
    const userRef = doc(db, "users", uid);
    
    // 2. 사용자 문서 데이터 조회
    const userSnap = await getDoc(userRef);
    
    // 3. 문서 존재 여부 확인
    if (userSnap.exists()) {
      // 문서 존재 : 해당 데이터에서 'region' 필드 값 반환
      return userSnap.data().region; 
    } else {
      // 사용자 문서는 존재하지만, region 필드가 없거나 문서를 못 찾은 경우
      console.warn("No region found for user:", uid);
      return null;
    }
  } catch (err) {
    // 조회 과정에서 네트워크 오류 등 예외 발생 시
    console.error("fetchUserRegion error:", err);
    return null;
  }
};
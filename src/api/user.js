// src/api/user.js
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Firestore에서 로그인한 사용자의 region 가져오기
 * @param {string} uid - Firebase Auth의 currentUser.uid
 * @returns {Promise<string|null>} region 문자열 또는 null
 */
export const fetchUserRegion = async (uid) => {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data().region; // 예: "Seoul"
    } else {
      console.warn("No region found for user:", uid);
      return null;
    }
  } catch (err) {
    console.error("fetchUserRegion error:", err);
    return null;
  }
};

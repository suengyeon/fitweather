import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase"; 

const REACTIONS_COLLECTION = "reactions"; // 문서 ID 형식: (recordId_uid)

/**
 * 특정 게시물에 대한 특정 사용자의 반응 문서 참조(DocumentReference)를 생성
 * @param {string} recordId 반응 대상 게시물/레코드 ID
 * @param {string} uid 반응을 남긴 사용자 ID
 * @returns {firebase.firestore.DocumentReference}
 */
function getReactionDocRef(recordId, uid) {
  const reactionId = `${recordId}_${uid}`; // 고유 문서 ID 생성
  return doc(db, REACTIONS_COLLECTION, reactionId); // 문서 참조 반환
}

/**
 * 특정 사용자의 특정 게시물에 대한 현재 반응 상태(좋아요/싫어요 여부) 조회
 * @param {string} recordId 게시물 ID
 * @param {string} uid 사용자 ID
 * @returns {Promise<{isThumbsUp: boolean, isThumbsDown: boolean}>} 
 */
export async function getUserReaction(recordId, uid) {
  // 필수 파라미터가 없으면 기본값 반환
  if (!recordId || !uid) return { isThumbsUp: false, isThumbsDown: false };
  
  const ref = getReactionDocRef(recordId, uid); // 반응 문서 참조
  const snap = await getDoc(ref); // 문서 조회

  // 문서가 없으면, 반응 없음으로 간주
  if (!snap.exists()) {
    return { isThumbsUp: false, isThumbsDown: false };
  }

  // 문서가 있으면, 저장된 'type' 필드를 확인하여 상태 반환
  const type = snap.data().type;
  return {
    isThumbsUp: type === "up",   // type이 "up"이면 좋아요
    isThumbsDown: type === "down" // type이 "down"이면 싫어요
  };
}

/**
 * 특정 게시물에 대한 전체 좋아요 수와 싫어요 수를 합산하여 반환
 * @param {string} recordId 게시물 ID
 * @returns {Promise<{thumbsUpCount: number, thumbsDownCount: number}>} 
 */
export async function getReactionSummary(recordId) {
  if (!recordId) return { thumbsUpCount: 0, thumbsDownCount: 0 };

  const col = collection(db, REACTIONS_COLLECTION); // 'reactions' 컬렉션 참조
  
  // 1. 해당 recordId에 대한 'up' 타입 반응을 찾는 쿼리
  const qUp = query(col, where("recordId", "==", recordId), where("type", "==", "up"));
  // 2. 해당 recordId에 대한 'down' 타입 반응을 찾는 쿼리
  const qDown = query(col, where("recordId", "==", recordId), where("type", "==", "down"));
  
  // 두 쿼리를 병렬(Promise.all)로 실행
  const [upSnap, downSnap] = await Promise.all([getDocs(qUp), getDocs(qDown)]);
  
  return { 
    thumbsUpCount: upSnap.size,   // 좋아요 문서 수
    thumbsDownCount: downSnap.size // 싫어요 문서 수
  };
}

/**
 * 특정 사용자의 좋아요('up') 반응 상태 토글
 * @param {string} recordId 게시물 ID
 * @param {string} uid 사용자 ID
 * @returns {Promise<"up" | null>} 
 * @throws {Error} 
 */
export async function toggleThumbsUp(recordId, uid) {
  if (!recordId || !uid) throw new Error("Invalid params");
  console.log('toggleThumbsUp API 호출:', { recordId, uid }); 
  
  const ref = getReactionDocRef(recordId, uid);
  const snap = await getDoc(ref); // 기존 반응 조회
  console.log('toggleThumbsUp - 기존 문서 존재:', snap.exists());
  
  // 1. 기존 반응이 없는 경우 (새로 'up' 생성)
  if (!snap.exists()) {
    console.log('toggleThumbsUp - 새 좋아요 생성');
    await setDoc(ref, { 
      recordId, 
      uid, 
      type: "up", // 'up'으로 설정
      createdAt: serverTimestamp() 
    });
    return "up";
  }
  
  // 2. 기존 반응이 있는 경우
  const currentType = snap.data().type;
  console.log('toggleThumbsUp - 현재 타입:', currentType);
  
  // 2-1. 기존 반응이 이미 'up'인 경우 (좋아요 취소)
  if (currentType === "up") {
    console.log('toggleThumbsUp - 좋아요 제거');
    await deleteDoc(ref); // 문서 삭제
    return null; // 제거됨을 의미
  }
  
  // 2-2. 기존 반응이 'down'인 경우 (좋아요로 변경)
  console.log('toggleThumbsUp - 좋아요로 변경');
  await setDoc(ref, { 
    recordId, 
    uid, 
    type: "up", // 'up'으로 덮어쓰기
    createdAt: serverTimestamp() 
  });
  return "up";
}

/**
 * 특정 사용자의 싫어요('down') 반응 상태 토글
 * @param {string} recordId 
 * @param {string} uid 
 * @returns {Promise<"down" | null>} 
 * @throws {Error} 
 */
export async function toggleThumbsDown(recordId, uid) {
  if (!recordId || !uid) throw new Error("Invalid params");
  const ref = getReactionDocRef(recordId, uid);
  const snap = await getDoc(ref);
  
  // 1. 기존 반응이 없는 경우 (새로 'down' 생성)
  if (!snap.exists()) {
    await setDoc(ref, { recordId, uid, type: "down", createdAt: serverTimestamp() });
    return "down";
  }
  
  // 2. 기존 반응이 있는 경우
  const currentType = snap.data().type;
  
  // 2-1. 기존 반응이 이미 'down'인 경우 (싫어요 취소)
  if (currentType === "down") {
    await deleteDoc(ref); // 문서 삭제
    return null; // 제거됨
  }
  
  // 2-2. 기존 반응이 'up'인 경우 (싫어요로 변경)
  await setDoc(ref, { recordId, uid, type: "down", createdAt: serverTimestamp() });
  return "down";
}
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase"; 

const REACTIONS_COLLECTION = "reactions"; // 반응 데이터가 저장되는 컬렉션 이름

/**
 * 특정 게시물에 대한 특정 사용자의 반응 문서 참조(DocumentReference) 생성
 */
function getReactionDocRef(recordId, uid) {
  // 문서 ID를 'recordId_uid' 형식으로 조합
  const reactionId = `${recordId}_${uid}`; 
  return doc(db, REACTIONS_COLLECTION, reactionId); 
}

/**
 * 특정 사용자의 특정 게시물에 대한 현재 반응 상태(좋아요/싫어요 여부) 조회
 */
export async function getUserReaction(recordId, uid) {
  // 필수 파라미터 유효성 검사
  if (!recordId || !uid) return { isThumbsUp: false, isThumbsDown: false };
  
  const ref = getReactionDocRef(recordId, uid); // 반응 문서 참조
  const snap = await getDoc(ref); // 문서 조회

  // 문서가 없으면, 반응 없음 반환
  if (!snap.exists()) {
    return { isThumbsUp: false, isThumbsDown: false };
  }

  // 문서가 있으면, 'type' 필드(up 또는 down)에 따라 상태 반환
  const type = snap.data().type;
  return {
    isThumbsUp: type === "up",   
    isThumbsDown: type === "down" 
  };
}

/**
 * 특정 게시물에 대한 전체 좋아요 수&싫어요 수 합산하여 반환
 */
export async function getReactionSummary(recordId) {
  if (!recordId) return { thumbsUpCount: 0, thumbsDownCount: 0 };

  const col = collection(db, REACTIONS_COLLECTION); // 'reactions' 컬렉션 참조
  
  // 1. 좋아요('up') 반응 수 계산 쿼리
  const qUp = query(col, where("recordId", "==", recordId), where("type", "==", "up"));
  // 2. 싫어요('down') 반응 수 계산 쿼리
  const qDown = query(col, where("recordId", "==", recordId), where("type", "==", "down"));
  
  // 두 쿼리를 병렬로 실행
  const [upSnap, downSnap] = await Promise.all([getDocs(qUp), getDocs(qDown)]);
  
  // 각 쿼리의 문서 수(size)를 합산하여 반환
  return { 
    thumbsUpCount: upSnap.size,   
    thumbsDownCount: downSnap.size 
  };
}

/**
 * 특정 사용자의 좋아요('up') 반응 상태 토글
 */
export async function toggleThumbsUp(recordId, uid) {
  if (!recordId || !uid) throw new Error("Invalid params");
  console.log('toggleThumbsUp API 호출:', { recordId, uid }); 
  
  const ref = getReactionDocRef(recordId, uid);
  const snap = await getDoc(ref); // 기존 반응 조회
  
  // 1. 기존 반응이 없는 경우 : 'up' 타입으로 새로 생성
  if (!snap.exists()) {
    console.log('toggleThumbsUp - 새 좋아요 생성');
    await setDoc(ref, { 
      recordId, 
      uid, 
      type: "up", 
      createdAt: serverTimestamp() 
    });
    return "up";
  }
  
  // 2. 기존 반응이 있는 경우 : 타입 확인 후 처리
  const currentType = snap.data().type;
  
  // 2-1. 기존 반응이 'up'인 경우 : 문서 삭제(좋아요 취소)
  if (currentType === "up") {
    console.log('toggleThumbsUp - 좋아요 제거');
    await deleteDoc(ref); 
    return null; 
  }
  
  // 2-2. 기존 반응이 'down'인 경우 : 'up'으로 업데이트(좋아요로 변경)
  console.log('toggleThumbsUp - 좋아요로 변경');
  await setDoc(ref, { 
    recordId, 
    uid, 
    type: "up", 
    createdAt: serverTimestamp() // 타임스탬프 갱신
  });
  return "up";
}

/**
 * 특정 사용자의 싫어요('down') 반응 상태 토글
 */
export async function toggleThumbsDown(recordId, uid) {
  if (!recordId || !uid) throw new Error("Invalid params");
  const ref = getReactionDocRef(recordId, uid);
  const snap = await getDoc(ref);
  
  // 1. 기존 반응이 없는 경우 : 'down' 타입으로 새로 생성
  if (!snap.exists()) {
    await setDoc(ref, { recordId, uid, type: "down", createdAt: serverTimestamp() });
    return "down";
  }
  
  // 2. 기존 반응이 있는 경우
  const currentType = snap.data().type;
  
  // 2-1. 기존 반응이 'down'인 경우 : 문서 삭제(싫어요 취소)
  if (currentType === "down") {
    await deleteDoc(ref); 
    return null; 
  }
  
  // 2-2. 기존 반응이 'up'인 경우 : 'down'으로 업데이트(싫어요로 변경)
  await setDoc(ref, { recordId, uid, type: "down", createdAt: serverTimestamp() });
  return "down";
}
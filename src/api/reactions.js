import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

const REACTIONS_COLLECTION = "reactions"; // per (recordId, uid)

function getReactionDocRef(recordId, uid) {
  const reactionId = `${recordId}_${uid}`;
  return doc(db, REACTIONS_COLLECTION, reactionId);
}

export async function getUserReaction(recordId, uid) {
  if (!recordId || !uid) return { isThumbsUp: false, isThumbsDown: false };
  const ref = getReactionDocRef(recordId, uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    return { isThumbsUp: false, isThumbsDown: false };
  }
  const type = snap.data().type;
  return {
    isThumbsUp: type === "up",
    isThumbsDown: type === "down"
  };
}

export async function getReactionSummary(recordId) {
  if (!recordId) return { thumbsUpCount: 0, thumbsDownCount: 0 };
  const col = collection(db, REACTIONS_COLLECTION);
  const qUp = query(col, where("recordId", "==", recordId), where("type", "==", "up"));
  const qDown = query(col, where("recordId", "==", recordId), where("type", "==", "down"));
  const [upSnap, downSnap] = await Promise.all([getDocs(qUp), getDocs(qDown)]);
  return { 
    thumbsUpCount: upSnap.size, 
    thumbsDownCount: downSnap.size 
  };
}

export async function toggleThumbsUp(recordId, uid) {
  if (!recordId || !uid) throw new Error("Invalid params");
  console.log('toggleThumbsUp API 호출:', { recordId, uid });
  
  const ref = getReactionDocRef(recordId, uid);
  const snap = await getDoc(ref);
  console.log('toggleThumbsUp - 기존 문서 존재:', snap.exists());
  
  if (!snap.exists()) {
    console.log('toggleThumbsUp - 새 좋아요 생성');
    await setDoc(ref, { recordId, uid, type: "up", createdAt: serverTimestamp() });
    return "up";
  }
  
  const currentType = snap.data().type;
  console.log('toggleThumbsUp - 현재 타입:', currentType);
  
  if (currentType === "up") {
    console.log('toggleThumbsUp - 좋아요 제거');
    await deleteDoc(ref);
    return null; // removed
  }
  
  console.log('toggleThumbsUp - 좋아요로 변경');
  await setDoc(ref, { recordId, uid, type: "up", createdAt: serverTimestamp() });
  return "up";
}

export async function toggleThumbsDown(recordId, uid) {
  if (!recordId || !uid) throw new Error("Invalid params");
  const ref = getReactionDocRef(recordId, uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { recordId, uid, type: "down", createdAt: serverTimestamp() });
    return "down";
  }
  const currentType = snap.data().type;
  if (currentType === "down") {
    await deleteDoc(ref);
    return null; // removed
  }
  await setDoc(ref, { recordId, uid, type: "down", createdAt: serverTimestamp() });
  return "down";
}



import { doc, updateDoc, getDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "../firebase";

export async function toggleLike(recordId, currentUserUid) {
  const recordRef = doc(db, "records", recordId);
  const userRef = doc(db, "users", currentUserUid);
  const recordSnap = await getDoc(recordRef);
  if (!recordSnap.exists()) throw new Error("데이터 없음");

  const likes = recordSnap.data().likes || [];
  const alreadyLiked = likes.includes(currentUserUid);

  if (alreadyLiked) {
    await updateDoc(recordRef, {
      likes: arrayRemove(currentUserUid)
    });
    await updateDoc(userRef, {
      likedRecords: arrayRemove(recordId)
    });
  } else {
    await updateDoc(recordRef, {
      likes: arrayUnion(currentUserUid)
    });
    await updateDoc(userRef, {
      likedRecords: arrayUnion(recordId)
    });
  }

  // 업데이트 후 최신 likes 배열 fetch해서 반환
  const updatedSnap = await getDoc(recordRef);
  return updatedSnap.data().likes || [];
} 
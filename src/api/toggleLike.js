import { doc, updateDoc, getDoc, arrayUnion, arrayRemove, increment } from "firebase/firestore";
import { db } from "../firebase"; 

/**
 * 특정 레코드(게시물)에 대한 현재 사용자의 '좋아요' 상태 토글
 * 좋아요를 누르지 않았다면 추가, 이미 눌렀다면 취소(제거)
 */
export async function toggleLike(recordId, currentUserUid) {
  // 1. 레코드 문서와 사용자 문서에 대한 참조 생성
  const recordRef = doc(db, "records", recordId); // 레코드 문서 참조
  const userRef = doc(db, "users", currentUserUid); // 사용자 문서 참조

  // 2. 현재 레코드 문서 상태 조회 및 유효성 검사
  const recordSnap = await getDoc(recordRef);
  if (!recordSnap.exists()) {
    // 레코드 존재하지 않으면 에러 발생
    throw new Error("데이터 없음");
  }

  // 3. 현재 좋아요 상태 확인('likes' 배열에 사용자 UID가 있는지 확인)
  const likes = recordSnap.data().likes || [];
  const alreadyLiked = likes.includes(currentUserUid);

  if (alreadyLiked) {
    // 좋아요 취소(Un-like) 로직
    // 4-1. 레코드 문서의 'likes' 배열에서 사용자 UID 제거
    await updateDoc(recordRef, {
      likes: arrayRemove(currentUserUid)
    });
    // 4-2. 사용자 문서의 'likedRecords' 배열에서 recordId 제거
    await updateDoc(userRef, {
      likedRecords: arrayRemove(recordId)
    });
  } else {
    // 좋아요 추가(Like) 로직
    // 5-1. 레코드 문서 'likes' 배열에 사용자 UID 추가(
    await updateDoc(recordRef, {
      likes: arrayUnion(currentUserUid)
    });
    // 5-2. 사용자 문서 'likedRecords' 배열에 recordId 추가 
    await updateDoc(userRef, {
      likedRecords: arrayUnion(recordId)
    });
  }

  // 6. 업데이트 후 레코드 다시 조회하여 최신 좋아요 배열 반환
  const updatedSnap = await getDoc(recordRef);
  return updatedSnap.data().likes || []; // 최신 좋아요 UID 배열 반환
}
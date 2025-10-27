import { doc, updateDoc, getDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "../firebase"; 

/**
 * 특정 레코드(게시물)에 대한 현재 사용자의 '좋아요' 상태 토글
 * 좋아요를 누르지 않았다면 추가, 이미 눌렀다면 취소(제거)
 *
 * @param {string} recordId 좋아요 대상 레코드의 ID
 * @param {string} currentUserUid 현재 로그인한 사용자의 UID
 * @returns {Promise<string[]>} 토글 후의 최신 좋아요 UID 배열
 * @throws {Error} 레코드가 존재하지 않을 경우
 */
export async function toggleLike(recordId, currentUserUid) {
  // 1. 필요한 Firestore 문서 참조 생성
  const recordRef = doc(db, "records", recordId); // 레코드 문서 참조 (좋아요 목록 포함)
  const userRef = doc(db, "users", currentUserUid); // 사용자 문서 참조 (좋아요 누른 레코드 목록 포함)

  // 2. 현재 레코드 문서 상태 조회 및 유효성 검사
  const recordSnap = await getDoc(recordRef);
  if (!recordSnap.exists()) {
    // 레코드 존재하지 않으면 에러 발생
    throw new Error("데이터 없음");
  }

  // 3. 현재 좋아요 상태 확인
  // 레코드 문서의 'likes' 필드(UID 배열) 가져오거나 없으면 빈 배열 사용
  const likes = recordSnap.data().likes || [];
  // 현재 사용자가 이미 좋아요 목록에 포함되어 있는지 확인
  const alreadyLiked = likes.includes(currentUserUid);

  if (alreadyLiked) {
    // 좋아요 취소 (Un-like) 로직
    // 4-1. 레코드 문서에서 현재 사용자 UID를 'likes' 배열에서 제거
    await updateDoc(recordRef, {
      likes: arrayRemove(currentUserUid)
    });
    // 4-2. 사용자 문서에서 해당 recordId를 'likedRecords' 배열에서 제거
    await updateDoc(userRef, {
      likedRecords: arrayRemove(recordId)
    });
  } else {
    // 좋아요 추가 (Like) 로직
    // 5-1. 레코드 문서 'likes' 배열에 현재 사용자 UID 추가
    await updateDoc(recordRef, {
      likes: arrayUnion(currentUserUid)
    });
    // 5-2. 사용자 문서 'likedRecords' 배열에 해당 recordId 추가
    await updateDoc(userRef, {
      likedRecords: arrayUnion(recordId)
    });
  }

  // 6. 업데이트 후 레코드 다시 조회하여 최신 좋아요 배열 반환
  const updatedSnap = await getDoc(recordRef);
  return updatedSnap.data().likes || []; // 최신 좋아요 UID 배열 반환
}
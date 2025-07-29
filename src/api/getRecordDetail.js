import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export async function getRecordDetail(recordId) {
  const recordRef = doc(db, "records", recordId);
  const recordSnap = await getDoc(recordRef);

  if (!recordSnap.exists()) {
    throw new Error("코디 데이터 없음");
  }

  const recordData = recordSnap.data();

  // 작성자 회원정보 fetch
  const userRef = doc(db, "users", recordData.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    throw new Error("작성자 회원정보 없음");
  }

  const userData = userSnap.data();

  return {
    record: { id: recordSnap.id, ...recordData },
    user: { id: userSnap.id, ...userData }
  };
} 
import { collection, addDoc, deleteDoc, query, where, getDocs, doc } from "firebase/firestore";
import { db } from "../firebase";

// 구독하기
export const subscribeUser = async (followerId, followingId) => {
  try {
    // 이미 구독 중인지 확인
    const existingSubscription = await checkSubscription(followerId, followingId);
    if (existingSubscription) {
      throw new Error("이미 구독 중인 사용자입니다.");
    }

    // 구독 추가
    await addDoc(collection(db, "follows"), {
      followerId: followerId,
      followingId: followingId,
      createdAt: new Date()
    });

    console.log("✅ 구독 성공:", { followerId, followingId });
    return true;
  } catch (error) {
    console.error("❌ 구독 실패:", error);
    throw error;
  }
};

// 구독 취소
export const unsubscribeUser = async (followerId, followingId) => {
  try {
    // 구독 관계 찾기
    const subscriptionQuery = query(
      collection(db, "follows"),
      where("followerId", "==", followerId),
      where("followingId", "==", followingId)
    );
    
    const querySnapshot = await getDocs(subscriptionQuery);
    
    if (querySnapshot.empty) {
      throw new Error("구독 관계를 찾을 수 없습니다.");
    }

    // 구독 삭제
    const subscriptionDoc = querySnapshot.docs[0];
    await deleteDoc(doc(db, "follows", subscriptionDoc.id));

    console.log("✅ 구독 취소 성공:", { followerId, followingId });
    return true;
  } catch (error) {
    console.error("❌ 구독 취소 실패:", error);
    throw error;
  }
};

// 구독 상태 확인
export const checkSubscription = async (followerId, followingId) => {
  try {
    const subscriptionQuery = query(
      collection(db, "follows"),
      where("followerId", "==", followerId),
      where("followingId", "==", followingId)
    );
    
    const querySnapshot = await getDocs(subscriptionQuery);
    return !querySnapshot.empty;
  } catch (error) {
    console.error("❌ 구독 상태 확인 실패:", error);
    return false;
  }
};

// 구독 토글 (구독 중이면 취소, 아니면 구독)
export const toggleSubscription = async (followerId, followingId) => {
  try {
    const isSubscribed = await checkSubscription(followerId, followingId);
    
    if (isSubscribed) {
      await unsubscribeUser(followerId, followingId);
      return false; // 구독 취소됨
    } else {
      await subscribeUser(followerId, followingId);
      return true; // 구독됨
    }
  } catch (error) {
    console.error("❌ 구독 토글 실패:", error);
    throw error;
  }
};

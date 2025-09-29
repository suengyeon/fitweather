import { collection, addDoc, deleteDoc, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

// 댓글 알림 생성 함수
export const createCommentNotification = async (commenterId, postOwnerId, postId, commentContent) => {
  try {
    // 댓글 작성자의 정보 가져오기
    const commenterDoc = await getDoc(doc(db, "users", commenterId));
    if (!commenterDoc.exists()) {
      console.error("❌ 댓글 작성자 정보를 찾을 수 없습니다:", commenterId);
      return;
    }

    const commenterData = commenterDoc.data();
    
    // 댓글 알림 데이터 생성
    const notificationData = {
      recipient: postOwnerId, // 게시글 작성자 (알림을 받을 사람)
      sender: {
        id: commenterId,
        nickname: commenterData.nickname || commenterId,
        profilePictureUrl: commenterData.profilePictureUrl || ""
      },
      type: "comment_on_my_post",
      isRead: false,
      link: `/feed-detail/${postId}`, // 해당 기록으로 이동
      message: commentContent, // 댓글 내용
      createdAt: new Date().toISOString()
    };

    // 알림 저장
    await addDoc(collection(db, "notifications"), notificationData);
  } catch (error) {
    console.error("❌ 댓글 알림 생성 실패:", error);
  }
};

// 답글 알림 생성 함수
export const createReplyNotification = async (replierId, commentOwnerId, postId, replyContent) => {
  try {
    // 답글 작성자의 정보 가져오기
    const replierDoc = await getDoc(doc(db, "users", replierId));
    if (!replierDoc.exists()) {
      console.error("❌ 답글 작성자 정보를 찾을 수 없습니다:", replierId);
      return;
    }

    const replierData = replierDoc.data();
    
    // 답글 알림 데이터 생성
    const notificationData = {
      recipient: commentOwnerId, // 댓글 작성자 (알림을 받을 사람)
      sender: {
        id: replierId,
        nickname: replierData.nickname || replierId,
        profilePictureUrl: replierData.profilePictureUrl || ""
      },
      type: "reply_to_my_comment",
      isRead: false,
      link: `/feed-detail/${postId}`, // 해당 기록으로 이동
      message: replyContent, // 답글 내용
      createdAt: new Date().toISOString()
    };

    // 알림 저장
    await addDoc(collection(db, "notifications"), notificationData);
  } catch (error) {
    console.error("❌ 답글 알림 생성 실패:", error);
  }
};

// 구독 알림 생성 함수
const createFollowNotification = async (followerId, followingId) => {
  try {
    // 구독한 사람(follower)의 정보 가져오기
    const followerDoc = await getDoc(doc(db, "users", followerId));
    if (!followerDoc.exists()) {
      console.error("❌ 구독자 정보를 찾을 수 없습니다:", followerId);
      return;
    }

    const followerData = followerDoc.data();
    
    // 구독 알림 데이터 생성
    const notificationData = {
      recipient: followingId, // 구독받은 사람 (알림을 받을 사람)
      sender: {
        id: followerId,
        nickname: followerData.nickname || followerId,
        profilePictureUrl: followerData.profilePictureUrl || ""
      },
      type: "follow",
      isRead: false,
      link: `/calendar/${followerId}`, // 구독한 사람의 캘린더로 이동
      message: `${followerData.nickname || followerId}이 나를 구독하기 시작했어요.`,
      createdAt: new Date().toISOString() // ISO 문자열로 저장
    };

    // 알림 저장
    await addDoc(collection(db, "notifications"), notificationData);
  } catch (error) {
    console.error("❌ 구독 알림 생성 실패:", error);
  }
};

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

    // 구독 알림 생성
    await createFollowNotification(followerId, followingId);
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

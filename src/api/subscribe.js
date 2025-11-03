import { collection, addDoc, deleteDoc, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { createFollowNotification } from "../services/notificationService"; 

/**
 * 게시글에 새 댓글 달렸을 시 게시글 작성자에게 알림 생성하여 저장
 */
export const createCommentNotification = async (commenterId, postOwnerId, postId, commentContent) => {
  try {
    // 1. 댓글 작성자(알림 발신자)의 사용자 정보 가져오기(닉네임, 프로필 사진 등)
    const commenterDoc = await getDoc(doc(db, "users", commenterId));
    if (!commenterDoc.exists()) {
      console.error("❌ 댓글 작성자 정보를 찾을 수 없습니다:", commenterId);
      return;
    }
    const commenterData = commenterDoc.data();

    // 2. 댓글 알림 데이터 생성(수신자 : 게시글 작성자, 타입 : comment_on_my_post)
    const notificationData = {
      recipient: postOwnerId, 
      sender: {
        id: commenterId,
        nickname: commenterData.nickname || commenterId, 
        profilePictureUrl: commenterData.profilePictureUrl || ""
      },
      type: "comment_on_my_post", 
      isRead: false, 
      link: `/feed-detail/${postId}`, // 게시글 상세 페이지 링크
      message: commentContent, 
      createdAt: new Date().toISOString()
    };

    // 3. 'notifications' 컬렉션에 알림 문서 저장
    await addDoc(collection(db, "notifications"), notificationData);
  } catch (error) {
    console.error("❌ 댓글 알림 생성 실패:", error);
  }
};

/**
 * 댓글에 답글 달렸을 시 댓글 작성자에게 알림 생성하여 저장
 */
export const createReplyNotification = async (replierId, commentOwnerId, postId, replyContent) => {
  try {
    // 1. 답글 작성자(알림 발신자)의 사용자 정보 가져오기
    const replierDoc = await getDoc(doc(db, "users", replierId));
    if (!replierDoc.exists()) {
      console.error("❌ 답글 작성자 정보를 찾을 수 없습니다:", replierId);
      return;
    }
    const replierData = replierDoc.data();

    // 2. 답글 알림 데이터 생성(수신자 : 댓글 작성자, 타입 : reply_to_my_comment)
    const notificationData = {
      recipient: commentOwnerId, 
      sender: {
        id: replierId,
        nickname: replierData.nickname || replierId,
        profilePictureUrl: replierData.profilePictureUrl || ""
      },
      type: "reply_to_my_comment", 
      isRead: false,
      link: `/feed-detail/${postId}`, // 게시글 상세 페이지 링크
      message: replyContent, 
      createdAt: new Date().toISOString()
    };

    // 3. 'notifications' 컬렉션에 알림 문서 저장
    await addDoc(collection(db, "notifications"), notificationData);
  } catch (error) {
    console.error("❌ 답글 알림 생성 실패:", error);
  }
};

/**
 * 구독(팔로우) 이벤트 발생 시 외부 알림 서비스 함수를 호출하기 위한 래퍼 함수
 */
const createFollowNotificationLocal = async (followerId, followingId) => {
  try {
    // 1. 구독자(follower)의 사용자 정보 가져오기
    const followerDoc = await getDoc(doc(db, "users", followerId));
    if (!followerDoc.exists()) {
      console.error("❌ 구독자 정보를 찾을 수 없습니다:", followerId);
      return;
    }
    const followerData = followerDoc.data();

    // 2. 외부 서비스 함수 사용하여 알림 생성 및 전송
    await createFollowNotification(
      followerId, 
      followerData.nickname || followerId, 
      followingId, // 알림 수신자
      followerData.profilePictureUrl || null 
    );
  } catch (error) {
    console.error("❌ 구독 알림 생성 실패:", error);
  }
};

/**
 * 사용자를 구독(팔로우)
 */
export const subscribeUser = async (followerId, followingId) => {
  try {
    // 1. 중복 구독 확인
    const existingSubscription = await checkSubscription(followerId, followingId);
    if (existingSubscription) {
      throw new Error("이미 구독 중인 사용자입니다.");
    }

    // 2. 'follows' 컬렉션에 구독 관계 문서 추가
    await addDoc(collection(db, "follows"), {
      followerId: followerId, 
      followingId: followingId, 
      createdAt: new Date() 
    });

    // 3. 구독 알림 생성 함수 호출
    await createFollowNotificationLocal(followerId, followingId);
    return true;
  } catch (error) {
    console.error("❌ 구독 실패:", error);
    throw error;
  }
};

/**
 * 사용자의 구독(팔로우) 취소
 */
export const unsubscribeUser = async (followerId, followingId) => {
  try {
    // 1. 구독 관계 찾는 쿼리 (followerId와 followingId가 모두 일치하는 문서)
    const subscriptionQuery = query(
      collection(db, "follows"),
      where("followerId", "==", followerId),
      where("followingId", "==", followingId)
    );

    const querySnapshot = await getDocs(subscriptionQuery);

    if (querySnapshot.empty) {
      throw new Error("구독 관계를 찾을 수 없습니다.");
    }

    // 2. 찾은 구독 관계 문서 삭제
    const subscriptionDoc = querySnapshot.docs[0]; 
    await deleteDoc(doc(db, "follows", subscriptionDoc.id));

    return true;
  } catch (error) {
    console.error("❌ 구독 취소 실패:", error);
    throw error;
  }
};

/**
 * 두 사용자 간의 구독 상태 확인
 */
export const checkSubscription = async (followerId, followingId) => {
  try {
    // 구독 관계 찾는 쿼리
    const subscriptionQuery = query(
      collection(db, "follows"),
      where("followerId", "==", followerId),
      where("followingId", "==", followingId)
    );

    const querySnapshot = await getDocs(subscriptionQuery);
    // 쿼리 결과가 비어있지 않으면(문서가 존재하면) 구독 중
    return !querySnapshot.empty;
  } catch (error) {
    console.error("❌ 구독 상태 확인 실패:", error);
    return false;
  }
};

/**
 * 구독 상태 토글(구독 중이면 취소, 아니면 구독)
 */
export const toggleSubscription = async (followerId, followingId) => {
  try {
    const isSubscribed = await checkSubscription(followerId, followingId);

    if (isSubscribed) {
      // 구독 중이면 취소 함수 호출
      await unsubscribeUser(followerId, followingId);
      return false; // 구독 취소됨
    } else {
      // 구독 중이 아니면 구독 함수 호출
      await subscribeUser(followerId, followingId);
      return true; // 구독됨
    }
  } catch (error) {
    console.error("❌ 구독 토글 실패:", error);
    throw error;
  }
};
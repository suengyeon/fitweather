import { collection, addDoc, deleteDoc, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { createFollowNotification } from "../services/notificationService"; 

/**
 * 게시글에 새 댓글 달렸을 시 게시글 작성자에게 알림 생성하여 저장
 * @param {string} commenterId 댓글 작성자 ID
 * @param {string} postOwnerId 게시글 작성자 ID (알림 수신자)
 * @param {string} postId 댓글이 달린 게시글 ID
 * @param {string} commentContent 댓글 내용
 */
export const createCommentNotification = async (commenterId, postOwnerId, postId, commentContent) => {
  try {
    // 1. 댓글 작성자(알림 발신자)의 사용자 정보(닉네임) 가져옴
    const commenterDoc = await getDoc(doc(db, "users", commenterId));
    if (!commenterDoc.exists()) {
      console.error("❌ 댓글 작성자 정보를 찾을 수 없습니다:", commenterId);
      return;
    }
    const commenterData = commenterDoc.data();

    // 2. 댓글 알림 데이터 생성
    const notificationData = {
      recipient: postOwnerId, // 게시글 작성자에게 알림 전송
      sender: {
        id: commenterId,
        nickname: commenterData.nickname || commenterId, // 닉네임 없으면 ID 사용
        profilePictureUrl: commenterData.profilePictureUrl || ""
      },
      type: "comment_on_my_post", // 알림 타입
      isRead: false, // 기본값 : 읽지 않음
      link: `/feed-detail/${postId}`, // 클릭 시 이동할 게시글 링크
      message: commentContent, // 알림에 표시될 댓글 내용
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
 * @param {string} replierId 답글 작성자 ID
 * @param {string} commentOwnerId 댓글 작성자 ID (알림 수신자)
 * @param {string} postId 답글이 달린 게시글 ID
 * @param {string} replyContent 답글 내용
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

    // 2. 답글 알림 데이터 생성
    const notificationData = {
      recipient: commentOwnerId, // 댓글 작성자에게 알림 전송
      sender: {
        id: replierId,
        nickname: replierData.nickname || replierId,
        profilePictureUrl: replierData.profilePictureUrl || ""
      },
      type: "reply_to_my_comment", // 알림 타입
      isRead: false,
      link: `/feed-detail/${postId}`, // 클릭 시 이동할 게시글 링크
      message: replyContent, // 알림에 표시될 답글 내용
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
 * @param {string} followerId 구독한 사용자 ID
 * @param {string} followingId 구독 대상 사용자 ID
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
      followerId, // 구독한 사람 ID
      followerData.nickname || followerId, // 구독한 사람 닉네임
      followingId, // 알림을 받을 사람 ID
      followerData.profilePictureUrl || null // 구독한 사람 프로필 사진 URL
    );
  } catch (error) {
    console.error("❌ 구독 알림 생성 실패:", error);
  }
};

/**
 * 사용자를 구독(팔로우)
 * @param {string} followerId 구독 요청한 사용자 ID
 * @param {string} followingId 구독 대상 사용자 ID
 * @returns {Promise<boolean>} 구독 성공 여부 (true)
 * @throws {Error} 이미 구독 중이거나 구독 실패 시
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
      followerId: followerId, // 구독자
      followingId: followingId, // 구독 대상
      createdAt: new Date() // 구독 시점
    });

    // 3. 구독 알림 생성
    await createFollowNotificationLocal(followerId, followingId);
    return true;
  } catch (error) {
    console.error("❌ 구독 실패:", error);
    throw error;
  }
};

/**
 * 사용자의 구독(팔로우) 취소
 * @param {string} followerId 구독 취소하는 사용자 ID
 * @param {string} followingId 구독 대상 사용자 ID
 * @returns {Promise<boolean>} 구독 취소 성공 여부(true)
 * @throws {Error} 구독 관계 찾을 수 없거나 취소 실패 시
 */
export const unsubscribeUser = async (followerId, followingId) => {
  try {
    // 1. 구독 관계 찾는 쿼리
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
    const subscriptionDoc = querySnapshot.docs[0]; // 첫 번째 문서(하나만 존재해야 함)
    await deleteDoc(doc(db, "follows", subscriptionDoc.id));

    return true;
  } catch (error) {
    console.error("❌ 구독 취소 실패:", error);
    throw error;
  }
};

/**
 * 두 사용자 간의 구독 상태 확인
 * @param {string} followerId 구독 확인하려는 사용자 ID
 * @param {string} followingId 구독 대상 사용자 ID
 * @returns {Promise<boolean>} 구독 중이면 true, 아니면 false
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
 * 구독 상태 토글 (구독 중이면 취소, 아니면 구독)
 * @param {string} followerId 액션을 수행하는 사용자 ID
 * @param {string} followingId 대상 사용자 ID
 * @returns {Promise<boolean>} 최종 구독 상태 (구독됨: true, 취소됨: false)
 * @throws {Error} 토글 실패 시
 */
export const toggleSubscription = async (followerId, followingId) => {
  try {
    const isSubscribed = await checkSubscription(followerId, followingId);

    if (isSubscribed) {
      // 구독 중이면 취소
      await unsubscribeUser(followerId, followingId);
      return false; // 구독 취소됨
    } else {
      // 구독 중이 아니면 구독
      await subscribeUser(followerId, followingId);
      return true; // 구독됨
    }
  } catch (error) {
    console.error("❌ 구독 토글 실패:", error);
    throw error;
  }
};
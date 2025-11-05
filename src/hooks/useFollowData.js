import { useState, useEffect, useCallback } from "react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase"; 
import { checkSubscription, toggleSubscription } from "../api/subscribe"; 

/**
 * 팔로우(following) 및 팔로워(followers) 목록, 그리고 상호 구독 상태를 관리하는 커스텀 훅
 */
const useFollowData = (userId) => {
  const [following, setFollowing] = useState([]); 
  const [followers, setFollowers] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [subscriptionStates, setSubscriptionStates] = useState({}); 

  //팔로우 데이터 및 구독 상태를 가져오는 핵심 로직
  const fetchFollowData = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);

      // --- 1. 내가 팔로우한 사람들(following) 데이터 가져오기 ---
      // Firestore 'follows' 컬렉션에서 followerId가 내 ID와 일치하는 문서 조회
      const followingQuery = query(collection(db, "follows"), where("followerId", "==", userId));
      const followingSnapshot = await getDocs(followingQuery);
      const followingList = [];
      // 조회된 문서 순회하며 followingId(구독 대상 ID)로 'users' 문서 조회하여 닉네임 가져오기
      for (const followDoc of followingSnapshot.docs) {
        const followData = followDoc.data();
        const userDoc = await getDoc(doc(db, "users", followData.followingId));
        if (userDoc.exists()) {
          followingList.push({ id: followData.followingId, nickname: userDoc.data().nickname || "알 수 없음" });
        }
      }
      setFollowing(followingList);

      // --- 2. 나를 팔로우한 사람들(followers) 데이터 가져오기 ---
      // Firestore 'follows' 컬렉션에서 followingId가 내 ID와 일치하는 문서 조회
      const followersQuery = query(collection(db, "follows"), where("followingId", "==", userId));
      const followersSnapshot = await getDocs(followersQuery);
      const followersList = [];
      // 조회된 문서 순회하며 followerId(구독자 ID)로 'users' 문서 조회하여 닉네임 가져오기
      for (const followDoc of followersSnapshot.docs) {
        const followData = followDoc.data();
        const userDoc = await getDoc(doc(db, "users", followData.followerId));
        if (userDoc.exists()) {
          followersList.push({ id: followData.followerId, nickname: userDoc.data().nickname || "알 수 없음" });
        }
      }
      setFollowers(followersList);

      // --- 3. 팔로잉/팔로워 목록 전체에 대해 현재 사용자의 구독 상태 확인 ---
      const allUsers = [...followingList, ...followersList].map(u => u.id);
      const uniqueUsers = [...new Set(allUsers)]; // 중복 제거
      const states = {};

      // Promise.all로 병렬 처리하여 각 사용자에 대한 구독 상태(나->상대방) 확인
      await Promise.all(uniqueUsers.map(async (targetId) => {
        try {
          // userId가 targetId를 구독하는지 확인
          const isSubscribed = await checkSubscription(userId, targetId); 
          states[targetId] = isSubscribed;
        } catch (error) {
          console.error(`구독 상태 확인 실패 (${targetId}):`, error);
          states[targetId] = false;
        }
      }));
      setSubscriptionStates(states);

    } catch (error) {
      console.error("팔로우 데이터 가져오기 실패:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]); // userId가 변경될 때마다 fetchFollowData 재정의

  // 컴포넌트 마운트 시 및 fetchFollowData 변경 시 데이터 로드
  useEffect(() => {
    fetchFollowData();
  }, [fetchFollowData]);

  //구독 토글 핸들러(UI 목록 업데이트 포함)
  const handleSubscriptionToggle = async (targetUserId) => {
    if (!userId) {
      console.error("❌ 사용자 정보가 없습니다.");
      return;
    }

    try {
      // 1. API 호출로 구독 상태 변경(토글)
      const isSubscribed = await toggleSubscription(userId, targetUserId); // 최종 구독 상태 반환

      // 2. 구독 상태(하트) 업데이트
      setSubscriptionStates(prev => ({
        ...prev,
        [targetUserId]: isSubscribed
      }));

      // 3. 팔로잉 목록 업데이트(구독 취소/추가에 따라 로컬 상태 변경)
      if (!isSubscribed) {
        // 구독 취소 시 : 팔로잉 목록에서 제거(내가 팔로우 취소한 경우)
        setFollowing(prev => prev.filter(user => user.id !== targetUserId));
      } else {
        // 구독 시작 : 팔로잉 목록에 추가(팔로우 시작)
        setFollowing(prev => {
          const exists = prev.some(user => user.id === targetUserId);
          if (!exists) {
            // 팔로워 목록에서 정보 찾아서 팔로잉에 추가(새로 조회하지 않고 기존 데이터 활용)
            const userToAdd = followers.find(user => user.id === targetUserId);
            return userToAdd ? [...prev, userToAdd] : prev;
          }
          return prev;
        });
      }
      return isSubscribed; // 최종 구독 상태 반환
    } catch (error) {
      console.error("❌ 구독 토글 실패:", error);
      throw error;
    }
  };

  return {
    following,
    followers,
    loading,
    subscriptionStates,
    handleSubscriptionToggle,
    refetch: fetchFollowData // 데이터 수동 새로고침 함수
  };
};

export default useFollowData;
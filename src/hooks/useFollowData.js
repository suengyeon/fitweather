// src/hooks/useFollowData.js

import { useState, useEffect, useCallback } from "react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase"; // 'firebase.js' 경로에 맞게 수정
import { checkSubscription, toggleSubscription } from "../api/subscribe"; // 'api/subscribe.js' 경로에 맞게 수정

const useFollowData = (userId) => {
  const [following, setFollowing] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscriptionStates, setSubscriptionStates] = useState({});

  /**
   * 🎯 팔로우 데이터 및 구독 상태를 가져오는 핵심 로직
   */
  const fetchFollowData = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);

      // --- 1. 내가 팔로우한 사람들 (following) 데이터 가져오기 ---
      const followingQuery = query(collection(db, "follows"), where("followerId", "==", userId));
      const followingSnapshot = await getDocs(followingQuery);
      const followingList = [];
      for (const followDoc of followingSnapshot.docs) {
        const followData = followDoc.data();
        const userDoc = await getDoc(doc(db, "users", followData.followingId));
        if (userDoc.exists()) {
          followingList.push({ id: followData.followingId, nickname: userDoc.data().nickname || "알 수 없음" });
        }
      }
      setFollowing(followingList);

      // --- 2. 나를 팔로우한 사람들 (followers) 데이터 가져오기 ---
      const followersQuery = query(collection(db, "follows"), where("followingId", "==", userId));
      const followersSnapshot = await getDocs(followersQuery);
      const followersList = [];
      for (const followDoc of followersSnapshot.docs) {
        const followData = followDoc.data();
        const userDoc = await getDoc(doc(db, "users", followData.followerId));
        if (userDoc.exists()) {
          followersList.push({ id: followData.followerId, nickname: userDoc.data().nickname || "알 수 없음" });
        }
      }
      setFollowers(followersList);

      // --- 3. 구독 상태 확인 ---
      // 팔로잉/팔로워 목록 전체에 대해 구독 상태 확인
      const allUsers = [...followingList, ...followersList].map(u => u.id);
      const uniqueUsers = [...new Set(allUsers)];
      const states = {};

      await Promise.all(uniqueUsers.map(async (targetId) => {
        try {
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
  }, [userId]);

  useEffect(() => {
    fetchFollowData();
  }, [fetchFollowData]);

  /**
   * 🔄 구독 토글 핸들러
   */
  const handleSubscriptionToggle = async (targetUserId) => {
    if (!userId) {
      console.error("❌ 사용자 정보가 없습니다.");
      return;
    }

    try {
      // 1. API 호출로 구독 상태 변경
      const isSubscribed = await toggleSubscription(userId, targetUserId);

      // 2. 구독 상태 (하트) 업데이트
      setSubscriptionStates(prev => ({
        ...prev,
        [targetUserId]: isSubscribed
      }));

      // 3. 팔로잉 목록 업데이트 (구독 취소 시 목록에서 제거)
      if (!isSubscribed) {
        // 구독 취소 시: 팔로잉 목록에서 제거 (내가 팔로우 취소한 경우)
        setFollowing(prev => prev.filter(user => user.id !== targetUserId));
      } else {
        // 구독 시: 팔로잉 목록에 추가 (팔로워였던 사람을 다시 팔로우할 때)
        setFollowing(prev => {
          const exists = prev.some(user => user.id === targetUserId);
          if (!exists) {
            // 팔로워 목록에서 해당 사용자 정보 가져와서 팔로잉에 추가
            const userToAdd = followers.find(user => user.id === targetUserId);
            return userToAdd ? [...prev, userToAdd] : prev;
          }
          return prev;
        });
      }
      return isSubscribed;
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
    refetch: fetchFollowData // 데이터 수동 새로고침이 필요할 경우 사용
  };
};

export default useFollowData;
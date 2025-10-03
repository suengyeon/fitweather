// src/pages/Follow.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bars3Icon, HomeIcon } from "@heroicons/react/24/solid";
import { BellIcon } from "@heroicons/react/24/outline";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { toggleSubscription, checkSubscription } from "../api/subscribe";
import MenuSidebar from "../components/MenuSidebar";
import NotiSidebar from "../components/NotiSidebar";
import useNotiSidebar from "../hooks/useNotiSidebar";

export default function Follow() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { alarmOpen, setAlarmOpen,
    notifications, unreadCount,
    markAllRead, handleDeleteSelected,
    markOneRead, handleAlarmItemClick,
  } = useNotiSidebar();

  const { user } = useAuth();
  const [following, setFollowing] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscriptionStates, setSubscriptionStates] = useState({});

  // 팔로우 데이터 가져오기
  useEffect(() => {
    const fetchFollowData = async () => {
      if (!user?.uid) return;

      try {
        setLoading(true);

        // 내가 팔로우한 사람들 (following)
        const followingQuery = query(
          collection(db, "follows"),
          where("followerId", "==", user.uid)
        );
        const followingSnapshot = await getDocs(followingQuery);
        const followingList = [];

        for (const followDoc of followingSnapshot.docs) {
          const followData = followDoc.data();
          const userDoc = await getDoc(doc(db, "users", followData.followingId));
          if (userDoc.exists()) {
            followingList.push({
              id: followData.followingId,
              nickname: userDoc.data().nickname || "알 수 없음"
            });
          }
        }
        setFollowing(followingList);

        // 나를 팔로우한 사람들 (followers)
        const followersQuery = query(
          collection(db, "follows"),
          where("followingId", "==", user.uid)
        );
        const followersSnapshot = await getDocs(followersQuery);
        const followersList = [];

        for (const followDoc of followersSnapshot.docs) {
          const followData = followDoc.data();
          const userDoc = await getDoc(doc(db, "users", followData.followerId));
          if (userDoc.exists()) {
            followersList.push({
              id: followData.followerId,
              nickname: userDoc.data().nickname || "알 수 없음"
            });
          }
        }
        setFollowers(followersList);

        // 구독 상태 확인 (팔로워들과 팔로잉들에 대해)
        const subscriptionStates = {};

        // 팔로워들 구독 상태 확인
        for (const follower of followersList) {
          try {
            const isSubscribed = await checkSubscription(user.uid, follower.id);
            subscriptionStates[follower.id] = isSubscribed;
          } catch (error) {
            console.error(`구독 상태 확인 실패 (${follower.id}):`, error);
            subscriptionStates[follower.id] = false;
          }
        }

        // 팔로잉들 구독 상태 확인
        for (const following of followingList) {
          try {
            const isSubscribed = await checkSubscription(user.uid, following.id);
            subscriptionStates[following.id] = isSubscribed;
          } catch (error) {
            console.error(`구독 상태 확인 실패 (${following.id}):`, error);
            subscriptionStates[following.id] = false;
          }
        }

        setSubscriptionStates(subscriptionStates);

      } catch (error) {
        console.error("팔로우 데이터 가져오기 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowData();
  }, [user?.uid]);

  // 구독 토글 핸들러
  const handleSubscriptionToggle = async (targetUserId) => {
    console.log("🔍 Follow 페이지 구독 버튼 클릭:", { currentUserId: user?.uid, targetUserId });

    if (!user?.uid) {
      console.error("❌ 사용자 정보가 없습니다.");
      return;
    }

    try {
      console.log("📡 구독 API 호출 시작:", { followerId: user.uid, followingId: targetUserId });
      const isSubscribed = await toggleSubscription(user.uid, targetUserId);

      // 구독 상태 업데이트
      setSubscriptionStates(prev => ({
        ...prev,
        [targetUserId]: isSubscribed
      }));

      // 구독 취소 시 팔로잉 목록에서만 제거 (팔로워는 그대로 유지)
      if (!isSubscribed) {
        // 팔로잉 목록에서만 제거 (내가 팔로우 취소한 경우)
        setFollowing(prev => prev.filter(user => user.id !== targetUserId));
        console.log("📤 팔로잉 목록에서 제거:", targetUserId);
      } else {
        // 구독 시 팔로잉 목록에 추가 (이미 있는 경우는 중복 방지)
        setFollowing(prev => {
          const exists = prev.some(user => user.id === targetUserId);
          if (!exists) {
            // 팔로워 목록에서 해당 사용자 정보 가져와서 팔로잉에 추가
            const userToAdd = followers.find(user => user.id === targetUserId);
            if (userToAdd) {
              return [...prev, userToAdd];
            }
          }
          return prev;
        });
        console.log("📥 팔로잉 목록에 추가:", targetUserId);
      }

      console.log("✅ 구독 토글 성공:", { targetUserId, isSubscribed });
    } catch (error) {
      console.error("❌ 구독 토글 실패:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col relative">
      {/* 사이드바 */}
      <MenuSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <NotiSidebar
        isOpen={alarmOpen}
        onClose={() => setAlarmOpen(false)}
        notifications={notifications}
        onMarkAllRead={markAllRead}
        onDeleteSelected={handleDeleteSelected}
        onMarkOneRead={markOneRead}
        onItemClick={handleAlarmItemClick}
      />

      {/* 상단 네비게이션 (Feed.js와 동일 톤) */}
      <div className="flex justify-between items-center px-4 py-3 bg-blue-100 shadow">
        <button
          className="bg-blue-200 px-3 py-1 rounded-md hover:bg-blue-300"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Bars3Icon className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-lg">구독</h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/")}
            className="bg-blue-200 px-3 py-1 rounded-md hover:bg-blue-300"
          >
            <HomeIcon className="w-5 h-5" />
          </button>
          <button
            className="relative flex items-center justify-center 
                                    bg-white w-7 h-7 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={() => setAlarmOpen(true)}
            aria-label="알림 열기"
          >
            <BellIcon className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-2 w-1.5 h-1.5 bg-red-500 rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="max-w-6xl w-full mx-auto px-4 py-6 space-y-4">
        {/* 상단 라벨 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl py-2 text-center font-semibold">팔로잉</div>
          <div className="bg-white rounded-xl py-2 text-center font-semibold">팔로워</div>
        </div>

        {/* 2열 카드 영역 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 팔로잉 카드 */}
          <section className="bg-white rounded-2xl min-h-[70vh] p-4">
            <ul className="space-y-4">
              {loading ? (
                <li className="text-sm text-gray-500">로딩 중...</li>
              ) : following.length === 0 ? (
                <li className="text-sm text-gray-500">아직 팔로잉한 사용자가 없어요.</li>
              ) : (
                following.map((user) => (
                  <li key={user.id} className="flex items-center gap-3 text-lg">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log("🔍 팔로잉 하트 클릭:", user.id);
                        handleSubscriptionToggle(user.id);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      style={{
                        cursor: "pointer",
                        fontSize: "24px",
                        transition: "all 0.2s ease",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "none",
                        background: "transparent",
                        color: subscriptionStates[user.id] ? "#dc2626" : "#9ca3af"
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = "scale(1.2)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = "scale(1)";
                      }}
                    >
                      {subscriptionStates[user.id] ? "♥" : "♡"}
                    </button>
                    <span
                      className="font-semibold cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log("🔍 팔로잉 닉네임 클릭:", user.nickname, user.id);
                        navigate(`/calendar/${user.id}`);
                      }}
                    >
                      {user.nickname}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </section>

          {/* 팔로워 카드 */}
          <section className="bg-white rounded-2xl min-h-[60vh] p-4">
            <ul className="space-y-4">
              {loading ? (
                <li className="text-sm text-gray-500">로딩 중...</li>
              ) : followers.length === 0 ? (
                <li className="text-sm text-gray-500">아직 나를 팔로우한 사용자가 없어요.</li>
              ) : (
                followers.map((user) => (
                  <li key={user.id} className="flex items-center gap-3 text-lg">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log("🔍 하트 클릭:", user.id);
                        handleSubscriptionToggle(user.id);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      style={{
                        cursor: "pointer",
                        fontSize: "24px",
                        transition: "all 0.2s ease",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "none",
                        background: "transparent",
                        color: subscriptionStates[user.id] ? "#dc2626" : "#9ca3af"
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = "scale(1.2)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = "scale(1)";
                      }}
                    >
                      {subscriptionStates[user.id] ? "♥" : "♡"}
                    </button>
                    <span
                      className="font-semibold cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log("🔍 닉네임 클릭:", user.nickname, user.id);
                        navigate(`/calendar/${user.id}`);
                      }}
                    >
                      {user.nickname}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

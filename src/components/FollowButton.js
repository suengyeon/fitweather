// 팔로우 버튼 컴포넌트

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { followUser, unfollowUser, checkFollowStatus } from '../utils/communityUtils';

function FollowButton({ targetUserId, targetUserName, onFollowChange }) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // 팔로우 상태 확인
  useEffect(() => {
    if (user && targetUserId && user.uid !== targetUserId) {
      checkFollowStatus();
    } else {
      setChecking(false);
    }
  }, [user, targetUserId]);

  const checkFollowStatus = async () => {
    setChecking(true);
    try {
      const status = await checkFollowStatus(user.uid, targetUserId);
      setIsFollowing(status);
    } catch (error) {
      console.error('팔로우 상태 확인 오류:', error);
    } finally {
      setChecking(false);
    }
  };

  // 팔로우/언팔로우 처리
  const handleFollowToggle = async () => {
    if (!user || user.uid === targetUserId) return;

    setLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(user.uid, targetUserId);
        setIsFollowing(false);
        onFollowChange?.(false);
      } else {
        await followUser(user.uid, targetUserId);
        setIsFollowing(true);
        onFollowChange?.(true);
      }
    } catch (error) {
      console.error('팔로우 처리 오류:', error);
      alert('팔로우 처리에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 본인 계정이면 팔로우 버튼 숨김
  if (!user || user.uid === targetUserId) {
    return null;
  }

  if (checking) {
    return (
      <div className="w-20 h-8 bg-gray-200 rounded-full animate-pulse"></div>
    );
  }

  return (
    <button
      onClick={handleFollowToggle}
      disabled={loading}
      className={`
        px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
        ${isFollowing 
          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
          : 'bg-blue-500 text-white hover:bg-blue-600'
        }
        ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {loading ? (
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
          <span>처리 중...</span>
        </div>
      ) : (
        isFollowing ? '팔로잉' : '팔로우'
      )}
    </button>
  );
}

// 사용자 프로필 카드 컴포넌트
export function UserProfileCard({ user, showFollowButton = true, onFollowChange }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 border">
      <div className="flex items-center gap-3">
        {/* 프로필 이미지 */}
        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
          {user.nickname?.charAt(0) || user.displayName?.charAt(0) || 'U'}
        </div>
        
        {/* 사용자 정보 */}
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800">
            {user.nickname || user.displayName || '익명'}
          </h3>
          <p className="text-sm text-gray-500">
            {user.region && `${user.region} 지역`}
          </p>
          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
            <span>팔로워 {user.followerCount || 0}</span>
            <span>팔로잉 {user.followingCount || 0}</span>
          </div>
        </div>
        
        {/* 팔로우 버튼 */}
        {showFollowButton && (
          <FollowButton
            targetUserId={user.uid}
            targetUserName={user.nickname || user.displayName}
            onFollowChange={onFollowChange}
          />
        )}
      </div>
    </div>
  );
}

// 팔로워/팔로잉 목록 컴포넌트
export function FollowList({ userId, type = 'followers', onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFollowList();
  }, [userId, type]);

  const loadFollowList = async () => {
    setLoading(true);
    try {
      const { getFollowers, getFollowing } = await import('../utils/communityUtils');
      const data = type === 'followers' 
        ? await getFollowers(userId)
        : await getFollowing(userId);
      setUsers(data);
    } catch (error) {
      console.error('팔로우 목록 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md max-h-96 overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {type === 'followers' ? '팔로워' : '팔로잉'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        {/* 목록 */}
        <div className="overflow-y-auto max-h-80">
          {loading ? (
            <div className="p-4 text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <p className="text-gray-500 mt-2">로딩 중...</p>
            </div>
          ) : users.length > 0 ? (
            <div className="p-2">
              {users.map((follow) => (
                <UserProfileCard
                  key={follow.id}
                  user={follow.user}
                  showFollowButton={true}
                />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <p>{type === 'followers' ? '팔로워가 없습니다.' : '팔로잉이 없습니다.'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FollowButton;


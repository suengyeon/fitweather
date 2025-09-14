// 커뮤니티 피드 페이지

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getFollowingFeed, getPopularPosts } from '../utils/communityUtils';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import CommentSection from '../components/CommentSection';
import FollowButton, { UserProfileCard } from '../components/FollowButton';
import { TagList } from '../components/TagSystem';
import Sidebar from '../components/Sidebar';

function Community() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('following'); // 'following' | 'popular' | 'discover'
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadPosts();
  }, [activeTab, user]);

  const loadPosts = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      let postsData = [];
      
      switch (activeTab) {
        case 'following':
          postsData = await getFollowingFeed(user.uid);
          break;
        case 'popular':
          postsData = await getPopularPosts();
          break;
        case 'discover':
          // 최신 게시물 (임시)
          postsData = await getPopularPosts();
          break;
        default:
          postsData = [];
      }
      
      setPosts(postsData);
    } catch (error) {
      console.error('게시물 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostClick = (post) => {
    // 게시물 상세 페이지로 이동 (추후 구현)
    console.log('게시물 클릭:', post);
  };

  const handleTagClick = (tag) => {
    // 태그 검색 페이지로 이동 (추후 구현)
    console.log('태그 클릭:', tag);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1">
        {/* 헤더 */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ☰
                </button>
                <h1 className="text-2xl font-bold text-gray-800">커뮤니티</h1>
              </div>
              
              {/* 탭 메뉴 */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('following')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'following'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  팔로잉
                </button>
                <button
                  onClick={() => setActiveTab('popular')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'popular'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  인기
                </button>
                <button
                  onClick={() => setActiveTab('discover')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'discover'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  탐색
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="max-w-4xl mx-auto px-4 py-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="text-gray-500 mt-2">게시물을 불러오는 중...</p>
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-6">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUser={user}
                  onPostClick={handlePostClick}
                  onTagClick={handleTagClick}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📸</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {activeTab === 'following' ? '팔로잉한 사용자의 게시물이 없습니다' :
                 activeTab === 'popular' ? '인기 게시물이 없습니다' :
                 '게시물이 없습니다'}
              </h3>
              <p className="text-gray-500 mb-4">
                {activeTab === 'following' ? '다른 사용자를 팔로우하거나 게시물을 작성해보세요!' :
                 '첫 번째 게시물을 작성해보세요!'}
              </p>
              {activeTab === 'following' && (
                <button
                  onClick={() => setActiveTab('discover')}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  다른 사용자 탐색하기
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 게시물 카드 컴포넌트
function PostCard({ post, currentUser, onPostClick, onTagClick }) {
  const [showComments, setShowComments] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);

  const handleLike = () => {
    // 좋아요 기능 (추후 구현)
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleCommentToggle = () => {
    setShowComments(!showComments);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* 게시물 헤더 */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
              {post.author?.nickname?.charAt(0) || post.author?.displayName?.charAt(0) || 'U'}
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">
                {post.author?.nickname || post.author?.displayName || '익명'}
              </h3>
              <p className="text-sm text-gray-500">
                {formatDistanceToNow(post.createdAt.toDate(), { 
                  addSuffix: true, 
                  locale: ko 
                })}
              </p>
            </div>
          </div>
          
          {currentUser && currentUser.uid !== post.userId && (
            <FollowButton
              targetUserId={post.userId}
              targetUserName={post.author?.nickname || post.author?.displayName}
            />
          )}
        </div>
      </div>

      {/* 게시물 이미지 */}
      {post.imageUrl && (
        <div className="aspect-square bg-gray-100">
          <img
            src={post.imageUrl}
            alt="Outfit"
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => onPostClick?.(post)}
          />
        </div>
      )}

      {/* 게시물 내용 */}
      <div className="p-4">
        {/* 착장 정보 */}
        {post.outfit && (
          <p className="text-gray-800 mb-3">{post.outfit}</p>
        )}

        {/* 태그 */}
        {post.styleTags && post.styleTags.length > 0 && (
          <div className="mb-3">
            <TagList 
              tags={post.styleTags} 
              onTagClick={onTagClick}
              size="small"
            />
          </div>
        )}

        {/* 날씨 정보 */}
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
          <span>🌡️ {post.temp}°C</span>
          <span>💧 {post.rain}mm</span>
          <span>💨 {post.humidity}%</span>
        </div>

        {/* 피드백 */}
        {post.feedback && (
          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <p className="text-sm text-gray-700">{post.feedback}</p>
          </div>
        )}

        {/* 액션 버튼들 */}
        <div className="flex items-center gap-6 pt-3 border-t">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${
              isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
            }`}
          >
            <span className="text-lg">{isLiked ? '❤️' : '🤍'}</span>
            <span>{likeCount}</span>
          </button>
          
          <button
            onClick={handleCommentToggle}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-500 transition-colors"
          >
            <span className="text-lg">💬</span>
            <span>{post.commentCount || 0}</span>
          </button>
          
          <button className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-green-500 transition-colors">
            <span className="text-lg">📤</span>
            <span>공유</span>
          </button>
        </div>
      </div>

      {/* 댓글 섹션 */}
      {showComments && (
        <div className="border-t">
          <CommentSection 
            postId={post.id} 
            postAuthorId={post.userId}
          />
        </div>
      )}
    </div>
  );
}

export default Community;


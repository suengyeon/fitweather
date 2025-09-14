// 댓글 섹션 컴포넌트

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { addComment, getCommentsByPostId, deleteComment, likeComment } from '../utils/communityUtils';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

function CommentSection({ postId, postAuthorId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 댓글 조회
  useEffect(() => {
    if (postId) {
      loadComments();
    }
  }, [postId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const commentsData = await getCommentsByPostId(postId);
      setComments(commentsData);
    } catch (error) {
      console.error('댓글 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 댓글 추가
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setSubmitting(true);
    try {
      const commentData = await addComment(postId, user.uid, newComment.trim());
      setComments(prev => [...prev, commentData]);
      setNewComment('');
    } catch (error) {
      console.error('댓글 추가 오류:', error);
      alert('댓글 추가에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 답글 추가
  const handleAddReply = async (parentCommentId) => {
    if (!replyContent.trim() || !user) return;

    setSubmitting(true);
    try {
      const replyData = await addComment(postId, user.uid, replyContent.trim(), parentCommentId);
      setComments(prev => [...prev, replyData]);
      setReplyContent('');
      setReplyingTo(null);
    } catch (error) {
      console.error('답글 추가 오류:', error);
      alert('답글 추가에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;

    try {
      await deleteComment(commentId, postId);
      setComments(prev => prev.filter(comment => comment.id !== commentId));
    } catch (error) {
      console.error('댓글 삭제 오류:', error);
      alert('댓글 삭제에 실패했습니다.');
    }
  };

  // 댓글 좋아요
  const handleLikeComment = async (commentId) => {
    try {
      await likeComment(commentId);
      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, likes: comment.likes + 1 }
          : comment
      ));
    } catch (error) {
      console.error('댓글 좋아요 오류:', error);
    }
  };

  // 댓글과 답글 분리
  const topLevelComments = comments.filter(comment => !comment.parentCommentId);
  const replies = comments.filter(comment => comment.parentCommentId);

  return (
    <div className="mt-6 border-t pt-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        댓글 {comments.length}개
      </h3>

      {/* 댓글 작성 */}
      {user && (
        <form onSubmit={handleAddComment} className="mb-6">
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium">
              {user.displayName?.charAt(0) || 'U'}
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="댓글을 작성해주세요..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                disabled={submitting}
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={!newComment.trim() || submitting}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {submitting ? '작성 중...' : '댓글 작성'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* 댓글 목록 */}
      {loading ? (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <p className="text-gray-500 mt-2">댓글을 불러오는 중...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {topLevelComments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              replies={replies.filter(reply => reply.parentCommentId === comment.id)}
              user={user}
              postAuthorId={postAuthorId}
              onReply={(commentId) => setReplyingTo(commentId)}
              onDelete={handleDeleteComment}
              onLike={handleLikeComment}
              replyingTo={replyingTo}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              onAddReply={handleAddReply}
              onCancelReply={() => setReplyingTo(null)}
              submitting={submitting}
            />
          ))}
        </div>
      )}

      {comments.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          <p>아직 댓글이 없습니다.</p>
          <p className="text-sm mt-1">첫 번째 댓글을 작성해보세요!</p>
        </div>
      )}
    </div>
  );
}

// 개별 댓글 컴포넌트
function CommentItem({ 
  comment, 
  replies, 
  user, 
  postAuthorId, 
  onReply, 
  onDelete, 
  onLike,
  replyingTo,
  replyContent,
  setReplyContent,
  onAddReply,
  onCancelReply,
  submitting
}) {
  const [showReplies, setShowReplies] = useState(false);
  const isAuthor = user?.uid === comment.userId;
  const isPostAuthor = user?.uid === postAuthorId;

  return (
    <div className="border-l-2 border-gray-100 pl-4">
      {/* 댓글 내용 */}
      <div className="flex gap-3">
        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
          {comment.userName?.charAt(0) || 'U'}
        </div>
        <div className="flex-1">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">{comment.userName || '익명'}</span>
              {isPostAuthor && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  작성자
                </span>
              )}
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(comment.createdAt.toDate(), { 
                  addSuffix: true, 
                  locale: ko 
                })}
              </span>
            </div>
            <p className="text-gray-800 text-sm">{comment.content}</p>
          </div>

          {/* 댓글 액션 */}
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <button
              onClick={() => onLike(comment.id)}
              className="flex items-center gap-1 hover:text-red-500 transition-colors"
            >
              <span>👍</span>
              <span>{comment.likes || 0}</span>
            </button>
            {user && (
              <button
                onClick={() => onReply(comment.id)}
                className="hover:text-blue-500 transition-colors"
              >
                답글
              </button>
            )}
            {(isAuthor || isPostAuthor) && (
              <button
                onClick={() => onDelete(comment.id)}
                className="hover:text-red-500 transition-colors"
              >
                삭제
              </button>
            )}
          </div>

          {/* 답글 작성 */}
          {replyingTo === comment.id && (
            <div className="mt-3 ml-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="답글을 작성해주세요..."
                  className="flex-1 p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={submitting}
                />
                <button
                  onClick={() => onAddReply(comment.id)}
                  disabled={!replyContent.trim() || submitting}
                  className="px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? '작성 중...' : '답글'}
                </button>
                <button
                  onClick={onCancelReply}
                  className="px-3 py-2 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                >
                  취소
                </button>
              </div>
            </div>
          )}

          {/* 답글 목록 */}
          {replies.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
              >
                <span>{showReplies ? '▼' : '▶'}</span>
                답글 {replies.length}개
              </button>
              
              {showReplies && (
                <div className="mt-2 space-y-2">
                  {replies.map(reply => (
                    <div key={reply.id} className="ml-4 border-l-2 border-gray-100 pl-3">
                      <div className="flex gap-2">
                        <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                          {reply.userName?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1">
                          <div className="bg-gray-50 rounded p-2">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-xs">{reply.userName || '익명'}</span>
                              <span className="text-xs text-gray-500">
                                {formatDistanceToNow(reply.createdAt.toDate(), { 
                                  addSuffix: true, 
                                  locale: ko 
                                })}
                              </span>
                            </div>
                            <p className="text-gray-800 text-xs">{reply.content}</p>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <button
                              onClick={() => onLike(reply.id)}
                              className="flex items-center gap-1 hover:text-red-500 transition-colors"
                            >
                              <span>👍</span>
                              <span>{reply.likes || 0}</span>
                            </button>
                            {(user?.uid === reply.userId || user?.uid === postAuthorId) && (
                              <button
                                onClick={() => onDelete(reply.id)}
                                className="hover:text-red-500 transition-colors"
                              >
                                삭제
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CommentSection;


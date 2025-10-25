// 공개 캘린더 뷰어 컴포넌트

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getUserPublicRecords, 
  likeCalendar, 
  unlikeCalendar, 
  checkCalendarLikeStatus,
  updateCalendarViewStats,
  addCalendarComment,
  getCalendarComments
} from '../utils/calendarSharingUtils';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

function PublicCalendarViewer({ targetUserId, targetUser, onClose }) {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (targetUserId) {
      loadCalendarData();
      checkLikeStatus();
      loadComments();
      updateViewStats();
    }
  }, [targetUserId, currentDate]);

  const loadCalendarData = async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const recordsData = await getUserPublicRecords(targetUserId, year, month);
      setRecords(recordsData);
    } catch (error) {
      console.error('캘린더 데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkLikeStatus = async () => {
    if (!user || user.uid === targetUserId) return;
    
    try {
      const liked = await checkCalendarLikeStatus(user.uid, targetUserId);
      setIsLiked(liked);
    } catch (error) {
      console.error('좋아요 상태 확인 오류:', error);
    }
  };

  const loadComments = async () => {
    try {
      const commentsData = await getCalendarComments(targetUserId);
      setComments(commentsData);
    } catch (error) {
      console.error('댓글 로드 오류:', error);
    }
  };

  const updateViewStats = async () => {
    try {
      await updateCalendarViewStats(targetUserId);
    } catch (error) {
      console.error('조회 통계 업데이트 오류:', error);
    }
  };

  const handleLike = async () => {
    if (!user || user.uid === targetUserId) return;
    
    try {
      if (isLiked) {
        await unlikeCalendar(user.uid, targetUserId);
        setIsLiked(false);
        setLikeCount(prev => prev - 1);
      } else {
        await likeCalendar(user.uid, targetUserId);
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('좋아요 처리 오류:', error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    
    setSubmittingComment(true);
    try {
      await addCalendarComment(user.uid, targetUserId, newComment.trim());
      setNewComment('');
      loadComments(); // 댓글 목록 새로고침
    } catch (error) {
      console.error('댓글 추가 오류:', error);
      alert('댓글 추가에 실패했습니다.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // 이전 달의 빈 칸들
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // 현재 달의 날짜들
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getRecordForDate = (date) => {
    if (!date) return null;
    const dateStr = date.toISOString().split('T')[0];
    return records.find(record => record.date === dateStr);
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
              {targetUser?.nickname?.charAt(0) || targetUser?.displayName?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                {targetUser?.nickname || targetUser?.displayName || '익명'}의 룩북
              </h2>
              <p className="text-sm text-gray-500">
                {targetUser?.region && `${targetUser.region} 지역`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                isLiked ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <span>{isLiked ? '❤️' : '🤍'}</span>
              <span>{likeCount}</span>
            </button>
            
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
            >
              <span>💬</span>
              <span>{comments.length}</span>
            </button>
            
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-80px)]">
          {/* 캘린더 */}
          <div className="flex-1 p-4">
            {/* 월 네비게이션 */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                ◀
              </button>
              <h3 className="text-xl font-semibold">
                {currentDate.getFullYear()}년 {monthNames[currentDate.getMonth()]}
              </h3>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                ▶
              </button>
            </div>

            {/* 캘린더 그리드 */}
            <div className="grid grid-cols-7 gap-1">
              {/* 요일 헤더 */}
              {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
              
              {/* 날짜 셀들 */}
              {days.map((date, index) => {
                const record = getRecordForDate(date);
                return (
                  <div
                    key={index}
                    className={`aspect-square p-1 border border-gray-200 ${
                      date ? 'hover:bg-gray-50 cursor-pointer' : 'bg-gray-50'
                    }`}
                  >
                    {date && (
                      <div className="h-full flex flex-col">
                        <div className="text-xs text-gray-600 mb-1">
                          {date.getDate()}
                        </div>
                        {record && (
                          <div className="flex-1 flex items-center justify-center">
                            {record.imageUrls && record.imageUrls.length > 0 ? (
                              <img
                                src={record.imageUrls[0]}
                                alt="Outfit"
                                className="w-full h-full object-cover rounded"
                              />
                            ) : (
                              <div className="w-full h-full bg-blue-100 rounded flex items-center justify-center">
                                <span className="text-xs">📸</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 댓글 섹션 */}
          {showComments && (
            <div className="w-80 border-l p-4 overflow-y-auto">
              <h4 className="font-semibold mb-3">댓글 {comments.length}개</h4>
              
              {/* 댓글 목록 */}
              <div className="space-y-3 mb-4">
                {comments.map(comment => (
                  <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium">
                        {comment.author?.nickname?.charAt(0) || 'U'}
                      </div>
                      <span className="text-sm font-medium">
                        {comment.author?.nickname || '익명'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(comment.createdAt.toDate(), { 
                          addSuffix: true, 
                          locale: ko 
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800">{comment.content}</p>
                  </div>
                ))}
              </div>

              {/* 댓글 작성 */}
              {user && (
                <form onSubmit={handleAddComment}>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="댓글을 작성해주세요..."
                      className="flex-1 p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={submittingComment}
                    />
                    <button
                      type="submit"
                      disabled={!newComment.trim() || submittingComment}
                      className="px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submittingComment ? '작성 중...' : '작성'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PublicCalendarViewer;











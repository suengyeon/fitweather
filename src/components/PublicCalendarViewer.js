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

/**
 * PublicCalendarViewer 컴포넌트 - 다른 사용자의 공개 캘린더 표시, 좋아요/댓글 상호작용 처리
 * @param {Object} props - 컴포넌트 속성
 * @param {string} props.targetUserId - 조회 대상 사용자의 UID
 * @param {Object} props.targetUser - 조회 대상 사용자 정보(닉네임, 지역 포함)
 * @param {() => void} props.onClose - 뷰어 모달 닫는 함수
 */
function PublicCalendarViewer({ targetUserId, targetUser, onClose }) {
  const { user } = useAuth(); // 현재 로그인된 사용자 정보
  
  // --- 상태 관리 ---
  const [currentDate, setCurrentDate] = useState(new Date()); // 현재 캘린더에 표시 중인 기준 날짜
  const [records, setRecords] = useState([]); // 해당 월의 착장 기록 데이터
  const [loading, setLoading] = useState(false); // 데이터 로딩 상태
  const [isLiked, setIsLiked] = useState(false); // 현재 사용자의 좋아요 상태
  const [likeCount, setLikeCount] = useState(0); // 좋아요 총 개수(초기 로드 필요)
  const [comments, setComments] = useState([]); // 댓글 목록
  const [showComments, setShowComments] = useState(false); // 댓글 섹션 표시 여부
  const [newComment, setNewComment] = useState(''); // 새로 작성 중인 댓글 내용
  const [submittingComment, setSubmittingComment] = useState(false); // 댓글 제출 중 상태

  // --- Effect : 데이터 로딩 및 상태 확인 ---
  useEffect(() => {
    if (targetUserId) {
      loadCalendarData(); // 캘린더 기록 로드
      checkLikeStatus(); // 좋아요 상태 확인
      loadComments();    // 댓글 목록 로드
      updateViewStats(); // 조회 통계 업데이트
    }
  }, [targetUserId, currentDate]); // 대상 IDor기준 날짜 바뀔 때마다 재실행

  /**
   * 대상 사용자의 해당 월 공개 기록을 Firestore에서 불러옴
   */
  const loadCalendarData = async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const recordsData = await getUserPublicRecords(targetUserId, year, month);
      setRecords(recordsData); // 기록 배열 업데이트
    } catch (error) {
      console.error('캘린더 데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 현재 로그인된 사용자가 이 캘린더에 좋아요를 눌렀는지 확인
   */
  const checkLikeStatus = async () => {
    // 로그인하지 않았거나 내 캘린더 : 확인 불필요
    if (!user || user.uid === targetUserId) return; 
    
    try {
      const liked = await checkCalendarLikeStatus(user.uid, targetUserId);
      setIsLiked(liked);
    } catch (error) {
      console.error('좋아요 상태 확인 오류:', error);
    }
  };

  /**
   * 캘린더에 달린 댓글 목록 불러옴
   */
  const loadComments = async () => {
    try {
      const commentsData = await getCalendarComments(targetUserId);
      setComments(commentsData); // 댓글 목록 업데이트
    } catch (error) {
      console.error('댓글 로드 오류:', error);
    }
  };

  /**
   * 캘린더 조회 통계 업데이트하여 조회수 증가
   */
  const updateViewStats = async () => {
    try {
      await updateCalendarViewStats(targetUserId);
    } catch (error) {
      console.error('조회 통계 업데이트 오류:', error);
    }
  };

  /**
   * 좋아요 상태 토글, 카운트 업데이트
   */
  const handleLike = async () => {
    // 로그인하지 않았거나 내 캘린더 : 좋아요 불가
    if (!user || user.uid === targetUserId) return;
    
    try {
      if (isLiked) {
        // 좋아요 취소
        await unlikeCalendar(user.uid, targetUserId);
        setIsLiked(false);
        setLikeCount(prev => prev - 1); // 옵티미스틱 업데이트
      } else {
        // 좋아요 누르기
        await likeCalendar(user.uid, targetUserId);
        setIsLiked(true);
        setLikeCount(prev => prev + 1); // 옵티미스틱 업데이트
      }
    } catch (error) {
      console.error('좋아요 처리 오류:', error);
    }
  };

  /**
   * 새 댓글 작성&Firestore에 저장
   */
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return; // 내용이 비었거나 사용자 없으면 종료
    
    setSubmittingComment(true);
    try {
      // 댓글 추가 API 호출
      await addCalendarComment(user.uid, targetUserId, newComment.trim());
      setNewComment(''); // 입력 필드 초기화
      loadComments(); // 댓글 목록 새로고침하여 즉시 반영
    } catch (error) {
      console.error('댓글 추가 오류:', error);
      alert('댓글 추가에 실패했습니다.'); 
    } finally {
      setSubmittingComment(false);
    }
  };

  /**
   * 캘린더의 월을 이전/다음으로 이동
   * @param {number} direction - -1(이전 월)or1(다음 월)
   */
  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate; // 새로운 날짜로 상태 업데이트 -> useEffect 재실행
    });
  };

  /**
   * 현재 월의 모든 날짜&이전/다음 월의 빈 칸 포함한 배열 생성
   * @param {Date} date - 기준 날짜
   * @returns {Array<Date|null>} 달력 셀에 표시될 날짜 배열
   */
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const lastDay = new Date(year, month + 1, 0); // 현재 월의 마지막 날짜
    const daysInMonth = lastDay.getDate();
    
    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay(); // 1일의 요일(0: 일요일, 6: 토요일)
    
    const days = [];
    
    // 이전 달의 빈 칸들(1일이 시작하는 요일까지)
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // 현재 달의 날짜들
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  /**
   * 주어진 날짜에 해당하는 기록이 records 배열에 있는지 찾음
   * @param {Date|null} date - 확인할 날짜 객체
   * @returns {Object|null} 해당 날짜의 기록 객체
   */
  const getRecordForDate = (date) => {
    if (!date) return null;
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD 형식으로 변환
    return records.find(record => record.date === dateStr);
  };

  // 캘린더 UI 렌더링에 필요한 계산
  const days = getDaysInMonth(currentDate);
  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];

  // --- 렌더링 ---
  return (
    // 모달 배경 및 컨테이너
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        
        {/* 1. 헤더(사용자 정보 및 액션 버튼) */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            {/* 프로필 이미지 대체(첫 글자 이니셜) */}
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
              {targetUser?.nickname?.charAt(0) || targetUser?.displayName?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                {targetUser?.nickname || targetUser?.displayName || '익명'}의 룩북
              </h2>
              {/* 지역 정보 */}
              <p className="text-sm text-gray-500">
                {targetUser?.region && `${targetUser.region} 지역`}
              </p>
            </div>
          </div>
          
          {/* 액션 버튼 그룹 */}
          <div className="flex items-center gap-2">
            {/* 좋아요 버튼 */}
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                isLiked ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <span>{isLiked ? '❤️' : '🤍'}</span>
              <span>{likeCount}</span>
            </button>
            
            {/* 댓글 보기 토글 버튼 */}
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
            >
              <span>💬</span>
              <span>{comments.length}</span>
            </button>
            
            {/* 닫기 버튼 */}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* 2. 본문 영역(캘린더 + 댓글 섹션) */}
        <div className="flex h-[calc(90vh-80px)]">
          
          {/* 2-1. 캘린더 영역(항상 표시) */}
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
                      date ? 'hover:bg-gray-50 cursor-pointer' : 'bg-gray-50' // 빈 칸 처리
                    }`}
                  >
                    {date && (
                      <div className="h-full flex flex-col">
                        <div className="text-xs text-gray-600 mb-1">
                          {date.getDate()} {/* 날짜 숫자 표시 */}
                        </div>
                        {/* 기록이 있는 경우 이미지 표시 */}
                        {record && (
                          <div className="flex-1 flex items-center justify-center">
                            {record.imageUrls && record.imageUrls.length > 0 ? (
                              <img
                                src={record.imageUrls[0]}
                                alt="Outfit"
                                className="w-full h-full object-cover rounded"
                              />
                            ) : (
                              // 이미지가 없을 경우 대체 UI
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

          {/* 2-2. 댓글 섹션(showComments==true일 때만 표시) */}
          {showComments && (
            <div className="w-80 border-l p-4 overflow-y-auto">
              <h4 className="font-semibold mb-3">댓글 {comments.length}개</h4>
              
              {/* 댓글 목록 */}
              <div className="space-y-3 mb-4">
                {comments.map(comment => (
                  <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      {/* 댓글 작성자 이니셜 */}
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium">
                        {comment.author?.nickname?.charAt(0) || 'U'}
                      </div>
                      {/* 작성자 닉네임 */}
                      <span className="text-sm font-medium">
                        {comment.author?.nickname || '익명'}
                      </span>
                      {/* 작성 시간(date-fns 사용) */}
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(comment.createdAt.toDate(), { 
                          addSuffix: true, 
                          locale: ko // 한국어 로케일 적용
                        })}
                      </span>
                    </div>
                    {/* 댓글 내용 */}
                    <p className="text-sm text-gray-800">{comment.content}</p>
                  </div>
                ))}
              </div>

              {/* 댓글 작성 폼(로그인 사용자에게만 표시) */}
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
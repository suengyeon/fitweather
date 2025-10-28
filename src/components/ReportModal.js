import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

/**
 * ReportModal 컴포넌트 - 게시물or댓글 신고 모달 팝업 UI
 * * @param {Object} props - 컴포넌트 속성
 * @param {boolean} props.isOpen - 모달 표시 여부 상태
 * @param {() => void} props.onClose - 모달 닫는 함수
 * @param {(targetId: string, targetUserId: string, reason: string) => Promise<void>} props.onReport - 신고 제출 로직 수행하는 비동기 함수
 * @param {('post'|'comment')} props.targetType - 신고 대상의 타입
 * @param {string} props.targetId - 신고 대상의 고유 ID(게시물 IDor댓글 ID)
 * @param {string} props.targetUserId - 신고 대상 콘텐츠의 작성자 ID
 */
function ReportModal({ isOpen, onClose, onReport, targetType, targetId, targetUserId }) {
  const [reason, setReason] = useState(''); // 사용자가 입력한 신고 사유
  const [isSubmitting, setIsSubmitting] = useState(false); // 신고 제출 중 상태

  /**
   * 폼 제출 핸들러 : 신고 로직을 비동기적으로 실행
   * @param {React.FormEvent} e - 폼 이벤트 객체
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return; // 사유 비어있으면 제출 불가

    setIsSubmitting(true);
    try {
      // 상위 컴포넌트로부터 받은 onReport 함수 호출하여 신고 데이터 제출
      await onReport(targetId, targetUserId, reason.trim());
      
      setReason(''); // 제출 성공 시 사유 초기화
      onClose(); // 모달 닫기
    } catch (error) {
      console.error('신고 제출 실패:', error);
      alert('신고 제출에 실패했습니다.'); 
    } finally {
      setIsSubmitting(false);
    }
  };

  // isOpen==false일 경우 렌더링하지 않음
  if (!isOpen) return null;

  // --- 렌더링 : 신고 모달 UI ---
  return (
    // 모달 배경 (fixed, 반투명 오버레이)
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        
        {/* 모달 헤더 */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">🚩 신고하기</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 신고 사유 입력 영역 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              신고 사유
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="신고 사유를 입력해주세요..."
              className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={500}
              required // HTML5 필수 입력 필드
            />
            {/* 글자 수 카운트 */}
            <div className="text-xs text-gray-500 mt-1">
              {reason.length}/500
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex justify-end gap-3">
            {/* 취소 버튼 */}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={isSubmitting} // 제출 중일 때 비활성화
            >
              취소
            </button>
            {/* 신고하기 제출 버튼 */}
            <button
              type="submit"
              disabled={!reason.trim() || isSubmitting} // 사유가 없거나 제출 중일 때 비활성화
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? '제출 중...' : '신고하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReportModal;
import React from 'react';

/**
 * BannedUserMessage 컴포넌트 - 계정 이용이 제한(차단)된 사용자에 표시되는 전체 화면 메시지
 */
function BannedUserMessage() {
  return (
    // 전체 화면 컨테이너: 회색 배경, 중앙 정렬
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      {/* 메시지 박스: 흰색 배경, 둥근 모서리, 그림자 효과, 중앙 내용 정렬 */}
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-4 text-center">
        
        {/* 경고 이모지 아이콘 */}
        <div className="text-6xl mb-4">🚫</div>
        
        {/* 메인 제목: 이용 제한 안내 */}
        <h2 className="text-2xl font-bold text-red-600 mb-4">이용이 제한되었습니다</h2>
        
        {/* 상세 안내 메시지 */}
        <p className="text-gray-600 mb-6">
          관리자에 의해 계정이 차단되었습니다.<br />
          문의사항이 있으시면 고객센터로 연락해주세요.
        </p>
        
        {/* 추가 정보/사유 표시 영역 */}
        <div className="bg-gray-100 rounded-lg p-4">
          <p className="text-sm text-gray-500">
            차단 사유: 부적절한 행동 또는 신고 누적
          </p>
        </div>
      </div>
    </div>
  );
}

export default BannedUserMessage;
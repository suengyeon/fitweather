import React from 'react';

function BannedUserMessage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-4 text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h2 className="text-2xl font-bold text-red-600 mb-4">이용이 제한되었습니다</h2>
        <p className="text-gray-600 mb-6">
          관리자에 의해 계정이 차단되었습니다.<br />
          문의사항이 있으시면 고객센터로 연락해주세요.
        </p>
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

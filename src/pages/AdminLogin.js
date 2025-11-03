import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * AdminLogin 컴포넌트 - 관리자 인증 및 세션 관리를 처리하는 로그인 폼
 */
function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState(''); 
  const [error, setError] = useState(''); 
  const [loading, setLoading] = useState(false); 
  const navigate = useNavigate();

  /**
   * 로그인 폼 제출 핸들러
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 간단한 지연 효과
    await new Promise(resolve => setTimeout(resolve, 500));

    // 하드코딩된 관리자 계정 정보 검증
    if (username === 'admin' && password === 'admin') {
      // 로그인 성공 : 세션 스토리지에 관리자 상태 및 로그인 시각 저장
      sessionStorage.setItem('adminLoggedIn', 'true');
      sessionStorage.setItem('adminLoginTime', new Date().toISOString());
      navigate('/admin'); // 관리자 페이지로 리디렉션
    } else {
      setError('아이디 또는 비밀번호가 올바르지 않습니다.'); // 실패 시 에러 메시지 설정
    }
    
    setLoading(false);
  };

  return (
    // 전체 화면 중앙 정렬 컨테이너
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">관리자 로그인</h1>
          <p className="text-gray-600">관리자만 접근할 수 있습니다</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {/* 아이디 입력 필드 */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              아이디
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="아이디를 입력하세요"
              required
            />
          </div>

          {/* 비밀번호 입력 필드 */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              비밀번호
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="비밀번호를 입력하세요"
              required
            />
          </div>

          {/* 오류 메시지(error 상태가 있을 때만 표시) */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* 로그인 버튼(로딩 중일 때 비활성화) */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        {/* 기본 계정 정보 안내 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            기본 계정: admin / admin
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
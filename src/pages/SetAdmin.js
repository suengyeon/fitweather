import React, { useState } from 'react';
import { setAdminUser, checkAdminUser, removeAdminUser } from '../utils/setAdmin';

function SetAdmin() {
  const [email, setEmail] = useState('jme0706611@gmail.com');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSetAdmin = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const success = await setAdminUser(email);
      if (success) {
        setMessage(`✅ ${email} 계정이 관리자로 설정되었습니다.`);
      } else {
        setMessage(`❌ 관리자 설정에 실패했습니다. 해당 이메일의 사용자가 존재하지 않을 수 있습니다.`);
      }
    } catch (error) {
      setMessage(`❌ 오류 발생: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckAdmin = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const isAdmin = await checkAdminUser(email);
      setMessage(isAdmin ? `✅ ${email}은 관리자 계정입니다.` : `❌ ${email}은 일반 사용자 계정입니다.`);
    } catch (error) {
      setMessage(`❌ 오류 발생: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAdmin = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const success = await removeAdminUser(email);
      if (success) {
        setMessage(`✅ ${email} 계정의 관리자 권한이 제거되었습니다.`);
      } else {
        setMessage(`❌ 관리자 권한 제거에 실패했습니다.`);
      }
    } catch (error) {
      setMessage(`❌ 오류 발생: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          관리자 계정 설정
        </h1>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            이메일 주소
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="관리자로 설정할 이메일"
          />
        </div>

        <div className="space-y-3">
          <button
            onClick={handleSetAdmin}
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? '처리 중...' : '관리자로 설정'}
          </button>

          <button
            onClick={handleCheckAdmin}
            disabled={loading}
            className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? '확인 중...' : '관리자 권한 확인'}
          </button>

          <button
            onClick={handleRemoveAdmin}
            disabled={loading}
            className="w-full bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? '처리 중...' : '관리자 권한 제거'}
          </button>
        </div>

        {message && (
          <div className="mt-4 p-3 bg-gray-100 rounded-md">
            <p className="text-sm text-gray-700">{message}</p>
          </div>
        )}

        <div className="mt-6 text-center">
          <a 
            href="/admin" 
            className="text-blue-500 hover:text-blue-700 underline"
          >
            관리자 페이지로 이동
          </a>
        </div>
      </div>
    </div>
  );
}

export default SetAdmin;

import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

function KakaoCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSocialUser } = useAuth();

  useEffect(() => {
    const handleKakaoLogin = async () => {
      try {
        // URL에서 인가 코드 추출
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get('code');
        
        if (!code) {
          console.error('인가 코드가 없습니다.');
          navigate('/login');
          return;
        }

        // 카카오 액세스 토큰 요청
        const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: '4c93403cc55aba8ddb8f5eb5aa338e29',
            redirect_uri: window.location.origin + '/auth/kakao/callback',
            code: code,
          }),
        });

        const tokenData = await tokenResponse.json();
        
        if (!tokenData.access_token) {
          console.error('액세스 토큰을 받지 못했습니다:', tokenData);
          navigate('/login');
          return;
        }

        // 카카오 사용자 정보 요청
        const userResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
          },
        });

        const userData = await userResponse.json();
        
        if (!userData.id) {
          console.error('사용자 정보를 받지 못했습니다:', userData);
          navigate('/login');
          return;
        }

        // Firebase에 사용자 정보 저장
        const userDoc = {
          uid: `kakao_${userData.id}`,
          email: userData.kakao_account?.email || `kakao_${userData.id}@kakao.com`,
          nickname: userData.properties?.nickname || `카카오사용자${userData.id}`,
          provider: 'kakao',
          createdAt: new Date(),
          region: 'Seoul' // 기본 지역
        };

        // Firestore에 사용자 정보 저장
        await setDoc(doc(db, 'users', userDoc.uid), userDoc);

        // 로그인 상태 설정
        setSocialUser(userDoc);
        
        // 홈으로 이동
        navigate('/');
        
      } catch (error) {
        console.error('카카오 로그인 오류:', error);
        navigate('/login');
      }
    };

    handleKakaoLogin();
  }, [navigate, location, setSocialUser]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">카카오 로그인 처리 중...</h2>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    </div>
  );
}

export default KakaoCallback; 
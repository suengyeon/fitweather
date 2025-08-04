import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

function NaverCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSocialUser } = useAuth();

  useEffect(() => {
    const handleNaverLogin = async () => {
      try {
        // URL에서 인가 코드 추출
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        
        if (!code) {
          console.error('인가 코드가 없습니다.');
          navigate('/login');
          return;
        }

        // 네이버 액세스 토큰 요청
        const tokenResponse = await fetch('https://nid.naver.com/oauth2.0/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: 'oTYR3GAlZNFMK2qoDlJM',
            client_secret: 'S357oxnt3n',
            code: code,
            state: state || 'random_state',
          }),
        });

        const tokenData = await tokenResponse.json();
        
        if (!tokenData.access_token) {
          console.error('액세스 토큰을 받지 못했습니다:', tokenData);
          navigate('/login');
          return;
        }

        // 네이버 사용자 정보 요청
        const userResponse = await fetch('https://openapi.naver.com/v1/nid/me', {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
          },
        });

        const userData = await userResponse.json();
        
        if (userData.response?.id) {
          const naverUser = userData.response;
          
          // Firebase에 사용자 정보 저장
          const userDoc = {
            uid: `naver_${naverUser.id}`,
            email: naverUser.email || `naver_${naverUser.id}@naver.com`,
            nickname: naverUser.nickname || `네이버사용자${naverUser.id}`,
            provider: 'naver',
            createdAt: new Date(),
            region: 'Seoul' // 기본 지역
          };

          // Firestore에 사용자 정보 저장
          await setDoc(doc(db, 'users', userDoc.uid), userDoc);

          // 로그인 상태 설정
          setSocialUser(userDoc);
          
          // 홈으로 이동
          navigate('/');
        } else {
          console.error('사용자 정보를 받지 못했습니다:', userData);
          navigate('/login');
        }
        
      } catch (error) {
        console.error('네이버 로그인 오류:', error);
        navigate('/login');
      }
    };

    handleNaverLogin();
  }, [navigate, location, setSocialUser]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">네이버 로그인 처리 중...</h2>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
      </div>
    </div>
  );
}

export default NaverCallback; 
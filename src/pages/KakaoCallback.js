import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

/**
 * KakaoCallback 컴포넌트 - 카카오 인가 코드를 받아 액세스 토큰을 교환하고, 사용자 정보를 가져와 앱에 로그인 처리하거나
 * 신규 사용자인 경우 회원가입 설정을 위해 ProfileSetup 페이지로 리다이렉트
 */
function KakaoCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSocialUser } = useAuth();
  // 중복 실행 방지 및 처리 상태
  const [isProcessing, setIsProcessing] = useState(false);
  // 이미 처리한 카카오 인가 코드 저장
  const [processedCode, setProcessedCode] = useState(null);

  useEffect(() => {
    const handleKakaoLogin = async () => {
      // URL에서 인가 코드 추출
      const urlParams = new URLSearchParams(location.search);
      const code = urlParams.get('code');
      
      // 새로운 코드가 오면 처리 상태 초기화
      if (code && processedCode !== code) {
        setIsProcessing(false);
        setProcessedCode(null);
      }
      
      // 이미 처리 중이거나 같은 코드를 이미 처리했으면 중복 실행 방지
      if (isProcessing || processedCode === code) {
        return;
      }
      
      if (!code) {
        console.error('인가 코드가 없습니다.');
        navigate('/login');
        return;
      }
      
      setIsProcessing(true);
      setProcessedCode(code); // 현재 코드를 처리 코드로 저장
      
      try {
        const error = urlParams.get('error');
        const error_description = urlParams.get('error_description');
        
        // 카카오 서버에서 에러가 발생한 경우 처리
        if (error) {
          alert(`카카오 로그인 에러: ${error_description || error}`);
          navigate('/login');
          return;
        }

        // 카카오 액세스 토큰 요청(재시도 로직 포함)
        let tokenData;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          try {
            // 액세스 토큰을 위한 POST 요청
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

            tokenData = await tokenResponse.json();
            
            if (tokenData.access_token) {
              // 액세스 토큰과 리프레시 토큰 저장
              localStorage.setItem('kakao_access_token', tokenData.access_token);
              if (tokenData.refresh_token) {
                localStorage.setItem('kakao_refresh_token', tokenData.refresh_token);
              }
              break; // 성공하면 루프 종료
            }
            
            // KOE237(요청 제한) 에러 발생 시 재시도 대기 후 다음 루프
            if (tokenData.error_code === 'KOE237') {
              const waitTime = (retryCount + 1) * 5000;
              if (retryCount === 0) {
                alert('카카오 서버가 혼잡합니다. 잠시 기다린 후 다시 시도합니다.');
              }
              await new Promise(resolve => setTimeout(resolve, waitTime));
              retryCount++;
              continue;
            }
            
            // 기타 에러는 재시도 없이 루프 종료
            break;
            
          } catch (fetchError) {
            // 네트워크 에러 시 짧게 대기 후 재시도
            retryCount++;
            if (retryCount < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 3000));
            }
          }
        }
        
        // 액세스 토큰 획득 실패 시 처리
        if (!tokenData.access_token) {
          if (tokenData.error_code === 'KOE237') {
            alert('카카오 서버가 혼잡합니다. 잠시 후 다시 시도해주세요.');
          } else if (tokenData.error_code === 'KOE320') {
            alert('인가 코드가 만료되었습니다. 다시 로그인해주세요.');
          } else {
            alert('카카오 로그인 중 오류가 발생했습니다.');
          }
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

        const uid = `kakao_${userData.id}`;
        // 이메일이 없는 경우 null 처리
        const email = userData.kakao_account?.email || null;
        const nickname = userData.properties?.nickname || `카카오사용자${userData.id}`;

        // Firestore 사용자 정보 확인 및 처리
        const userDocRef = doc(db, 'users', uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          // 1. 기존 사용자 : 바로 로그인 처리
          const existingUser = userDocSnap.data();
          const completeUser = { uid: uid, ...existingUser };
          
          setSocialUser(completeUser); // 앱 컨텍스트에 사용자 정보 설정
          navigate('/'); // 홈으로 이동
        } else {
          // 2. 새 사용자 : 이메일 중복 확인 후 ProfileSetup으로 리다이렉트
          if (email) {
            // 이메일로 기존 사용자 쿼리
            const emailQuery = query(
              collection(db, "users"),
              where("email", "==", email)
            );
            const emailSnapshot = await getDocs(emailQuery);

            if (!emailSnapshot.empty) {
              // 이메일 중복 시 에러 처리 후 로그인 페이지로
              alert("이미 가입된 이메일입니다. 다른 계정으로 로그인해주세요.");
              navigate('/login');
              return;
            }
          }

          // Firestore에 새 사용자 기본 정보 저장
          const userDoc = {
            uid: uid,
            email: email,
            nickname: nickname,
            provider: 'kakao',
            createdAt: new Date(),
            region: 'Seoul' // 기본 지역 설정
          };
          await setDoc(userDocRef, userDoc);

          // ProfileSetup 페이지로 이동(추가 정보 입력 유도)
          navigate('/profile-setup', {
            state: {
              uid: uid,
              email: email,
              displayName: nickname,
              provider: 'kakao',
              hasEmail: !!email // 이메일 존재 여부 전달
            }
          });
        }
        
      } catch (error) {
        console.error('카카오 로그인 오류:', error);
        alert('카카오 로그인 중 오류가 발생했습니다: ' + error.message);
        navigate('/login');
      } finally {
        setIsProcessing(false);
      }
    };

    handleKakaoLogin();
  }, [navigate, location, setSocialUser, isProcessing, processedCode]); // 의존성 배열

  return (
    // 로그인 처리 중 UI
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">카카오 로그인 처리 중...</h2>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto"></div>
      </div>
    </div>
  );
}

export default KakaoCallback;
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

function KakaoCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSocialUser } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCode, setProcessedCode] = useState(null);

  useEffect(() => {
    const handleKakaoLogin = async () => {
      // URL에서 인가 코드 추출
      const urlParams = new URLSearchParams(location.search);
      const code = urlParams.get('code');
      
      // 새로운 코드가 오면 항상 처리 (로그아웃 후 재로그인 대응)
      if (code && processedCode !== code) {
        setIsProcessing(false);
        setProcessedCode(null);
      }
      
      // 이미 처리 중이거나 같은 코드를 이미 처리했으면 중복 실행 방지
      if (isProcessing || processedCode === code) {
        console.log('이미 처리 중이거나 같은 코드를 처리했습니다. 중복 실행 방지.');
        return;
      }
      
      if (!code) {
        console.error('인가 코드가 없습니다.');
        navigate('/login');
        return;
      }
      
      setIsProcessing(true);
      setProcessedCode(code);
      
      try {
        console.log('카카오 콜백 페이지 로드됨');
        console.log('현재 URL:', window.location.href);
        console.log('카카오 콜백 파라미터:', { code, error: urlParams.get('error'), error_description: urlParams.get('error_description') });
        
        const error = urlParams.get('error');
        const error_description = urlParams.get('error_description');
        
        if (error) {
          console.error('카카오 로그인 에러:', error, error_description);
          alert(`카카오 로그인 에러: ${error_description || error}`);
          navigate('/login');
          return;
        }

        console.log('카카오 액세스 토큰 요청 시작...');
        
        // 카카오 액세스 토큰 요청 (재시도 로직 포함)
        let tokenData;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          try {
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
            console.log('카카오 토큰 응답:', tokenData);
            
            if (tokenData.access_token) {
              // 액세스 토큰을 로컬 스토리지에 저장 (로그아웃 시 사용)
              localStorage.setItem('kakao_access_token', tokenData.access_token);
              if (tokenData.refresh_token) {
                localStorage.setItem('kakao_refresh_token', tokenData.refresh_token);
              }
              break; // 성공하면 루프 종료
            }
            
            if (tokenData.error_code === 'KOE237') {
              // 요청 제한 에러인 경우 더 긴 대기 시간으로 재시도
              const waitTime = (retryCount + 1) * 5000; // 5초, 10초, 15초
              console.log(`요청 제한 에러, ${waitTime/1000}초 후 재시도... (${retryCount + 1}/${maxRetries})`);
              
              // 사용자에게 대기 안내
              if (retryCount === 0) {
                alert('카카오 서버가 혼잡합니다. 잠시 기다린 후 다시 시도합니다.');
              }
              
              await new Promise(resolve => setTimeout(resolve, waitTime));
              retryCount++;
              continue;
            }
            
            // 다른 에러는 재시도하지 않음
            break;
            
          } catch (fetchError) {
            console.error('토큰 요청 중 네트워크 에러:', fetchError);
            retryCount++;
            if (retryCount < maxRetries) {
              const waitTime = 3000; // 3초 대기
              console.log(`네트워크 에러, ${waitTime/1000}초 후 재시도... (${retryCount}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
            }
          }
        }
        
        if (!tokenData.access_token) {
          console.error('액세스 토큰을 받지 못했습니다:', tokenData);
          
          // 특정 에러 코드에 대한 처리
          if (tokenData.error_code === 'KOE237') {
            alert('카카오 서버가 혼잡합니다. 잠시 후 다시 시도해주세요.\n\n다른 로그인 방법을 사용하시거나 잠시 후 다시 시도해주세요.');
          } else if (tokenData.error_code === 'KOE320') {
            alert('인가 코드가 만료되었습니다. 다시 로그인해주세요.');
          } else {
            alert('카카오 로그인 중 오류가 발생했습니다.\n\n다른 로그인 방법을 사용해주세요.');
          }
          
          navigate('/login');
          return;
        }

        console.log('카카오 사용자 정보 요청 시작...');
        
        // 카카오 사용자 정보 요청
        const userResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
          },
        });

        const userData = await userResponse.json();
        console.log('카카오 사용자 정보 응답:', userData);
        
        if (!userData.id) {
          console.error('사용자 정보를 받지 못했습니다:', userData);
          navigate('/login');
          return;
        }

        const uid = `kakao_${userData.id}`;
        // 카카오에서 이메일을 제공하지 않는 경우가 많으므로 기본값 사용
        const email = userData.kakao_account?.email || null;
        const nickname = userData.properties?.nickname || `카카오사용자${userData.id}`;

        console.log('카카오 사용자 정보:', {
          id: userData.id,
          email: userData.kakao_account?.email,
          nickname: userData.properties?.nickname,
          account: userData.kakao_account
        });

        // 기존 사용자 정보 확인
        const userDocRef = doc(db, 'users', uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          // 기존 사용자가 있으면 바로 로그인
          console.log('기존 사용자 발견, 바로 로그인');
          const existingUser = userDocSnap.data();
          console.log('기존 사용자 데이터:', existingUser);
          
          // uid를 포함한 완전한 사용자 객체 생성
          const completeUser = {
            uid: uid,
            ...existingUser
          };
          console.log('완전한 사용자 객체:', completeUser);
          
          setSocialUser(completeUser);
          console.log('setSocialUser 호출 완료');
          console.log('홈으로 이동 시작...');
          navigate('/');
        } else {
          // 새 사용자인데 이메일이 이미 다른 계정에서 사용 중인지 확인
          if (email) {
            const emailQuery = query(
              collection(db, "users"),
              where("email", "==", email)
            );
            const emailSnapshot = await getDocs(emailQuery);

            if (!emailSnapshot.empty) {
              // 이메일이 이미 다른 계정에서 사용 중
              alert("이미 가입된 이메일입니다. 다른 계정으로 로그인해주세요.");
              navigate('/login');
              return;
            }
          }

          // 새 사용자면 ProfileSetup으로 이동
          console.log('새 사용자, ProfileSetup으로 이동');
          
          // 새 사용자 정보 생성
          const userDoc = {
            uid: uid,
            email: email,
            nickname: nickname,
            provider: 'kakao',
            createdAt: new Date(),
            region: 'Seoul' // 기본 지역
          };

          // Firestore에 사용자 정보 저장
          await setDoc(userDocRef, userDoc);

          // ProfileSetup 페이지로 이동
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
  }, [navigate, location, setSocialUser, isProcessing, processedCode]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">카카오 로그인 처리 중...</h2>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto"></div>
      </div>
    </div>
  );
}

export default KakaoCallback; 
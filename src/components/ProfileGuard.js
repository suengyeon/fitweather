import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth"; 
import { doc, getDoc } from "firebase/firestore"; 
import { db } from "../firebase";
import { useNavigate, Outlet } from "react-router-dom"; 

/**
 * ProfileGuard 컴포넌트 - 로그인한 사용자의 필수 프로필 정보(닉네임, 지역) 설정 확인
 * 누락된 경우 'profile-setup' 페이지로 리디렉션하여 라우팅 보호
 */
export default function ProfileGuard() {
  const [loading, setLoading] = useState(true); // 프로필 확인 중 로딩 상태
  const navigate = useNavigate(); // 페이지 이동 훅
  const auth = getAuth(); // Firebase Auth 인스턴스

  useEffect(() => {
    /**
     * 현재 사용자의 프로필 필수 정보 확인하는 비동기 함수
     */
    const checkProfile = async () => {
      const user = auth.currentUser; // 현재 로그인된 사용자 정보

      if (user) {
        // 1. Firestore 'users' 컬렉션에서 사용자 문서 참조 및 조회
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref); 

        // 2. 프로필 필수 정보(문서 존재, 닉네임, 지역) 누락 여부 확인
        if (!snap.exists() ||           
            !snap.data().nickname ||    
            !snap.data().region         
        ) {
          // 필수 정보 누락 : 프로필 설정 페이지로 리디렉션
          navigate("/profile-setup");
        }
      }
      // 사용자가 없거나 검사 통과 시 로딩 상태 해제
      setLoading(false);
    };
    
    checkProfile(); // 컴포넌트 마운트 시 검사 시작
  }, [auth, navigate]); 

  // 로딩 중일 때 로딩 화면 표시
  if (loading) return <div>로딩중...</div>;
  
  // 로딩 완료 및 검사 통과 시 하위 라우트 컴포넌트 렌더링
  return <Outlet />;
}
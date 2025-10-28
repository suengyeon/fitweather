import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth"; 
import { doc, getDoc } from "firebase/firestore"; 
import { db } from "../firebase";
import { useNavigate, Outlet } from "react-router-dom"; 

/**
 * ProfileGuard 컴포넌트 - 로그인한 사용자의 필수 프로필 정보(닉네임, 지역) 설정 확인
 * 누락된 경우 'profile-setup' 페이지로 리디렉션하여 라우팅 보호
 * @returns {JSX.Element} 로딩 화면 또는 하위 라우트 컴포넌트(Outlet)
 */
export default function ProfileGuard() {
  const [loading, setLoading] = useState(true); // 프로필 확인 중 로딩 상태
  const navigate = useNavigate(); // 페이지 이동 위한 훅
  const auth = getAuth(); // Firebase Auth 인스턴스

  useEffect(() => {
    /**
     * 현재 사용자의 프로필 필수 정보 확인하는 비동기 함수
     */
    const checkProfile = async () => {
      const user = auth.currentUser; // 현재 로그인된 사용자 정보

      if (user) {
        // 1. Firestore 'users' 컬렉션에서 사용자 문서 참조
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref); // 사용자 문서 조회

        // 2. 프로필 필수 정보 누락 여부 확인
        if (!snap.exists() ||           // 사용자 문서 자체가 없거나
            !snap.data().nickname ||    // 닉네임 필드가 없거나
            !snap.data().region         // 지역 필드가 없는 경우
        ) {
          // 필수 정보 누락 : 프로필 설정 페이지로 리디렉션
          navigate("/profile-setup");
        }
      }
      // 사용자가 없거나(로그인 상태가 아니거나) 검사 통과한 경우 로딩 상태 해제
      setLoading(false);
    };
    
    checkProfile(); // 컴포넌트 마운트 시 검사 시작
  }, [auth, navigate]); // auth와 navigate 변경될 때마다 재실행

  // 로딩 중일 때 로딩 화면 표시
  if (loading) return <div>로딩중...</div>;
  
  // 로딩 완료 및 검사 통과 시 하위 라우트 컴포넌트 렌더링하여 콘텐츠 표시
  return <Outlet />;
}
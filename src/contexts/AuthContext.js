import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase"; 
import { onAuthStateChanged } from "firebase/auth"; 
import { doc, getDoc } from "firebase/firestore"; 

// 1. 인증 상태 저장할 컨텍스트 객체 생성
const AuthContext = createContext();

/**
 * AuthProvider 컴포넌트 - 애플리케이션의 자식 컴포넌트들에게 인증 상태 및 관련 함수 제공
 */
export function AuthProvider({ children }) {
  // --- 상태 관리 ---
  const [user, setUser] = useState(null); // Firebase User 객체(로그인 정보)
  const [loading, setLoading] = useState(true); // 초기 인증 상태 확인 중 여부
  const [isBanned, setIsBanned] = useState(false); // 사용자 차단 상태

  // --- Effect : Firebase 인증 상태 감시 및 차단 상태 확인 ---
  useEffect(() => {
    // onAuthStateChanged 리스너 : 로그인/로그아웃 상태 바뀔 때마다 실행
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // 사용자가 로그인된 경우
        try {
          // Firestore에서 해당 사용자의 'users' 문서 조회
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            
            // 사용자 status가 'banned'인지 확인
            if (userData.status === 'banned') {
              setIsBanned(true); // 차단 상태 설정
              setUser(null); // user 상태 null로 설정하여 앱에서 로그아웃 처리
              setLoading(false);
              return; // 차단된 경우 로직 종료
            }
          }
        } catch (error) {
          console.error('사용자 상태 확인 실패:', error);
          // Firestore 조회 실패 시에도 로그인 상태 유지
        }
      }
      
      // 차단되지 않았거나, 로그아웃 상태인 경우
      setUser(user); // user 상태 업데이트
      setIsBanned(false); // 차단 상태 초기화
      setLoading(false); // 초기 로딩 완료
    });
    
    // Cleanup 함수 : 컴포넌트 언마운트 시 리스너 해제
    return () => unsubscribe();
  }, []); // 컴포넌트 마운트 시 한 번만 실행

  /**
   * 소셜 로그인 등 외부 로직을 통해 사용자 객체를 수동으로 설정하는 함수
   */
  const setSocialUser = (socialUser) => {
    setUser(socialUser);
  };

  // --- 컨텍스트 값 제공 ---
  return (
    <AuthContext.Provider value={{ user, loading, setSocialUser, isBanned }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth 훅 - 다른 컴포넌트에서 인증 상태&함수를 쉽게 가져올 수 있도록 하는 커스텀 훅
 */
export function useAuth() {
  return useContext(AuthContext);
}
import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBanned, setIsBanned] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // 사용자 상태 확인
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            if (userData.status === 'banned') {
              setIsBanned(true);
              setUser(null);
              setLoading(false);
              return;
            }
          }
        } catch (error) {
          console.error('사용자 상태 확인 실패:', error);
        }
      }
      setUser(user);
      setIsBanned(false);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 소셜 로그인 사용자 설정 함수
  const setSocialUser = (socialUser) => {
    setUser(socialUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, setSocialUser, isBanned }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

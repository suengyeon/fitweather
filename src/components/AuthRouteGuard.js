import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { auth } from "../firebase";

export default function AuthRouteGuard() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const isLoginPage = location.pathname === "/login";
      if (user && isLoginPage) {
        navigate("/home"); // 로그인 상태로 /login 들어오면 리디렉트
      }
      setLoading(false);
    });

    return () => unsubscribe(); // cleanup
  }, [, location, navigate]);

  if (loading) return <div className="text-center mt-10">로딩 중...</div>;
  
  return <Outlet />;
}

import React, { useState } from "react";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth"; 
import { useNavigate, Outlet, useLocation } from "react-router-dom"; 
import { auth } from "../firebase"; 

/**
 * 인증 라우트 가드 컴포넌트 - Firebase 인증 상태(로그인 여부)에 따라 라우팅 보호, 리디렉션
 */
export default function AuthRouteGuard() {
  const [loading, setLoading] = useState(true); // 인증 상태 확인 로딩 상태
  const navigate = useNavigate(); // 라우팅 이동 훅
  const location = useLocation(); // 현재 경로 정보 훅

  useEffect(() => {
    // Firebase 인증 상태 변화 감시 리스너 설정
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const isLoginPage = location.pathname === "/login";

      // 1. 사용자가 로그인 상태(user 존재)이고, 현재 경로가 로그인 페이지인 경우
      if (user && isLoginPage) {
        navigate("/home"); // 홈으로 강제 리디렉션하여 로그인 페이지 접근 차단
      }
      
      // 2. 인증 상태 확인 완료(로딩 상태 해제)
      setLoading(false);
    });

    // 컴포넌트 언마운트 시 리스너 해제(클린업 함수)
    return () => unsubscribe(); 
  }, [location, navigate]); // location, navigate 변경 시 재실행

  // 인증 상태 확인 중일 때 로딩 화면 표시
  if (loading) return <div className="text-center mt-10">로딩 중...</div>;
  
  // 인증 확인 완료되면 하위 라우트 컴포넌트를 렌더링(보호된 콘텐츠 표시)
  return <Outlet />;
}
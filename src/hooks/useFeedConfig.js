import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase"; 

/**
 * 선택된 날짜의 연도, 월, 일 객체를 반환합니다.
 */
const initializeDateState = (isFromHome, locationState) => {
  // 홈에서 직접 진입한 경우 : 세션스토리지 클리어 및 오늘 날짜 사용
  if (isFromHome) {
    sessionStorage.removeItem('feedDate');
    sessionStorage.removeItem('feedRegion'); 
    const today = new Date();
    return {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      day: today.getDate()
    };
  }

  // 브라우저 뒤로가기 등으로 저장된 날짜가 있으면 사용
  const stored = sessionStorage.getItem('feedDate');
  if (stored) {
    const [year, month, day] = stored.split('-').map(Number);
    return { year, month, day };
  }
  
  // FeedDetail에서 전달받은 날짜 정보가 있으면 사용
  if (locationState?.year && locationState?.month && locationState?.day) {
     return {
        year: locationState.year,
        month: locationState.month,
        day: locationState.day,
      };
  }

  // 기본값 : 오늘 날짜
  const today = new Date();
  return {
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    day: today.getDate()
  };
};

/**
 * 지역 설정 및 날짜 상태, 세션스토리지 관리를 담당하는 커스텀 훅입니다.
 */
export function useFeedConfig(user) {
  const location = useLocation();
  // 홈에서 진입했는지 여부 판단(fromCard, fromDetail state가 없으면 홈 진입으로 간주)
  const isFromHome = !location.state?.fromCard && !location.state?.fromDetail;

  const initialDateState = initializeDateState(isFromHome, location.state);
  const [dateState, setDateState] = useState(initialDateState);
  const [region, setRegion] = useState("");
  const isInitialized = useRef(false); // 초기화 완료 여부 추적

  // 세션스토리지에서 지역 정보 가져오는 헬퍼 함수
  const getStoredRegion = useCallback(() => {
    const stored = sessionStorage.getItem('feedRegion');
    return stored || "";
  }, []);

  // user 변경 시 초기화 플래그 리셋
  useEffect(() => {
    isInitialized.current = false;
  }, [user]);

  // 사용자 기본 지역 및 세션스토리지 복구/업데이트 로직(컴포넌트 마운트 시 및 user 변경 시)
  useEffect(() => {
    async function setupFeedConfiguration() {
      if (!user || isInitialized.current) return; // 이미 초기화되었으면 실행하지 않음

      const storedRegion = getStoredRegion();
      const fromDetail = location.state?.fromDetail;
      const passedRegion = location.state?.region;
      const passedDate = location.state?.year && location.state?.month && location.state?.day;

      let newRegion = storedRegion;
      let newDateState = initialDateState; 

      // 1. FeedDetail에서 돌아온 경우(전달받은 지역/날짜 정보 우선 사용)
      if (fromDetail) {
        if (passedRegion) {
          newRegion = passedRegion;
        }
        if (passedDate) {
          newDateState = {
            year: location.state.year,
            month: location.state.month,
            day: location.state.day,
          };
        }
      // 2. 일반적인 진입 또는 새로고침
      } else {
        if (!storedRegion) {
          // 저장된 지역이 없으면 Firestore에서 사용자 기본 지역 조회 및 사용
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            newRegion = userSnap.data().region || "Seoul";
          } else {
            newRegion = "Seoul";
          }
        }
      }
      
      // 지역 상태 업데이트
      if (newRegion) {
        setRegion(newRegion);
        sessionStorage.setItem('feedRegion', newRegion);
      }
      
      // 날짜 상태 업데이트
      if (passedDate) {
        setDateState(newDateState);
        const dateStr = `${newDateState.year}-${String(newDateState.month).padStart(2, '0')}-${String(newDateState.day).padStart(2, '0')}`;
        sessionStorage.setItem('feedDate', dateStr);
      }
      
      isInitialized.current = true; // 초기화 완료 표시
    }
    
    // user가 존재할 때만 설정 로직 실행
    if (user) {
        setupFeedConfiguration();
    }
  }, [user, location.state, getStoredRegion]); // 초기화는 한 번만 실행 

  // 날짜 상태 변경 시 세션스토리지에 저장(dateState가 바뀔 때마다 실행)
  useEffect(() => {
    const { year, month, day } = dateState;
    if (year && month && day) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      sessionStorage.setItem('feedDate', dateStr);
    }
  }, [dateState]);

  // 지역 상태 변경 시 세션스토리지에 저장(region이 바뀔 때마다 실행)
  useEffect(() => {
    if (region) {
      sessionStorage.setItem('feedRegion', region);
    }
  }, [region]);

  return { region, setRegion, dateState, setDateState };
}
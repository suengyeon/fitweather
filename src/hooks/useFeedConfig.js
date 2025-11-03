import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase"; 

/**
 * 선택된 날짜의 연도, 월, 일 객체를 반환합니다.
 * @param {boolean} isFromHome - 홈에서 진입했는지 여부
 * @returns {{year: number, month: number, day: number}}
 */
const initializeDateState = (isFromHome, locationState) => {
  // 홈에서 직접 들어온 경우 세션스토리지 클리어 및 오늘 날짜 사용
  if (isFromHome) {
    sessionStorage.removeItem('feedDate');
    sessionStorage.removeItem('feedRegion'); // 지역 정보도 클리어
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


  // 기본적으로는 오늘 날짜
  const today = new Date();
  return {
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    day: today.getDate()
  };
};

/**
 * 지역 설정 및 세션스토리지 관리를 담당하는 커스텀 훅입니다.
 * @param {object} user - 현재 인증된 사용자 객체
 * @returns {{region: string, setRegion: function, dateState: object, setDateState: function}}
 */
export function useFeedConfig(user) {
  const location = useLocation();
  const isFromHome = !location.state?.fromCard && !location.state?.fromDetail;

  const initialDateState = initializeDateState(isFromHome, location.state);
  const [dateState, setDateState] = useState(initialDateState);
  const [region, setRegion] = useState("");

  // 세션스토리지에서 지역 정보 가져오기 (외부에서 사용되지 않으므로 내부 함수로 전환)
  const getStoredRegion = useCallback(() => {
    const stored = sessionStorage.getItem('feedRegion');
    return stored || "";
  }, []);

  // 사용자 기본 지역 및 세션스토리지 복구 로직
  useEffect(() => {
    async function setupFeedConfiguration() {
      if (!user) return;

      const storedRegion = getStoredRegion();
      const fromDetail = location.state?.fromDetail;
      const passedRegion = location.state?.region;
      const passedDate = location.state?.year && location.state?.month && location.state?.day;

      let newRegion = storedRegion;
      let newDateState = dateState; // 현재 상태 유지

      // 1. FeedDetail에서 돌아온 경우
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
        // 지역 및 날짜가 설정되었다면 세션스토리지 저장 로직으로 이동

      // 2. 일반적인 진입 또는 새로고침
      } else {
        if (!storedRegion) {
          // 저장된 지역이 없으면 사용자 기본 지역 사용
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            newRegion = userSnap.data().region || "Seoul";
          } else {
            newRegion = "Seoul";
          }
        }
      }
      
      // 상태 업데이트 및 세션스토리지 저장
      if (newRegion && newRegion !== region) {
        setRegion(newRegion);
        sessionStorage.setItem('feedRegion', newRegion);
      }
      if (newDateState !== dateState) {
        setDateState(newDateState);
        const dateStr = `${newDateState.year}-${String(newDateState.month).padStart(2, '0')}-${String(newDateState.day).padStart(2, '0')}`;
        sessionStorage.setItem('feedDate', dateStr);
      }
    }
    
    // 지역 상태가 이미 설정되어 있으면 (첫 렌더링 이후 업데이트를 막기 위해)
    // 혹은 user가 없으면 실행하지 않습니다.
    if (user) {
        setupFeedConfiguration();
    }
  }, [user, location.state, getStoredRegion, region, dateState]); // region, dateState를 의존성 배열에 추가하여 상태 설정 후 저장 로직 실행

  // 날짜 상태 변경 시 세션스토리지에 저장 (컴포넌트의 로직 유지)
  useEffect(() => {
    const { year, month, day } = dateState;
    if (year && month && day) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      sessionStorage.setItem('feedDate', dateStr);
    }
  }, [dateState]);

  // 지역 상태 변경 시 세션스토리지에 저장 (컴포넌트의 로직 유지)
  useEffect(() => {
    if (region) {
      sessionStorage.setItem('feedRegion', region);
    }
  }, [region]);

  return { region, setRegion, dateState, setDateState };
}
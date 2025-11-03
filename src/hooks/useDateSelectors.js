import { useMemo } from 'react';

// 연도와 월에 따른 일 수 계산 함수 (기존 로직)
const getDaysInMonth = (year, month) => {
  if (year === 0 || month === 0) return 31; // 초기값 안전 처리
  // new Date(year, month, 0).getDate()는 'month'의 마지막 날짜(일)을 반환
  return new Date(year, month, 0).getDate(); 
};

/**
 * 날짜 선택 드롭다운 옵션 및 핸들러를 제공하는 커스텀 훅
 * @param {object} dateState - { year, month, day } 형태의 날짜 상태
 * @param {Function} setDateState - dateState를 업데이트하는 함수
 * @returns {{years: Array<number>, months: Array<number>, days: Array<number>, handleDateChange: Function}}
 */
export function useDateSelectors(dateState, setDateState) {
  
  // 연도 옵션 생성 (최근 5년)
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  }, []);

  // 월 옵션 생성 (1월 ~ 12월)
  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => i + 1);
  }, []);

  // 선택된 연도와 월에 따른 일 수 옵션 생성
  const days = useMemo(() => {
    const maxDays = getDaysInMonth(dateState.year, dateState.month);
    return Array.from({ length: maxDays }, (_, i) => i + 1);
  }, [dateState.year, dateState.month]);

  // 날짜 드롭다운 핸들러 (기존 로직 유지)
  const handleDateChange = (type, value) => {
    setDateState(prev => {
      const newDateState = { ...prev, [type]: value };

      // 월이나 연도가 바뀌면 일(day)을 확인하여 유효성을 보장
      if (type === 'month' || type === 'year') {
        const daysInMonth = getDaysInMonth(newDateState.year, newDateState.month);
        
        // 새로운 월의 최대 일 수를 초과하면 최대 일로 설정
        if (newDateState.day > daysInMonth) {
          newDateState.day = daysInMonth;
        }
      }

      return newDateState;
    });
  };

  return { years, months, days, handleDateChange };
}
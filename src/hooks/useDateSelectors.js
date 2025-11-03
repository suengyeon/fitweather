import { useMemo } from 'react';

/**
 * 연도와 월에 따른 일 수 계산 함수
 */
const getDaysInMonth = (year, month) => {
  if (year === 0 || month === 0) return 31; // 초기값 안전 처리
  // new Date(year, month, 0)는 'month - 1'의 마지막 날짜(일) 반환
  return new Date(year, month, 0).getDate(); 
};

/**
 * 날짜 선택 드롭다운 옵션 및 핸들러를 제공하는 커스텀 훅
 */
export function useDateSelectors(dateState, setDateState) {
  
  // 연도 옵션 생성(최근 5년)
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  }, []);

  // 월 옵션 생성(1월 ~ 12월)
  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => i + 1);
  }, []);

  // 선택된 연도와 월에 따른 일 수 옵션 생성(dateState.year, month 변경 시 재계산)
  const days = useMemo(() => {
    const maxDays = getDaysInMonth(dateState.year, dateState.month);
    return Array.from({ length: maxDays }, (_, i) => i + 1);
  }, [dateState.year, dateState.month]);

  // 날짜 드롭다운 핸들러(type : 'year', 'month', 'day')
  const handleDateChange = (type, value) => {
    setDateState(prev => {
      const newDateState = { ...prev, [type]: value };

      // 월이나 연도가 바뀌면 일(day)의 유효성 검사
      if (type === 'month' || type === 'year') {
        const daysInMonth = getDaysInMonth(newDateState.year, newDateState.month);
        
        // 새로운 월의 최대 일 수를 초과하면 최대 일로 조정
        if (newDateState.day > daysInMonth) {
          newDateState.day = daysInMonth;
        }
      }

      return newDateState;
    });
  };

  return { years, months, days, handleDateChange };
}
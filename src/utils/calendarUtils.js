/**
 * 날짜를 'YYYY-MM-DD' 형식의 로컬 문자열로 포맷합니다.
 * react-calendar와 Firestore 기록의 날짜 키를 일치시키는 데 사용됩니다.
 * 예: 2024-05-15
 */
export function formatDateLocal(date) {
  return date.toLocaleDateString("sv-SE");
}

/**
 * 캘린더에서 드롭다운(Dropdown) 등으로 사용할 수 있는 연도 배열입니다.
 * 현재 연도(2025년 기준)를 중심으로 5개 연도를 생성합니다.
 */
const CURRENT_YEAR = new Date().getFullYear();
export const years = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 2 + i);

/**
 * 캘린더에서 드롭다운으로 사용할 수 있는 월 배열입니다.
 * 0부터 11까지의 월 값과 한국어 레이블을 포함합니다.
 */
export const months = [
  { label: "1월", value: 0 },
  { label: "2월", value: 1 },
  { label: "3월", value: 2 },
  { label: "4월", value: 3 },
  { label: "5월", value: 4 },
  { label: "6월", value: 5 },
  { label: "7월", value: 6 },
  { label: "8월", value: 7 },
  { label: "9월", value: 8 },
  { label: "10월", value: 9 },
  { label: "11월", value: 10 },
  { label: "12월", value: 11 },
];
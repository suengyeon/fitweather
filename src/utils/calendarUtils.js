/**
 * 날짜를 'YYYY-MM-DD' 형식의 로컬 문자열로 포맷
 * react-calendar와 Firestore 기록의 날짜 키를 일치시키는 데 사용
 */
export function formatDateLocal(date) {
  // "sv-SE" 로케일은 ISO 8601 형식(YYYY-MM-DD)을 따르므로 사용
  return date.toLocaleDateString("sv-SE"); 
}

/**
 * 캘린더에서 드롭다운(Dropdown) 등으로 사용할 수 있는 연도 배열
 * 현재 연도(2025년 기준)를 중심으로 5개 연도를 생성
 */
const CURRENT_YEAR = new Date().getFullYear();
// 현재 연도를 기준으로 -2년에서 +2년까지 총 5개 연도를 생성
export const years = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 2 + i);

/**
 * 캘린더에서 드롭다운으로 사용할 수 있는 월 배열
 * value는 Date 객체에서 사용하는 0(1월)부터 11(12월)까지의 값 포함
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
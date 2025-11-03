/**
 * 추천/피드 페이지 필터링 로직 및 상수 모음
 */

// 1. 계절 코드 ↔ 한글 레이블 매핑
export const seasonMap = {
  earlyspring: "초봄",
  spring: "봄",
  latespring: "늦봄",
  earlysummer: "초여름",
  summer: "여름",
  latesummer: "늦여름",
  earlyautumn: "초가을",
  autumn: "가을",
  lateautumn: "늦가을",
  earlywinter: "초겨울",
  winter: "겨울",
  latewinter: "늦겨울",
};

/**
 * 계절 코드를 정규화된 한글 레이블로 변환(값 없으면 빈 문자열 반환)
 */
export const normalizeSeason = (value) => (value ? (seasonMap[value] || value) : "");

// 2. 스타일 코드 ↔ 별칭 매핑
export const styleAliases = {
  casual: ["casual", "캐주얼"],
  basic: ["basic", "베이직/놈코어"],
  formal: ["formal", "포멀"],
  sporty: ["sporty", "스포티", "액티브", "스포티/액티브"],
  street: ["street", "시크", "스트릿", "시크/스트릿"],
  feminine: ["feminine", "러블리", "페미닌", "러블리/페미닌"],
};

/**
 * 기록의 스타일 필드가 필터 키와 일치하는지 확인(다중/단일 스타일 기록 모두 대응 가능)
 */
export const matchesStyle = (recordStyleField, filterKey) => {
  if (!filterKey) return true; // 필터 키가 없으면 항상 true(필터 적용 안 함)

  // 필터 키에 해당하는 별칭 목록(wanted) 가져옴
  const wanted = styleAliases[filterKey] || [filterKey];
  
  // 개별 스타일이 원하는 별칭 목록에 포함되는지 확인하는 함수(대소문자 무시)
  const checkOne = (s) =>
    !!wanted.find((w) => String(s).toLowerCase() === String(w).toLowerCase());

  // 1. 스타일이 배열 형태인 경우(다중 스타일 기록)
  if (Array.isArray(recordStyleField)) {
    return recordStyleField.some(checkOne); // 배열 요소 중 하나라도 일치하면 true
  }
  
  // 2. 스타일이 단일 문자열 형태인 경우
  if (recordStyleField == null) return false;
  return checkOne(recordStyleField); // 단일 값 일치 여부 반환
};
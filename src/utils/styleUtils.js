/**
 * 스타일 관련 유틸리티 함수들
 */

/**
 * 스타일 코드(영문)를 한국어 라벨로 변환
 */
export function getStyleLabel(style) {
  const styleLabels = {
    'casual': '캐주얼',
    'formal': '포멀',
    'basic': '베이직/놈코어',
    'sporty': '스포티/액티브',
    'feminine': '러블리/페미닌',
    'street': '시크/스트릿'
  };
  // 매핑된 값이 없으면 원본 스타일 코드 반환
  return styleLabels[style] || style;
}

/**
 * 스타일 라벨(한국어)을 코드로 역변환
 */
export function getStyleCode(label) {
  const labelToCode = {
    '캐주얼': 'casual',
    '포멀': 'formal',
    '베이직/놈코어': 'basic',
    '스포티/액티브': 'sporty',
    '러블리/페미닌': 'feminine',
    '시크/스트릿': 'street'
  };
  // 매핑된 값이 없으면 원본 라벨 반환
  return labelToCode[label] || label;
}

/**
 * 모든 스타일 옵션 배열 반환 (UI 컴포넌트 드롭다운 등에 사용)
 */
export function getAllStyleOptions() {
  return [
    { value: 'casual', label: '캐주얼' },
    { value: 'formal', label: '포멀' },
    { value: 'basic', label: '베이직/놈코어' },
    { value: 'sporty', label: '스포티/액티브' },
    { value: 'feminine', label: '러블리/페미닌' },
    { value: 'street', label: '시크/스트릿' }
  ];
}
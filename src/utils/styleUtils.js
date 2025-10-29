/**
 * 스타일 관련 유틸리티 함수들
 */

/**
 * 스타일 라벨 변환
 * @param {string} style - 스타일 코드
 * @returns {string} 한국어 라벨
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
  return styleLabels[style] || style;
}

/**
 * 스타일 라벨을 코드로 역변환
 * @param {string} label - 한국어 라벨
 * @returns {string} 스타일 코드
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
  return labelToCode[label] || label;
}

/**
 * 스타일 이모지 반환
 * @param {string} style - 스타일 코드
 * @returns {string} 이모지
 */
export function getStyleEmoji(style) {
  const styleEmojis = {
    'casual': '👕',
    'formal': '👔',
    'basic': '👖',
    'sporty': '🏃',
    'feminine': '👗',
    'street': '🕶️'
  };
  return styleEmojis[style] || '👕';
}

/**
 * 모든 스타일 옵션 반환
 * @returns {Array} 스타일 옵션 배열
 */
export function getAllStyleOptions() {
  return [
    { value: 'casual', label: '캐주얼', emoji: '👕' },
    { value: 'formal', label: '포멀', emoji: '👔' },
    { value: 'basic', label: '베이직/놈코어', emoji: '👖' },
    { value: 'sporty', label: '스포티/액티브', emoji: '🏃' },
    { value: 'feminine', label: '러블리/페미닌', emoji: '👗' },
    { value: 'street', label: '시크/스트릿', emoji: '🕶️' }
  ];
}

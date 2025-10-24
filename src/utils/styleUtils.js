/**
 * 스타일 관련 유틸리티 함수들
 */

/**
 * 스타일 유사도 계산
 * @param {string} style1 - 첫 번째 스타일
 * @param {string} style2 - 두 번째 스타일
 * @returns {number} 유사도 점수 (0-1)
 */
export function calculateStyleSimilarity(style1, style2) {
  if (!style1 || !style2) return 0;
  if (style1 === style2) return 1;

  // 스타일 유사도 매핑
  const styleGroups = {
    'casual': ['basic', 'minimal'],
    'formal': ['business', 'elegant'],
    'basic': ['casual', 'minimal'],
    'sporty': ['active', 'athletic'],
    'feminine': ['romantic', 'girly'],
    'street': ['urban', 'hip-hop']
  };
  
  console.log(`🔍 스타일 유사도 계산: ${style1} vs ${style2}`);

  // 같은 그룹 내 스타일은 유사도 0.7
  for (const [group, styles] of Object.entries(styleGroups)) {
    if (styles.includes(style1.toLowerCase()) && styles.includes(style2.toLowerCase())) {
      return 0.7;
    }
    if (style1.toLowerCase() === group && styles.includes(style2.toLowerCase())) {
      return 0.7;
    }
    if (style2.toLowerCase() === group && styles.includes(style1.toLowerCase())) {
      return 0.7;
    }
  }

  return 0;
}

/**
 * 스타일 그룹 가져오기
 * @param {string} style - 스타일명
 * @returns {Array} 해당 스타일이 속한 그룹들
 */
export function getStyleGroups(style) {
  const styleGroups = {
    'casual': ['basic', 'minimal'],
    'formal': ['business', 'elegant'],
    'basic': ['casual', 'minimal'],
    'sporty': ['active', 'athletic'],
    'feminine': ['romantic', 'girly'],
    'street': ['urban', 'hip-hop']
  };
  
  const groups = [];
  for (const [group, styles] of Object.entries(styleGroups)) {
    if (styles.includes(style.toLowerCase()) || group === style.toLowerCase()) {
      groups.push(group);
    }
  }
  
  return groups;
}

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
    'street': '시크/스트릿',
    'minimal': '미니멀',
    'business': '비즈니스',
    'elegant': '엘레강트',
    'active': '액티브',
    'athletic': '애슬레틱',
    'romantic': '로맨틱',
    'girly': '걸리',
    'urban': '어반',
    'hip-hop': '힙합'
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
    '시크/스트릿': 'street',
    '미니멀': 'minimal',
    '비즈니스': 'business',
    '엘레강트': 'elegant',
    '액티브': 'active',
    '애슬레틱': 'athletic',
    '로맨틱': 'romantic',
    '걸리': 'girly',
    '어반': 'urban',
    '힙합': 'hip-hop'
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
    'street': '🕶️',
    'minimal': '⚪',
    'business': '💼',
    'elegant': '✨',
    'active': '🏃‍♀️',
    'athletic': '🏋️',
    'romantic': '💕',
    'girly': '🌸',
    'urban': '🏙️',
    'hip-hop': '🎧'
  };
  
  return styleEmojis[style] || '👕';
}

/**
 * 스타일 색상 반환
 * @param {string} style - 스타일 코드
 * @returns {string} 색상 코드
 */
export function getStyleColor(style) {
  const styleColors = {
    'casual': '#98FB98',
    'formal': '#4A90E2',
    'basic': '#87CEEB',
    'sporty': '#FF6B6B',
    'feminine': '#FFB6C1',
    'street': '#2C3E50',
    'minimal': '#F5F5F5',
    'business': '#34495E',
    'elegant': '#E8B4B8',
    'active': '#FF8C00',
    'athletic': '#FF4500',
    'romantic': '#FF69B4',
    'girly': '#FFB6C1',
    'urban': '#708090',
    'hip-hop': '#000000'
  };
  
  return styleColors[style] || '#98FB98';
}

/**
 * 모든 스타일 옵션 반환
 * @returns {Array} 스타일 옵션 배열
 */
export function getAllStyleOptions() {
  return [
    { value: 'casual', label: '캐주얼', emoji: '👕', color: '#98FB98' },
    { value: 'formal', label: '포멀', emoji: '👔', color: '#4A90E2' },
    { value: 'basic', label: '베이직/놈코어', emoji: '👖', color: '#87CEEB' },
    { value: 'sporty', label: '스포티/액티브', emoji: '🏃', color: '#FF6B6B' },
    { value: 'feminine', label: '러블리/페미닌', emoji: '👗', color: '#FFB6C1' },
    { value: 'street', label: '시크/스트릿', emoji: '🕶️', color: '#2C3E50' }
  ];
}

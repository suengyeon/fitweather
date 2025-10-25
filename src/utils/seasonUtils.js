// 절기 계산 및 날씨 관련 유틸리티

/**
 * 12절기 기반 계절 구분
 * @param {Date} date - 날짜 객체
 * @returns {Object} 절기 정보
 */
export function getSeasonInfo(date = new Date()) {
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();
  
  // 12절기 기반 계절 구분
  const seasonMap = {
    // 봄 (3-5월)
    3: { season: 'spring', period: 'early', label: '초봄', emoji: '🌸' },
    4: { season: 'spring', period: 'mid', label: '늦봄', emoji: '🌺' },
    5: { season: 'spring', period: 'late', label: '늦봄', emoji: '🌺' },
    
    // 여름 (6-8월)
    6: { season: 'summer', period: 'early', label: '초여름', emoji: '☀️' },
    7: { season: 'summer', period: 'mid', label: '한여름', emoji: '🔥' },
    8: { season: 'summer', period: 'late', label: '늦여름', emoji: '🌞' },
    
    // 가을 (9-11월)
    9: { season: 'autumn', period: 'early', label: '초가을', emoji: '🍂' },
    10: { season: 'autumn', period: 'early', label: '초가을', emoji: '🍂' },
    11: { season: 'autumn', period: 'late', label: '늦가을', emoji: '🍁' },
    
    // 겨울 (12-2월)
    12: { season: 'winter', period: 'early', label: '초겨울', emoji: '❄️' },
    1: { season: 'winter', period: 'mid', label: '한겨울', emoji: '🥶' },
    2: { season: 'winter', period: 'late', label: '늦겨울', emoji: '🌨️' }
  };
  
  return seasonMap[month] || { season: 'unknown', period: 'unknown', label: '알 수 없음', emoji: '❓' };
}

/**
 * 시간대 구분 (아침/점심/저녁)
 * @param {Date} date - 날짜 객체
 * @returns {Object} 시간대 정보
 */
export function getTimePeriod(date = new Date()) {
  const hour = date.getHours();
  
  if (hour >= 5 && hour < 12) {
    return { period: 'morning', label: '아침', emoji: '🌅' };
  } else if (hour >= 12 && hour < 18) {
    return { period: 'afternoon', label: '점심', emoji: '☀️' };
  } else {
    return { period: 'evening', label: '저녁', emoji: '🌆' };
  }
}

/**
 * 온도 기반 체감 온도 구분
 * @param {number} temp - 온도 (섭씨)
 * @param {number} humidity - 습도 (%)
 * @param {number} windSpeed - 풍속 (m/s)
 * @returns {Object} 체감 온도 정보
 */
export function getFeelingTemperature(temp, humidity = 50, windSpeed = 0) {
  // 간단한 체감온도 계산 (실제로는 더 복잡한 공식 사용 가능)
  let feelsLike = temp;
  
  // 습도 영향 (습도가 높으면 더 덥게 느껴짐)
  if (temp > 20) {
    feelsLike += (humidity - 50) * 0.1;
  }
  
  // 풍속 영향 (바람이 강하면 더 춥게 느껴짐)
  feelsLike -= windSpeed * 0.5;
  
  // 체감 온도 구간별 분류
  if (feelsLike < 0) {
    return { level: 'very_cold', label: '매우 추움', emoji: '🥶', color: '#4A90E2' };
  } else if (feelsLike < 10) {
    return { level: 'cold', label: '추움', emoji: '❄️', color: '#7BB3F0' };
  } else if (feelsLike < 20) {
    return { level: 'cool', label: '시원함', emoji: '🌬️', color: '#87CEEB' };
  } else if (feelsLike < 25) {
    return { level: 'comfortable', label: '적당함', emoji: '😊', color: '#98FB98' };
  } else if (feelsLike < 30) {
    return { level: 'warm', label: '따뜻함', emoji: '☀️', color: '#FFB347' };
  } else {
    return { level: 'hot', label: '더움', emoji: '🔥', color: '#FF6B6B' };
  }
}

// 스타일 관련 함수들은 styleUtils.js로 이동

/**
 * 옷 카테고리 정규화
 */
export const CLOTHING_CATEGORIES = {
  outer: {
    label: '아우터',
    items: ['코트', '자켓', '가디건', '후드티', '블레이저', '패딩', '야상', '트렌치코트', '니트', '맨투맨']
  },
  top: {
    label: '상의',
    items: ['티셔츠', '셔츠', '블라우스', '니트', '후드티', '맨투맨', '폴로셔츠', '탱크톱', '긴팔티', '반팔티']
  },
  bottom: {
    label: '하의',
    items: ['청바지', '슬랙스', '치마', '반바지', '트레이닝복', '레깅스', '정장바지', '데님', '코튼팬츠', '스커트']
  },
  shoes: {
    label: '신발',
    items: ['운동화', '구두', '부츠', '샌들', '로퍼', '힐', '스니커즈', '워커', '플랫슈즈', '슬리퍼']
  },
  acc: {
    label: '액세서리',
    items: ['모자', '가방', '시계', '목걸이', '귀걸이', '반지', '스카프', '벨트', '선글라스', '장갑']
  }
};


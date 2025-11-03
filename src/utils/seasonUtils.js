/**
 * 12절기 기반 계절 구분
 */
export function getSeasonInfo(date = new Date()) {
  const month = date.getMonth() + 1; // 1-12
  
  // 12절기 기반 계절 구분
  const seasonMap = {
    // 봄(3-5월)
    3: { season: 'spring', period: 'early', label: '초봄', emoji: '🌸' },
    4: { season: 'spring', period: 'mid', label: '늦봄', emoji: '🌺' },
    5: { season: 'spring', period: 'late', label: '늦봄', emoji: '🌺' },
    
    // 여름(6-8월)
    6: { season: 'summer', period: 'early', label: '초여름', emoji: '☀️' },
    7: { season: 'summer', period: 'mid', label: '한여름', emoji: '🔥' },
    8: { season: 'summer', period: 'late', label: '늦여름', emoji: '🌞' },
    
    // 가을(9-11월)
    9: { season: 'autumn', period: 'early', label: '초가을', emoji: '🍂' },
    10: { season: 'autumn', period: 'early', label: '초가을', emoji: '🍂' },
    11: { season: 'autumn', period: 'late', label: '늦가을', emoji: '🍁' },
    
    // 겨울(12-2월)
    12: { season: 'winter', period: 'early', label: '초겨울', emoji: '❄️' },
    1: { season: 'winter', period: 'mid', label: '한겨울', emoji: '🥶' },
    2: { season: 'winter', period: 'late', label: '늦겨울', emoji: '🌨️' }
  };
  
  return seasonMap[month] || { season: 'unknown', period: 'unknown', label: '알 수 없음', emoji: '❓' };
}
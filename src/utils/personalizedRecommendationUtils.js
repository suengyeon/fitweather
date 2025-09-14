// 개인화된 추천 시스템

import { getOutfitRecommendation } from './recommendationUtils';
import { analyzeUserPatterns, analyzeCommunityPatterns } from './userAnalysisUtils';
import { STYLE_TAGS } from './seasonUtils';

/**
 * 개인화된 추천 생성
 * @param {Object} conditions - 날씨 조건
 * @param {string} uid - 사용자 ID
 * @param {string} region - 지역
 * @returns {Object} 개인화된 추천 결과
 */
export async function getPersonalizedRecommendation(conditions, uid, region) {
  try {
    // 기본 추천 생성
    const baseRecommendation = getOutfitRecommendation(conditions);
    
    // 사용자 패턴 분석
    const userPatterns = await analyzeUserPatterns(uid, 30);
    
    // 집단 패턴 분석
    const communityPatterns = await analyzeCommunityPatterns(region, 7);
    
    // 개인화 적용
    const personalizedRecommendation = applyPersonalization(
      baseRecommendation,
      userPatterns,
      communityPatterns,
      conditions
    );
    
    return {
      ...personalizedRecommendation,
      personalization: {
        userPatterns,
        communityPatterns,
        personalizationScore: calculatePersonalizationScore(userPatterns, communityPatterns)
      }
    };
  } catch (error) {
    console.error('개인화 추천 생성 오류:', error);
    return getOutfitRecommendation(conditions);
  }
}

/**
 * 개인화 적용
 */
function applyPersonalization(baseRecommendation, userPatterns, communityPatterns, conditions) {
  let personalizedItems = { ...baseRecommendation.recommendedItems };
  
  // 1. 사용자 선호 스타일 적용
  if (userPatterns.preferredStyles.length > 0) {
    const topStyle = userPatterns.preferredStyles[0];
    if (topStyle.totalScore > 3) { // 충분한 데이터가 있을 때만 적용
      personalizedItems = applyStylePreference(personalizedItems, topStyle.style);
    }
  }
  
  // 2. 사용자 자주 사용하는 아이템 우선순위 적용
  if (userPatterns.frequentItems) {
    personalizedItems = applyFrequentItems(personalizedItems, userPatterns.frequentItems);
  }
  
  // 3. 온도 선호도 적용
  if (userPatterns.temperaturePreferences.length > 0) {
    personalizedItems = applyTemperaturePreference(
      personalizedItems, 
      userPatterns.temperaturePreferences, 
      conditions
    );
  }
  
  // 4. 집단 트렌드 적용
  if (communityPatterns.popularStyles.length > 0) {
    personalizedItems = applyCommunityTrends(
      personalizedItems, 
      communityPatterns, 
      conditions
    );
  }
  
  // 5. 개인화된 팁 생성
  const personalizedTips = generatePersonalizedTips(
    userPatterns, 
    communityPatterns, 
    baseRecommendation.tips
  );
  
  return {
    ...baseRecommendation,
    recommendedItems: personalizedItems,
    tips: personalizedTips,
    personalizationApplied: true
  };
}

/**
 * 스타일 선호도 적용
 */
function applyStylePreference(items, preferredStyle) {
  const styleRules = {
    formal: {
      outer: ['자켓', '블레이저', '코트'],
      top: ['셔츠', '블라우스'],
      bottom: ['슬랙스', '정장바지'],
      shoes: ['구두', '로퍼', '힐'],
      acc: ['시계', '벨트']
    },
    casual: {
      outer: ['후드티', '가디건', '자켓'],
      top: ['티셔츠', '긴팔티', '반팔티'],
      bottom: ['청바지', '코튼팬츠'],
      shoes: ['운동화', '스니커즈'],
      acc: ['모자', '가방']
    },
    sport: {
      outer: ['후드티', '야상'],
      top: ['티셔츠', '탱크톱'],
      bottom: ['트레이닝복', '레깅스'],
      shoes: ['운동화', '스니커즈'],
      acc: ['모자', '장갑']
    },
    date: {
      outer: ['자켓', '가디건'],
      top: ['셔츠', '블라우스', '니트'],
      bottom: ['청바지', '슬랙스', '치마'],
      shoes: ['구두', '로퍼', '힐'],
      acc: ['목걸이', '귀걸이']
    }
  };
  
  const styleItems = styleRules[preferredStyle];
  if (!styleItems) return items;
  
  // 각 카테고리에서 선호 스타일 아이템을 우선순위로 배치
  const personalizedItems = { ...items };
  Object.keys(styleItems).forEach(category => {
    if (personalizedItems[category]) {
      const styleCategoryItems = styleItems[category];
      const existingItems = personalizedItems[category];
      
      // 선호 스타일 아이템을 앞으로 이동
      const reorderedItems = [
        ...existingItems.filter(item => styleCategoryItems.includes(item)),
        ...existingItems.filter(item => !styleCategoryItems.includes(item))
      ];
      
      personalizedItems[category] = reorderedItems;
    }
  });
  
  return personalizedItems;
}

/**
 * 자주 사용하는 아이템 적용
 */
function applyFrequentItems(items, frequentItems) {
  const personalizedItems = { ...items };
  
  Object.keys(frequentItems).forEach(category => {
    if (personalizedItems[category] && frequentItems[category].length > 0) {
      const frequentCategoryItems = frequentItems[category]
        .filter(item => item.count > 1) // 2번 이상 사용한 아이템만
        .map(item => item.item);
      
      if (frequentCategoryItems.length > 0) {
        const existingItems = personalizedItems[category];
        
        // 자주 사용하는 아이템을 앞으로 이동
        const reorderedItems = [
          ...existingItems.filter(item => frequentCategoryItems.includes(item)),
          ...existingItems.filter(item => !frequentCategoryItems.includes(item))
        ];
        
        personalizedItems[category] = reorderedItems;
      }
    }
  });
  
  return personalizedItems;
}

/**
 * 온도 선호도 적용
 */
function applyTemperaturePreference(items, temperaturePreferences, conditions) {
  // 현재 체감온도와 가장 유사한 온도 구간 찾기
  const currentTemp = conditions.temp;
  const similarPreference = temperaturePreferences.find(pref => 
    Math.abs(getTemperatureValue(pref.level) - currentTemp) < 5
  );
  
  if (!similarPreference || similarPreference.comfortRatio < 0.7) {
    return items; // 충분한 데이터가 없으면 기본 추천 유지
  }
  
  // 온도 선호도가 높은 경우 해당 온도에 맞는 아이템 우선순위 조정
  return adjustItemsForTemperature(items, similarPreference.level);
}

/**
 * 온도 레벨을 숫자 값으로 변환
 */
function getTemperatureValue(level) {
  const tempMap = {
    very_cold: -10,
    cold: 0,
    cool: 10,
    comfortable: 20,
    warm: 25,
    hot: 30
  };
  return tempMap[level] || 20;
}

/**
 * 온도에 따른 아이템 조정
 */
function adjustItemsForTemperature(items, temperatureLevel) {
  const adjustments = {
    very_cold: {
      outer: ['패딩', '롱패딩', '야상'],
      acc: ['목도리', '장갑', '모자']
    },
    cold: {
      outer: ['코트', '자켓', '패딩'],
      acc: ['스카프', '장갑']
    },
    hot: {
      outer: [],
      top: ['반팔티', '탱크톱'],
      bottom: ['반바지', '짧은 치마'],
      acc: ['선글라스', '모자']
    }
  };
  
  const adjustment = adjustments[temperatureLevel];
  if (!adjustment) return items;
  
  const adjustedItems = { ...items };
  Object.keys(adjustment).forEach(category => {
    if (adjustedItems[category]) {
      const categoryItems = adjustment[category];
      const existingItems = adjustedItems[category];
      
      // 온도에 맞는 아이템을 앞으로 이동
      const reorderedItems = [
        ...existingItems.filter(item => categoryItems.includes(item)),
        ...existingItems.filter(item => !categoryItems.includes(item))
      ];
      
      adjustedItems[category] = reorderedItems;
    }
  });
  
  return adjustedItems;
}

/**
 * 집단 트렌드 적용
 */
function applyCommunityTrends(items, communityPatterns, conditions) {
  // 현재 날씨와 계절에 맞는 집단 트렌드 찾기
  const weatherTrends = communityPatterns.weatherOutfits[conditions.weather];
  if (!weatherTrends) return items;
  
  const personalizedItems = { ...items };
  
  Object.keys(weatherTrends).forEach(category => {
    if (personalizedItems[category] && weatherTrends[category]) {
      const popularItems = Object.keys(weatherTrends[category])
        .map(item => ({
          item,
          count: weatherTrends[category][item]
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3) // 상위 3개
        .map(item => item.item);
      
      if (popularItems.length > 0) {
        const existingItems = personalizedItems[category];
        
        // 인기 아이템을 앞으로 이동
        const reorderedItems = [
          ...existingItems.filter(item => popularItems.includes(item)),
          ...existingItems.filter(item => !popularItems.includes(item))
        ];
        
        personalizedItems[category] = reorderedItems;
      }
    }
  });
  
  return personalizedItems;
}

/**
 * 개인화된 팁 생성
 */
function generatePersonalizedTips(userPatterns, communityPatterns, baseTips) {
  const personalizedTips = [...baseTips];
  
  // 사용자 패턴 기반 팁
  if (userPatterns.comfortLevels.good > 0.8) {
    personalizedTips.push('😊 당신은 패션 감각이 뛰어나네요! 계속 멋진 스타일을 유지해보세요.');
  } else if (userPatterns.comfortLevels.bad > 0.3) {
    personalizedTips.push('💡 착장 피드백을 더 자세히 남겨주시면 더 정확한 추천을 드릴 수 있어요.');
  }
  
  // 자주 사용하는 아이템 기반 팁
  const frequentOuter = userPatterns.frequentItems.outer?.[0];
  if (frequentOuter && frequentOuter.count > 3) {
    personalizedTips.push(`🧥 ${frequentOuter.item}을(를) 자주 입으시는군요! 오늘도 고려해보세요.`);
  }
  
  // 집단 트렌드 기반 팁
  if (communityPatterns.popularStyles.length > 0) {
    const popularStyle = communityPatterns.popularStyles[0];
    if (popularStyle.popularity > 0.3) {
      const styleLabel = STYLE_TAGS[popularStyle.style]?.label || popularStyle.style;
      personalizedTips.push(`🔥 이 지역에서 ${styleLabel} 스타일이 인기예요!`);
    }
  }
  
  return personalizedTips;
}

/**
 * 개인화 점수 계산
 */
function calculatePersonalizationScore(userPatterns, communityPatterns) {
  let score = 0;
  
  // 사용자 데이터 풍부도
  if (userPatterns.totalRecords > 10) score += 0.3;
  else if (userPatterns.totalRecords > 5) score += 0.2;
  else if (userPatterns.totalRecords > 0) score += 0.1;
  
  // 스타일 선호도 명확도
  if (userPatterns.preferredStyles.length > 0) {
    const topStyle = userPatterns.preferredStyles[0];
    if (topStyle.totalScore > 5) score += 0.3;
    else if (topStyle.totalScore > 3) score += 0.2;
  }
  
  // 온도 선호도 명확도
  if (userPatterns.temperaturePreferences.length > 0) {
    const hasGoodComfort = userPatterns.temperaturePreferences.some(
      pref => pref.comfortRatio > 0.7
    );
    if (hasGoodComfort) score += 0.2;
  }
  
  // 집단 데이터 풍부도
  if (communityPatterns.totalRecords > 20) score += 0.2;
  else if (communityPatterns.totalRecords > 10) score += 0.1;
  
  return Math.min(score, 1.0);
}

/**
 * 추천 히스토리 저장
 * @param {string} uid - 사용자 ID
 * @param {Object} recommendation - 추천 결과
 * @param {Object} conditions - 추천 조건
 */
export async function saveRecommendationHistory(uid, recommendation, conditions) {
  try {
    // 추천 히스토리를 로컬 스토리지에 저장 (간단한 구현)
    const historyKey = `recommendation_history_${uid}`;
    const existingHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
    
    const historyItem = {
      id: Date.now(),
      timestamp: new Date(),
      conditions,
      recommendation: {
        season: recommendation.season,
        feelingTemperature: recommendation.feelingTemperature,
        recommendedItems: recommendation.recommendedItems,
        confidence: recommendation.confidence
      },
      personalizationScore: recommendation.personalization?.personalizationScore || 0
    };
    
    // 최근 50개만 유지
    const newHistory = [historyItem, ...existingHistory].slice(0, 50);
    localStorage.setItem(historyKey, JSON.stringify(newHistory));
    
    return historyItem;
  } catch (error) {
    console.error('추천 히스토리 저장 오류:', error);
  }
}

/**
 * 추천 히스토리 조회
 * @param {string} uid - 사용자 ID
 * @returns {Array} 추천 히스토리
 */
export function getRecommendationHistory(uid) {
  try {
    const historyKey = `recommendation_history_${uid}`;
    return JSON.parse(localStorage.getItem(historyKey) || '[]');
  } catch (error) {
    console.error('추천 히스토리 조회 오류:', error);
    return [];
  }
}


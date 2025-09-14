// 사용자 기록 분석 및 개인화 추천 유틸리티

import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * 사용자의 과거 기록을 분석하여 패턴 추출
 * @param {string} uid - 사용자 ID
 * @param {number} days - 분석할 기간 (일)
 * @returns {Object} 사용자 패턴 분석 결과
 */
export async function analyzeUserPatterns(uid, days = 30) {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // 사용자 기록 조회
    const recordsRef = collection(db, 'records');
    const q = query(
      recordsRef,
      where('uid', '==', uid),
      where('createdAt', '>=', startDate),
      where('createdAt', '<=', endDate),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (records.length === 0) {
      return getDefaultUserPattern();
    }

    // 패턴 분석
    const patterns = {
      preferredStyles: analyzeStylePreferences(records),
      temperaturePreferences: analyzeTemperaturePreferences(records),
      seasonalPreferences: analyzeSeasonalPreferences(records),
      timePreferences: analyzeTimePreferences(records),
      comfortLevels: analyzeComfortLevels(records),
      frequentItems: analyzeFrequentItems(records),
      weatherAdaptations: analyzeWeatherAdaptations(records)
    };

    return {
      ...patterns,
      totalRecords: records.length,
      analysisPeriod: days,
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error('사용자 패턴 분석 오류:', error);
    return getDefaultUserPattern();
  }
}

/**
 * 스타일 선호도 분석
 */
function analyzeStylePreferences(records) {
  const styleCount = {};
  const styleComfort = {};

  records.forEach(record => {
    if (record.styleTags && Array.isArray(record.styleTags)) {
      record.styleTags.forEach(style => {
        styleCount[style] = (styleCount[style] || 0) + 1;
        
        // 편안함 정도와 연관성 분석
        if (record.structuredFeedback?.comfort) {
          if (!styleComfort[style]) {
            styleComfort[style] = { good: 0, okay: 0, bad: 0 };
          }
          styleComfort[style][record.structuredFeedback.comfort]++;
        }
      });
    }
  });

  // 선호도 점수 계산 (빈도 + 편안함)
  const preferences = Object.keys(styleCount).map(style => {
    const frequency = styleCount[style];
    const comfort = styleComfort[style];
    const comfortScore = comfort ? 
      (comfort.good * 3 + comfort.okay * 2 + comfort.bad * 1) / 
      (comfort.good + comfort.okay + comfort.bad) : 2;
    
    return {
      style,
      frequency,
      comfortScore,
      totalScore: frequency * comfortScore
    };
  });

  return preferences.sort((a, b) => b.totalScore - a.totalScore);
}

/**
 * 온도 선호도 분석
 */
function analyzeTemperaturePreferences(records) {
  const tempRanges = {
    very_cold: { count: 0, comfort: 0 },
    cold: { count: 0, comfort: 0 },
    cool: { count: 0, comfort: 0 },
    comfortable: { count: 0, comfort: 0 },
    warm: { count: 0, comfort: 0 },
    hot: { count: 0, comfort: 0 }
  };

  records.forEach(record => {
    if (record.feelingTemperature?.level) {
      const level = record.feelingTemperature.level;
      tempRanges[level].count++;
      
      if (record.structuredFeedback?.comfort === 'good') {
        tempRanges[level].comfort++;
      }
    }
  });

  // 각 온도 구간의 편안함 비율 계산
  const preferences = Object.keys(tempRanges).map(level => ({
    level,
    count: tempRanges[level].count,
    comfortRatio: tempRanges[level].count > 0 ? 
      tempRanges[level].comfort / tempRanges[level].count : 0
  }));

  return preferences.filter(p => p.count > 0);
}

/**
 * 계절별 선호도 분석
 */
function analyzeSeasonalPreferences(records) {
  const seasonCount = {};
  const seasonComfort = {};

  records.forEach(record => {
    if (record.seasonInfo?.season) {
      const season = record.seasonInfo.season;
      seasonCount[season] = (seasonCount[season] || 0) + 1;
      
      if (record.structuredFeedback?.comfort) {
        if (!seasonComfort[season]) {
          seasonComfort[season] = { good: 0, okay: 0, bad: 0 };
        }
        seasonComfort[season][record.structuredFeedback.comfort]++;
      }
    }
  });

  return Object.keys(seasonCount).map(season => ({
    season,
    count: seasonCount[season],
    comfort: seasonComfort[season] || { good: 0, okay: 0, bad: 0 }
  }));
}

/**
 * 시간대별 선호도 분석
 */
function analyzeTimePreferences(records) {
  const timeCount = { morning: 0, afternoon: 0, evening: 0 };
  const timeComfort = { morning: 0, afternoon: 0, evening: 0 };

  records.forEach(record => {
    if (record.timePeriod) {
      timeCount[record.timePeriod]++;
      if (record.structuredFeedback?.comfort === 'good') {
        timeComfort[record.timePeriod]++;
      }
    }
  });

  return Object.keys(timeCount).map(period => ({
    period,
    count: timeCount[period],
    comfortRatio: timeCount[period] > 0 ? 
      timeComfort[period] / timeCount[period] : 0
  }));
}

/**
 * 편안함 수준 분석
 */
function analyzeComfortLevels(records) {
  const comfortCount = { good: 0, okay: 0, bad: 0 };
  const totalRecords = records.length;

  records.forEach(record => {
    if (record.structuredFeedback?.comfort) {
      comfortCount[record.structuredFeedback.comfort]++;
    }
  });

  return {
    good: totalRecords > 0 ? comfortCount.good / totalRecords : 0,
    okay: totalRecords > 0 ? comfortCount.okay / totalRecords : 0,
    bad: totalRecords > 0 ? comfortCount.bad / totalRecords : 0,
    totalRecords
  };
}

/**
 * 자주 사용하는 아이템 분석
 */
function analyzeFrequentItems(records) {
  const itemCount = {
    outer: {},
    top: {},
    bottom: {},
    shoes: {},
    acc: {}
  };

  records.forEach(record => {
    if (record.outfit) {
      Object.keys(itemCount).forEach(category => {
        if (record.outfit[category] && Array.isArray(record.outfit[category])) {
          record.outfit[category].forEach(item => {
            itemCount[category][item] = (itemCount[category][item] || 0) + 1;
          });
        }
      });
    }
  });

  // 각 카테고리별 상위 아이템 추출
  const frequentItems = {};
  Object.keys(itemCount).forEach(category => {
    const items = Object.keys(itemCount[category]).map(item => ({
      item,
      count: itemCount[category][item]
    }));
    frequentItems[category] = items
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // 상위 5개
  });

  return frequentItems;
}

/**
 * 날씨 적응 패턴 분석
 */
function analyzeWeatherAdaptations(records) {
  const weatherPatterns = {};

  records.forEach(record => {
    if (record.weather?.icon && record.structuredFeedback?.comfort) {
      const weather = record.weather.icon;
      if (!weatherPatterns[weather]) {
        weatherPatterns[weather] = { good: 0, okay: 0, bad: 0, total: 0 };
      }
      weatherPatterns[weather][record.structuredFeedback.comfort]++;
      weatherPatterns[weather].total++;
    }
  });

  return Object.keys(weatherPatterns).map(weather => ({
    weather,
    comfortRatio: weatherPatterns[weather].total > 0 ? 
      weatherPatterns[weather].good / weatherPatterns[weather].total : 0,
    total: weatherPatterns[weather].total
  }));
}

/**
 * 기본 사용자 패턴 (기록이 없을 때)
 */
function getDefaultUserPattern() {
  return {
    preferredStyles: [
      { style: 'casual', frequency: 1, comfortScore: 2, totalScore: 2 }
    ],
    temperaturePreferences: [
      { level: 'comfortable', count: 1, comfortRatio: 1 }
    ],
    seasonalPreferences: [],
    timePreferences: [
      { period: 'afternoon', count: 1, comfortRatio: 1 }
    ],
    comfortLevels: { good: 0.8, okay: 0.2, bad: 0, totalRecords: 0 },
    frequentItems: {
      outer: [],
      top: [],
      bottom: [],
      shoes: [],
      acc: []
    },
    weatherAdaptations: [],
    totalRecords: 0,
    analysisPeriod: 30,
    lastUpdated: new Date()
  };
}

/**
 * 집단 데이터 분석 (모든 사용자 기록 기반)
 * @param {string} region - 지역
 * @param {number} days - 분석할 기간
 * @returns {Object} 집단 패턴 분석 결과
 */
export async function analyzeCommunityPatterns(region, days = 7) {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const recordsRef = collection(db, 'records');
    const q = query(
      recordsRef,
      where('region', '==', region),
      where('isPublic', '==', true),
      where('createdAt', '>=', startDate),
      where('createdAt', '<=', endDate),
      orderBy('createdAt', 'desc'),
      limit(100) // 최근 100개 기록만 분석
    );

    const snapshot = await getDocs(q);
    const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (records.length === 0) {
      return getDefaultCommunityPattern();
    }

    return {
      popularStyles: analyzePopularStyles(records),
      weatherOutfits: analyzeWeatherOutfits(records),
      seasonalTrends: analyzeSeasonalTrends(records),
      totalRecords: records.length,
      region,
      analysisPeriod: days
    };
  } catch (error) {
    console.error('집단 패턴 분석 오류:', error);
    return getDefaultCommunityPattern();
  }
}

/**
 * 인기 스타일 분석
 */
function analyzePopularStyles(records) {
  const styleCount = {};
  
  records.forEach(record => {
    if (record.styleTags && Array.isArray(record.styleTags)) {
      record.styleTags.forEach(style => {
        styleCount[style] = (styleCount[style] || 0) + 1;
      });
    }
  });

  return Object.keys(styleCount).map(style => ({
    style,
    count: styleCount[style],
    popularity: styleCount[style] / records.length
  })).sort((a, b) => b.count - a.count);
}

/**
 * 날씨별 인기 착장 분석
 */
function analyzeWeatherOutfits(records) {
  const weatherOutfits = {};

  records.forEach(record => {
    if (record.weather?.icon && record.outfit) {
      const weather = record.weather.icon;
      if (!weatherOutfits[weather]) {
        weatherOutfits[weather] = {
          outer: {},
          top: {},
          bottom: {},
          shoes: {},
          acc: {}
        };
      }

      Object.keys(record.outfit).forEach(category => {
        if (record.outfit[category] && Array.isArray(record.outfit[category])) {
          record.outfit[category].forEach(item => {
            weatherOutfits[weather][category][item] = 
              (weatherOutfits[weather][category][item] || 0) + 1;
          });
        }
      });
    }
  });

  return weatherOutfits;
}

/**
 * 계절별 트렌드 분석
 */
function analyzeSeasonalTrends(records) {
  const seasonTrends = {};

  records.forEach(record => {
    if (record.seasonInfo?.season) {
      const season = record.seasonInfo.season;
      if (!seasonTrends[season]) {
        seasonTrends[season] = {
          styles: {},
          items: { outer: {}, top: {}, bottom: {}, shoes: {}, acc: {} }
        };
      }

      // 스타일 트렌드
      if (record.styleTags) {
        record.styleTags.forEach(style => {
          seasonTrends[season].styles[style] = 
            (seasonTrends[season].styles[style] || 0) + 1;
        });
      }

      // 아이템 트렌드
      if (record.outfit) {
        Object.keys(record.outfit).forEach(category => {
          if (record.outfit[category]) {
            record.outfit[category].forEach(item => {
              seasonTrends[season].items[category][item] = 
                (seasonTrends[season].items[category][item] || 0) + 1;
            });
          }
        });
      }
    }
  });

  return seasonTrends;
}

/**
 * 기본 집단 패턴
 */
function getDefaultCommunityPattern() {
  return {
    popularStyles: [
      { style: 'casual', count: 1, popularity: 0.5 }
    ],
    weatherOutfits: {},
    seasonalTrends: {},
    totalRecords: 0,
    region: 'Seoul',
    analysisPeriod: 7
  };
}


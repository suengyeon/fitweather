// AI 추천 시스템을 위한 데이터 수집 및 분석 유틸리티

import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc,
  orderBy, 
  limit,
  getDoc,
  doc
} from 'firebase/firestore';

/**
 * 사용자 행동 데이터 수집
 */

// 사용자 상호작용 이벤트 로깅
export async function logUserInteraction(userId, interactionType, data) {
  try {
    const interactionData = {
      userId,
      interactionType, // 'view', 'like', 'comment', 'share', 'click', 'search'
      data: {
        ...data,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      createdAt: new Date()
    };

    // Firestore에 로그 저장
    const docRef = await addDoc(collection(db, 'userInteractions'), interactionData);
    return { id: docRef.id, ...interactionData };
  } catch (error) {
    console.error('사용자 상호작용 로깅 오류:', error);
    // 로깅 실패해도 앱 동작에는 영향 없음
  }
}

// 추천 결과에 대한 사용자 피드백 수집
export async function logRecommendationFeedback(userId, recommendationId, feedback) {
  try {
    const feedbackData = {
      userId,
      recommendationId,
      feedback: {
        type: feedback.type, // 'positive', 'negative', 'neutral'
        rating: feedback.rating, // 1-5 점수
        reason: feedback.reason, // 'too_hot', 'too_cold', 'not_my_style', 'perfect', etc.
        selectedItems: feedback.selectedItems || [], // 사용자가 선택한 아이템들
        ignoredItems: feedback.ignoredItems || [], // 사용자가 무시한 아이템들
        timestamp: new Date()
      },
      createdAt: new Date()
    };

    const docRef = await addDoc(collection(db, 'recommendationFeedback'), feedbackData);
    return { id: docRef.id, ...feedbackData };
  } catch (error) {
    console.error('추천 피드백 로깅 오류:', error);
  }
}

/**
 * 사용자 패턴 분석
 */

// 사용자 스타일 선호도 분석
export async function analyzeUserStylePreferences(userId, limitCount = 100) {
  try {
    const q = query(
      collection(db, 'records'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const records = [];
    
    querySnapshot.forEach((doc) => {
      records.push({ id: doc.id, ...doc.data() });
    });

    // 스타일 태그 빈도 분석
    const styleTagFrequency = {};
    const colorPreferences = {};
    const weatherPreferences = {};
    const timePreferences = {};

    records.forEach(record => {
      // 스타일 태그 분석
      if (record.styleTags) {
        record.styleTags.forEach(tag => {
          styleTagFrequency[tag] = (styleTagFrequency[tag] || 0) + 1;
        });
      }

      // 시간대 선호도 분석
      if (record.timePeriod) {
        timePreferences[record.timePeriod] = (timePreferences[record.timePeriod] || 0) + 1;
      }

      // 날씨별 선호도 분석
      if (record.weather) {
        const weatherKey = `${record.weather.temp}_${record.weather.icon}`;
        weatherPreferences[weatherKey] = (weatherPreferences[weatherKey] || 0) + 1;
      }

      // 착장에서 색상 추출 (간단한 키워드 기반)
      if (record.outfit) {
        const colors = extractColorsFromText(record.outfit);
        colors.forEach(color => {
          colorPreferences[color] = (colorPreferences[color] || 0) + 1;
        });
      }
    });

    return {
      totalRecords: records.length,
      styleTagFrequency,
      colorPreferences,
      weatherPreferences,
      timePreferences,
      analysisDate: new Date()
    };
  } catch (error) {
    console.error('사용자 스타일 선호도 분석 오류:', error);
    throw error;
  }
}

// 사용자 체감 온도 패턴 분석
export async function analyzeUserTemperaturePreferences(userId, limitCount = 100) {
  try {
    const q = query(
      collection(db, 'records'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const records = [];
    
    querySnapshot.forEach((doc) => {
      records.push({ id: doc.id, ...doc.data() });
    });

    const temperatureData = [];
    
    records.forEach(record => {
      if (record.weather && record.structuredFeedback) {
        temperatureData.push({
          actualTemp: record.weather.temp,
          feelingTemp: record.structuredFeedback.temperature,
          comfort: record.structuredFeedback.comfort,
          issues: record.structuredFeedback.issues,
          date: record.date,
          season: record.seasonInfo?.season
        });
      }
    });

    // 체감 온도 패턴 분석
    const tempPatterns = {};
    const comfortPatterns = {};
    const issuePatterns = {};

    temperatureData.forEach(data => {
      const tempRange = getTemperatureRange(data.actualTemp);
      const key = `${tempRange}_${data.season}`;
      
      if (!tempPatterns[key]) {
        tempPatterns[key] = {
          total: 0,
          comfortable: 0,
          tooHot: 0,
          tooCold: 0
        };
      }
      
      tempPatterns[key].total++;
      
      if (data.feelingTemp === 'comfortable') {
        tempPatterns[key].comfortable++;
      } else if (data.feelingTemp === 'too_hot') {
        tempPatterns[key].tooHot++;
      } else if (data.feelingTemp === 'too_cold') {
        tempPatterns[key].tooCold++;
      }

      // 편안함 패턴
      if (data.comfort) {
        comfortPatterns[data.comfort] = (comfortPatterns[data.comfort] || 0) + 1;
      }

      // 문제점 패턴
      if (data.issues) {
        data.issues.forEach(issue => {
          issuePatterns[issue] = (issuePatterns[issue] || 0) + 1;
        });
      }
    });

    return {
      totalRecords: temperatureData.length,
      tempPatterns,
      comfortPatterns,
      issuePatterns,
      rawData: temperatureData,
      analysisDate: new Date()
    };
  } catch (error) {
    console.error('사용자 온도 선호도 분석 오류:', error);
    throw error;
  }
}

/**
 * 커뮤니티 데이터 분석
 */

// 커뮤니티 스타일 트렌드 분석
export async function analyzeCommunityTrends(limitCount = 1000) {
  try {
    const q = query(
      collection(db, 'records'),
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const records = [];
    
    querySnapshot.forEach((doc) => {
      records.push({ id: doc.id, ...doc.data() });
    });

    // 스타일 트렌드 분석
    const styleTrends = {};
    const weatherStyleCorrelation = {};
    const seasonalTrends = {};
    const popularityMetrics = {};

    records.forEach(record => {
      const date = new Date(record.date);
      const month = date.getMonth();
      const season = record.seasonInfo?.season;

      // 스타일 태그 트렌드
      if (record.styleTags) {
        record.styleTags.forEach(tag => {
          if (!styleTrends[tag]) {
            styleTrends[tag] = {
              total: 0,
              byMonth: {},
              bySeason: {}
            };
          }
          
          styleTrends[tag].total++;
          styleTrends[tag].byMonth[month] = (styleTrends[tag].byMonth[month] || 0) + 1;
          
          if (season) {
            styleTrends[tag].bySeason[season] = (styleTrends[tag].bySeason[season] || 0) + 1;
          }
        });
      }

      // 날씨-스타일 상관관계
      if (record.weather && record.styleTags) {
        const weatherKey = `${record.weather.temp}_${record.weather.icon}`;
        if (!weatherStyleCorrelation[weatherKey]) {
          weatherStyleCorrelation[weatherKey] = {};
        }
        
        record.styleTags.forEach(tag => {
          weatherStyleCorrelation[weatherKey][tag] = 
            (weatherStyleCorrelation[weatherKey][tag] || 0) + 1;
        });
      }

      // 계절별 트렌드
      if (season && record.styleTags) {
        if (!seasonalTrends[season]) {
          seasonalTrends[season] = {};
        }
        
        record.styleTags.forEach(tag => {
          seasonalTrends[season][tag] = (seasonalTrends[season][tag] || 0) + 1;
        });
      }

      // 인기도 메트릭 (좋아요, 댓글 수)
      if (record.likeCount || record.commentCount) {
        const popularity = (record.likeCount || 0) + (record.commentCount || 0) * 2;
        
        if (record.styleTags) {
          record.styleTags.forEach(tag => {
            if (!popularityMetrics[tag]) {
              popularityMetrics[tag] = { total: 0, popularity: 0 };
            }
            popularityMetrics[tag].total++;
            popularityMetrics[tag].popularity += popularity;
          });
        }
      }
    });

    return {
      totalRecords: records.length,
      styleTrends,
      weatherStyleCorrelation,
      seasonalTrends,
      popularityMetrics,
      analysisDate: new Date()
    };
  } catch (error) {
    console.error('커뮤니티 트렌드 분석 오류:', error);
    throw error;
  }
}

/**
 * AI 모델을 위한 데이터 전처리
 */

// 추천을 위한 사용자 특성 벡터 생성
export async function generateUserFeatureVector(userId) {
  try {
    const [styleAnalysis, tempAnalysis] = await Promise.all([
      analyzeUserStylePreferences(userId),
      analyzeUserTemperaturePreferences(userId)
    ]);

    // 사용자 프로필 정보
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userProfile = userDoc.exists() ? userDoc.data() : {};

    // 특성 벡터 구성
    const featureVector = {
      userId,
      // 기본 정보
      region: userProfile.region || 'unknown',
      age: userProfile.age || null,
      gender: userProfile.gender || 'unknown',
      
      // 스타일 선호도 (정규화된 빈도)
      stylePreferences: normalizeFrequencies(styleAnalysis.styleTagFrequency),
      colorPreferences: normalizeFrequencies(styleAnalysis.colorPreferences),
      
      // 온도 선호도
      temperatureSensitivity: calculateTemperatureSensitivity(tempAnalysis),
      comfortThresholds: calculateComfortThresholds(tempAnalysis),
      
      // 활동 패턴
      timePreferences: normalizeFrequencies(styleAnalysis.timePreferences),
      
      // 메타데이터
      totalRecords: styleAnalysis.totalRecords,
      analysisDate: new Date()
    };

    return featureVector;
  } catch (error) {
    console.error('사용자 특성 벡터 생성 오류:', error);
    throw error;
  }
}

// AI 추천을 위한 컨텍스트 벡터 생성
export function generateContextVector(weather, time, season, location) {
  return {
    // 날씨 정보
    temperature: weather.temp,
    humidity: weather.humidity || 50,
    windSpeed: weather.windSpeed || 0,
    weatherCondition: weather.icon,
    rainAmount: weather.rain || 0,
    
    // 시간 정보
    hour: time.getHours(),
    dayOfWeek: time.getDay(),
    timeOfDay: getTimeOfDay(time),
    
    // 계절 정보
    season: season.season,
    seasonPeriod: season.period,
    
    // 위치 정보
    region: location,
    
    // 생성 시간
    timestamp: new Date()
  };
}

/**
 * 유틸리티 함수들
 */

// 텍스트에서 색상 추출 (간단한 키워드 기반)
function extractColorsFromText(text) {
  const colorKeywords = {
    '빨간색': 'red', '빨강': 'red', 'red': 'red',
    '파란색': 'blue', '파랑': 'blue', 'blue': 'blue',
    '노란색': 'yellow', '노랑': 'yellow', 'yellow': 'yellow',
    '초록색': 'green', '초록': 'green', 'green': 'green',
    '검은색': 'black', '검정': 'black', 'black': 'black',
    '흰색': 'white', '흰색': 'white', 'white': 'white',
    '회색': 'gray', '그레이': 'gray', 'gray': 'gray',
    '갈색': 'brown', '브라운': 'brown', 'brown': 'brown',
    '핑크': 'pink', '분홍': 'pink', 'pink': 'pink',
    '보라색': 'purple', '보라': 'purple', 'purple': 'purple'
  };

  const colors = [];
  const lowerText = text.toLowerCase();
  
  Object.entries(colorKeywords).forEach(([keyword, color]) => {
    if (lowerText.includes(keyword.toLowerCase())) {
      colors.push(color);
    }
  });

  return colors;
}

// 온도 범위 계산
function getTemperatureRange(temp) {
  if (temp < 0) return 'very_cold';
  if (temp < 10) return 'cold';
  if (temp < 20) return 'cool';
  if (temp < 25) return 'warm';
  if (temp < 30) return 'hot';
  return 'very_hot';
}

// 빈도 정규화
function normalizeFrequencies(frequencyObj) {
  const total = Object.values(frequencyObj).reduce((sum, count) => sum + count, 0);
  if (total === 0) return {};
  
  const normalized = {};
  Object.entries(frequencyObj).forEach(([key, count]) => {
    normalized[key] = count / total;
  });
  
  return normalized;
}

// 온도 민감도 계산
function calculateTemperatureSensitivity(tempAnalysis) {
  const { tempPatterns } = tempAnalysis;
  let totalDiscomfort = 0;
  let totalRecords = 0;
  
  Object.values(tempPatterns).forEach(pattern => {
    totalDiscomfort += pattern.tooHot + pattern.tooCold;
    totalRecords += pattern.total;
  });
  
  return totalRecords > 0 ? totalDiscomfort / totalRecords : 0;
}

// 편안함 임계값 계산
function calculateComfortThresholds(tempAnalysis) {
  const { rawData } = tempAnalysis;
  const comfortData = rawData.filter(d => d.feelingTemp === 'comfortable');
  
  if (comfortData.length === 0) {
    return { min: 15, max: 25, optimal: 20 };
  }
  
  const temps = comfortData.map(d => d.actualTemp);
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const optimal = temps.reduce((sum, temp) => sum + temp, 0) / temps.length;
  
  return { min, max, optimal };
}

// 시간대 분류
function getTimeOfDay(time) {
  const hour = time.getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

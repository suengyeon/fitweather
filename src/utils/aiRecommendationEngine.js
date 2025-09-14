// AI 기반 추천 엔진

import { 
  generateUserFeatureVector, 
  generateContextVector,
  logUserInteraction,
  logRecommendationFeedback 
} from './aiDataCollectionUtils';

/**
 * AI 추천 엔진 클래스
 */
class AIRecommendationEngine {
  constructor() {
    this.modelVersion = '1.0.0';
    this.featureWeights = {
      style: 0.3,
      weather: 0.25,
      temperature: 0.2,
      time: 0.15,
      community: 0.1
    };
  }

  /**
   * 메인 추천 함수
   */
  async generateRecommendation(userId, context, options = {}) {
    try {
      // 1. 사용자 특성 벡터 생성
      const userFeatures = await generateUserFeatureVector(userId);
      
      // 2. 컨텍스트 벡터 생성
      const contextVector = generateContextVector(
        context.weather,
        context.time || new Date(),
        context.season,
        context.location
      );

      // 3. AI 모델 예측 (현재는 규칙 기반 + 통계 기반)
      const prediction = await this.predictOutfit(userFeatures, contextVector, options);

      // 4. 추천 결과 생성
      const recommendation = {
        id: this.generateRecommendationId(),
        userId,
        context: contextVector,
        userFeatures: this.sanitizeUserFeatures(userFeatures),
        prediction,
        confidence: prediction.confidence,
        reasoning: prediction.reasoning,
        alternatives: prediction.alternatives,
        createdAt: new Date(),
        modelVersion: this.modelVersion
      };

      // 5. 사용자 상호작용 로깅
      await logUserInteraction(userId, 'recommendation_generated', {
        recommendationId: recommendation.id,
        context: contextVector,
        confidence: prediction.confidence
      });

      return recommendation;
    } catch (error) {
      console.error('AI 추천 생성 오류:', error);
      // 폴백: 기본 규칙 기반 추천
      return this.generateFallbackRecommendation(userId, context);
    }
  }

  /**
   * AI 모델 예측 (현재는 고도화된 규칙 기반)
   */
  async predictOutfit(userFeatures, contextVector, options) {
    const predictions = [];

    // 1. 스타일 기반 예측
    const stylePrediction = this.predictByStyle(userFeatures, contextVector);
    predictions.push({ type: 'style', ...stylePrediction, weight: this.featureWeights.style });

    // 2. 날씨 기반 예측
    const weatherPrediction = this.predictByWeather(userFeatures, contextVector);
    predictions.push({ type: 'weather', ...weatherPrediction, weight: this.featureWeights.weather });

    // 3. 온도 기반 예측
    const temperaturePrediction = this.predictByTemperature(userFeatures, contextVector);
    predictions.push({ type: 'temperature', ...temperaturePrediction, weight: this.featureWeights.temperature });

    // 4. 시간 기반 예측
    const timePrediction = this.predictByTime(userFeatures, contextVector);
    predictions.push({ type: 'time', ...timePrediction, weight: this.featureWeights.time });

    // 5. 커뮤니티 기반 예측
    const communityPrediction = await this.predictByCommunity(userFeatures, contextVector);
    predictions.push({ type: 'community', ...communityPrediction, weight: this.featureWeights.community });

    // 6. 예측 결과 통합
    const finalPrediction = this.ensemblePredictions(predictions);

    return finalPrediction;
  }

  /**
   * 스타일 기반 예측
   */
  predictByStyle(userFeatures, contextVector) {
    const { stylePreferences, colorPreferences } = userFeatures;
    
    // 사용자 선호 스타일 추출
    const topStyles = Object.entries(stylePreferences)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([style]) => style);

    // 사용자 선호 색상 추출
    const topColors = Object.entries(colorPreferences)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([color]) => color);

    // 스타일별 아이템 매핑
    const styleItems = this.getStyleItems(topStyles, topColors, contextVector);

    return {
      items: styleItems,
      confidence: this.calculateStyleConfidence(stylePreferences),
      reasoning: `사용자의 선호 스타일 (${topStyles.join(', ')})과 색상 (${topColors.join(', ')})을 기반으로 추천`
    };
  }

  /**
   * 날씨 기반 예측
   */
  predictByWeather(userFeatures, contextVector) {
    const { weatherCondition, temperature, humidity, windSpeed, rainAmount } = contextVector;
    
    let items = [];
    let confidence = 0.8;

    // 날씨별 기본 아이템
    if (weatherCondition === 'rainy' || rainAmount > 0) {
      items = ['우산', '방수 재킷', '방수 신발', '긴 바지'];
      confidence = 0.9;
    } else if (weatherCondition === 'sunny') {
      items = ['선글라스', '모자', '자외선 차단제', '가벼운 옷'];
      confidence = 0.85;
    } else if (weatherCondition === 'cloudy') {
      items = ['가벼운 겉옷', '긴 소매', '편안한 신발'];
      confidence = 0.75;
    } else if (weatherCondition === 'snowy') {
      items = ['따뜻한 코트', '목도리', '장갑', '부츠'];
      confidence = 0.9;
    }

    // 온도 조정
    if (temperature < 10) {
      items = [...items, '따뜻한 내의', '두꺼운 양말'];
    } else if (temperature > 25) {
      items = items.filter(item => !['따뜻한 코트', '목도리', '장갑'].includes(item));
      items = [...items, '반팔', '반바지', '시원한 소재'];
    }

    return {
      items,
      confidence,
      reasoning: `${weatherCondition} 날씨와 ${temperature}°C 온도를 고려한 추천`
    };
  }

  /**
   * 온도 기반 예측
   */
  predictByTemperature(userFeatures, contextVector) {
    const { temperature } = contextVector;
    const { temperatureSensitivity, comfortThresholds } = userFeatures;
    
    let items = [];
    let confidence = 0.7;

    // 사용자의 편안함 임계값 고려
    const { min, max, optimal } = comfortThresholds;
    
    if (temperature < min) {
      // 사용자가 추위를 많이 타는 경우
      const extraWarmth = temperatureSensitivity > 0.3 ? 2 : 1;
      items = [
        '따뜻한 코트',
        '목도리',
        '장갑',
        ...Array(extraWarmth).fill('따뜻한 내의')
      ];
      confidence = 0.85;
    } else if (temperature > max) {
      // 사용자가 더위를 많이 타는 경우
      items = ['시원한 소재', '반팔', '반바지', '가벼운 옷'];
      confidence = 0.85;
    } else {
      // 편안한 온도 범위
      items = ['적당한 두께의 옷', '편안한 신발'];
      confidence = 0.8;
    }

    return {
      items,
      confidence,
      reasoning: `사용자의 온도 민감도 (${(temperatureSensitivity * 100).toFixed(1)}%)와 편안함 범위 (${min}°C-${max}°C)를 고려한 추천`
    };
  }

  /**
   * 시간 기반 예측
   */
  predictByTime(userFeatures, contextVector) {
    const { hour, timeOfDay, dayOfWeek } = contextVector;
    const { timePreferences } = userFeatures;
    
    let items = [];
    let confidence = 0.6;

    // 시간대별 추천
    if (timeOfDay === 'morning') {
      items = ['편안한 옷', '운동화', '가벼운 겉옷'];
    } else if (timeOfDay === 'afternoon') {
      items = ['활동적인 옷', '편안한 신발', '모자'];
    } else if (timeOfDay === 'evening') {
      items = ['세련된 옷', '구두', '가벼운 코트'];
    } else {
      items = ['편안한 옷', '슬리퍼', '따뜻한 겉옷'];
    }

    // 요일별 조정
    if (dayOfWeek === 0 || dayOfWeek === 6) { // 주말
      items = [...items, '캐주얼한 옷', '편안한 신발'];
    } else { // 평일
      items = [...items, '깔끔한 옷', '적당한 신발'];
    }

    return {
      items,
      confidence,
      reasoning: `${timeOfDay} 시간대와 ${dayOfWeek < 6 ? '평일' : '주말'}을 고려한 추천`
    };
  }

  /**
   * 커뮤니티 기반 예측
   */
  async predictByCommunity(userFeatures, contextVector) {
    try {
      // 커뮤니티 데이터에서 유사한 상황의 인기 아이템 추출
      const communityItems = await this.getCommunityPopularItems(contextVector);
      
      return {
        items: communityItems,
        confidence: 0.6,
        reasoning: '비슷한 상황에서 다른 사용자들이 많이 선택한 아이템 기반 추천'
      };
    } catch (error) {
      console.error('커뮤니티 기반 예측 오류:', error);
      return {
        items: [],
        confidence: 0.3,
        reasoning: '커뮤니티 데이터를 불러올 수 없어 낮은 신뢰도로 추천'
      };
    }
  }

  /**
   * 예측 결과 통합 (앙상블)
   */
  ensemblePredictions(predictions) {
    // 가중 평균으로 아이템 점수 계산
    const itemScores = {};
    let totalConfidence = 0;
    let totalWeight = 0;

    predictions.forEach(prediction => {
      const weight = prediction.weight;
      const confidence = prediction.confidence;
      
      totalConfidence += confidence * weight;
      totalWeight += weight;

      // 아이템별 점수 계산
      prediction.items.forEach(item => {
        if (!itemScores[item]) {
          itemScores[item] = 0;
        }
        itemScores[item] += weight * confidence;
      });
    });

    // 최종 아이템 순위
    const rankedItems = Object.entries(itemScores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([item, score]) => ({ item, score }));

    // 대안 추천 생성
    const alternatives = this.generateAlternatives(rankedItems, predictions);

    return {
      recommendedItems: rankedItems.slice(0, 5).map(({ item }) => item),
      confidence: totalWeight > 0 ? totalConfidence / totalWeight : 0.5,
      reasoning: this.generateReasoning(predictions),
      alternatives,
      itemScores: rankedItems
    };
  }

  /**
   * 대안 추천 생성
   */
  generateAlternatives(rankedItems, predictions) {
    const alternatives = [];
    
    // 스타일별 대안
    const stylePrediction = predictions.find(p => p.type === 'style');
    if (stylePrediction && stylePrediction.items.length > 0) {
      alternatives.push({
        type: 'style_alternative',
        items: stylePrediction.items.slice(0, 3),
        description: '다른 스타일 옵션'
      });
    }

    // 날씨별 대안
    const weatherPrediction = predictions.find(p => p.type === 'weather');
    if (weatherPrediction && weatherPrediction.items.length > 0) {
      alternatives.push({
        type: 'weather_alternative',
        items: weatherPrediction.items.slice(0, 3),
        description: '날씨 대비 옵션'
      });
    }

    return alternatives;
  }

  /**
   * 추천 이유 생성
   */
  generateReasoning(predictions) {
    const reasons = predictions
      .filter(p => p.confidence > 0.5)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3)
      .map(p => p.reasoning);

    return reasons.length > 0 ? reasons.join(' ') : '종합적인 분석을 통한 추천';
  }

  /**
   * 스타일별 아이템 매핑
   */
  getStyleItems(styles, colors, context) {
    const styleItemMap = {
      'casual': ['청바지', '티셔츠', '스니커즈', '후드티'],
      'formal': ['정장', '셔츠', '구두', '넥타이'],
      'sporty': ['운동복', '운동화', '반바지', '트레이닝복'],
      'elegant': ['원피스', '힐', '가방', '액세서리'],
      'street': ['오버사이즈', '캡', '스니커즈', '체인'],
      'vintage': ['빈티지 코트', '옥스포드', '로퍼', '버튼다운']
    };

    let items = [];
    
    styles.forEach(style => {
      if (styleItemMap[style]) {
        items = [...items, ...styleItemMap[style]];
      }
    });

    // 색상 조합 추가
    if (colors.length > 0) {
      items = [...items, `${colors[0]} 계열`, `${colors[1] || colors[0]} 포인트`];
    }

    return [...new Set(items)]; // 중복 제거
  }

  /**
   * 스타일 신뢰도 계산
   */
  calculateStyleConfidence(stylePreferences) {
    const totalRecords = Object.values(stylePreferences).reduce((sum, freq) => sum + freq, 0);
    const maxFrequency = Math.max(...Object.values(stylePreferences));
    
    if (totalRecords === 0) return 0.3;
    if (maxFrequency > 0.5) return 0.9;
    if (maxFrequency > 0.3) return 0.7;
    return 0.5;
  }

  /**
   * 커뮤니티 인기 아이템 조회
   */
  async getCommunityPopularItems(contextVector) {
    // 실제 구현에서는 Firestore에서 데이터를 조회
    // 현재는 시뮬레이션된 데이터 반환
    const mockItems = [
      '인기 청바지', '트렌디한 스니커즈', '스타일리시한 코트',
      '편안한 티셔츠', '세련된 가방'
    ];
    
    return mockItems.slice(0, 3);
  }

  /**
   * 폴백 추천 생성
   */
  generateFallbackRecommendation(userId, context) {
    return {
      id: this.generateRecommendationId(),
      userId,
      context,
      prediction: {
        recommendedItems: ['기본 티셔츠', '청바지', '스니커즈'],
        confidence: 0.4,
        reasoning: '기본적인 추천 (AI 모델 사용 불가)',
        alternatives: []
      },
      createdAt: new Date(),
      modelVersion: 'fallback'
    };
  }

  /**
   * 사용자 피드백 처리
   */
  async processFeedback(userId, recommendationId, feedback) {
    try {
      // 피드백 로깅
      await logRecommendationFeedback(userId, recommendationId, feedback);
      
      // 모델 개선을 위한 데이터 수집
      const improvementData = {
        recommendationId,
        feedback,
        timestamp: new Date()
      };

      // 실제 구현에서는 이 데이터를 ML 모델 학습에 사용
      console.log('피드백 처리:', improvementData);
      
      return true;
    } catch (error) {
      console.error('피드백 처리 오류:', error);
      return false;
    }
  }

  /**
   * 유틸리티 함수들
   */
  generateRecommendationId() {
    return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  sanitizeUserFeatures(userFeatures) {
    // 민감한 정보 제거
    const { userId, ...sanitized } = userFeatures;
    return sanitized;
  }
}

// 싱글톤 인스턴스 생성
const aiRecommendationEngine = new AIRecommendationEngine();

export default aiRecommendationEngine;


// AI API 연동을 위한 유틸리티 (시뮬레이션)

/**
 * AI 모델 API 엔드포인트 시뮬레이션
 */
class AIApiSimulator {
  constructor() {
    this.baseUrl = 'https://api.fitweather-ai.com'; // 실제 API URL
    this.apiKey = process.env.REACT_APP_AI_API_KEY || 'demo-key';
    this.modelVersion = '1.0.0';
  }

  /**
   * 사용자 특성 벡터를 AI 모델에 전송하여 추천 요청
   */
  async requestRecommendation(userFeatureVector, contextVector) {
    try {
      // 실제 구현에서는 실제 AI API를 호출
      const response = await this.simulateAIRequest(userFeatureVector, contextVector);
      return response;
    } catch (error) {
      console.error('AI API 요청 오류:', error);
      throw error;
    }
  }

  /**
   * 사용자 피드백을 AI 모델에 전송하여 학습 데이터로 활용
   */
  async sendFeedback(feedbackData) {
    try {
      // 실제 구현에서는 피드백 데이터를 AI 모델 학습에 사용
      const response = await this.simulateFeedbackSubmission(feedbackData);
      return response;
    } catch (error) {
      console.error('피드백 전송 오류:', error);
      throw error;
    }
  }

  /**
   * AI 모델 성능 메트릭 조회
   */
  async getModelMetrics() {
    try {
      const response = await this.simulateMetricsRequest();
      return response;
    } catch (error) {
      console.error('모델 메트릭 조회 오류:', error);
      throw error;
    }
  }

  /**
   * AI 모델 업데이트 상태 확인
   */
  async checkModelUpdate() {
    try {
      const response = await this.simulateModelUpdateCheck();
      return response;
    } catch (error) {
      console.error('모델 업데이트 확인 오류:', error);
      throw error;
    }
  }

  /**
   * AI 추천 시뮬레이션
   */
  async simulateAIRequest(userFeatures, context) {
    // 실제 AI 모델 응답을 시뮬레이션
    await this.delay(1000 + Math.random() * 2000); // 1-3초 지연

    const { temperature, weatherCondition, timeOfDay } = context;
    const { stylePreferences, temperatureSensitivity } = userFeatures;

    // 온도 기반 기본 추천
    let baseItems = [];
    if (temperature < 10) {
      baseItems = ['따뜻한 코트', '목도리', '장갑', '부츠'];
    } else if (temperature < 20) {
      baseItems = ['가벼운 겉옷', '긴 소매', '긴 바지', '스니커즈'];
    } else if (temperature < 25) {
      baseItems = ['반팔', '긴 바지', '가벼운 신발', '모자'];
    } else {
      baseItems = ['반팔', '반바지', '시원한 소재', '샌들'];
    }

    // 스타일 선호도 반영
    const topStyles = Object.entries(stylePreferences)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([style]) => style);

    const styleItems = this.getStyleBasedItems(topStyles);
    const finalItems = [...new Set([...baseItems, ...styleItems])].slice(0, 6);

    // 신뢰도 계산
    const confidence = this.calculateConfidence(userFeatures, context);

    return {
      success: true,
      data: {
        recommendedItems: finalItems,
        confidence,
        reasoning: this.generateReasoning(userFeatures, context),
        alternatives: this.generateAlternatives(finalItems),
        modelVersion: this.modelVersion,
        processingTime: Math.random() * 2000 + 1000
      }
    };
  }

  /**
   * 피드백 전송 시뮬레이션
   */
  async simulateFeedbackSubmission(feedbackData) {
    await this.delay(500);

    return {
      success: true,
      data: {
        feedbackId: `feedback_${Date.now()}`,
        status: 'processed',
        message: '피드백이 AI 모델 학습에 반영되었습니다.'
      }
    };
  }

  /**
   * 모델 메트릭 시뮬레이션
   */
  async simulateMetricsRequest() {
    await this.delay(300);

    return {
      success: true,
      data: {
        accuracy: 0.87,
        precision: 0.85,
        recall: 0.82,
        f1Score: 0.83,
        userSatisfaction: 0.78,
        totalRecommendations: 15420,
        positiveFeedback: 0.72,
        lastUpdated: new Date().toISOString()
      }
    };
  }

  /**
   * 모델 업데이트 확인 시뮬레이션
   */
  async simulateModelUpdateCheck() {
    await this.delay(200);

    return {
      success: true,
      data: {
        currentVersion: this.modelVersion,
        latestVersion: '1.0.1',
        hasUpdate: true,
        updateDescription: '사용자 피드백 기반 개선사항 적용',
        releaseDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      }
    };
  }

  /**
   * 스타일 기반 아이템 생성
   */
  getStyleBasedItems(styles) {
    const styleItemMap = {
      'casual': ['청바지', '티셔츠', '스니커즈'],
      'formal': ['정장', '셔츠', '구두'],
      'sporty': ['운동복', '운동화', '반바지'],
      'elegant': ['원피스', '힐', '가방'],
      'street': ['오버사이즈', '캡', '체인'],
      'vintage': ['빈티지 코트', '옥스포드', '로퍼']
    };

    let items = [];
    styles.forEach(style => {
      if (styleItemMap[style]) {
        items = [...items, ...styleItemMap[style]];
      }
    });

    return items;
  }

  /**
   * 신뢰도 계산
   */
  calculateConfidence(userFeatures, context) {
    let confidence = 0.5;

    // 사용자 데이터 풍부도
    if (userFeatures.totalRecords > 50) confidence += 0.2;
    else if (userFeatures.totalRecords > 20) confidence += 0.1;

    // 스타일 선호도 명확도
    const maxStylePreference = Math.max(...Object.values(userFeatures.stylePreferences || {}));
    if (maxStylePreference > 0.5) confidence += 0.15;
    else if (maxStylePreference > 0.3) confidence += 0.1;

    // 온도 민감도 정보
    if (userFeatures.temperatureSensitivity !== undefined) confidence += 0.1;

    // 컨텍스트 정보 완성도
    if (context.temperature && context.weatherCondition && context.timeOfDay) {
      confidence += 0.05;
    }

    return Math.min(confidence, 0.95);
  }

  /**
   * 추천 이유 생성
   */
  generateReasoning(userFeatures, context) {
    const reasons = [];

    // 온도 기반 이유
    if (context.temperature < 10) {
      reasons.push('추운 날씨를 고려하여 따뜻한 옷을 추천했습니다.');
    } else if (context.temperature > 25) {
      reasons.push('더운 날씨를 고려하여 시원한 옷을 추천했습니다.');
    }

    // 스타일 기반 이유
    const topStyle = Object.entries(userFeatures.stylePreferences || {})
      .sort(([,a], [,b]) => b - a)[0];
    
    if (topStyle && topStyle[1] > 0.3) {
      reasons.push(`사용자가 선호하는 ${topStyle[0]} 스타일을 반영했습니다.`);
    }

    // 시간대 기반 이유
    if (context.timeOfDay === 'morning') {
      reasons.push('아침 시간대에 적합한 편안한 옷을 추천했습니다.');
    } else if (context.timeOfDay === 'evening') {
      reasons.push('저녁 시간대에 적합한 세련된 옷을 추천했습니다.');
    }

    return reasons.length > 0 ? reasons.join(' ') : '종합적인 분석을 통한 추천입니다.';
  }

  /**
   * 대안 추천 생성
   */
  generateAlternatives(mainItems) {
    const alternatives = [
      {
        type: 'color_variation',
        items: mainItems.slice(0, 3).map(item => `${item} (다른 색상)`),
        description: '색상 변형 옵션'
      },
      {
        type: 'style_variation',
        items: ['캐주얼 버전', '포멀 버전', '스포티 버전'],
        description: '스타일 변형 옵션'
      }
    ];

    return alternatives;
  }

  /**
   * 지연 함수
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 실제 AI API 클라이언트 (향후 구현)
class RealAIApiClient {
  constructor() {
    this.baseUrl = process.env.REACT_APP_AI_API_URL;
    this.apiKey = process.env.REACT_APP_AI_API_KEY;
  }

  async requestRecommendation(userFeatureVector, contextVector) {
    const response = await fetch(`${this.baseUrl}/recommend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        userFeatures: userFeatureVector,
        context: contextVector,
        modelVersion: '1.0.0'
      })
    });

    if (!response.ok) {
      throw new Error(`AI API 요청 실패: ${response.status}`);
    }

    return await response.json();
  }

  async sendFeedback(feedbackData) {
    const response = await fetch(`${this.baseUrl}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(feedbackData)
    });

    if (!response.ok) {
      throw new Error(`피드백 전송 실패: ${response.status}`);
    }

    return await response.json();
  }
}

// 환경에 따라 적절한 클라이언트 선택
const aiApiClient = process.env.NODE_ENV === 'production' && process.env.REACT_APP_AI_API_URL
  ? new RealAIApiClient()
  : new AIApiSimulator();

export default aiApiClient;

// AI 모델 관리 유틸리티
export const AIModelManager = {
  /**
   * 모델 성능 모니터링
   */
  async getPerformanceMetrics() {
    return await aiApiClient.getModelMetrics();
  },

  /**
   * 모델 업데이트 확인
   */
  async checkForUpdates() {
    return await aiApiClient.checkModelUpdate();
  },

  /**
   * A/B 테스트를 위한 모델 버전 선택
   */
  selectModelVersion(userId) {
    // 사용자 ID 기반으로 일관된 모델 버전 선택
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return Math.abs(hash) % 2 === 0 ? '1.0.0' : '1.0.1';
  },

  /**
   * 추천 품질 평가
   */
  evaluateRecommendationQuality(recommendation, userFeedback) {
    const metrics = {
      relevance: 0,
      diversity: 0,
      novelty: 0,
      overall: 0
    };

    // 사용자 피드백 기반 평가
    if (userFeedback) {
      metrics.relevance = userFeedback.rating / 5;
      metrics.overall = userFeedback.rating / 5;
    }

    // 추천 다양성 평가
    const uniqueItems = new Set(recommendation.prediction.recommendedItems);
    metrics.diversity = uniqueItems.size / recommendation.prediction.recommendedItems.length;

    return metrics;
  }
};


# AI 추천 시스템 문서

## 개요

Fitweather의 AI 추천 시스템은 사용자의 개인 패턴, 날씨 조건, 커뮤니티 트렌드를 종합적으로 분석하여 개인화된 의상 추천을 제공하는 고도화된 시스템입니다.

## 시스템 아키텍처

### 1. 데이터 수집 계층 (Data Collection Layer)
- **파일**: `src/utils/aiDataCollectionUtils.js`
- **기능**: 
  - 사용자 상호작용 로깅
  - 추천 피드백 수집
  - 사용자 패턴 분석
  - 커뮤니티 트렌드 분석

### 2. AI 추천 엔진 (AI Recommendation Engine)
- **파일**: `src/utils/aiRecommendationEngine.js`
- **기능**:
  - 다중 예측 모델 앙상블
  - 사용자 특성 벡터 생성
  - 컨텍스트 벡터 생성
  - 추천 결과 통합

### 3. API 연동 계층 (API Integration Layer)
- **파일**: `src/utils/aiApiUtils.js`
- **기능**:
  - AI 모델 API 시뮬레이션
  - 실제 AI API 클라이언트 (향후 구현)
  - 모델 성능 모니터링

### 4. UI 컴포넌트 (UI Components)
- **파일**: `src/components/AIRecommendationDisplay.js`
- **기능**:
  - AI 추천 결과 표시
  - 사용자 피드백 수집
  - 추천 상세 정보 제공

## 주요 기능

### 1. 개인화 추천
- **사용자 스타일 분석**: 과거 기록을 기반으로 한 스타일 선호도 분석
- **온도 민감도 분석**: 사용자의 체감 온도 패턴 분석
- **시간대 선호도**: 시간대별 착장 패턴 분석

### 2. 다중 예측 모델
- **스타일 기반 예측**: 사용자 선호 스타일과 색상 기반
- **날씨 기반 예측**: 현재 날씨 조건 고려
- **온도 기반 예측**: 사용자 온도 민감도 반영
- **시간 기반 예측**: 시간대와 요일 고려
- **커뮤니티 기반 예측**: 인기 패턴 반영

### 3. 앙상블 학습
- 각 예측 모델의 결과를 가중 평균으로 통합
- 신뢰도 기반 결과 조정
- 대안 추천 제공

### 4. 실시간 피드백
- 사용자 피드백 수집
- AI 모델 개선을 위한 데이터 축적
- 추천 품질 평가

## 사용법

### 1. 기본 사용법
```javascript
import aiRecommendationEngine from '../utils/aiRecommendationEngine';

// 추천 생성
const recommendation = await aiRecommendationEngine.generateRecommendation(
  userId,
  {
    weather: { temp: 20, icon: 'sunny', humidity: 60 },
    time: new Date(),
    season: { season: 'spring', period: 'early' },
    location: 'Seoul'
  }
);
```

### 2. 피드백 처리
```javascript
// 사용자 피드백 전송
await aiRecommendationEngine.processFeedback(
  userId,
  recommendationId,
  {
    type: 'positive',
    rating: 5,
    reason: 'perfect',
    selectedItems: ['청바지', '티셔츠']
  }
);
```

### 3. 사용자 분석
```javascript
import { analyzeUserStylePreferences } from '../utils/aiDataCollectionUtils';

// 사용자 스타일 분석
const analysis = await analyzeUserStylePreferences(userId);
console.log(analysis.styleTagFrequency);
```

## 설정 옵션

### 1. 추천 옵션
- **개인화 추천**: 사용자 기록 기반 추천 활성화/비활성화
- **커뮤니티 데이터**: 커뮤니티 트렌드 반영 여부
- **날씨 기반**: 날씨 조건 고려 여부
- **스타일 기반**: 스타일 선호도 반영 여부
- **시간 기반**: 시간대 고려 여부

### 2. 고급 설정
- **신뢰도 임계값**: 0.3 ~ 0.9 (기본값: 0.6)
- **최대 추천 수**: 3 ~ 10개 (기본값: 5개)

## 데이터 구조

### 1. 사용자 특성 벡터
```javascript
{
  userId: string,
  region: string,
  age: number,
  gender: string,
  stylePreferences: { [style: string]: number },
  colorPreferences: { [color: string]: number },
  temperatureSensitivity: number,
  comfortThresholds: { min: number, max: number, optimal: number },
  timePreferences: { [time: string]: number },
  totalRecords: number
}
```

### 2. 컨텍스트 벡터
```javascript
{
  temperature: number,
  humidity: number,
  windSpeed: number,
  weatherCondition: string,
  rainAmount: number,
  hour: number,
  dayOfWeek: number,
  timeOfDay: string,
  season: string,
  seasonPeriod: string,
  region: string
}
```

### 3. 추천 결과
```javascript
{
  id: string,
  userId: string,
  context: object,
  userFeatures: object,
  prediction: {
    recommendedItems: string[],
    confidence: number,
    reasoning: string,
    alternatives: object[],
    itemScores: object[]
  },
  createdAt: Date,
  modelVersion: string
}
```

## 성능 메트릭

### 1. 정확도 메트릭
- **정확도 (Accuracy)**: 전체 예측 중 정확한 예측 비율
- **정밀도 (Precision)**: 추천된 아이템 중 실제로 선택된 비율
- **재현율 (Recall)**: 실제 선택된 아이템 중 추천된 비율
- **F1 점수**: 정밀도와 재현율의 조화평균

### 2. 사용자 만족도
- **전체 만족도**: 사용자 피드백 기반 만족도
- **긍정 피드백 비율**: 긍정적 피드백 비율
- **추천 활용도**: 추천된 아이템의 실제 선택 비율

## 관리자 기능

### 1. AI 관리자 대시보드
- **경로**: `/ai-admin`
- **기능**:
  - 모델 성능 모니터링
  - 사용자 패턴 분석
  - 커뮤니티 트렌드 분석
  - 모델 업데이트 상태 확인

### 2. AI 설정 페이지
- **경로**: `/ai-settings`
- **기능**:
  - 개인화 추천 설정
  - 고급 옵션 조정
  - 사용자 분석 데이터 확인

## 향후 개발 계획

### 1. 실제 AI 모델 연동
- TensorFlow.js 또는 PyTorch 모델 연동
- 실시간 모델 학습
- A/B 테스트 기능

### 2. 고도화된 개인화
- 딥러닝 기반 사용자 임베딩
- 시퀀스 모델을 통한 패턴 학습
- 실시간 적응형 추천

### 3. 다중 모달리티 지원
- 이미지 기반 스타일 분석
- 텍스트 기반 선호도 추출
- 음성 피드백 처리

## 보안 및 개인정보

### 1. 데이터 보호
- 사용자 개인정보 익명화
- 민감한 정보 제거
- 데이터 암호화

### 2. 투명성
- 추천 이유 제공
- 데이터 사용 목적 명시
- 사용자 동의 기반 데이터 수집

## 문제 해결

### 1. 일반적인 문제
- **추천이 부정확한 경우**: 더 많은 기록을 남기고 피드백을 제공
- **로딩이 느린 경우**: 네트워크 상태 확인 및 캐시 정리
- **설정이 저장되지 않는 경우**: 브라우저 권한 및 로그인 상태 확인

### 2. 개발자 도구
```javascript
// 브라우저 콘솔에서 사용 가능한 디버깅 함수들
window.testAIRecommendation = async () => {
  // AI 추천 테스트
};

window.analyzeUserData = async (userId) => {
  // 사용자 데이터 분석
};
```

## API 참조

### aiRecommendationEngine
- `generateRecommendation(userId, context, options)`: 추천 생성
- `processFeedback(userId, recommendationId, feedback)`: 피드백 처리

### aiDataCollectionUtils
- `logUserInteraction(userId, type, data)`: 상호작용 로깅
- `analyzeUserStylePreferences(userId)`: 스타일 분석
- `analyzeCommunityTrends(limit)`: 커뮤니티 트렌드 분석

### AIModelManager
- `getPerformanceMetrics()`: 성능 메트릭 조회
- `checkForUpdates()`: 모델 업데이트 확인
- `evaluateRecommendationQuality(recommendation, feedback)`: 추천 품질 평가

---

이 문서는 AI 추천 시스템의 전체적인 구조와 사용법을 설명합니다. 추가 질문이나 개선 사항이 있으면 개발팀에 문의해 주세요.


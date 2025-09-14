# 커뮤니티 기반 추천 시스템

## 개요

커뮤니티 기반 추천 시스템은 **실제 사용자들이 올린 코디**를 바탕으로 한 추천 시스템입니다. 다른 사용자들의 성공적인 코디를 분석하여 유사한 상황에서 어떤 옷을 입었는지 추천해주는 방식입니다.

## 🎯 핵심 아이디어

> **"비슷한 날씨에 다른 사람들이 입고 만족했던 코디를 추천해드려요!"**

### 기존 추천 vs 커뮤니티 추천

| 구분 | 기존 추천 | 커뮤니티 추천 |
|------|-----------|---------------|
| **데이터 소스** | 규칙 기반 | 실제 사용자 코디 |
| **개인화** | 없음 | 사용자 취향 분석 |
| **신뢰도** | 일반적 | 실제 만족도 기반 |
| **트렌드** | 반영 안됨 | 최신 트렌드 반영 |

## 🔍 추천 알고리즘

### 1. **인기도 기반 추천 (40%)**
```javascript
// 유사한 온도/날씨 조건의 인기 코디 찾기
const popularOutfits = await findPopularOutfits({
  temp: 20,
  weather: 'sunny',
  tempRange: 'warm'  // ±3도 범위
});

// 좋아요 수로 정렬하여 상위 코디 추천
```

### 2. **개인화 추천 (30%)**
```javascript
// 사용자가 좋아요한 코디 분석
const likedOutfits = await getUserLikedOutfits(userId);

// 좋아요한 코디와 유사한 스타일의 인기 코디 찾기
const similarOutfits = await findSimilarOutfits(likedOutfits, conditions);

// 비슷한 취향의 다른 사용자들 찾기
const similarUsers = await findSimilarUsers(userId);
```

### 3. **트렌드 기반 추천 (30%)**
```javascript
// 최근 1주일간의 인기 코디
const trendingOutfits = await getTrendBasedRecommendation(conditions);

// 최근에 올라온 코디 중 좋아요가 많은 것들
```

## 📊 데이터 분석 과정

### 1. **온도 범위 분류**
```javascript
const getTemperatureRange = (temp) => {
  if (temp < 0) return 'very_cold';    // 매우 추움
  if (temp < 10) return 'cold';        // 추움
  if (temp < 20) return 'cool';        // 시원함
  if (temp < 25) return 'warm';        // 따뜻함
  if (temp < 30) return 'hot';         // 더움
  return 'very_hot';                   // 매우 더움
};
```

### 2. **관련도 점수 계산**
```javascript
const calculateRelevanceScore = (outfit, conditions) => {
  let score = 0;
  
  // 좋아요 수 기반 점수 (30%)
  score += (outfit.likeCount || 0) * 0.3;
  
  // 온도 일치도 (40%)
  const tempDiff = Math.abs(outfit.weather?.temp - conditions.temp);
  score += Math.max(0, 10 - tempDiff) * 0.4;
  
  // 날씨 일치도 (30%)
  if (outfit.weather?.icon === conditions.weather) {
    score += 20 * 0.3;
  }
  
  return score;
};
```

### 3. **사용자 취향 분석**
```javascript
// 사용자가 좋아요한 코디의 공통 스타일 태그 추출
const extractCommonTags = (likedOutfits) => {
  const tagFrequency = new Map();
  
  likedOutfits.forEach(outfit => {
    (outfit.styleTags || []).forEach(tag => {
      const current = tagFrequency.get(tag) || 0;
      tagFrequency.set(tag, current + 1);
    });
  });
  
  return Array.from(tagFrequency.entries())
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([tag]) => tag);
};
```

## 🎨 사용자 경험

### 추천 결과 표시
```
👥 커뮤니티 추천                    신뢰도: 높음 (87%)

추천 아이템:
✓ 청바지  ✓ 티셔츠  ✓ 스니커즈  ✓ 가벼운 겉옷

추천 이유:
15개의 인기 코디에서 추천, 당신이 좋아한 스타일과 유사한 코디

커뮤니티 데이터:
┌─────────┬─────────┬─────────┐
│ 15      │ 12      │ 3       │
│ 분석된  │ 평균    │ 인기    │
│ 코디    │ 좋아요  │ 사용자  │
└─────────┴─────────┴─────────┘

참고된 코디:
📸 김철수님의 코디    👍 25개 좋아요  [보기]
📸 이영희님의 코디    👍 18개 좋아요  [보기]
📸 박민수님의 코디    👍 15개 좋아요  [보기]
```

## 🔧 기술적 구현

### 1. **Firestore 쿼리 최적화**
```javascript
// 온도 범위로 인덱싱된 쿼리
const q = query(
  collection(db, 'records'),
  where('isPublic', '==', true),
  where('tempRange', '==', tempRange),  // 복합 인덱스 필요
  orderBy('likeCount', 'desc'),
  limit(20)
);
```

### 2. **캐싱 시스템**
```javascript
class CommunityBasedRecommendationEngine {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5분 캐시
  }
  
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    return null;
  }
}
```

### 3. **협업 필터링**
```javascript
// 비슷한 취향의 사용자 찾기
const findSimilarUsers = async (userId) => {
  const userLikes = await getUserLikedOutfits(userId);
  const userTags = extractCommonTags(userLikes);
  
  // 같은 태그를 좋아하는 다른 사용자들 찾기
  const similarUsers = await findUsersWithSimilarTags(userTags);
  
  return similarUsers;
};
```

## 📈 성능 지표

### 1. **추천 품질 메트릭**
- **정확도**: 추천된 아이템의 실제 선택 비율
- **다양성**: 추천된 아이템의 스타일 다양성
- **신선도**: 최신 트렌드 반영 정도

### 2. **사용자 만족도**
- **피드백 수집**: 사용자별 추천 만족도
- **클릭률**: 추천된 코디의 조회 비율
- **활용도**: 추천된 아이템의 실제 착용 비율

### 3. **커뮤니티 활성도**
- **기여도**: 사용자별 코디 업로드 빈도
- **상호작용**: 좋아요, 댓글, 공유 수
- **트렌드 형성**: 특정 스타일의 인기도 변화

## 🚀 사용법

### 1. **기본 사용법**
```javascript
import communityRecommendationEngine from '../utils/communityBasedRecommendationUtils';

const recommendation = await communityRecommendationEngine.getCommunityBasedRecommendation(
  {
    temp: 20,
    weather: 'sunny',
    humidity: 60,
    windSpeed: 5,
    date: new Date(),
    styleTags: []
  },
  userId  // 로그인한 사용자 ID (선택사항)
);
```

### 2. **UI 컴포넌트 사용**
```javascript
import { CommunityRecommendationButton } from '../components/CommunityRecommendationDisplay';

<CommunityRecommendationButton
  context={{
    weather: { temp: 20, icon: 'sunny' },
    time: new Date(),
    season: { season: 'spring' },
    location: 'Seoul'
  }}
  onRecommendationGenerated={(recommendation) => {
    console.log('커뮤니티 추천:', recommendation);
  }}
/>
```

## 🎯 추천 결과 구조

```javascript
{
  recommendedItems: ['청바지', '티셔츠', '스니커즈'],
  sourceOutfits: [
    {
      id: 'outfit1',
      userName: '김철수',
      likeCount: 25,
      imageUrls: ['url1'],
      styleTags: ['casual', 'street']
    }
  ],
  reasoning: '15개의 인기 코디에서 추천, 당신이 좋아한 스타일과 유사한 코디',
  alternatives: [
    {
      type: 'style_variation',
      items: ['다른 색상 청바지', '다른 스타일 티셔츠'],
      description: '다른 스타일 옵션'
    }
  ],
  confidence: 0.87,
  source: 'community',
  communityStats: {
    totalOutfits: 15,
    avgLikes: 12.5,
    topUsers: [
      { userId: 'user1', count: 3 },
      { userId: 'user2', count: 2 }
    ]
  }
}
```

## 🔮 향후 개선 계획

### 1. **고도화된 개인화**
- **딥러닝 기반 사용자 임베딩**: 사용자 행동 패턴을 벡터로 변환
- **실시간 적응**: 사용자 피드백에 따른 실시간 모델 업데이트
- **다중 모달리티**: 이미지, 텍스트, 메타데이터 종합 분석

### 2. **커뮤니티 기능 강화**
- **팔로우 기반 추천**: 팔로우하는 사용자의 코디 우선 추천
- **지역별 트렌드**: 지역별 날씨와 문화를 고려한 추천
- **계절별 패턴**: 계절 변화에 따른 스타일 트렌드 분석

### 3. **성능 최적화**
- **실시간 스트리밍**: 새로운 코디가 올라올 때마다 실시간 업데이트
- **분산 처리**: 대용량 데이터 처리를 위한 분산 시스템
- **예측 캐싱**: 사용자 행동 패턴 기반 예측적 캐싱

## 💡 사용 팁

### 사용자에게 권장사항:
1. **더 많은 코디 업로드**: 자신의 스타일을 더 많이 공유할수록 정확한 추천
2. **좋아요 활용**: 마음에 드는 코디에 좋아요를 눌러 취향 학습
3. **피드백 제공**: 추천에 대한 피드백을 주면 더 정확해짐
4. **다양한 스타일 시도**: 새로운 스타일을 시도해보면 추천 다양성 증가

### 개발자를 위한 팁:
1. **인덱스 최적화**: `tempRange`와 `likeCount` 복합 인덱스 필수
2. **캐시 전략**: 자주 조회되는 조건별 캐싱으로 성능 향상
3. **에러 처리**: 네트워크 오류 시 폴백 추천 제공
4. **모니터링**: 추천 품질과 사용자 만족도 지속 모니터링

---

이 시스템을 통해 사용자들은 **실제로 검증된 코디**를 바탕으로 한 신뢰할 수 있는 추천을 받을 수 있습니다! 🎉


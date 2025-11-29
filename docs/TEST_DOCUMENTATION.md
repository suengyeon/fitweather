# 단위 및 통합 테스트 상세 문서

## 📋 목차

1. [테스트 개요](#테스트-개요)
2. [단위 테스트 (Unit Tests)](#단위-테스트-unit-tests)
3. [통합 테스트 (Integration Tests)](#통합-테스트-integration-tests)
4. [테스트 통계](#테스트-통계)
5. [테스트 실행 방법](#테스트-실행-방법)

---

## 테스트 개요

### 테스트 현황

- **총 테스트 파일**: 16개
- **총 테스트 케이스**: 151개
- **테스트 통과율**: 100% (모든 테스트 통과)
- **테스트 유형**: 단위 테스트 + 통합 테스트

### 테스트 도구

| 도구 | 버전 | 용도 |
|------|------|------|
| **Jest** | (CRA 포함) | 테스트 프레임워크 |
| **@testing-library/react** | ^16.3.0 | React 컴포넌트 테스트 |
| **@testing-library/jest-dom** | ^6.6.3 | DOM 매처 확장 |
| **@testing-library/user-event** | ^13.5.0 | 사용자 이벤트 시뮬레이션 |

---

## 단위 테스트 (Unit Tests)

단위 테스트는 개별 함수, 컴포넌트, 서비스를 독립적으로 테스트합니다.

### 1. 유틸리티 함수 테스트 (5개 파일)

#### `weatherUtils.test.js` - 날씨 유틸리티 함수

**테스트 대상**: `getWeatherEmoji`, `feelingToEmoji`, `getFeelingOptions`

**테스트 케이스**:
- ✅ 날씨 아이콘 코드를 이모지로 변환 (맑음, 구름, 비, 눈 등)
- ✅ 체감 온도를 이모지로 변환 (steam, hot, nice, cold, ice)
- ✅ 감정 옵션 배열 생성 및 검증
- ✅ 알 수 없는 코드 처리

**예시**:
```javascript
test('맑은 날씨 아이콘 코드를 이모지로 변환', () => {
  expect(getWeatherEmoji('sunny')).toBe('☀️');
});

test('hot 감정을 이모지로 변환', () => {
  expect(feelingToEmoji('hot')).toBe('🥵 (더움)');
});
```

#### `forecastUtils.test.js` - 예보 데이터 처리 함수

**테스트 대상**: `selectNextForecast`, `getSeason`, `getWeatherExpression`, `getExpressionColor`

**테스트 케이스**:
- ✅ 유효한 예보 데이터에서 다음 시간대 예보 추출
- ✅ 빈 배열/null 처리
- ✅ 24절기 기반 계절 판별 (봄, 여름, 가을, 겨울)
- ✅ 온도 기반 날씨 표현 반환 (따뜻해요, 추워요 등)
- ✅ 날씨 표현별 색상 반환

**예시**:
```javascript
test('봄 계절에 대한 날씨 표현 반환', () => {
  expect(getWeatherExpression('봄', 20)).toBe('따뜻해요');
  expect(getWeatherExpression('봄', 15)).toBe('포근해요');
  expect(getWeatherExpression('봄', 10)).toBe('시원해요');
});

test('더운 날씨 표현에 대한 색상 반환', () => {
  expect(getExpressionColor('너무 더워요')).toBe('#F44336');
});
```

#### `seasonUtils.test.js` - 계절 정보 함수

**테스트 대상**: `getSeasonInfo`

**테스트 케이스**:
- ✅ 각 월별 계절 정보 반환 (3월~2월)
- ✅ 계절, 기간, 레이블, 이모지 모두 올바르게 반환
- ✅ 기본값으로 현재 날짜 사용
- ✅ 모든 반환값의 구조 검증

**예시**:
```javascript
test('3월(초봄)에 대한 계절 정보 반환', () => {
  const date = new Date(2024, 2, 15); // 3월 15일
  const info = getSeasonInfo(date);
  
  expect(info.season).toBe('spring');
  expect(info.period).toBe('early');
  expect(info.label).toBe('초봄');
  expect(info.emoji).toBe('🌸');
});
```

#### `timeUtils.test.js` - 시간 변환 함수

**테스트 대상**: 시간 변환 유틸리티 함수들

**테스트 케이스**:
- ✅ 서울 시간 기준 시간 변환
- ✅ 다양한 시간대 처리
- ✅ 날짜 포맷 변환

#### `styleUtils.test.js` - 스타일 변환 함수

**테스트 대상**: `getStyleLabel` 등 스타일 관련 함수

**테스트 케이스**:
- ✅ 스타일 코드를 한글 레이블로 변환
- ✅ 스타일 옵션 배열 생성
- ✅ 알 수 없는 스타일 코드 처리

---

### 2. 서비스 테스트 (2개 파일)

#### `weatherService.test.js` - 날씨 서비스 클래스

**테스트 대상**: `WeatherService` 클래스

**테스트 케이스**:

1. **생성자 테스트**
   - ✅ 기본 API가 'kma'로 설정되는지 확인
   - ✅ Fallback API 목록이 올바르게 설정되는지 확인
   - ✅ 초기 상태값 확인

2. **날씨 조회 테스트**
   - ✅ 기상청 API 성공 시 데이터 반환
   - ✅ 기상청 API 타임아웃 시 Fallback API 시도
   - ✅ 기상청 API 실패 시 Fallback API 시도

3. **Mock 데이터 테스트**
   - ✅ 모의 데이터가 올바른 구조를 가지고 있는지 확인
   - ✅ 모의 데이터의 온도가 합리적인 범위 내에 있는지 확인

4. **계절/표현/색상 테스트**
   - ✅ 온도와 날짜를 기반으로 계절 반환
   - ✅ 계절과 온도를 기반으로 날씨 표현 반환
   - ✅ 날씨 표현에 대한 색상 반환
   - ✅ 계절에 대한 색상 반환

**예시**:
```javascript
test('기상청 API 성공 시 데이터 반환', async () => {
  const mockWeatherData = {
    temp: 20,
    sky: '1',
    pty: '0',
    icon: 'sunny',
    season: '봄'
  };
  
  weatherService.fetchKmaWeather = jest.fn().mockResolvedValue(mockWeatherData);
  
  const result = await weatherService.getWeather('Seoul');
  
  expect(result).toEqual(mockWeatherData);
  expect(weatherService.lastUsedAPI).toBe('kma');
});
```

#### `notificationService.test.js` - 알림 서비스

**테스트 대상**: 알림 CRUD 및 비즈니스 로직

**테스트 케이스**:

1. **알림 생성**
   - ✅ 유효한 알림 데이터로 알림 생성
   - ✅ 유효하지 않은 데이터로 알림 생성 시도 시 에러 발생

2. **알림 조회**
   - ✅ 사용자 알림 목록 조회
   - ✅ 페이징 옵션과 함께 알림 조회
   - ✅ 읽지 않은 알림 개수 조회

3. **읽음 처리**
   - ✅ 모든 읽지 않은 알림을 읽음 처리
   - ✅ 특정 알림을 읽음 처리
   - ✅ 존재하지 않는 알림 읽음 처리 시도 시 에러 발생
   - ✅ 권한이 없는 사용자 처리

4. **알림 삭제**
   - ✅ 여러 알림 삭제
   - ✅ 빈 배열 처리

5. **알림 타입별 생성**
   - ✅ 구독 알림 생성
   - ✅ 댓글 알림 생성
   - ✅ 답글 알림 생성
   - ✅ 신고 알림 생성

**예시**:
```javascript
test('유효한 알림 데이터로 알림 생성', async () => {
  const mockDocRef = { id: 'notification123' };
  addDoc.mockResolvedValue(mockDocRef);
  
  const notificationData = {
    recipient: 'user123',
    sender: { id: 'user456', nickname: 'TestUser' },
    type: NOTIFICATION_TYPES.FOLLOW,
    link: '/profile/user456'
  };
  
  const result = await createNotification(notificationData);
  
  expect(result).toBe('notification123');
  expect(addDoc).toHaveBeenCalled();
});
```

---

### 3. API 함수 테스트 (3개 파일)

#### `user.test.js` - 사용자 API

**테스트 대상**: `fetchUserRegion`

**테스트 케이스**:
- ✅ 사용자 지역 정보 조회 성공
- ✅ 사용자 문서가 존재하지 않으면 null 반환
- ✅ 에러 발생 시 null 반환
- ✅ region 필드가 없으면 undefined 반환

#### `saveOutfitRecord.test.js` - 착장 기록 저장 API

**테스트 대상**: `saveOutfitRecord`

**테스트 케이스**:
- ✅ 착장 레코드 저장 성공
- ✅ 필수 필드만 있는 레코드 저장
- ✅ 저장 실패 시 에러 발생

**예시**:
```javascript
test('착장 레코드 저장 성공', async () => {
  const mockDocRef = { id: 'record123' };
  addDoc.mockResolvedValue(mockDocRef);
  
  const record = {
    uid: 'user123',
    region: 'Seoul',
    date: '2024-03-15',
    temp: 20,
    rain: 0,
    feeling: 'nice',
    outfit: { top: 'T-shirt', bottom: 'Jeans' }
  };
  
  const result = await saveOutfitRecord(record);
  
  expect(result).toBe('record123');
  expect(addDoc).toHaveBeenCalled();
});
```

#### `toggleLike.test.js` - 좋아요 토글 API

**테스트 대상**: `toggleLike`

**테스트 케이스**:
- ✅ 좋아요 추가 (이전에 좋아요하지 않은 경우)
- ✅ 좋아요 취소 (이미 좋아요한 경우)
- ✅ 레코드가 존재하지 않으면 에러 발생
- ✅ likes 배열이 없으면 빈 배열로 처리

**예시**:
```javascript
test('좋아요 추가 (이전에 좋아요하지 않은 경우)', async () => {
  const mockRecordDoc = {
    exists: () => true,
    data: () => ({ likes: [] })
  };
  
  const mockUpdatedRecordDoc = {
    exists: () => true,
    data: () => ({ likes: ['user123'] })
  };
  
  getDoc
    .mockResolvedValueOnce(mockRecordDoc)
    .mockResolvedValueOnce(mockUpdatedRecordDoc);
  
  const result = await toggleLike('record123', 'user123');
  
  expect(result).toEqual(['user123']);
  expect(updateDoc).toHaveBeenCalledTimes(2);
});
```

---

### 4. 컴포넌트 테스트 (1개 파일)

#### `WeatherCard.test.js` - 날씨 카드 컴포넌트

**테스트 대상**: `WeatherCard` 컴포넌트

**테스트 케이스**:
- ✅ 기본 props로 렌더링
- ✅ 온도, 강수량, 습도 표시
- ✅ 다양한 날씨 아이콘 표시 (맑음, 비, 눈, 구름)
- ✅ onIconClick 핸들러가 있을 때 클릭 이벤트 처리
- ✅ onIconClick이 없을 때 클릭 이벤트 처리 안 함
- ✅ isRecord prop에 따른 상세 정보 표시/숨김
- ✅ bgColor prop 적용

**예시**:
```javascript
test('다양한 날씨 아이콘 표시', () => {
  const { rerender } = render(<WeatherCard {...defaultProps} icon="rain" />);
  expect(screen.getByText('🌧️')).toBeInTheDocument();
  
  rerender(<WeatherCard {...defaultProps} icon="snow" />);
  expect(screen.getByText('❄️')).toBeInTheDocument();
  
  rerender(<WeatherCard {...defaultProps} icon="cloudy" />);
  expect(screen.getByText('☁️')).toBeInTheDocument();
});
```

---

## 통합 테스트 (Integration Tests)

통합 테스트는 여러 모듈이 함께 작동하는 전체 플로우를 테스트합니다.

### 1. API 통합 테스트 (1개 파일)

#### `weatherIntegration.test.js` - 날씨 API 통합 플로우

**테스트 대상**: 날씨 API Fallback 시스템 전체 플로우

**테스트 케이스**:

1. **기상청 API 성공 시 전체 플로우**
   - ✅ 기상청 API 호출 → 데이터 반환 → 표준화된 형식 확인
   - ✅ `lastUsedAPI`가 'kma'로 설정되는지 확인

2. **기상청 API 실패 후 Fallback API 성공 플로우**
   - ✅ 기상청 API 실패 → OpenWeatherMap API 시도 → 성공
   - ✅ 데이터가 올바르게 변환되는지 확인
   - ✅ `lastUsedAPI`가 'openweathermap'으로 설정되는지 확인

3. **모든 API 실패 후 Mock 데이터 반환 플로우**
   - ✅ 모든 외부 API 실패 → Mock 데이터 반환
   - ✅ `apiSource`가 'mock'인지 확인
   - ✅ 서비스 지속성 확인

4. **날씨 데이터 표준화**
   - ✅ 다양한 API에서 받은 데이터가 표준 형식으로 변환되는지 확인
   - ✅ 필수 필드(temp, icon 등) 존재 확인

**예시**:
```javascript
test('기상청 API 실패 후 Fallback API 성공 플로우', async () => {
  weatherService.fetchKmaWeather = jest.fn().mockRejectedValue(new Error('KMA API Error'));
  
  weatherService.fetchOpenWeatherMap = jest.fn().mockResolvedValue({
    temp: 22,
    icon: 'cloudy',
    season: '봄',
    apiSource: 'openweathermap'
  });
  
  const result = await weatherService.getWeather('Seoul');
  
  expect(result).toBeDefined();
  expect(result.temp).toBe(22);
  expect(weatherService.lastUsedAPI).toBe('openweathermap');
});
```

---

### 2. 사용자 플로우 테스트 (2개 파일)

#### `recordFlow.test.js` - 착장 기록 생성 및 좋아요 플로우

**테스트 대상**: 기록 생성 → 좋아요 추가 전체 플로우

**테스트 케이스**:

1. **착장 기록 생성 → 좋아요 추가 전체 플로우**
   - ✅ 기록 저장 성공
   - ✅ 좋아요 추가 성공
   - ✅ 데이터 일관성 확인

2. **여러 사용자가 같은 기록에 좋아요 추가**
   - ✅ User1 좋아요 추가
   - ✅ User2 좋아요 추가
   - ✅ 두 사용자 모두 likes 배열에 포함되는지 확인
   - ✅ 데이터 정합성 확인

3. **에러 처리 플로우**
   - ✅ 기록 저장 실패 시 에러 처리
   - ✅ 존재하지 않는 기록에 좋아요 시도 시 에러 처리

**예시**:
```javascript
test('1. 착장 기록 생성 → 2. 좋아요 추가 전체 플로우', async () => {
  // 1. 착장 기록 생성
  const mockRecordRef = { id: 'record123' };
  addDoc.mockResolvedValue(mockRecordRef);
  
  const record = {
    uid: 'user123',
    region: 'Seoul',
    date: '2024-03-15',
    temp: 20,
    outfit: { top: 'T-shirt', bottom: 'Jeans' }
  };
  
  const recordId = await saveOutfitRecord(record);
  expect(recordId).toBe('record123');
  
  // 2. 좋아요 추가
  const mockRecordDoc = {
    exists: () => true,
    data: () => ({ likes: [] })
  };
  
  const mockUpdatedRecordDoc = {
    exists: () => true,
    data: () => ({ likes: ['user456'] })
  };
  
  getDoc
    .mockResolvedValueOnce(mockRecordDoc)
    .mockResolvedValueOnce(mockUpdatedRecordDoc);
  
  const likes = await toggleLike(recordId, 'user456');
  expect(likes).toEqual(['user456']);
});
```

#### `notificationFlow.test.js` - 알림 생성 및 조회 플로우

**테스트 대상**: 알림 생성 → 조회 → 읽음 처리 전체 플로우

**테스트 케이스**:

1. **팔로우 알림 플로우**
   - ✅ 팔로우 알림 생성
   - ✅ 알림 조회
   - ✅ 읽음 처리
   - ✅ 전체 플로우 검증

2. **댓글 알림 플로우**
   - ✅ 댓글 작성 시 알림 생성
   - ✅ 알림 목록 조회
   - ✅ 알림 타입 확인

3. **읽지 않은 알림 개수 조회**
   - ✅ 정확한 개수 반환 확인

**예시**:
```javascript
test('1. 팔로우 알림 생성 → 2. 알림 조회 → 3. 읽음 처리', async () => {
  // 1. 팔로우 알림 생성
  const mockFollowNotifRef = { id: 'followNotif123' };
  addDoc.mockResolvedValue(mockFollowNotifRef);
  
  const notifId = await createFollowNotification(
    'follower123',
    'Follower',
    'following123',
    'avatar.jpg'
  );
  
  expect(notifId).toBe('followNotif123');
  
  // 2. 알림 조회
  const mockNotifDoc = {
    id: 'followNotif123',
    data: () => ({
      recipient: 'following123',
      type: NOTIFICATION_TYPES.FOLLOW,
      isRead: false
    })
  };
  
  const mockSnapshot = {
    docs: [mockNotifDoc],
    empty: false
  };
  
  getDocs.mockResolvedValue(mockSnapshot);
  
  const result = await getUserNotifications('following123');
  expect(result.notifications.length).toBe(1);
  expect(result.unreadCount).toBe(1);
  
  // 3. 읽음 처리
  const mockReadDoc = {
    exists: () => true,
    data: () => ({ recipient: 'following123' })
  };
  
  getDoc.mockResolvedValue(mockReadDoc);
  updateDoc.mockResolvedValue();
  
  const readResult = await markNotificationAsRead('followNotif123', 'following123');
  expect(readResult).toBe(true);
});
```

---

## 테스트 통계

### 테스트 파일 분류

| 카테고리 | 파일 수 | 주요 테스트 내용 |
|---------|--------|----------------|
| **유틸리티 함수** | 5개 | 날씨, 계절, 시간, 스타일 변환 |
| **서비스** | 2개 | 날씨 서비스, 알림 서비스 |
| **API 함수** | 3개 | 사용자, 기록 저장, 좋아요 |
| **컴포넌트** | 1개 | 날씨 카드 컴포넌트 |
| **API 통합** | 1개 | 날씨 API Fallback 시스템 |
| **사용자 플로우** | 2개 | 기록 생성/좋아요, 알림 플로우 |
| **모크/유틸리티** | 2개 | Firebase 모크, 테스트 유틸리티 |
| **총계** | **16개** | **151개 테스트 케이스** |

### 테스트 커버리지

- **단위 테스트**: 핵심 유틸리티 함수, 서비스, API 함수 커버
- **통합 테스트**: 주요 사용자 플로우 및 API Fallback 시스템 커버
- **목표 커버리지**: 80% 이상 (단위 테스트)

---

## 테스트 실행 방법

### 모든 테스트 실행
```bash
npm test
```

### 특정 파일 테스트
```bash
npm test -- weatherUtils.test.js
```

### Watch 모드로 실행
```bash
npm test -- --watch
```

### 커버리지 리포트 생성
```bash
npm test -- --coverage
```

### 단위 테스트만 실행
```bash
npm test -- --testPathPattern=unit
```

### 통합 테스트만 실행
```bash
npm test -- --testPathPattern=integration
```

---

## 테스트 모킹

### Firebase 모크

모든 Firebase 관련 테스트는 `__mocks__/firebase.js`를 사용합니다.

**주요 모크 함수**:
- `collection`, `doc`, `getDoc`, `getDocs`
- `addDoc`, `updateDoc`, `deleteDoc`
- `query`, `where`, `orderBy`, `limit`
- `serverTimestamp`, `writeBatch`

**사용 예시**:
```javascript
jest.mock('../../../firebase', () => ({
  db: require('../../../__tests__/__mocks__/firebase').db
}));

jest.mock('firebase/firestore', () => 
  require('../../../__tests__/__mocks__/firebase')
);
```

### 외부 API 모크

날씨 API는 `jest.fn()`을 사용하여 모크합니다.

**사용 예시**:
```javascript
jest.mock('../../../api/kmaWeather', () => ({
  fetchKmaForecast: jest.fn()
}));

fetchKmaForecast.mockResolvedValue(mockWeatherData);
```

---

## 주요 테스트 시나리오

### 1. 날씨 API Fallback 시스템

- ✅ 기상청 API 성공
- ✅ 기상청 API 실패 → OpenWeatherMap 성공
- ✅ 모든 API 실패 → Mock 데이터 반환
- ✅ 타임아웃 처리

### 2. 알림 시스템

- ✅ 구독 알림 생성 → 조회 → 읽음 처리
- ✅ 댓글 알림 생성 → 조회
- ✅ 읽지 않은 알림 개수 조회
- ✅ 여러 알림 일괄 처리

### 3. 착장 기록 시스템

- ✅ 기록 생성 → 좋아요 추가
- ✅ 여러 사용자 동시 좋아요
- ✅ 에러 처리

### 4. 유틸리티 함수

- ✅ 날씨 아이콘 변환
- ✅ 계절 판별 (24절기 기반)
- ✅ 날씨 표현 계산 (온도 기반)
- ✅ 색상 변환

---

## 테스트 품질 지표

### ✅ 강점

1. **포괄적인 커버리지**: 핵심 기능 대부분 테스트
2. **명확한 테스트 구조**: 단위/통합 테스트 분리
3. **실제 시나리오 반영**: 사용자 플로우 테스트 포함
4. **에러 처리 검증**: 예외 상황 테스트 포함
5. **모킹 활용**: 외부 의존성 격리

### ⚠️ 개선 가능한 부분

1. **E2E 테스트 부재**: End-to-End 테스트 없음
2. **커버리지 측정**: 실제 커버리지 수치 미확인
3. **성능 테스트**: 성능 관련 테스트 없음
4. **접근성 테스트**: 접근성 검증 테스트 없음

---

## 결론

Fitweather 프로젝트는 **151개의 테스트 케이스**로 핵심 기능을 검증하고 있습니다. 단위 테스트와 통합 테스트를 통해 코드의 안정성과 신뢰성을 보장하며, 특히 날씨 API Fallback 시스템과 알림 시스템 같은 핵심 기능에 대한 철저한 테스트를 수행하고 있습니다.

---

**작성일**: 2024년  
**프로젝트**: Fitweather - 날씨 기반 착장 기록 및 공유 플랫폼



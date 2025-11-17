# Fitweather 테스트 가이드

## 테스트 라이브러리

| 라이브러리 | 버전 | 용도 | 설명 |
|-----------|------|------|------|
| **Jest** | (CRA 포함) | 테스트 프레임워크 | JavaScript 테스트 러너, 어설션, 모킹 제공 |
| **@testing-library/react** | ^16.3.0 | React 컴포넌트 테스트 | React 컴포넌트 렌더링 및 테스트 유틸리티 |
| **@testing-library/jest-dom** | ^6.6.3 | DOM 매처 확장 | `toBeInTheDocument()`, `toHaveClass()` 등 추가 매처 |
| **@testing-library/user-event** | ^13.5.0 | 사용자 이벤트 시뮬레이션 | 클릭, 타이핑 등 사용자 상호작용 시뮬레이션 |
| **@testing-library/dom** | ^10.4.0 | DOM 쿼리 유틸리티 | DOM 요소 쿼리 및 검증 유틸리티 |
| **react-scripts** | 5.0.1 | 테스트 환경 설정 | Jest 설정 및 테스트 실행 환경 제공 |

### 주요 기능

- **Jest**: 테스트 실행, 어설션, 모킹, 스냅샷 테스트
- **React Testing Library**: 사용자 중심 테스트 접근법, 접근성 기반 쿼리
- **jest-dom**: DOM 상태 검증을 위한 추가 매처 (`toBeInTheDocument()`, `toHaveClass()` 등)
- **user-event**: 실제 사용자 행동을 시뮬레이션하는 고급 이벤트 처리

---

## 테스트 구조

```
src/__tests__/
├── __mocks__/           # 모크 파일들
│   └── firebase.js      # Firebase 모크
├── utils/               # 테스트 유틸리티
│   └── testUtils.js     # 테스트 헬퍼 함수들
├── unit/                # 단위 테스트
│   ├── api/            # API 함수 테스트
│   ├── components/     # 컴포넌트 테스트
│   ├── services/       # 서비스 테스트
│   └── utils/          # 유틸리티 함수 테스트
└── integration/         # 통합 테스트
    ├── api/            # API 통합 테스트
    └── userFlow/       # 사용자 플로우 테스트
```

## 테스트 실행

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

## 테스트 종류

### 1. 단위 테스트 (Unit Tests)

#### 유틸리티 함수 테스트
- `weatherUtils.test.js`: 날씨 관련 유틸리티 함수
- `forecastUtils.test.js`: 예보 데이터 처리 함수
- `seasonUtils.test.js`: 계절 관련 함수
- `timeUtils.test.js`: 시간 관련 함수
- `styleUtils.test.js`: 스타일 관련 함수

#### 서비스 테스트
- `weatherService.test.js`: 날씨 서비스 클래스
- `notificationService.test.js`: 알림 서비스

#### API 함수 테스트
- `user.test.js`: 사용자 API
- `saveOutfitRecord.test.js`: 착장 기록 저장 API
- `toggleLike.test.js`: 좋아요 토글 API

#### 컴포넌트 테스트
- `WeatherCard.test.js`: 날씨 카드 컴포넌트

### 2. 통합 테스트 (Integration Tests)

#### API 통합 테스트
- `weatherIntegration.test.js`: 날씨 API 통합 플로우

#### 사용자 플로우 테스트
- `recordFlow.test.js`: 착장 기록 생성 및 좋아요 플로우
- `notificationFlow.test.js`: 알림 생성 및 조회 플로우

## 모크 설정

### Firebase 모크
Firebase 관련 테스트는 `__mocks__/firebase.js`를 사용합니다.

```javascript
import { db, auth } from '../../../__tests__/__mocks__/firebase';
```

### 사용 예시
```javascript
// Firebase 모크 설정
jest.mock('../../../firebase', () => ({
  db: require('../../../__tests__/__mocks__/firebase').db
}));

jest.mock('firebase/firestore', () => 
  require('../../../__tests__/__mocks__/firebase')
);
```

## 테스트 작성 가이드

### 1. 테스트 파일 명명 규칙
- 파일명: `*.test.js` 또는 `*.spec.js`
- 위치: 테스트 대상 파일과 동일한 구조 유지

### 2. 테스트 구조
```javascript
describe('Component/Function Name', () => {
  beforeEach(() => {
    // 테스트 전 설정
  });

  afterEach(() => {
    // 테스트 후 정리
  });

  describe('Feature/Function', () => {
    test('should do something', () => {
      // 테스트 코드
    });
  });
});
```

### 3. 모크 사용
```javascript
// 함수 모크
jest.mock('../../../api/kmaWeather', () => ({
  fetchKmaForecast: jest.fn()
}));

// 모크 구현
fetchKmaForecast.mockResolvedValue(mockData);
```

### 4. 비동기 테스트
```javascript
test('async function test', async () => {
  const result = await asyncFunction();
  expect(result).toBe(expected);
});
```

## 커버리지 목표

- **단위 테스트 커버리지**: 80% 이상
- **통합 테스트**: 주요 플로우 100% 커버

## 주의사항

1. **Firebase 모크**: 실제 Firebase에 연결하지 않도록 주의
2. **비동기 처리**: `async/await` 또는 `Promise` 사용
3. **모크 리셋**: `beforeEach`에서 모크 초기화
4. **타임아웃**: 긴 작업은 `jest.setTimeout()` 사용

## 문제 해결

### 테스트가 실패하는 경우
1. 모크가 제대로 설정되었는지 확인
2. 비동기 처리가 올바른지 확인
3. 테스트 환경 변수가 설정되었는지 확인

### Firebase 모크 오류
- `__mocks__/firebase.js` 파일이 올바르게 설정되었는지 확인
- `jest.mock()` 호출이 올바른지 확인

## 추가 리소스

- [Jest 공식 문서](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Firebase 테스트 가이드](https://firebase.google.com/docs/emulator-suite)


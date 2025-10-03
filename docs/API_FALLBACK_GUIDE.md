# 🌤️ 날씨 API 대체 시스템 가이드

## 📋 개요

Fitweather는 안정적인 날씨 서비스를 제공하기 위해 **이중 API 시스템**을 구현했습니다.

- **기본 API**: 기상청 (KMA) API
- **대체 API**: OpenWeatherMap API
- **자동 전환**: 기상청 API 실패 시 자동으로 OpenWeatherMap으로 전환

## 🔧 설정 방법

### 1. 환경 변수 설정

`.env` 파일에 다음 API 키들을 설정하세요:

```bash
# 기상청 API 키 (기본)
REACT_APP_KMA_SERVICE_KEY=your_kma_api_key_here

# OpenWeatherMap API 키 (대체용)
REACT_APP_OPENWEATHER_API_KEY=your_openweathermap_api_key_here
```

### 2. API 키 발급

#### 기상청 API 키
1. [공공데이터포털](https://data.go.kr) 접속
2. 회원가입 및 로그인
3. "기상청_단기예보조회" 검색
4. 활용신청 후 승인 대기
5. 승인 후 API 키 발급

#### OpenWeatherMap API 키
1. [OpenWeatherMap](https://openweathermap.org/api) 접속
2. 회원가입 및 로그인
3. "Current Weather Data" API 선택
4. API 키 발급 (무료: 일일 1,000회)

## 🚀 동작 방식

### 1. 기본 동작
```javascript
// 1차: 기상청 API 시도
try {
  const data = await fetchKmaWeather(region);
  return data; // 성공 시 기상청 데이터 반환
} catch (error) {
  // 2차: OpenWeatherMap API 시도
  const data = await fetchOpenWeatherMap(region);
  return data; // 대체 API 데이터 반환
}
```

### 2. 데이터 변환
OpenWeatherMap 데이터를 기상청 형식으로 자동 변환:

| OpenWeatherMap | 기상청 | 아이콘 |
|----------------|--------|--------|
| 800 (맑음) | sky=1, pty=0 | ☀️ |
| 801-802 (구름) | sky=3, pty=0 | ☁️ |
| 500-531 (비) | pty=1 | 🌧️ |
| 600-622 (눈) | pty=3 | ❄️ |

## 🎨 UI 표시

### API 소스 표시기
사용자에게 현재 사용 중인 API를 표시:

- **🇰🇷 KMA**: 기상청 API 사용 중
- **🌍 OWM**: OpenWeatherMap API 사용 중

### 표시 위치
- 홈 화면: 날씨 온도 아래
- 지역 피드: 날씨 카드 내
- 기록 화면: 날씨 정보 옆

## 📊 장점

### 1. 안정성
- 기상청 API 장애 시에도 서비스 지속
- 자동 대체로 사용자 경험 향상

### 2. 국제화
- OpenWeatherMap은 전 세계 날씨 데이터 제공
- 해외 지역 확장 시 유리

### 3. 성능
- 더 빠른 응답 시간
- 실시간 업데이트

### 4. 비용 효율성
- OpenWeatherMap 무료 플랜: 일일 1,000회
- 유료 플랜: 월 $40부터

## 🔍 모니터링

### 콘솔 로그
```javascript
// 성공 시
✅ 기상청 API 성공
✅ OpenWeatherMap API 성공

// 실패 시
❌ 기상청 API 실패, OpenWeatherMap으로 대체
❌ 모든 날씨 API 실패
```

### API 소스 추적
```javascript
const { weather, apiSource } = useWeather(region);
console.log('현재 API:', apiSource); // 'kma' 또는 'openweathermap'
```

## 🛠️ 문제 해결

### 1. API 키 오류
```
Error: OpenWeatherMap API 키가 설정되지 않았습니다.
```
**해결**: `.env` 파일에 `REACT_APP_OPENWEATHER_API_KEY` 설정

### 2. 지역명 오류
```
Error: OpenWeatherMap API 오류: 404
```
**해결**: 지역명 매핑 테이블 확인 및 추가

### 3. 네트워크 오류
```
Error: 모든 날씨 API 실패
```
**해결**: 네트워크 연결 확인 및 API 서버 상태 점검

## 📈 성능 최적화

### 1. 캐싱
- 날씨 데이터 10분간 캐시
- 중복 요청 방지

### 2. 에러 핸들링
- 타임아웃 설정 (5초)
- 재시도 로직 (3회)

### 3. 사용자 경험
- 로딩 상태 표시
- API 소스 시각적 표시

## 🔮 향후 계획

1. **추가 API 지원**: AccuWeather, WeatherAPI 등
2. **지능형 선택**: 지역별 최적 API 자동 선택
3. **데이터 품질**: 여러 API 데이터 비교 및 검증
4. **실시간 모니터링**: API 상태 대시보드

---

이 시스템을 통해 사용자는 안정적이고 끊김 없는 날씨 서비스를 경험할 수 있습니다! 🌟

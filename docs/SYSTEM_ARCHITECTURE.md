# Fitweather 시스템 아키텍처

## 📋 목차

1. [전체 개요](#전체-개요)
2. [시스템 구성도](#시스템-구성도)
3. [아키텍처 레이어](#아키텍처-레이어)
4. [데이터 모델](#데이터-모델)
5. [주요 플로우](#주요-플로우)
6. [라우팅 구조](#라우팅-구조)
7. [컴포넌트 계층 구조](#컴포넌트-계층-구조)
8. [API 통신 구조](#api-통신-구조)

---

## 전체 개요

Fitweather는 날씨 기반 착장 기록 및 공유 플랫폼입니다. React 기반 SPA와 Firebase BaaS를 활용하여 구현되었습니다.

### 기술 스택

- **Frontend**: React (CRA), React Router, Tailwind CSS
- **Backend**: Firebase (Auth, Firestore, Storage)
- **External APIs**: 
  - 날씨 API: 기상청(KMA), OpenWeatherMap, AccuWeather, WeatherAPI, Visual Crossing (Fallback 시스템)
  - OAuth: 구글 로그인 (Firebase Auth), 카카오 로그인

---

## 시스템 구성도

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[🌐 브라우저]
        React[⚛️ React App]
    end
    
    subgraph "Presentation Layer"
        Pages[📄 Pages]
        Components[🧩 Components]
        Contexts[🔄 Contexts]
    end
    
    subgraph "Business Logic Layer"
        Services[⚙️ Services]
        Utils[🛠️ Utils]
        Hooks[🎣 Custom Hooks]
    end
    
    subgraph "Data Access Layer"
        API[📡 API Modules]
        FirebaseSDK[🔥 Firebase SDK]
    end
    
    subgraph "Backend Services"
        FirebaseAuth[🔐 Firebase Auth]
        Firestore[🗄️ Firestore]
        Storage[📁 Firebase Storage]
    end
    
    subgraph "External Services"
        KMA[🌤️ KMA API<br/>기상청]
        OWM[🌍 OpenWeatherMap<br/>대체 API 1]
        AccuWeather[🌤️ AccuWeather<br/>대체 API 2]
        WeatherAPI[🌦️ WeatherAPI<br/>대체 API 3]
        VisualCrossing[🌍 Visual Crossing<br/>대체 API 4]
        GoogleOAuth[🔍 구글 OAuth<br/>Firebase Auth]
        KakaoOAuth[🔗 카카오 OAuth]
    end
    
    Browser --> React
    React --> Pages
    React --> Components
    React --> Contexts
    
    Pages --> Services
    Pages --> API
    Components --> Utils
    Components --> Hooks
    
    Services --> API
    Utils --> API
    Hooks --> API
    
    API --> FirebaseSDK
    FirebaseSDK --> FirebaseAuth
    FirebaseSDK --> Firestore
    FirebaseSDK --> Storage
    
    API --> KMA
    API --> OWM
    API --> AccuWeather
    API --> WeatherAPI
    API --> VisualCrossing
    FirebaseAuth --> GoogleOAuth
    FirebaseAuth --> KakaoOAuth
    
    style Browser fill:#e1f5ff
    style React fill:#61dafb
    style FirebaseAuth fill:#ffa726
    style Firestore fill:#ffa726
    style Storage fill:#ffa726
    style KMA fill:#4fc3f7
    style KakaoOAuth fill:#fee500
```

---

## 아키텍처 레이어

### 1. Presentation Layer (표현 계층)

**Pages** (`src/pages/`)
- 사용자 인터페이스 페이지 컴포넌트
- 라우트에 직접 연결되는 최상위 컴포넌트

**Components** (`src/components/`)
- 재사용 가능한 UI 컴포넌트
- 특정 페이지에 종속되지 않는 범용 컴포넌트

**Contexts** (`src/contexts/`)
- 전역 상태 관리 (AuthContext 등)
- 컴포넌트 간 상태 공유

### 2. Business Logic Layer (비즈니스 로직 계층)

**Services** (`src/services/`)
- 복잡한 비즈니스 로직 처리
- 예: `notificationService.js` - 알림 생성 및 관리

**Utils** (`src/utils/`)
- 순수 함수 유틸리티
- 예: `sortingUtils.js`, `seasonUtils.js`, `weatherUtils.js`

**Custom Hooks** (`src/hooks/`)
- 재사용 가능한 상태 로직
- 예: `useUserProfile.js`, `useWeather.js`, `useNotiSidebar.js`

### 3. Data Access Layer (데이터 접근 계층)

**API Modules** (`src/api/`)
- Firebase 및 외부 API 호출
- 데이터 CRUD 작업 캡슐화

**Firebase SDK** (`src/firebase.js`)
- Firebase 초기화 및 설정
- Firebase 서비스 접근

---

## 데이터 모델

### Firestore 컬렉션 구조

```mermaid
erDiagram
    users ||--o{ outfits : "작성"
    users ||--o{ follows : "구독"
    users ||--o{ notifications : "수신"
    users ||--o{ comments : "작성"
    
    outfits ||--o{ comments : "댓글"
    outfits }o--|| users : "작성자"
    
    follows }o--|| users : "follower"
    follows }o--|| users : "following"
    
    notifications }o--|| users : "recipient"
    notifications }o--|| users : "sender"
    
    users {
        string uid PK
        string nickname
        string region
        string profilePictureUrl
        boolean isPublic
        array styles
        string status
    }
    
    outfits {
        string id PK
        string uid FK
        string date
        string region
        number temp
        number rain
        string feeling
        array weatherEmojis
        array imageUrls
        object outfit
        array styles
        array season
        boolean isPublic
        timestamp createdAt
    }
    
    follows {
        string id PK
        string followerId FK
        string followingId FK
        timestamp createdAt
    }
    
    notifications {
        string id PK
        string recipient FK
        object sender
        string type
        string link
        string message
        boolean isRead
        timestamp createdAt
    }
```

### 주요 컬렉션 상세

#### `users`
- 사용자 프로필 정보
- 캘린더 공개 여부 (`isPublic`)
- 기본 스타일 설정

#### `outfits`
- 착장 기록
- 날씨 정보 포함
- 스타일 및 계절 태그

#### `follows`
- 구독 관계
- `followerId` → `followingId`

#### `notifications`
- 알림 메시지
- 타입: `follow`, `comment_on_my_post`, `reply_to_my_comment`
- 읽음 상태 관리

---

## 주요 플로우

### 1. 홈 추천 플로우

```mermaid
sequenceDiagram
    participant User
    participant Home
    participant HomeRecommendationUtils
    participant FirebaseQueries
    participant SortingUtils
    participant SeasonUtils
    
    User->>Home: 페이지 접근
    Home->>HomeRecommendationUtils: getHomeRecommendations(userStyle, exactSeason)
    HomeRecommendationUtils->>SeasonUtils: getSeasonInfo(현재 날짜)
    SeasonUtils-->>HomeRecommendationUtils: 계절 정보
    HomeRecommendationUtils->>FirebaseQueries: getAllPublicRecords(200)
    FirebaseQueries-->>HomeRecommendationUtils: 전체 공개 기록
    HomeRecommendationUtils->>HomeRecommendationUtils: filterBySeason()
    HomeRecommendationUtils->>HomeRecommendationUtils: filterByStyle() (선택적)
    HomeRecommendationUtils->>SortingUtils: sortRecords(filtered, "popular")
    SortingUtils-->>HomeRecommendationUtils: 정렬된 기록
    HomeRecommendationUtils->>HomeRecommendationUtils: slice(0, 3)
    HomeRecommendationUtils-->>Home: 상위 3개 추천
    Home-->>User: 추천 표시
```

**정렬 알고리즘**:
1. 좋아요 수 내림차순
2. 싫어요 수 오름차순 (적은 순)
3. 생성 시간 오름차순 (빠른 순)

### 2. 기록 저장 플로우

```mermaid
sequenceDiagram
    participant User
    participant Record
    participant UploadAPI
    participant SaveAPI
    participant FirebaseStorage
    participant Firestore
    
    User->>Record: 기록 작성 완료
    Record->>UploadAPI: uploadOutfitImage(images)
    UploadAPI->>FirebaseStorage: 이미지 업로드
    FirebaseStorage-->>UploadAPI: imageUrls
    UploadAPI-->>Record: 이미지 URL 배열
    Record->>SaveAPI: saveOutfitRecord(record)
    SaveAPI->>Firestore: outfits 컬렉션에 문서 추가
    Firestore-->>SaveAPI: 문서 ID
    SaveAPI-->>Record: 저장 완료
    Record->>User: 성공 메시지 표시
```

### 3. 캘린더 접근 플로우

```mermaid
sequenceDiagram
    participant User
    participant Calendar
    participant Firestore
    
    User->>Calendar: /calendar/:uid 접근
    Calendar->>Firestore: users/{uid} 조회
    
    alt 비공개 캘린더
        Firestore-->>Calendar: isPublic = false
        Calendar->>Calendar: alert 1회 표시
        Calendar->>User: history.back() (이전 페이지)
    else 공개 캘린더
        Firestore-->>Calendar: isPublic = true
        Calendar->>Firestore: records 조회 (uid 필터)
        Firestore-->>Calendar: 기록 목록
        Calendar->>User: 캘린더 표시
    end
```

### 4. 알림 표시 플로우

```mermaid
sequenceDiagram
    participant User
    participant NotiSidebar
    participant NotificationService
    participant Firestore
    
    User->>NotiSidebar: 알림 사이드바 열기
    NotiSidebar->>NotificationService: getUserNotifications(userId)
    NotificationService->>Firestore: notifications 컬렉션 조회
    Note over Firestore: recipient == userId<br/>orderBy createdAt desc<br/>limit 50
    Firestore-->>NotificationService: 알림 목록
    NotificationService-->>NotiSidebar: 알림 데이터
    NotiSidebar->>NotiSidebar: 타입별 제목/아이콘 매핑
    NotiSidebar-->>User: 알림 목록 표시
    
    User->>NotiSidebar: 알림 클릭
    NotiSidebar->>NotificationService: markNotificationAsRead(id)
    NotificationService->>Firestore: isRead = true 업데이트
    NotiSidebar->>User: 해당 페이지로 이동
```

---

## 라우팅 구조

```mermaid
graph TB
    App[App.js<br/>BrowserRouter]
    
    App --> AuthProvider[AuthProvider<br/>전역 인증 상태]
    AuthProvider --> Routes[Routes]
    
    Routes --> PublicRoutes[Public Routes]
    Routes --> ProtectedRoutes[Protected Routes]
    Routes --> AdminRoutes[Admin Routes]
    
    PublicRoutes --> Login[/login]
    PublicRoutes --> ProfileSetup[/profile-setup]
    PublicRoutes --> KakaoCallback[/auth/kakao/callback]
    
    ProtectedRoutes --> Home[/<br/>홈 화면]
    ProtectedRoutes --> Record[/record<br/>기록 작성]
    ProtectedRoutes --> Feed[/feed<br/>피드]
    ProtectedRoutes --> FeedDetail[/feed-detail/:id<br/>상세보기]
    ProtectedRoutes --> Calendar[/calendar<br/>캘린더]
    ProtectedRoutes --> CalendarUser[/calendar/:uid<br/>다른 사용자]
    ProtectedRoutes --> Recommend[/recommend<br/>추천]
    ProtectedRoutes --> RecommendView[/recommend-view]
    ProtectedRoutes --> RecommendFilter[/recommend-filter-settings]
    ProtectedRoutes --> Follow[/follow<br/>구독]
    ProtectedRoutes --> MyPage[/mypage_userinfo<br/>마이페이지]
    ProtectedRoutes --> ProfileEdit[/profile-edit<br/>프로필 수정]
    ProtectedRoutes --> Withdraw[/withdraw<br/>회원탈퇴]
    
    AdminRoutes --> Admin[/admin<br/>관리자]
    AdminRoutes --> AdminLogin[/admin-login]
    AdminRoutes --> SetAdmin[/set-admin]
    
    style PublicRoutes fill:#e8f5e9
    style ProtectedRoutes fill:#fff3e0
    style AdminRoutes fill:#fce4ec
```

### 라우트 가드

- **AuthRouteGuard**: 로그인 필요 페이지 보호
- **ProfileGuard**: 프로필 설정 완료 여부 확인
- **BannedUserMessage**: 차단된 사용자 접근 차단

---

## 컴포넌트 계층 구조

```mermaid
graph TD
    App[App<br/>전역 설정, 라우팅]
    
    App --> AuthProvider[AuthProvider<br/>인증 컨텍스트]
    AuthProvider --> Routes[Routes]
    
    Routes --> Page[Page Component<br/>예: Home, Feed, Calendar]
    
    Page --> Sidebar[MenuSidebar<br/>메뉴]
    Page --> NotiSidebar[NotiSidebar<br/>알림]
    Page --> MainContent[Main Content]
    
    MainContent --> WeatherCard[WeatherCard<br/>날씨 표시]
    MainContent --> FeedCard[FeedCard<br/>피드 카드]
    MainContent --> OutfitRecommendation[OutfitRecommendation<br/>추천 표시]
    
    FeedCard --> CommentSection[CommentSection<br/>댓글 섹션]
    FeedCard --> ReportModal[ReportModal<br/>신고 모달]
    
    MainContent --> RecordForm[RecordForm<br/>기록 폼]
    
    style App fill:#61dafb
    style Page fill:#ffa726
    style MainContent fill:#66bb6a
```

### 주요 컴포넌트

#### Pages
- **Home**: 홈 화면, 추천 표시
- **Feed**: 지역 피드
- **FeedDetail**: 기록 상세
- **Record**: 기록 작성/수정
- **Calendar**: 캘린더 뷰
- **Follow**: 구독 관리
- **Recommend**: 추천 페이지

#### Shared Components
- **MenuSidebar**: 메뉴 사이드바
- **NotiSidebar**: 알림 사이드바
- **FeedCard**: 피드 카드
- **WeatherCard**: 날씨 카드
- **CommentSection**: 댓글 섹션
- **AuthRouteGuard**: 인증 가드
- **ProfileGuard**: 프로필 가드

---

## API 통신 구조

### Firebase 통신

```mermaid
graph LR
    Client[Client App]
    
    Client --> Auth[Firebase Auth<br/>인증]
    Client --> Firestore[Firestore<br/>데이터베이스]
    Client --> Storage[Storage<br/>파일 저장]
    
    Auth --> Kakao[카카오 OAuth]
    
    Firestore --> Users[users 컬렉션]
    Firestore --> Outfits[outfits 컬렉션]
    Firestore --> Follows[follows 컬렉션]
    Firestore --> Notifications[notifications 컬렉션]
    
    Storage --> Images[이미지 파일]
```

### 외부 API 통신

#### 날씨 API (Fallback 시스템)

Fitweather는 안정적인 날씨 서비스를 제공하기 위해 **다중 API Fallback 시스템**을 구현했습니다.

```mermaid
sequenceDiagram
    participant Client
    participant WeatherService
    participant PrimaryAPI[기상청 API]
    participant Fallback1[OpenWeatherMap]
    participant Fallback2[AccuWeather]
    participant Fallback3[WeatherAPI]
    participant Fallback4[Visual Crossing]
    
    Client->>WeatherService: 날씨 정보 요청
    
    alt 기상청 API 성공 (2초 타임아웃)
        WeatherService->>PrimaryAPI: 현재 날씨 조회
        PrimaryAPI-->>WeatherService: 날씨 데이터
        WeatherService-->>Client: 기상청 데이터 반환
    else 기상청 API 실패/타임아웃
        WeatherService->>Fallback1: OpenWeatherMap 시도
        alt OpenWeatherMap 성공
            Fallback1-->>WeatherService: 날씨 데이터
            WeatherService-->>Client: OWM 데이터 반환
        else OpenWeatherMap 실패
            WeatherService->>Fallback2: AccuWeather 시도
            alt AccuWeather 시도 성공
                Fallback2-->>WeatherService: 날씨 데이터
                WeatherService-->>Client: AccuWeather 데이터 반환
            else AccuWeather 실패
                WeatherService->>Fallback3: WeatherAPI 시도
                alt WeatherAPI 성공
                    Fallback3-->>WeatherService: 날씨 데이터
                    WeatherService-->>Client: WeatherAPI 데이터 반환
                else WeatherAPI 실패
                    WeatherService->>Fallback4: Visual Crossing 시도
                    alt Visual Crossing 성공
                        Fallback4-->>WeatherService: 날씨 데이터
                        WeatherService-->>Client: Visual Crossing 데이터 반환
                    else 모든 API 실패
                        WeatherService-->>Client: Mock 데이터 반환
                    end
                end
            end
        end
    end
```

**날씨 API 목록**:

| API 이름 | 우선순위 | 용도 | 환경 변수 |
|---------|---------|------|----------|
| **기상청 (KMA)** | 1순위 (기본) | 현재/예보 날씨 | `REACT_APP_KMA_SERVICE_KEY` |
| **OpenWeatherMap** | 2순위 | 대체 API 1 | `REACT_APP_OPENWEATHER_API_KEY` |
| **AccuWeather** | 3순위 | 대체 API 2 | `REACT_APP_ACCUWEATHER_API_KEY` |
| **WeatherAPI** | 4순위 | 대체 API 3 | `REACT_APP_WEATHERAPI_KEY` |
| **Visual Crossing** | 5순위 | 대체 API 4 | `REACT_APP_VISUALCROSSING_API_KEY` |

**기상청 API 엔드포인트**:
- `getVilageFcst`: 단기예보 (현재/미래)
- `getWthrDataList`: 관측 데이터 (과거)

**Fallback 동작**:
- 기상청 API에 2초 타임아웃 적용
- 실패 시 순차적으로 대체 API 시도
- 모든 API 실패 시 Mock 데이터 반환 (서비스 지속성 보장)
- 사용 중인 API는 `ApiSourceIndicator` 컴포넌트로 표시

#### 구글 OAuth API (Firebase Auth)

```mermaid
sequenceDiagram
    participant User
    participant Login
    participant GoogleAuth[구글 인증 서버]
    participant FirebaseAuth
    
    User->>Login: 구글 로그인 클릭
    Login->>FirebaseAuth: GoogleAuthProvider 요청
    FirebaseAuth->>GoogleAuth: OAuth 팝업 인증
    GoogleAuth-->>User: 구글 로그인 페이지
    User->>GoogleAuth: 로그인 정보 입력
    GoogleAuth-->>FirebaseAuth: 인증 토큰
    FirebaseAuth->>FirebaseAuth: Firebase 사용자 생성
    FirebaseAuth-->>Login: Firebase 인증 완료
    Login->>Login: Firestore users 조회
    alt 신규 사용자
        Login->>User: 프로필 설정 페이지로 이동
    else 기존 사용자
        Login->>User: 홈 화면으로 이동
    end
```

**구글 OAuth 특징**:
- Firebase Authentication의 `GoogleAuthProvider` 사용
- Popup 방식 인증 (팝업 차단 시 오류 처리)
- 자동으로 이메일, 프로필 정보 획득
- Firebase Console에서 구글 로그인 활성화 필요

**환경 변수**:
- Firebase 프로젝트 설정에서 구글 로그인 활성화 필요
- 추가 API 키 설정 불필요 (Firebase 설정만으로 동작)

#### 카카오 OAuth API

```mermaid
sequenceDiagram
    participant User
    participant Login
    participant KakaoAuth[카카오 인증 서버]
    participant KakaoAPI[카카오 API]
    participant FirebaseAuth
    
    User->>Login: 카카오 로그인 클릭
    Login->>KakaoAuth: OAuth 인증 요청
    KakaoAuth-->>User: 로그인 페이지로 리다이렉트
    User->>KakaoAuth: 로그인 정보 입력
    KakaoAuth-->>Login: 인증 코드 전달 (callback)
    Login->>KakaoAuth: 액세스 토큰 요청
    KakaoAuth-->>Login: 액세스 토큰 발급
    Login->>KakaoAPI: 사용자 정보 조회
    KakaoAPI-->>Login: 사용자 프로필 정보
    Login->>FirebaseAuth: Firebase 커스텀 토큰 생성
    FirebaseAuth-->>Login: Firebase 사용자 생성
    Login-->>User: 로그인 완료
```

**카카오 OAuth 엔드포인트**:
- 인증: `https://kauth.kakao.com/oauth/authorize`
- 토큰: `https://kauth.kakao.com/oauth/token`
- 사용자 정보: `https://kapi.kakao.com/v2/user/me`
- 로그아웃: `https://kapi.kakao.com/v1/user/logout`

**환경 변수**:
- `REACT_APP_KAKAO_CLIENT_ID`: 카카오 앱 키
- `REACT_APP_KAKAO_REDIRECT_URI`: 리다이렉트 URI (자동 설정)

---

## 보안 및 권한 관리

### 인증 플로우

```mermaid
sequenceDiagram
    participant User
    participant Login
    participant FirebaseAuth
    participant OAuthProvider[OAuth Provider<br/>구글/카카오]
    participant AuthContext
    participant Firestore
    
    User->>Login: 로그인 요청
    alt 구글 로그인
        Login->>FirebaseAuth: GoogleAuthProvider 팝업
        FirebaseAuth->>OAuthProvider: 구글 인증
        OAuthProvider-->>FirebaseAuth: 구글 토큰
        FirebaseAuth-->>Login: Firebase 인증 완료
    else 카카오 로그인
        Login->>OAuthProvider: 카카오 OAuth 리다이렉트
        OAuthProvider-->>Login: 인증 코드
        Login->>OAuthProvider: 액세스 토큰 요청
        OAuthProvider-->>Login: 액세스 토큰
        Login->>OAuthProvider: 사용자 정보 조회
        OAuthProvider-->>Login: 사용자 프로필
        Login->>FirebaseAuth: 커스텀 토큰 생성
        FirebaseAuth-->>Login: Firebase 인증 완료
    end
    Login->>Firestore: users/{uid} 조회
    Firestore-->>Login: 사용자 정보
    Login->>AuthContext: 인증 상태 업데이트
    AuthContext-->>User: 로그인 완료
```

### 권한 체크

1. **인증 상태**: `AuthContext`에서 관리
2. **프로필 완성도**: `ProfileGuard`가 확인
3. **차단 상태**: `users.status === 'banned'` 체크
4. **캘린더 공개**: `users.isPublic` 필드 확인

### 지원하는 OAuth 제공자

| 제공자 | 인증 방식 | 특징 |
|--------|----------|------|
| **구글** | Firebase Auth (Popup) | 간편한 설정, 자동 프로필 정보 |
| **카카오** | 커스텀 OAuth (Redirect) | 한국 사용자 친화적, 리다이렉트 방식 |

---

## 성능 최적화

### 쿼리 최적화

- **제한 설정**: 모든 쿼리에 `limit()` 적용
- **인덱스**: 복합 쿼리를 위한 Firestore 인덱스 설정
- **페이지네이션**: 대량 데이터는 `startAfter()` 사용

### 클라이언트 최적화

- **React.memo**: 불필요한 리렌더링 방지
- **useMemo/useCallback**: 비용이 큰 연산 캐싱
- **코드 스플리팅**: 라우트별 동적 import

### 이미지 최적화

- **썸네일 생성**: Storage에서 썸네일 버전 제공
- **지연 로딩**: Intersection Observer 활용
- **압축**: 업로드 전 이미지 압축

---

## 파일 구조 참고

### 주요 디렉토리

```
src/
├── api/              # API 호출 모듈
├── components/       # 재사용 컴포넌트
├── contexts/         # Context API (상태 관리)
├── hooks/            # Custom Hooks
├── models/           # 데이터 모델 정의
├── pages/            # 페이지 컴포넌트
├── services/         # 비즈니스 로직 서비스
└── utils/            # 유틸리티 함수
```

### 핵심 파일

- **추천 로직**: `utils/homeRecommendationUtils.js`, `utils/sortingUtils.js`
- **날씨**: `api/kmaWeather.js`, `api/kmaPastWeather.js`, `api/weatherService.js`
- **알림**: `services/notificationService.js`, `models/Notification.js`
- **인증**: `contexts/AuthContext.js`, `firebase.js`

---

## 확장 가능성

### 향후 개선 사항

1. **서버리스 함수**: Cloud Functions로 비즈니스 로직 이전
2. **실시간 동기화**: Firestore 실시간 리스너 확대
3. **푸시 알림**: FCM 연동
4. **검색 기능**: Algolia 등 검색 서비스 연동
5. **CDN**: 이미지 CDN 활용

---

*최종 업데이트: 2024*

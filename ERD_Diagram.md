# FitWeather 데이터베이스 ERD

## 전체 데이터베이스 ERD

```mermaid
erDiagram
    USERS {
        string uid PK "Firebase Auth UID"
        string email "사용자 이메일"
        string displayName "표시 이름"
        string photoURL "프로필 사진 URL"
        timestamp createdAt "계정 생성 시간"
        timestamp updatedAt "정보 수정 시간"
    }
    
    USER_PROFILES {
        string uid PK,FK "사용자 UID"
        string nickname "닉네임"
        number age "나이"
        string gender "성별"
        number height "키 (cm)"
        number weight "몸무게 (kg)"
        array style "선호 스타일 배열"
        string region "주 활동 지역"
    }
    
    USER_SETTINGS {
        string uid PK,FK "사용자 UID"
        boolean isPublic "공개 프로필 여부"
        boolean notifications "알림 수신 여부"
        string language "언어 설정"
    }
    
    OUTFIT_RECORDS {
        string id PK "레코드 ID"
        string uid FK "작성자 UID"
        string region "지역"
        timestamp date "기록 날짜"
        number temp "온도"
        number rain "강수량"
        number humidity "습도"
        string icon "날씨 아이콘"
        string desc "날씨 설명"
        string feeling "체감 온도"
        array weatherEmojis "날씨 이모지 배열"
        array outer "아우터 종류"
        array top "상의 종류"
        array bottom "하의 종류"
        array shoes "신발 종류"
        array acc "액세서리 종류"
        array imageUrls "이미지 URL 배열"
        boolean isPublic "공개 여부"
        array likes "좋아요한 사용자 UID 배열"
        number likeCount "좋아요 수"
        number commentCount "댓글 수"
        string feedback "피드백"
        array tags "태그 배열"
        string season "계절"
        timestamp createdAt "생성 시간"
        timestamp updatedAt "수정 시간"
    }
    
    LIKES {
        string id PK "좋아요 ID"
        string recordId FK "코디 레코드 ID"
        string uid FK "좋아요한 사용자 UID"
        timestamp createdAt "좋아요 시간"
        string type "좋아요 타입"
    }
    
    COMMENTS {
        string id PK "댓글 ID"
        string recordId FK "코디 레코드 ID"
        string uid FK "댓글 작성자 UID"
        string content "댓글 내용"
        timestamp createdAt "작성 시간"
        timestamp updatedAt "수정 시간"
        boolean isEdited "수정 여부"
        array likes "좋아요한 사용자 UID 배열"
        string parentId "부모 댓글 ID"
    }
    
    WEATHER_DATA {
        string id PK "날씨 데이터 ID"
        string region "지역"
        timestamp date "날짜"
        string baseTime "기준 시간"
        number forecastTemp "예보 온도"
        number forecastRain "예보 강수량"
        number forecastHumidity "예보 습도"
        number windSpeed "풍속"
        string windDir "풍향"
        string sky "하늘 상태"
        string precipitation "강수 형태"
        number currentTemp "현재 온도"
        number currentRain "현재 강수량"
        number currentHumidity "현재 습도"
        timestamp updatedAt "업데이트 시간"
    }
    
    PAST_WEATHER {
        string id PK "과거 날씨 ID"
        string date "날짜"
        string region "지역"
        number avgTemp "평균 온도"
        number avgRain "평균 강수량"
        number avgHumidity "평균 습도"
        string sky "하늘 상태"
        string pty "강수 형태"
        string iconCode "아이콘 코드"
        string season "계절"
        timestamp createdAt "생성 시간"
        timestamp updatedAt "수정 시간"
    }
    
    USERS ||--|| USER_PROFILES : "소유"
    USERS ||--|| USER_SETTINGS : "소유"
    USERS ||--o{ OUTFIT_RECORDS : "작성"
    USERS ||--o{ LIKES : "좋아요"
    USERS ||--o{ COMMENTS : "댓글 작성"
    OUTFIT_RECORDS ||--o{ LIKES : "받은 좋아요"
    OUTFIT_RECORDS ||--o{ COMMENTS : "댓글"
    COMMENTS ||--o{ COMMENTS : "대댓글"
```

## 주요 엔티티 관계도

```mermaid
graph TB
    subgraph "사용자 관련"
        User[👤 사용자<br/>USERS]
        Profile[👤 프로필<br/>USER_PROFILES]
        Settings[⚙️ 설정<br/>USER_SETTINGS]
    end
    
    subgraph "코디 관련"
        Outfit[👗 코디 기록<br/>OUTFIT_RECORDS]
        Like[❤️ 좋아요<br/>LIKES]
        Comment[💬 댓글<br/>COMMENTS]
    end
    
    subgraph "날씨 관련"
        Weather[🌤️ 현재 날씨<br/>WEATHER_DATA]
        PastWeather[📅 과거 날씨<br/>PAST_WEATHER]
    end
    
    User -->|1:1| Profile
    User -->|1:1| Settings
    User -->|1:N| Outfit
    User -->|1:N| Like
    User -->|1:N| Comment
    
    Outfit -->|1:N| Like
    Outfit -->|1:N| Comment
    Comment -->|1:N| Comment
    
    Weather -.->|참조| Outfit
    PastWeather -.->|참조| Outfit
```

## 테이블별 상세 구조

### 1. 사용자 관련 테이블

```mermaid
graph LR
    subgraph "사용자 마스터"
        A[USERS<br/>사용자 기본 정보]
    end
    
    subgraph "사용자 상세"
        B[USER_PROFILES<br/>프로필 정보]
        C[USER_SETTINGS<br/>설정 정보]
    end
    
    A -->|1:1| B
    A -->|1:1| C
```

### 2. 코디 관련 테이블

```mermaid
graph TB
    subgraph "코디 마스터"
        A[OUTFIT_RECORDS<br/>코디 기록]
    end
    
    subgraph "소셜 기능"
        B[LIKES<br/>좋아요]
        C[COMMENTS<br/>댓글]
    end
    
    A -->|1:N| B
    A -->|1:N| C
    C -->|1:N| C
```

### 3. 날씨 관련 테이블

```mermaid
graph LR
    subgraph "날씨 데이터"
        A[WEATHER_DATA<br/>현재 날씨]
        B[PAST_WEATHER<br/>과거 날씨]
    end
    
    A -.->|참조| C[OUTFIT_RECORDS]
    B -.->|참조| C
```

## 데이터베이스 인덱스 설계

```mermaid
graph TB
    subgraph "복합 인덱스"
        Index1[지역 + 날짜 + 공개여부<br/>지역별 공개 코디 조회]
        Index2[온도 + 강수량 + 날짜<br/>날씨 조건별 코디 검색]
        Index3[사용자 + 날짜<br/>사용자별 코디 기록 조회]
        Index4[레코드ID + 생성시간<br/>댓글/좋아요 조회]
    end
    
    subgraph "단일 인덱스"
        Index5[사용자 UID<br/>사용자 정보 조회]
        Index6[지역<br/>지역별 데이터 조회]
        Index7[날짜<br/>날짜별 데이터 조회]
        Index8[공개여부<br/>공개/비공개 필터링]
    end
    
    subgraph "텍스트 인덱스"
        Index9[태그 배열<br/>태그 기반 검색]
        Index10[댓글 내용<br/>댓글 내용 검색]
        Index11[피드백<br/>피드백 내용 검색]
    end
```

## 보안 규칙 구조

```mermaid
graph TB
    subgraph "사용자 데이터 보안"
        UserRule[사용자는 자신의 데이터만 접근]
        ProfileRule[프로필은 소유자만 수정 가능]
        SettingsRule[설정은 소유자만 접근 가능]
    end
    
    subgraph "코디 데이터 보안"
        OutfitRule[공개 코디는 모든 사용자 조회 가능]
        PrivateRule[비공개 코디는 작성자만 조회 가능]
        ModifyRule[코디는 작성자만 수정/삭제 가능]
    end
    
    subgraph "소셜 데이터 보안"
        LikeRule[좋아요는 인증된 사용자만 가능]
        CommentRule[댓글은 인증된 사용자만 작성 가능]
        SocialRule[소셜 데이터는 공개 코디에만 가능]
    end
```

## 주요 관계 요약

| 관계 | 테이블1 | 테이블2 | 관계 유형 | 설명 |
|------|---------|---------|-----------|------|
| 1 | USERS | USER_PROFILES | 1:1 | 사용자와 프로필 |
| 2 | USERS | USER_SETTINGS | 1:1 | 사용자와 설정 |
| 3 | USERS | OUTFIT_RECORDS | 1:N | 사용자와 코디 기록 |
| 4 | USERS | LIKES | 1:N | 사용자와 좋아요 |
| 5 | USERS | COMMENTS | 1:N | 사용자와 댓글 |
| 6 | OUTFIT_RECORDS | LIKES | 1:N | 코디와 좋아요 |
| 7 | OUTFIT_RECORDS | COMMENTS | 1:N | 코디와 댓글 |
| 8 | COMMENTS | COMMENTS | 1:N | 댓글과 대댓글 |

## 데이터베이스 특징

### ✅ **NoSQL 최적화**
- Firestore에 최적화된 구조
- 문서 기반 데이터 저장
- 실시간 동기화 지원

### ✅ **확장성**
- 사용자 증가에 대응 가능한 설계
- 수평적 확장 지원
- 자동 백업 및 복구

### ✅ **성능 최적화**
- 적절한 인덱스로 쿼리 성능 최적화
- 복합 인덱스를 통한 다중 조건 검색
- 캐싱을 통한 응답 속도 향상

### ✅ **보안 강화**
- 계층적 보안 규칙 적용
- 사용자별 데이터 접근 제어
- 암호화된 데이터 전송 및 저장

### ✅ **유연성**
- 배열 타입을 활용한 유연한 데이터 구조
- 동적 스키마 변경 지원
- 확장 가능한 메타데이터 구조

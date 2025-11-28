# Fitweather ERD (Entity Relationship Diagram)

## 📊 전체 ERD 다이어그램

### 상세 엔티티 관계도

```mermaid
erDiagram
    users {
        string uid PK "Firebase Auth UID"
        string email "이메일"
        string displayName "표시 이름"
        string photoURL "프로필 사진"
        string nickname UK "닉네임 (고유)"
        string region "지역"
        string provider "로그인 제공자"
        boolean isPublic "캘린더 공개"
        array styles "선호 스타일"
        string status "계정 상태"
        timestamp createdAt "생성 시간"
        timestamp updatedAt "수정 시간"
        timestamp lastActiveAt "마지막 활동"
        object filters "추천 필터 설정"
    }
    
    outfits {
        string id PK "자동 생성 ID"
        string uid FK "작성자 UID"
        string nickname "작성자 닉네임"
        string date "기록 날짜"
        string region "지역 코드"
        string regionName "지역명"
        string recordedDate "기록 날짜"
        string recordedTime "기록 시간"
        number temp "온도"
        number rain "강수량"
        number humidity "습도"
        string icon "날씨 아이콘"
        string desc "날씨 설명"
        object weather "날씨 객체"
        array weatherEmojis "날씨 이모지"
        object outfit "착장 정보"
        string style "스타일"
        array styles "스타일 배열"
        array season "계절 배열"
        string feeling "체감 온도"
        string feedback "피드백"
        string memo "메모"
        array imageUrls "이미지 URL"
        boolean isPublic "공개 여부"
        number likeCount "좋아요 수"
        number commentCount "댓글 수"
        timestamp createdAt "생성 시간"
        timestamp updatedAt "수정 시간"
        timestamp recordedAt "기록 시간"
    }
    
    comments {
        string id PK "자동 생성 ID"
        string recordId FK "착장 기록 ID"
        string uid FK "작성자 UID"
        string nickname "작성자 닉네임"
        string content "댓글 내용"
        string parentId FK "부모 댓글 ID"
        boolean isEdited "수정 여부"
        boolean isDeleted "삭제 여부"
        number likeCount "좋아요 수"
        timestamp createdAt "작성 시간"
        timestamp updatedAt "수정 시간"
    }
    
    reactions {
        string id PK "recordId_uid 조합"
        string recordId FK "착장 기록 ID"
        string uid FK "사용자 UID"
        string type "반응 타입 (up/down)"
        timestamp createdAt "반응 시간"
    }
    
    follows {
        string id PK "자동 생성 ID"
        string followerId FK "팔로워 UID"
        string followingId FK "팔로잉 UID"
        timestamp createdAt "팔로우 시간"
    }
    
    notifications {
        string id PK "자동 생성 ID"
        string recipient FK "수신자 UID"
        object sender "발신자 정보"
        string type "알림 타입"
        string title "알림 제목"
        string message "알림 내용"
        string link "이동 링크"
        boolean isRead "읽음 여부"
        timestamp createdAt "생성 시간"
        timestamp readAt "읽은 시간"
    }
    
    reports {
        string id PK "자동 생성 ID"
        string reporterId FK "신고자 UID"
        string targetType "신고 대상 타입"
        string targetId "신고 대상 ID"
        string reason "신고 사유"
        string description "상세 설명"
        string status "처리 상태"
        timestamp createdAt "신고 시간"
        timestamp resolvedAt "처리 시간"
        string resolvedBy "처리 관리자"
    }

    %% 관계 정의
    users ||--o{ outfits : "작성"
    users ||--o{ comments : "작성"
    users ||--o{ reactions : "반응"
    users ||--o{ follows : "팔로워 (followerId)"
    users ||--o{ follows : "팔로잉 (followingId)"
    users ||--o{ notifications : "수신 (recipient)"
    users ||--o{ reports : "신고 (reporterId)"
    
    outfits ||--o{ comments : "댓글"
    outfits ||--o{ reactions : "반응"
    outfits ||--o{ reports : "신고 (targetType=post)"
    
    comments ||--o{ comments : "답글 (parentId)"
    comments ||--o{ reports : "신고 (targetType=comment)"
```

## 📋 엔티티 상세 정보

### 1. users (사용자)
- **Primary Key**: `uid` (Firebase Auth UID)
- **Unique Key**: `nickname`
- **주요 관계**:
  - 1:N → outfits (작성한 착장 기록)
  - 1:N → comments (작성한 댓글)
  - 1:N → reactions (반응)
  - 1:N → follows (팔로워/팔로잉)
  - 1:N → notifications (수신한 알림)
  - 1:N → reports (신고)

### 2. outfits (착장 기록)
- **Primary Key**: `id` (자동 생성)
- **Foreign Key**: `uid` → users.uid
- **주요 관계**:
  - N:1 → users (작성자)
  - 1:N → comments (댓글)
  - 1:N → reactions (반응)
  - 1:N → reports (신고)

### 3. comments (댓글)
- **Primary Key**: `id` (자동 생성)
- **Foreign Key**: 
  - `recordId` → outfits.id
  - `uid` → users.uid
  - `parentId` → comments.id (자기 참조)
- **주요 관계**:
  - N:1 → outfits (착장 기록)
  - N:1 → users (작성자)
  - 1:N → comments (답글)
  - 1:N → reports (신고)

### 4. reactions (반응)
- **Primary Key**: `id` (`{recordId}_{uid}` 조합)
- **Foreign Key**: 
  - `recordId` → outfits.id
  - `uid` → users.uid
- **주요 관계**:
  - N:1 → outfits (착장 기록)
  - N:1 → users (사용자)

### 5. follows (팔로우)
- **Primary Key**: `id` (자동 생성)
- **Foreign Key**: 
  - `followerId` → users.uid
  - `followingId` → users.uid
- **주요 관계**:
  - N:1 → users (팔로워)
  - N:1 → users (팔로잉)

### 6. notifications (알림)
- **Primary Key**: `id` (자동 생성)
- **Foreign Key**: `recipient` → users.uid
- **주요 관계**:
  - N:1 → users (수신자)

### 7. reports (신고)
- **Primary Key**: `id` (자동 생성)
- **Foreign Key**: `reporterId` → users.uid
- **주요 관계**:
  - N:1 → users (신고자)
  - N:1 → outfits/comments (신고 대상, targetType에 따라)

## 🔗 관계 유형

| 관계 | 부모 엔티티 | 자식 엔티티 | 관계 유형 | 설명 |
|------|------------|------------|-----------|------|
| 작성 | users | outfits | 1:N | 한 사용자는 여러 착장 기록 작성 가능 |
| 작성 | users | comments | 1:N | 한 사용자는 여러 댓글 작성 가능 |
| 반응 | users | reactions | 1:N | 한 사용자는 여러 반응 가능 |
| 반응 | outfits | reactions | 1:N | 한 착장 기록은 여러 반응 받을 수 있음 |
| 댓글 | outfits | comments | 1:N | 한 착장 기록은 여러 댓글 가질 수 있음 |
| 답글 | comments | comments | 1:N | 한 댓글은 여러 답글 가질 수 있음 (자기 참조) |
| 팔로우 | users | follows | 1:N | 한 사용자는 여러 사용자 팔로우 가능 |
| 팔로잉 | users | follows | 1:N | 한 사용자는 여러 사용자에게 팔로우 받음 |
| 알림 | users | notifications | 1:N | 한 사용자는 여러 알림 수신 가능 |
| 신고 | users | reports | 1:N | 한 사용자는 여러 신고 가능 |
| 신고 | outfits | reports | 1:N | 한 착장 기록은 여러 신고 받을 수 있음 |
| 신고 | comments | reports | 1:N | 한 댓글은 여러 신고 받을 수 있음 |

## 📝 참고사항

### Firestore 특성
- **NoSQL 문서 데이터베이스**: 관계형 데이터베이스와 달리 외래 키 제약조건이 없음
- **참조 무결성**: 애플리케이션 레벨에서 관리 필요
- **문서 ID**: 자동 생성 또는 사용자 정의 가능

### 인덱스
- 복합 인덱스가 필요한 쿼리 패턴에 대해 Firestore Console에서 설정 필요
- 자주 사용되는 쿼리:
  - `outfits`: region + isPublic + createdAt
  - `comments`: recordId + createdAt
  - `notifications`: recipient + isRead + createdAt
  - `follows`: followerId + createdAt, followingId + createdAt

### 데이터 무결성
- `users.nickname`: 애플리케이션 레벨에서 고유성 검증
- `reactions.id`: `{recordId}_{uid}` 조합으로 고유성 보장
- `follows`: `followerId + followingId` 조합 고유성 검증 필요

---

*생성일: 2024*
*기반 문서: Database_Schema.md*


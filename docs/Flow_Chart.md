# Fitweather 플로우 차트 (Flow Chart)

## 📋 목차

1. [전체 사용자 여정 플로우](#전체-사용자-여정-플로우)
2. [회원가입 및 로그인 플로우](#회원가입-및-로그인-플로우)
3. [프로필 설정 플로우](#프로필-설정-플로우)
4. [착장 기록 작성 플로우](#착장-기록-작성-플로우)
5. [추천 시스템 플로우](#추천-시스템-플로우)
6. [피드 탐색 플로우](#피드-탐색-플로우)
7. [소셜 상호작용 플로우](#소셜-상호작용-플로우)
8. [알림 처리 플로우](#알림-처리-플로우)
9. [관리자 작업 플로우](#관리자-작업-플로우)
10. [에러 처리 플로우](#에러-처리-플로우)

---

## 전체 사용자 여정 플로우

### 첫 방문 사용자 여정

```mermaid
flowchart TD
    Start([사용자 앱 접속])
    CheckAuth{인증 상태<br/>확인}
    NotAuth[로그인 페이지]
    Auth[인증 완료]
    CheckProfile{프로필<br/>설정 여부}
    ProfileSetup[프로필 설정 페이지]
    Home[홈 화면]
    Explore[기능 탐색]
    
    Start --> CheckAuth
    CheckAuth -->|인증 안됨| NotAuth
    CheckAuth -->|인증됨| Auth
    Auth --> CheckProfile
    CheckProfile -->|프로필 없음| ProfileSetup
    CheckProfile -->|프로필 있음| Home
    ProfileSetup --> Home
    Home --> Explore
    
    Explore --> Record[착장 기록]
    Explore --> Feed[피드 탐색]
    Explore --> Recommend[추천 받기]
    Explore --> Calendar[캘린더 보기]
    
    style Start fill:#4caf50
    style Home fill:#61dafb
    style NotAuth fill:#f44336
    style ProfileSetup fill:#ff9800
```

---

## 회원가입 및 로그인 플로우

### 구글 로그인 플로우

```mermaid
flowchart TD
    Start([구글 로그인 버튼 클릭])
    Popup[Firebase Auth 팝업 표시]
    UserInput[사용자 로그인 정보 입력]
    AuthCheck{인증<br/>성공?}
    AuthFail[인증 실패 메시지]
    GetUserInfo[사용자 정보 획득<br/>uid, email, displayName]
    CheckUser{기존 사용자<br/>확인}
    NewUser[신규 사용자]
    ExistingUser[기존 사용자]
    CreateFirebaseUser[Firebase 사용자 생성]
    CheckFirestore{Firestore<br/>users 문서<br/>존재?}
    ProfileSetup[프로필 설정 페이지로 이동]
    Home[홈 화면으로 이동]
    End([완료])
    
    Start --> Popup
    Popup --> UserInput
    UserInput --> AuthCheck
    AuthCheck -->|실패| AuthFail
    AuthCheck -->|성공| GetUserInfo
    AuthFail --> End
    GetUserInfo --> CheckUser
    CheckUser -->|신규| NewUser
    CheckUser -->|기존| ExistingUser
    NewUser --> CreateFirebaseUser
    CreateFirebaseUser --> CheckFirestore
    CheckFirestore -->|없음| ProfileSetup
    CheckFirestore -->|있음| Home
    ExistingUser --> Home
    ProfileSetup --> End
    Home --> End
    
    style Start fill:#4caf50
    style AuthFail fill:#f44336
    style ProfileSetup fill:#ff9800
    style Home fill:#61dafb
```

### 카카오 로그인 플로우

```mermaid
flowchart TD
    Start([카카오 로그인 버튼 클릭])
    Redirect[카카오 인증 페이지로 리다이렉트]
    UserLogin[카카오 로그인]
    GetCode{인증 코드<br/>수신?}
    CodeFail[에러 메시지]
    RequestToken[액세스 토큰 요청]
    TokenFail{토큰<br/>발급 성공?}
    GetUserInfo[카카오 API로 사용자 정보 조회]
    CheckEmail{이메일<br/>존재?}
    CheckDuplicateEmail{이메일<br/>중복 확인}
    EmailExists[이메일 중복 에러]
    CreateFirebaseUser[Firebase 사용자 생성]
    CreateFirestoreUser[Firestore users 문서 생성]
    CheckProfile{프로필<br/>설정 여부}
    ProfileSetup[프로필 설정 페이지]
    Home[홈 화면]
    End([완료])
    
    Start --> Redirect
    Redirect --> UserLogin
    UserLogin --> GetCode
    GetCode -->|실패| CodeFail
    GetCode -->|성공| RequestToken
    CodeFail --> End
    RequestToken --> TokenFail
    TokenFail -->|실패| CodeFail
    TokenFail -->|성공| GetUserInfo
    GetUserInfo --> CheckEmail
    CheckEmail -->|없음| CreateFirebaseUser
    CheckEmail -->|있음| CheckDuplicateEmail
    CheckDuplicateEmail -->|중복| EmailExists
    CheckDuplicateEmail -->|없음| CreateFirebaseUser
    EmailExists --> End
    CreateFirebaseUser --> CreateFirestoreUser
    CreateFirestoreUser --> CheckProfile
    CheckProfile -->|미설정| ProfileSetup
    CheckProfile -->|설정됨| Home
    ProfileSetup --> End
    Home --> End
    
    style Start fill:#4caf50
    style CodeFail fill:#f44336
    style EmailExists fill:#f44336
    style ProfileSetup fill:#ff9800
    style Home fill:#61dafb
```

### 로그아웃 플로우

```mermaid
flowchart TD
    Start([로그아웃 버튼 클릭])
    Confirm{로그아웃<br/>확인?}
    Cancel[취소]
    SignOut[Firebase Auth signOut 호출]
    ClearState[AuthContext 상태 초리]
    ClearLocalStorage[로컬 스토리지 정리]
    RedirectLogin[로그인 페이지로 리다이렉트]
    End([완료])
    
    Start --> Confirm
    Confirm -->|취소| Cancel
    Confirm -->|확인| SignOut
    Cancel --> End
    SignOut --> ClearState
    ClearState --> ClearLocalStorage
    ClearLocalStorage --> RedirectLogin
    RedirectLogin --> End
    
    style Start fill:#4caf50
    style Cancel fill:#9e9e9e
    style End fill:#61dafb
```

---

## 프로필 설정 플로우

### 프로필 초기 설정

```mermaid
flowchart TD
    Start([프로필 설정 페이지 진입])
    LoadData[전달받은 사용자 정보 로드<br/>email, displayName, uid]
    InputNickname[닉네임 입력]
    InputRegion[지역 선택]
    Validate{입력값<br/>유효성 검사}
    ValidationError[에러 메시지 표시]
    CheckDuplicate{닉네임<br/>중복 확인}
    DuplicateError[닉네임 중복 에러]
    SaveProfile[Firestore users 문서 저장]
    SaveSuccess{저장<br/>성공?}
    UpdateContext[AuthContext 상태 업데이트]
    RedirectHome[홈 화면으로 이동]
    End([완료])
    
    Start --> LoadData
    LoadData --> InputNickname
    InputNickname --> InputRegion
    InputRegion --> Validate
    Validate -->|무효| ValidationError
    Validate -->|유효| CheckDuplicate
    ValidationError --> InputNickname
    CheckDuplicate -->|중복| DuplicateError
    CheckDuplicate -->|없음| SaveProfile
    DuplicateError --> InputNickname
    SaveProfile --> SaveSuccess
    SaveSuccess -->|실패| ValidationError
    SaveSuccess -->|성공| UpdateContext
    UpdateContext --> RedirectHome
    RedirectHome --> End
    
    style Start fill:#4caf50
    style ValidationError fill:#f44336
    style DuplicateError fill:#f44336
    style RedirectHome fill:#61dafb
```

---

## 착장 기록 작성 플로우

### 기록 작성 프로세스

```mermaid
flowchart TD
    Start([기록 작성 페이지 진입])
    LoadProfile[사용자 프로필 로드<br/>region, styles]
    SelectDate[날짜 선택<br/>오늘/과거]
    DateCheck{날짜<br/>선택}
    Today[오늘 날짜]
    Past[과거 날짜]
    FetchCurrentWeather[현재 날씨 조회<br/>WeatherService]
    FetchPastWeather[과거 날씨 조회<br/>PastWeather API]
    WeatherData[날씨 데이터 획득]
    SelectImages[이미지 선택<br/>최대 5장]
    InputOutfit[착장 정보 입력<br/>아우터, 상의, 하의, 신발, 악세서리]
    SelectStyle[스타일 선택<br/>캐주얼, 포멀 등]
    SelectFeeling[체감 온도 선택]
    SelectWeatherEmoji[날씨 이모지 선택<br/>최대 2개]
    InputMemo[메모 입력<br/>선택사항]
    SetPublic{공개 설정<br/>선택}
    Validate{입력값<br/>검증}
    ValidationError[에러 메시지]
    UploadImages[이미지 Firebase Storage 업로드]
    UploadSuccess{업로드<br/>성공?}
    UploadError[업로드 에러]
    CalculateSeason[계절 계산<br/>SeasonUtils]
    SaveRecord[Firestore outfits 문서 저장]
    SaveSuccess{저장<br/>성공?}
    SaveError[저장 에러]
    SuccessMessage[성공 메시지 표시]
    RedirectCalendar[캘린더로 이동<br/>또는 페이지 유지]
    End([완료])
    
    Start --> LoadProfile
    LoadProfile --> SelectDate
    SelectDate --> DateCheck
    DateCheck -->|오늘| Today
    DateCheck -->|과거| Past
    Today --> FetchCurrentWeather
    Past --> FetchPastWeather
    FetchCurrentWeather --> WeatherData
    FetchPastWeather --> WeatherData
    WeatherData --> SelectImages
    SelectImages --> InputOutfit
    InputOutfit --> SelectStyle
    SelectStyle --> SelectFeeling
    SelectFeeling --> SelectWeatherEmoji
    SelectWeatherEmoji --> InputMemo
    InputMemo --> SetPublic
    SetPublic --> Validate
    Validate -->|무효| ValidationError
    Validate -->|유효| UploadImages
    ValidationError --> SelectImages
    UploadImages --> UploadSuccess
    UploadSuccess -->|실패| UploadError
    UploadSuccess -->|성공| CalculateSeason
    UploadError --> SelectImages
    CalculateSeason --> SaveRecord
    SaveRecord --> SaveSuccess
    SaveSuccess -->|실패| SaveError
    SaveSuccess -->|성공| SuccessMessage
    SaveError --> SaveRecord
    SuccessMessage --> RedirectCalendar
    RedirectCalendar --> End
    
    style Start fill:#4caf50
    style ValidationError fill:#f44336
    style UploadError fill:#f44336
    style SaveError fill:#f44336
    style SuccessMessage fill:#4caf50
```

### 이미지 업로드 상세 플로우

```mermaid
flowchart TD
    Start([이미지 선택])
    FileValidation{파일 유효성<br/>확인<br/>크기, 형식}
    InvalidFile[유효하지 않은 파일<br/>에러 메시지]
    Preview[이미지 미리보기 생성]
    Compression{이미지<br/>압축<br/>선택적}
    Resize{이미지<br/>리사이즈<br/>선택적}
    CreateStorageRef[Storage 참조 생성<br/>outfits/{uid}/{timestamp}]
    UploadStart[업로드 시작]
    Progress[업로드 진행률 표시]
    UploadComplete{업로드<br/>완료?}
    UploadError[업로드 에러]
    GetDownloadURL[다운로드 URL 획득]
    AddToArray[URL 배열에 추가]
    AllUploaded{모든 이미지<br/>업로드 완료?}
    ReturnURLs[URL 배열 반환]
    End([완료])
    
    Start --> FileValidation
    FileValidation -->|무효| InvalidFile
    FileValidation -->|유효| Preview
    InvalidFile --> Start
    Preview --> Compression
    Compression --> Resize
    Resize --> CreateStorageRef
    CreateStorageRef --> UploadStart
    UploadStart --> Progress
    Progress --> UploadComplete
    UploadComplete -->|실패| UploadError
    UploadComplete -->|성공| GetDownloadURL
    UploadError --> Start
    GetDownloadURL --> AddToArray
    AddToArray --> AllUploaded
    AllUploaded -->|아직 남음| Compression
    AllUploaded -->|완료| ReturnURLs
    ReturnURLs --> End
    
    style Start fill:#4caf50
    style InvalidFile fill:#f44336
    style UploadError fill:#f44336
    style ReturnURLs fill:#4caf50
```

### 기록 수정 플로우

```mermaid
flowchart TD
    Start([기록 수정 시작])
    LoadRecord[기존 기록 데이터 로드]
    CheckOwnership{본인<br/>기록?}
    AccessDenied[접근 권한 없음]
    PopulateForm[폼에 기존 데이터 채우기]
    EditData[데이터 수정]
    NewImages{새 이미지<br/>추가?}
    KeepOldImages[기존 이미지 유지]
    UploadNewImages[새 이미지 업로드]
    UpdateRecord[Firestore 문서 업데이트]
    UpdateSuccess{업데이트<br/>성공?}
    UpdateError[업데이트 에러]
    SuccessMessage[성공 메시지]
    RefreshUI[UI 새로고침]
    End([완료])
    
    Start --> LoadRecord
    LoadRecord --> CheckOwnership
    CheckOwnership -->|아님| AccessDenied
    CheckOwnership -->|본인 기록| PopulateForm
    AccessDenied --> End
    PopulateForm --> EditData
    EditData --> NewImages
    NewImages -->|없음| KeepOldImages
    NewImages -->|있음| UploadNewImages
    KeepOldImages --> UpdateRecord
    UploadNewImages --> UpdateRecord
    UpdateRecord --> UpdateSuccess
    UpdateSuccess -->|실패| UpdateError
    UpdateSuccess -->|성공| SuccessMessage
    UpdateError --> UpdateRecord
    SuccessMessage --> RefreshUI
    RefreshUI --> End
    
    style Start fill:#4caf50
    style AccessDenied fill:#f44336
    style UpdateError fill:#f44336
    style SuccessMessage fill:#4caf50
```

---

## 추천 시스템 플로우

### 홈 추천 생성 플로우

```mermaid
flowchart TD
    Start([홈 페이지 진입])
    LoadUserProfile[사용자 프로필 로드<br/>region, styles]
    GetCurrentSeason[현재 계절 계산<br/>SeasonUtils]
    QueryAllRecords[전체 공개 기록 조회<br/>getAllPublicRecords<br/>limit 200]
    FilterSeason[계절 필터링<br/>filterBySeason]
    HasStyleFilter{사용자 스타일<br/>설정 여부}
    FilterStyle[스타일 필터링<br/>filterByStyle]
    SkipStyleFilter[스타일 필터링 스킵]
    SortPopular[인기순 정렬<br/>sortRecords 'popular']
    SelectTop3[상위 3개 선택<br/>slice 0, 3]
    DisplayRecommendations[추천 표시<br/>OutfitRecommendation]
    RefreshButton{새로고침<br/>버튼 클릭?}
    QueryTop10[상위 10개 재조회]
    RandomSelect[10개 중 랜덤 3개 선택]
    End([완료])
    
    Start --> LoadUserProfile
    LoadUserProfile --> GetCurrentSeason
    GetCurrentSeason --> QueryAllRecords
    QueryAllRecords --> FilterSeason
    FilterSeason --> HasStyleFilter
    HasStyleFilter -->|스타일 있음| FilterStyle
    HasStyleFilter -->|스타일 없음| SkipStyleFilter
    FilterStyle --> SortPopular
    SkipStyleFilter --> SortPopular
    SortPopular --> SelectTop3
    SelectTop3 --> DisplayRecommendations
    DisplayRecommendations --> RefreshButton
    RefreshButton -->|클릭| QueryTop10
    RefreshButton -->|안함| End
    QueryTop10 --> RandomSelect
    RandomSelect --> DisplayRecommendations
    
    style Start fill:#4caf50
    style DisplayRecommendations fill:#61dafb
    style End fill:#4caf50
```

### 정렬 알고리즘 플로우

```mermaid
flowchart TD
    Start([정렬 요청<br/>sortType: 'popular'])
    LoadRecords[기록 배열 로드]
    SortByLikes[좋아요 수 기준<br/>내림차순 정렬]
    SameLikes{좋아요 수<br/>동일?}
    SortByDislikes[싫어요 수 기준<br/>오름차순 정렬<br/>적은 순]
    SameDislikes{싫어요 수<br/>동일?}
    SortByTime[생성 시간 기준<br/>오름차순 정렬<br/>빠른 순]
    ReturnSorted[정렬된 배열 반환]
    End([완료])
    
    Start --> LoadRecords
    LoadRecords --> SortByLikes
    SortByLikes --> SameLikes
    SameLikes -->|동일함| SortByDislikes
    SameLikes -->|다름| ReturnSorted
    SortByDislikes --> SameDislikes
    SameDislikes -->|동일함| SortByTime
    SameDislikes -->|다름| ReturnSorted
    SortByTime --> ReturnSorted
    ReturnSorted --> End
    
    style Start fill:#4caf50
    style ReturnSorted fill:#61dafb
```

---

## 피드 탐색 플로우

### 피드 필터링 및 정렬 플로우

```mermaid
flowchart TD
    Start([피드 페이지 진입])
    LoadDefaultFilters[기본 필터 로드<br/>지역: 사용자 지역<br/>날짜: 오늘])
    QueryRecords[기록 조회<br/>지역 + 날짜 필터]
    ApplyStyleFilter{스타일 필터<br/>선택?}
    FilterByStyle[스타일 필터 적용]
    SkipStyleFilter[스타일 필터 스킵]
    ApplySort{정렬 방식<br/>선택}
    SortPopular[인기순 정렬]
    SortRecent[최신순 정렬]
    DisplayRecords[기록 목록 표시<br/>카드 그리드]
    ChangeFilter{필터 변경?}
    ChangeSort{정렬 변경?}
    UpdateQuery[쿼리 업데이트]
    UserClick{기록 카드<br/>클릭?}
    NavigateDetail[상세 페이지로 이동<br/>/feed-detail/:id]
    End([완료])
    
    Start --> LoadDefaultFilters
    LoadDefaultFilters --> QueryRecords
    QueryRecords --> ApplyStyleFilter
    ApplyStyleFilter -->|선택됨| FilterByStyle
    ApplyStyleFilter -->|미선택| SkipStyleFilter
    FilterByStyle --> ApplySort
    SkipStyleFilter --> ApplySort
    ApplySort -->|인기순| SortPopular
    ApplySort -->|최신순| SortRecent
    SortPopular --> DisplayRecords
    SortRecent --> DisplayRecords
    DisplayRecords --> ChangeFilter
    ChangeFilter -->|변경| UpdateQuery
    ChangeFilter -->|변경 안함| ChangeSort
    ChangeSort -->|변경| UpdateQuery
    ChangeSort -->|변경 안함| UserClick
    UpdateQuery --> QueryRecords
    UserClick -->|클릭| NavigateDetail
    UserClick -->|안함| End
    NavigateDetail --> End
    
    style Start fill:#4caf50
    style DisplayRecords fill:#61dafb
    style NavigateDetail fill:#ff9800
```

### 피드 상세 조회 플로우

```mermaid
flowchart TD
    Start([피드 상세 페이지 진입])
    GetRecordId[기록 ID 파라미터 추출]
    LoadRecord[기록 데이터 로드]
    LoadComments[댓글 데이터 로드<br/>실시간 리스너]
    LoadWeather[날씨 정보 표시]
    DisplayImages[이미지 캐러셀 표시]
    DisplayOutfit[착장 정보 표시]
    CheckOwnership{본인<br/>기록?}
    ShowEditButton[수정/삭제 버튼 표시]
    HideEditButton[수정/삭제 버튼 숨김]
    UserAction{사용자<br/>액션}
    Like[좋아요/싫어요]
    Comment[댓글 작성]
    Follow[팔로우/언팔로우]
    Report[신고]
    NavigateCalendar[작성자 캘린더 이동]
    BackButton[뒤로가기 버튼]
    ReturnPrevious[이전 페이지로 이동]
    End([완료])
    
    Start --> GetRecordId
    GetRecordId --> LoadRecord
    LoadRecord --> LoadComments
    LoadRecord --> LoadWeather
    LoadRecord --> DisplayImages
    LoadRecord --> DisplayOutfit
    LoadRecord --> CheckOwnership
    CheckOwnership -->|본인| ShowEditButton
    CheckOwnership -->|타인| HideEditButton
    ShowEditButton --> UserAction
    HideEditButton --> UserAction
    UserAction -->|좋아요| Like
    UserAction -->|댓글| Comment
    UserAction -->|팔로우| Follow
    UserAction -->|신고| Report
    UserAction -->|캘린더| NavigateCalendar
    UserAction -->|뒤로가기| BackButton
    Like --> End
    Comment --> End
    Follow --> End
    Report --> End
    NavigateCalendar --> End
    BackButton --> ReturnPrevious
    ReturnPrevious --> End
    
    style Start fill:#4caf50
    style ShowEditButton fill:#4caf50
    style HideEditButton fill:#9e9e9e
```

---

## 소셜 상호작용 플로우

### 좋아요/싫어요 플로우

```mermaid
flowchart TD
    Start([좋아요/싫어요 버튼 클릭])
    CheckAuth{인증<br/>상태 확인}
    AuthRequired[로그인 필요 메시지]
    CheckPublic{기록 공개<br/>여부 확인}
    NotPublic[비공개 기록<br/>좋아요 불가]
    GetReactionKey[반응 키 생성<br/>recordId_uid]
    QueryReaction[reactions 컬렉션 조회]
    ReactionExists{기존 반응<br/>존재?}
    SameType{기존 반응 타입<br/>= 클릭 타입?}
    RemoveReaction[반응 문서 삭제<br/>좋아요 취소]
    UpdateReactionType[반응 타입 변경<br/>좋아요 ↔ 싫어요]
    CreateReaction[새 반응 문서 생성]
    UpdateCounts[기록의 좋아요/싫어요 수 재계산]
    UpdateUI[UI 업데이트<br/>반응 수 표시]
    End([완료])
    
    Start --> CheckAuth
    CheckAuth -->|미인증| AuthRequired
    CheckAuth -->|인증됨| CheckPublic
    AuthRequired --> End
    CheckPublic -->|비공개| NotPublic
    CheckPublic -->|공개| GetReactionKey
    NotPublic --> End
    GetReactionKey --> QueryReaction
    QueryReaction --> ReactionExists
    ReactionExists -->|없음| CreateReaction
    ReactionExists -->|있음| SameType
    SameType -->|같음| RemoveReaction
    SameType -->|다름| UpdateReactionType
    RemoveReaction --> UpdateCounts
    UpdateReactionType --> UpdateCounts
    CreateReaction --> UpdateCounts
    UpdateCounts --> UpdateUI
    UpdateUI --> End
    
    style Start fill:#4caf50
    style AuthRequired fill:#f44336
    style NotPublic fill:#9e9e9e
    style UpdateUI fill:#4caf50
```

### 댓글 작성 플로우

```mermaid
flowchart TD
    Start([댓글 작성 시작])
    CheckAuth{인증<br/>확인}
    AuthRequired[로그인 필요]
    CheckPublic{기록 공개<br/>여부}
    NotPublic[비공개 기록<br/>댓글 불가]
    InputComment[댓글 내용 입력]
    ValidateComment{댓글<br/>유효성 검사}
    InvalidComment[유효하지 않은 댓글<br/>에러 메시지]
    IsReply{답글<br/>작성?}
    CreateCommentDoc[댓글 문서 생성<br/>comments 컬렉션]
    SetParentId[parentId 설정<br/>답글인 경우]
    UpdateCommentCount[기록의 댓글 수 증가]
    CheckFollow{팔로우<br/>관계 확인}
    CreateNotification[댓글 알림 생성<br/>comment_on_my_post]
    RefreshComments[댓글 목록 새로고침]
    ClearInput[입력 필드 초기화]
    End([완료])
    
    Start --> CheckAuth
    CheckAuth -->|미인증| AuthRequired
    CheckAuth -->|인증됨| CheckPublic
    AuthRequired --> End
    CheckPublic -->|비공개| NotPublic
    CheckPublic -->|공개| InputComment
    NotPublic --> End
    InputComment --> ValidateComment
    ValidateComment -->|무효| InvalidComment
    ValidateComment -->|유효| IsReply
    InvalidComment --> InputComment
    IsReply -->|답글| SetParentId
    IsReply -->|일반 댓글| CreateCommentDoc
    SetParentId --> CreateCommentDoc
    CreateCommentDoc --> UpdateCommentCount
    UpdateCommentCount --> CheckFollow
    CheckFollow -->|팔로우 관계| CreateNotification
    CheckFollow -->|본인 게시물| RefreshComments
    CheckFollow -->|팔로우 없음| RefreshComments
    CreateNotification --> RefreshComments
    RefreshComments --> ClearInput
    ClearInput --> End
    
    style Start fill:#4caf50
    style AuthRequired fill:#f44336
    style NotPublic fill:#9e9e9e
    style ClearInput fill:#4caf50
```

### 팔로우 플로우

```mermaid
flowchart TD
    Start([팔로우 버튼 클릭])
    CheckAuth{인증<br/>확인}
    AuthRequired[로그인 필요]
    GetUserIds[사용자 ID 획득<br/>followerId, followingId]
    CheckSelf{본인<br/>팔로우?}
    SelfFollow[본인 팔로우 불가<br/>에러 메시지]
    QueryFollow[follows 컬렉션 조회<br/>중복 확인]
    AlreadyFollowing{이미<br/>팔로우 중?}
    Unfollow[팔로우 취소<br/>follows 문서 삭제]
    DecreaseCounts[팔로워/팔로잉 수 감소]
    Follow[팔로우 생성<br/>follows 문서 생성]
    IncreaseCounts[팔로워/팔로잉 수 증가]
    CreateNotification[팔로우 알림 생성<br/>type: 'follow']
    UpdateUI[UI 업데이트<br/>팔로우 상태 표시]
    End([완료])
    
    Start --> CheckAuth
    CheckAuth -->|미인증| AuthRequired
    CheckAuth -->|인증됨| GetUserIds
    AuthRequired --> End
    GetUserIds --> CheckSelf
    CheckSelf -->|본인| SelfFollow
    CheckSelf -->|타인| QueryFollow
    SelfFollow --> End
    QueryFollow --> AlreadyFollowing
    AlreadyFollowing -->|팔로우 중| Unfollow
    AlreadyFollowing -->|미팔로우| Follow
    Unfollow --> DecreaseCounts
    DecreaseCounts --> UpdateUI
    Follow --> IncreaseCounts
    IncreaseCounts --> CreateNotification
    CreateNotification --> UpdateUI
    UpdateUI --> End
    
    style Start fill:#4caf50
    style AuthRequired fill:#f44336
    style SelfFollow fill:#f44336
    style UpdateUI fill:#4caf50
```

---

## 알림 처리 플로우

### 알림 조회 및 처리 플로우

```mermaid
flowchart TD
    Start([알림 사이드바 열기])
    CheckAuth{인증<br/>확인}
    AuthRequired[로그인 필요]
    QueryNotifications[notifications 컬렉션 쿼리<br/>recipient = userId<br/>orderBy createdAt desc<br/>limit 50]
    LoadNotifications[알림 목록 로드]
    MapNotifications[알림 타입별<br/>아이콘/제목 매핑]
    DisplayNotifications[알림 목록 표시]
    UserClick{알림<br/>클릭?}
    CheckRead{읽음<br/>상태 확인}
    MarkAsRead[isRead = true<br/>업데이트]
    NavigateToLink[링크로 이동<br/>댓글/팔로우 등]
    DeleteNotification{알림<br/>삭제?}
    RemoveNotification[알림 문서 삭제]
    UpdateCount[알림 개수 업데이트]
    End([완료])
    
    Start --> CheckAuth
    CheckAuth -->|미인증| AuthRequired
    CheckAuth -->|인증됨| QueryNotifications
    AuthRequired --> End
    QueryNotifications --> LoadNotifications
    LoadNotifications --> MapNotifications
    MapNotifications --> DisplayNotifications
    DisplayNotifications --> UserClick
    UserClick -->|클릭| CheckRead
    UserClick -->|안함| DeleteNotification
    CheckRead -->|읽지 않음| MarkAsRead
    CheckRead -->|읽음| NavigateToLink
    MarkAsRead --> NavigateToLink
    NavigateToLink --> UpdateCount
    DeleteNotification -->|삭제| RemoveNotification
    DeleteNotification -->|유지| End
    RemoveNotification --> UpdateCount
    UpdateCount --> End
    
    style Start fill:#4caf50
    style AuthRequired fill:#f44336
    style NavigateToLink fill:#61dafb
```

### 알림 생성 플로우

```mermaid
flowchart TD
    Start([알림 트리거 이벤트])
    EventType{이벤트<br/>타입}
    FollowEvent[팔로우 이벤트]
    CommentEvent[댓글 이벤트]
    ReplyEvent[답글 이벤트]
    CheckConditions[알림 조건 확인<br/>본인 여부, 팔로우 관계 등]
    ConditionsMet{조건<br/>만족?}
    SkipNotification[알림 생성 스킵]
    CreateNotificationDoc[알림 문서 생성<br/>type, recipient, sender, link, message]
    SaveToFirestore[Firestore notifications<br/>컬렉션에 저장]
    UpdateUnreadCount[미읽음 알림 수 증가]
    RealTimeUpdate[실시간 알림 업데이트<br/>리스너 트리거]
    End([완료])
    
    Start --> EventType
    EventType -->|팔로우| FollowEvent
    EventType -->|댓글| CommentEvent
    EventType -->|답글| ReplyEvent
    FollowEvent --> CheckConditions
    CommentEvent --> CheckConditions
    ReplyEvent --> CheckConditions
    CheckConditions --> ConditionsMet
    ConditionsMet -->|불만족| SkipNotification
    ConditionsMet -->|만족| CreateNotificationDoc
    SkipNotification --> End
    CreateNotificationDoc --> SaveToFirestore
    SaveToFirestore --> UpdateUnreadCount
    UpdateUnreadCount --> RealTimeUpdate
    RealTimeUpdate --> End
    
    style Start fill:#4caf50
    style SkipNotification fill:#9e9e9e
    style RealTimeUpdate fill:#61dafb
```

---

## 관리자 작업 플로우

### 관리자 로그인 플로우

```mermaid
flowchart TD
    Start([관리자 로그인 페이지])
    InputCredentials[관리자 ID/PW 입력]
    ValidateInput{입력값<br/>유효성 검사}
    InvalidInput[입력값 에러]
    CheckAdminCredentials[관리자 인증 정보 확인]
    AuthSuccess{인증<br/>성공?}
    AuthFail[인증 실패 메시지]
    CreateSession[관리자 세션 생성<br/>1시간 타임아웃]
    SaveSession[세션 저장<br/>로컬 스토리지]
    RedirectAdmin[관리자 페이지로 이동]
    End([완료])
    
    Start --> InputCredentials
    InputCredentials --> ValidateInput
    ValidateInput -->|무효| InvalidInput
    ValidateInput -->|유효| CheckAdminCredentials
    InvalidInput --> InputCredentials
    CheckAdminCredentials --> AuthSuccess
    AuthSuccess -->|실패| AuthFail
    AuthSuccess -->|성공| CreateSession
    AuthFail --> InputCredentials
    CreateSession --> SaveSession
    SaveSession --> RedirectAdmin
    RedirectAdmin --> End
    
    style Start fill:#4caf50
    style InvalidInput fill:#f44336
    style AuthFail fill:#f44336
    style RedirectAdmin fill:#61dafb
```

### 신고 처리 플로우

```mermaid
flowchart TD
    Start([신고 목록 조회])
    CheckAdminAuth{관리자<br/>인증 확인}
    NotAdmin[관리자 권한 없음]
    QueryReports[신고 목록 조회<br/>reports 컬렉션]
    LoadReports[신고 데이터 로드]
    HighlightRepeat[신고 3회 이상<br/>사용자 하이라이트]
    DisplayReports[신고 목록 표시]
    AdminAction{관리자<br/>액션 선택}
    ViewContent[콘텐츠 확인]
    BlockUser[사용자 차단<br/>status = 'banned']
    DeleteContent[콘텐츠 삭제<br/>게시물/댓글]
    DismissReport[신고 무시]
    UpdateStatus[신고 상태 업데이트<br/>처리됨/무시됨]
    NotifyUser[사용자에게 알림<br/>차단/삭제 사유]
    End([완료])
    
    Start --> CheckAdminAuth
    CheckAdminAuth -->|인증 안됨| NotAdmin
    CheckAdminAuth -->|인증됨| QueryReports
    NotAdmin --> End
    QueryReports --> LoadReports
    LoadReports --> HighlightRepeat
    HighlightRepeat --> DisplayReports
    DisplayReports --> AdminAction
    AdminAction -->|확인| ViewContent
    AdminAction -->|차단| BlockUser
    AdminAction -->|삭제| DeleteContent
    AdminAction -->|무시| DismissReport
    ViewContent --> AdminAction
    BlockUser --> UpdateStatus
    DeleteContent --> UpdateStatus
    DismissReport --> UpdateStatus
    UpdateStatus --> NotifyUser
    NotifyUser --> End
    
    style Start fill:#4caf50
    style NotAdmin fill:#f44336
    style BlockUser fill:#f44336
    style DeleteContent fill:#ff9800
```

---

## 에러 처리 플로우

### 일반 에러 처리 플로우

```mermaid
flowchart TD
    Start([에러 발생])
    ErrorType{에러<br/>타입}
    NetworkError[네트워크 에러]
    AuthError[인증 에러]
    PermissionError[권한 에러]
    ValidationError[유효성 검사 에러]
    APIError[API 에러]
    UnknownError[알 수 없는 에러]
    LogError[에러 로깅<br/>console.error]
    CheckRecoverable{복구<br/>가능?}
    Retry[재시도 로직]
    Fallback[Fallback 처리]
    ShowError[에러 메시지 표시<br/>Toast/Alert]
    UserAction{사용자<br/>액션}
    RetryAction[재시도]
    Dismiss[닫기]
    End([완료])
    
    Start --> ErrorType
    ErrorType -->|네트워크| NetworkError
    ErrorType -->|인증| AuthError
    ErrorType -->|권한| PermissionError
    ErrorType -->|유효성| ValidationError
    ErrorType -->|API| APIError
    ErrorType -->|기타| UnknownError
    NetworkError --> LogError
    AuthError --> LogError
    PermissionError --> LogError
    ValidationError --> LogError
    APIError --> LogError
    UnknownError --> LogError
    LogError --> CheckRecoverable
    CheckRecoverable -->|가능| Retry
    CheckRecoverable -->|불가능| Fallback
    Retry --> CheckRecoverable
    Fallback --> ShowError
    ShowError --> UserAction
    UserAction -->|재시도| Retry
    UserAction -->|닫기| Dismiss
    Dismiss --> End
    
    style Start fill:#4caf50
    style NetworkError fill:#f44336
    style AuthError fill:#f44336
    style PermissionError fill:#f44336
    style ShowError fill:#ff9800
```

### 날씨 API Fallback 에러 처리 플로우

```mermaid
flowchart TD
    Start([날씨 데이터 요청])
    TryKMA[기상청 API 시도<br/>2초 타임아웃]
    KMASuccess{기상청<br/>성공?}
    KMAData[기상청 데이터 반환]
    TryOWM[OpenWeatherMap 시도]
    OWMSuccess{OWM<br/>성공?}
    OWMData[OWM 데이터 반환]
    TryAccu[AccuWeather 시도]
    AccuSuccess{AccuWeather<br/>성공?}
    AccuData[AccuWeather 데이터 반환]
    TryWeatherAPI[WeatherAPI 시도]
    WeatherAPISuccess{WeatherAPI<br/>성공?}
    WeatherAPIData[WeatherAPI 데이터 반환]
    TryVisualCrossing[Visual Crossing 시도]
    VisualCrossingSuccess{Visual Crossing<br/>성공?}
    VisualCrossingData[Visual Crossing 데이터 반환]
    UseMockData[Mock 데이터 사용<br/>기본값 반환]
    LogFailure[API 실패 로깅]
    StandardizeData[데이터 표준화]
    ReturnData[데이터 반환]
    End([완료])
    
    Start --> TryKMA
    TryKMA --> KMASuccess
    KMASuccess -->|성공| KMAData
    KMASuccess -->|실패/타임아웃| TryOWM
    KMAData --> StandardizeData
    TryOWM --> OWMSuccess
    OWMSuccess -->|성공| OWMData
    OWMSuccess -->|실패| TryAccu
    OWMData --> StandardizeData
    TryAccu --> AccuSuccess
    AccuSuccess -->|성공| AccuData
    AccuSuccess -->|실패| TryWeatherAPI
    AccuData --> StandardizeData
    TryWeatherAPI --> WeatherAPISuccess
    WeatherAPISuccess -->|성공| WeatherAPIData
    WeatherAPISuccess -->|실패| TryVisualCrossing
    WeatherAPIData --> StandardizeData
    TryVisualCrossing --> VisualCrossingSuccess
    VisualCrossingSuccess -->|성공| VisualCrossingData
    VisualCrossingSuccess -->|실패| LogFailure
    VisualCrossingData --> StandardizeData
    LogFailure --> UseMockData
    UseMockData --> StandardizeData
    StandardizeData --> ReturnData
    ReturnData --> End
    
    style Start fill:#4caf50
    style KMAData fill:#4caf50
    style OWMData fill:#4caf50
    style AccuData fill:#4caf50
    style WeatherAPIData fill:#4caf50
    style VisualCrossingData fill:#4caf50
    style UseMockData fill:#ff9800
    style LogFailure fill:#f44336
```

---

## 주요 플로우 패턴 요약

### 1. 인증 플로우 패턴
- **로그인 → 인증 확인 → 사용자 조회 → 프로필 확인 → 페이지 이동**
- 모든 보호된 페이지는 인증 가드를 거침
- 프로필 미설정 시 자동 리다이렉트

### 2. 데이터 생성 플로우 패턴
- **입력 검증 → 파일 업로드 (필요 시) → 데이터 저장 → 상태 업데이트 → UI 반영**
- 모든 입력값에 대한 유효성 검사 필수
- 비동기 작업은 에러 핸들링 포함

### 3. 데이터 조회 플로우 패턴
- **쿼리 생성 → 필터 적용 → 정렬 → 제한 (limit) → 표시**
- 대량 데이터는 페이지네이션 또는 제한 적용
- 실시간 업데이트는 리스너 사용

### 4. 소셜 상호작용 플로우 패턴
- **권한 확인 → 공개 여부 확인 → 작업 수행 → 카운트 업데이트 → 알림 생성 → UI 업데이트**
- 모든 소셜 기능은 공개 콘텐츠에만 가능
- 알림은 조건부 생성 (본인 제외, 팔로우 관계 등)

### 5. 에러 처리 플로우 패턴
- **에러 발생 → 에러 타입 식별 → 로깅 → 복구 시도 → Fallback → 사용자 알림**
- 네트워크 에러는 재시도 메커니즘 포함
- 사용자 친화적 에러 메시지 제공

---

*최종 업데이트: 2024*

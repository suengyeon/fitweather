# 클라우드 메시징 사용 현황

## 📋 목차

1. [현재 상태](#현재-상태)
2. [설정된 부분](#설정된-부분)
3. [실제 사용 현황](#실제-사용-현황)
4. [알림 시스템 구조](#알림-시스템-구조)
5. [FCM 도입 시 활용 방안](#fcm-도입-시-활용-방안)

---

## 현재 상태

### ⚠️ 중요: FCM은 현재 사용되지 않음

**Firebase Cloud Messaging (FCM)**은 설정만 되어 있고, **실제로는 사용되지 않고 있습니다.**

현재 프로젝트는 **Firestore 기반의 인앱 알림**만 사용하고 있습니다.

---

## 설정된 부분

### 1. Firebase 설정에 messagingSenderId 포함

**파일**: `src/firebase.js`

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyAnbb96Ndu0emoBWDuSpIHUK5VsP-E6Txs",
  authDomain: "fitweather-638a3.firebaseapp.com",
  projectId: "fitweather-638a3",
  storageBucket: "fitweather-638a3.appspot.com",
  messagingSenderId: "606417155001",  // ⚠️ 설정만 되어 있음
  appId: "1:606417155001:web:6c3998df975e2fe6263c68",
  measurementId: "G-YW36DSG53V"
};
```

### 2. 패키지 설치됨

**파일**: `package-lock.json`

다음 FCM 관련 패키지들이 설치되어 있습니다:
- `@firebase/messaging`
- `@firebase/messaging-compat`
- `@firebase/messaging-interop-types`

하지만 실제 코드에서 import하거나 사용하는 부분은 없습니다.

### 3. 환경 변수 예시에 포함

**파일**: `env.example`

```env
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
```

---

## 실제 사용 현황

### 현재 알림 시스템: Firestore 기반 인앱 알림

현재 프로젝트는 **Firestore의 `notifications` 컬렉션**을 사용하여 인앱 알림을 구현하고 있습니다.

#### 알림 생성 위치

1. **구독 알림**: `src/api/subscribe.js`
   - 사용자가 다른 사용자를 구독할 때 알림 생성

2. **댓글 알림**: `src/components/CommentSection.js`
   - 기록에 댓글이 달릴 때 알림 생성

3. **답글 알림**: `src/components/CommentSection.js`
   - 댓글에 답글이 달릴 때 알림 생성

4. **새 기록 알림**: `src/api/saveOutfitRecord.js`
   - 구독한 사용자가 새 기록을 올릴 때 알림 생성

#### 알림 조회 위치

1. **알림 목록 조회**: `src/api/notificationAPI.js`
   - `fetchUserNotifications()`: 사용자의 모든 알림 조회
   - `fetchUnreadNotificationCount()`: 읽지 않은 알림 개수 조회

2. **알림 표시**: `src/components/NotiSidebar.js`
   - 사이드바에서 알림 목록 표시
   - 알림 클릭 시 해당 페이지로 이동

3. **알림 상태 관리**: `src/hooks/useNotiSidebar.js`
   - 알림 목록 상태 관리
   - 읽음 처리, 삭제 등 액션 핸들러

#### 알림 서비스

**파일**: `src/services/notificationService.js`

- `createNotification()`: 알림 생성
- `getUserNotifications()`: 알림 조회
- `getUnreadNotificationCount()`: 읽지 않은 알림 개수 조회
- `markNotificationAsRead()`: 읽음 처리
- `deleteNotification()`: 알림 삭제

---

## 알림 시스템 구조

### 현재 알림 플로우

```mermaid
graph TD
    A[사용자 액션] --> B[알림 생성 API 호출]
    B --> C[Firestore notifications 컬렉션에 저장]
    C --> D[수신자가 앱 접속 시]
    D --> E[useNotiSidebar 훅이 알림 조회]
    E --> F[NotiSidebar 컴포넌트에 표시]
    F --> G[사용자가 알림 확인]
    
    style C fill:#ffa726
    style E fill:#61dafb
    style F fill:#4caf50
```

### 알림 데이터 구조

**컬렉션**: `notifications`

```javascript
{
  id: string,                    // Firestore 문서 ID
  recipient: string,              // 수신자 UID
  sender: {
    id: string,                  // 발신자 UID
    nickname: string,            // 발신자 닉네임
    avatarUrl: string | null     // 발신자 프로필 사진
  },
  type: string,                  // 알림 타입 (FOLLOW, COMMENT, REPLY, NEW_POST)
  isRead: boolean,               // 읽음 여부
  link: string,                  // 알림 클릭 시 이동할 경로
  message: string | null,        // 알림 메시지 (댓글/답글의 경우)
  createdAt: Timestamp,          // 생성 시간
  updatedAt: Timestamp           // 수정 시간
}
```

### 알림 타입

**파일**: `src/models/Notification.js`

```javascript
export const NOTIFICATION_TYPES = {
  FOLLOW: 'follow',                    // 구독 알림
  COMMENT_ON_MY_POST: 'comment',       // 댓글 알림
  REPLY_TO_MY_COMMENT: 'reply',        // 답글 알림
  NEW_POST: 'new_post',                 // 새 기록 알림
  USER_REPORTED: 'user_reported'       // 신고 알림
};
```

---

## FCM 도입 시 활용 방안

### 현재 시스템의 한계

1. **앱이 열려있을 때만 알림 확인 가능**
   - 사용자가 앱을 사용하지 않으면 알림을 받을 수 없음
   - 브라우저 탭에 포커스가 있을 때만 알림 새로고침

2. **실시간 푸시 알림 부재**
   - Firestore 리스너를 사용하지 않아 실시간 업데이트 제한적
   - 페이지 새로고침 또는 포커스 이벤트에 의존

3. **브라우저 알림 미지원**
   - 브라우저의 네이티브 알림 기능 미사용
   - 사용자가 다른 탭을 보고 있으면 알림을 놓칠 수 있음

### FCM 도입 시 개선 사항

#### 1. 브라우저 푸시 알림

**구현 위치**: `src/firebase.js` 또는 별도 파일

```javascript
// 예시 코드 (현재 미구현)
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// FCM 초기화
const messaging = getMessaging(app);

// 알림 권한 요청 및 토큰 받기
async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: 'YOUR_VAPID_KEY'
      });
      // 토큰을 Firestore에 저장하여 서버에서 푸시 알림 전송 가능
      return token;
    }
  } catch (error) {
    console.error('알림 권한 요청 실패:', error);
  }
}

// 포그라운드 알림 수신 처리
onMessage(messaging, (payload) => {
  console.log('포그라운드 메시지 수신:', payload);
  // 브라우저 알림 표시
  new Notification(payload.notification.title, {
    body: payload.notification.body,
    icon: payload.notification.icon
  });
});
```

#### 2. Cloud Functions와 연동

**Firebase Cloud Functions**를 사용하여 알림 생성 시 자동으로 FCM 푸시 알림 전송:

```javascript
// Cloud Functions 예시 (현재 미구현)
exports.sendNotification = functions.firestore
  .document('notifications/{notificationId}')
  .onCreate(async (snap, context) => {
    const notification = snap.data();
    
    // 수신자의 FCM 토큰 조회
    const userToken = await getFCMToken(notification.recipient);
    
    // FCM 푸시 알림 전송
    await admin.messaging().send({
      token: userToken,
      notification: {
        title: getNotificationTitle(notification.type),
        body: notification.message || getNotificationBody(notification.type)
      },
      data: {
        link: notification.link,
        type: notification.type
      }
    });
  });
```

#### 3. 실시간 알림 동기화

**Firestore 리스너**를 사용하여 실시간 알림 업데이트:

```javascript
// 예시 코드 (현재 미구현)
import { onSnapshot, query, where, orderBy } from "firebase/firestore";

// 실시간 알림 리스너
useEffect(() => {
  if (!user?.uid) return;
  
  const q = query(
    collection(db, 'notifications'),
    where('recipient', '==', user.uid),
    orderBy('createdAt', 'desc')
  );
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setNotifications(notifications);
    
    // 새 알림이 있으면 브라우저 알림 표시
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added' && !change.doc.data().isRead) {
        showBrowserNotification(change.doc.data());
      }
    });
  });
  
  return () => unsubscribe();
}, [user?.uid]);
```

---

## 현재 알림 시스템 사용 위치 요약

### 알림 생성 위치

| 기능 | 파일 | 함수/위치 |
|------|------|----------|
| 구독 알림 | `src/api/subscribe.js` | `subscribeToUser()` |
| 댓글 알림 | `src/components/CommentSection.js` | 댓글 작성 시 |
| 답글 알림 | `src/components/CommentSection.js` | 답글 작성 시 |
| 새 기록 알림 | `src/api/saveOutfitRecord.js` | 기록 저장 시 |

### 알림 조회 및 표시 위치

| 기능 | 파일 | 설명 |
|------|------|------|
| 알림 목록 조회 | `src/api/notificationAPI.js` | `fetchUserNotifications()` |
| 알림 상태 관리 | `src/hooks/useNotiSidebar.js` | `useNotiSidebar()` 훅 |
| 알림 UI 표시 | `src/components/NotiSidebar.js` | 사이드바 컴포넌트 |
| 알림 서비스 | `src/services/notificationService.js` | 비즈니스 로직 |

### 알림 모델

| 파일 | 설명 |
|------|------|
| `src/models/Notification.js` | 알림 데이터 모델 및 유효성 검사 |

---

## 향후 개선 계획

### 단기 (1-3개월)

1. **Firestore 리스너 도입**
   - 실시간 알림 업데이트
   - 새 알림 도착 시 즉시 반영

2. **브라우저 알림 API 활용**
   - Web Notifications API 사용
   - 앱이 백그라운드일 때도 알림 표시

### 중기 (3-6개월)

1. **FCM 푸시 알림 구현**
   - 알림 권한 요청
   - FCM 토큰 관리
   - 포그라운드/백그라운드 알림 처리

2. **Cloud Functions 연동**
   - 알림 생성 시 자동 푸시 전송
   - 서버 사이드 푸시 알림 관리

### 장기 (6개월 이상)

1. **알림 설정 기능**
   - 사용자별 알림 설정 (켜기/끄기)
   - 알림 타입별 설정
   - 알림 시간대 설정

2. **알림 그룹화**
   - 여러 알림을 하나로 그룹화
   - 알림 요약 기능

---

## 결론

**현재 상태**: 
- FCM은 설정만 되어 있고 실제로는 사용되지 않음
- Firestore 기반의 인앱 알림만 사용 중

**개선 필요성**:
- 사용자 경험 향상을 위해 FCM 푸시 알림 도입 권장
- 앱이 백그라운드일 때도 알림을 받을 수 있도록 개선 필요

**우선순위**:
1. Firestore 리스너로 실시간 알림 업데이트 (가장 쉬움)
2. 브라우저 알림 API 활용 (중간 난이도)
3. FCM 푸시 알림 구현 (가장 복잡하지만 가장 효과적)

---

**작성일**: 2024년  
**프로젝트**: Fitweather - 날씨 기반 착장 기록 및 공유 플랫폼



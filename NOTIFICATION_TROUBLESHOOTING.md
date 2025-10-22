# 🔔 알림 문제 해결 가이드

구독한 사용자의 새 기록 알림이 오지 않는 문제를 해결하는 방법입니다.

## 🚨 문제 진단

### 1단계: 브라우저 콘솔에서 진단 실행

개발 환경에서 브라우저 콘솔을 열고 다음 명령어를 실행하세요:

```javascript
// 전체 진단 실행
window.debugNotifications.diagnoseNotificationIssue("기록작성자ID", "구독자ID");
```

### 2단계: 진단 결과 확인

진단 결과에서 다음 항목들을 확인하세요:

- ✅ **사용자 존재**: 기록 작성자와 구독자가 모두 존재하는지
- ✅ **구독 관계**: 구독 관계가 올바르게 설정되어 있는지
- ✅ **구독자 목록**: getFollowers 함수가 구독자를 찾는지
- ✅ **알림 전송**: 알림 전송 함수가 정상 작동하는지
- ✅ **알림 수신**: 실제로 알림이 생성되는지

## 🔧 일반적인 문제와 해결방법

### 문제 1: 구독 관계가 없음

**증상**: "구독 관계를 찾을 수 없습니다" 메시지

**해결방법**:
```javascript
// 구독 관계 생성
window.debugNotifications.testFollowRelationship("구독자ID", "작성자ID");
```

### 문제 2: 기록이 비공개로 설정됨

**증상**: "비공개 기록이므로 알림을 전송하지 않습니다" 메시지

**해결방법**: 
- 착장 기록 작성 시 "공개" 옵션을 체크했는지 확인
- `isPublic: true`로 설정되어 있는지 확인

### 문제 3: 알림 전송 함수 오류

**증상**: "알림 전송 실패" 메시지

**해결방법**:
```javascript
// 수동으로 알림 전송 테스트
window.debugNotifications.manuallySendNotification("작성자ID", "기록ID");
```

### 문제 4: 알림 데이터 구조 불일치

**증상**: 알림이 생성되지만 UI에서 표시되지 않음

**해결방법**: 
- 알림 데이터의 `sender` 필드에 `nickname`과 `profilePictureUrl` 포함 확인
- 알림 타입이 `new_post_from_following`인지 확인

## 🧪 테스트 방법

### 1. 전체 시스템 테스트

```javascript
// 전체 알림 시스템 테스트
window.testNotificationSystem.runNotificationSystemTest("사용자ID");
```

### 2. 구독자 조회 테스트

```javascript
// 구독자 목록 조회
window.testNotificationSystem.testGetFollowers("사용자ID");
```

### 3. 새 기록 알림 테스트

```javascript
// 새 기록 알림 전송 테스트
window.testNotificationSystem.testNewPostNotification("사용자ID");
```

## 📋 체크리스트

알림이 오지 않을 때 다음을 확인하세요:

- [ ] 구독 관계가 올바르게 설정되어 있는가?
- [ ] 기록이 공개(`isPublic: true`)로 설정되어 있는가?
- [ ] 기록 작성자와 구독자 ID가 올바른가?
- [ ] 브라우저 콘솔에 오류 메시지가 있는가?
- [ ] Firestore의 `follows` 컬렉션에 구독 관계가 있는가?
- [ ] Firestore의 `notifications` 컬렉션에 알림이 생성되는가?

## 🔍 로그 확인

개발자 도구의 콘솔에서 다음 로그들을 확인하세요:

```
🚀 새 기록 알림 전송 시작: {postAuthorId: "...", postId: "..."}
👤 기록 작성자 정보: {id: "...", name: "...", avatarUrl: "..."}
👥 구독자 목록: ["구독자ID1", "구독자ID2"]
📤 구독자들에게 알림 전송 중...
📤 1/2 - 구독자ID1에게 알림 전송 중...
✅ 구독자ID1에게 알림 전송 완료: 알림ID
✅ 2명의 구독자에게 새 기록 알림 전송 완료
```

## 🆘 여전히 문제가 있다면

1. **Firestore 콘솔 확인**: 
   - `follows` 컬렉션에 구독 관계가 있는지
   - `notifications` 컬렉션에 알림이 생성되는지

2. **네트워크 탭 확인**: 
   - Firestore API 호출이 성공하는지
   - 오류 응답이 있는지

3. **브라우저 캐시 클리어**: 
   - 하드 리프레시 (Ctrl+Shift+R)
   - 개발자 도구에서 "Disable cache" 체크

4. **Firebase 설정 확인**:
   - Firebase 프로젝트 설정이 올바른지
   - Firestore 보안 규칙이 알림 생성을 허용하는지

## 📞 추가 도움

문제가 지속되면 다음 정보와 함께 문의하세요:

- 브라우저 콘솔의 전체 로그
- 진단 결과 (`diagnoseNotificationIssue` 출력)
- 사용자 ID들 (기록 작성자, 구독자)
- 기록 ID



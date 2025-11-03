/**
 * 알림 데이터 모델
 * Firestore 컬렉션: 'notifications'
 */

/**
 * 알림 타입 열거형
 */
export const NOTIFICATION_TYPES = {
  FOLLOW: 'follow',
  COMMENT_ON_MY_POST: 'comment_on_my_post',
  REPLY_TO_MY_COMMENT: 'reply_to_my_comment'
};

/**
 * 알림 스키마 정의
 * @typedef {Object} Notification
 * @property {string} id - 알림 고유 ID(Firestore 문서 ID)
 * @property {string} recipient - 알림을 받는 사용자 ID(필수)
 * @property {Object} sender - 알림을 발생시킨 사용자 정보(필수)
 * @property {string} sender.id - 발신자 사용자 ID
 * @property {string} sender.nickname - 발신자 닉네임
 * @property {string} [sender.avatarUrl] - 발신자 프로필 사진 URL
 * @property {string} type - 알림 종류(NOTIFICATION_TYPES 중 하나, 필수)
 * @property {boolean} isRead - 읽음 여부(기본값: false)
 * @property {string} link - 알림 클릭 시 이동할 경로(필수)
 * @property {string} [message] - 알림에 표시될 추가 내용
 * @property {Date} createdAt - 알림 생성 시간
 * @property {Date} [updatedAt] - 알림 수정 시간
 */

/**
 * 알림 생성 시 필요한 데이터 타입
 * @typedef {Object} CreateNotificationData
 * @property {string} recipient - 수신자 사용자 ID
 * @property {Object} sender - 발신자 정보
 * @property {string} sender.id - 발신자 ID
 * @property {string} sender.nickname - 발신자 닉네임
 * @property {string} [sender.avatarUrl] - 발신자 프로필 사진 URL
 * @property {string} type - 알림 타입
 * @property {string} link - 이동할 경로
 * @property {string} [message] - 추가 메시지
 */

/**
 * 알림 응답 데이터 타입 (API 응답용)
 * @typedef {Object} NotificationResponse
 * @property {string} id - 알림 ID
 * @property {string} recipient - 수신자 ID
 * @property {Object} sender - 발신자 정보
 * @property {string} type - 알림 타입
 * @property {boolean} isRead - 읽음 여부
 * @property {string} link - 이동 경로
 * @property {string} [message] - 추가 메시지
 * @property {string} createdAt - 생성 시간(ISO 문자열)
 * @property {string} [updatedAt] - 수정 시간(ISO 문자열)
 */

/**
 * 알림 목록 조회 응답 타입
 * @typedef {Object} NotificationListResponse
 * @property {NotificationResponse[]} notifications - 알림 목록
 * @property {number} totalCount - 전체 알림 개수
 * @property {number} unreadCount - 읽지 않은 알림 개수
 * @property {string} [nextPageToken] - 다음 페이지 토큰(페이징용)
 */

/**
 * 알림 생성 시 유효성 검사
 * @param {CreateNotificationData} data - 알림 생성 데이터
 * @returns {Object} 유효성 검사 결과
 */
export function validateNotificationData(data) {
  const errors = [];

  // 필수 필드 검사
  if (!data.recipient) {
    errors.push('recipient is required');
  }
  if (!data.sender || !data.sender.id || !data.sender.nickname) {
    errors.push('sender with id and nickname is required');
  }
  if (!data.type || !Object.values(NOTIFICATION_TYPES).includes(data.type)) {
    errors.push('type must be one of: ' + Object.values(NOTIFICATION_TYPES).join(', '));
  }
  if (!data.link) {
    errors.push('link is required');
  }

  // 타입별 추가 검사
  if (data.type === NOTIFICATION_TYPES.FOLLOW) {
    // 구독 알림 : 추가 메시지 불필요
  } else if (data.type === NOTIFICATION_TYPES.COMMENT_ON_MY_POST) {
    if (!data.message) {
      errors.push('message is required for comment notifications');
    }
  } else if (data.type === NOTIFICATION_TYPES.REPLY_TO_MY_COMMENT) {
    if (!data.message) {
      errors.push('message is required for reply notifications');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 알림 데이터를 API 응답 형식으로 변환
 * @param {Object} notificationDoc - Firestore 문서 데이터
 * @returns {NotificationResponse} API 응답 형식 데이터
 */
export function formatNotificationResponse(notificationDoc) {
  const data = notificationDoc.data();
  return {
    id: notificationDoc.id,
    recipient: data.recipient,
    sender: data.sender,
    type: data.type,
    isRead: data.isRead || false,
    link: data.link,
    message: data.message || null,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null
  };
}

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom"; 
import { doc, getDoc } from "firebase/firestore"; 
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext"; 
import {
  fetchUserNotifications,       
  markAllNotificationsAsReadAPI, 
  markNotificationAsReadAPI,    
  deleteSelectedNotificationsAPI,
} from "../api/notificationAPI";

/**
 * useNotiSidebar 커스텀 훅 - 알림 사이드바 상태, 알림 목록, 관련 액션 핸들러 제공
 * @returns {Object} 알림 관련 상태 및 함수
 */
export default function useNotiSidebar() {
  const navigate = useNavigate();
  const { user } = useAuth(); // 현재 로그인된 사용자 정보
  const [alarmOpen, setAlarmOpen] = useState(false); // 사이드바 열림/닫힘 상태
  const [notifications, setNotifications] = useState([]); // 알림 목록 데이터

  // --- Effect : 초기 알림 로드 ---
  useEffect(() => {
    const load = async () => {
      if (!user?.uid) return; // 사용자 UID 없으면 로드 X
      try {
        const list = await fetchUserNotifications(user.uid);
        setNotifications(list);
      } catch (e) {
        console.error("알림 로드 실패:", e);
        setNotifications([]);
      }
    };
    load();
  }, [user?.uid]); // 사용자 UID 변경될 때마다 실행

  // --- Effect : 포커스 시 알림 새로고침 ---
  useEffect(() => {
    // 브라우저 탭에 포커스가 돌아왔을 때 알림 새로고침하는 함수
    const onFocus = async () => {
      if (!user?.uid) return;
      try {
        const list = await fetchUserNotifications(user.uid);
        setNotifications(list);
      } catch (e) {
        console.error("포커스 새로고침 실패:", e);
      }
    };
    
    // 이벤트 리스너 등록 및 해제
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [user?.uid]);

  // --- 액션 핸들러 : 전체 읽음 처리 ---
  const markAllRead = async () => {
    if (!user?.uid) return;
    // API 호출
    await markAllNotificationsAsReadAPI(user.uid);
    // Optimistic Update : UI 상태를 먼저 변경하여 즉각적인 피드백 제공
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // --- 액션 핸들러 : 선택 삭제 처리 ---
  const handleDeleteSelected = async (ids) => {
    if (!user?.uid) return;
    // API 호출
    await deleteSelectedNotificationsAPI(ids, user.uid);
    // Optimistic Update : 삭제된 ID 제외하고 목록 필터링
    setNotifications(prev => prev.filter(n => !ids.includes(n.id)));
  };

  // --- 액션 핸들러 : 개별 읽음 처리 ---
  const markOneRead = async (id) => {
    if (!user?.uid) return;
    // API 호출
    await markNotificationAsReadAPI(id, user.uid);
    // Optimistic Update : 해당 ID 알림만 'read: true'로 변경
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  // --- 액션 핸들러 : 알림 항목 클릭 ---
  const handleAlarmItemClick = async (n) => {
    await markOneRead(n.id); // 클릭 시 해당 알림 먼저 읽음 처리

    // 댓글/답글 알림 : 게시물이 본인 기록인지 확인하여 라우팅 경로 변경
    if ((n.type === "comment_on_my_post" || n.type === "reply_to_my_comment") && n.link) {
      // 알림 링크에서 recordId 추출 (/feed-detail/ 또는 /feed/ 경로 모두 처리)
      let recordId = n.link.split("/feed-detail/")[1] || n.link.split("/feed/")[1];
      if (recordId) {
        try {
          // Firestore에서 해당 기록 문서 조회 (outfits 컬렉션)
          const ref = doc(db, "outfits", recordId);
          const snap = await getDoc(ref);
          
          // 기록이 존재, 해당 기록의 UID가 현재 사용자 UID와 일치하면
          if (snap.exists() && snap.data().uid === user?.uid) {
            // /record로 이동
            navigate("/record", { state: { existingRecord: { id: recordId, ...snap.data() } } });
            return; // 사용자 기록 수정 페이지로 이동했으므로 함수 종료
          }
        } catch (e) {
          console.error("기록 조회 실패:", e);
          // 실패해도 아래의 기본 링크 이동 로직 실행됨
        }
      }
    }

    // 기본 링크 이동(댓글/답글 외 알림or기록 조회 실패 시)
    // /feed/ 경로를 /feed-detail/로 변환 (하위 호환성)
    if (n.link) {
      const correctedLink = n.link.startsWith("/feed/") && !n.link.startsWith("/feed-detail/")
        ? n.link.replace("/feed/", "/feed-detail/")
        : n.link;
      navigate(correctedLink);
    }
  };

  // --- 메모이제이션 : 읽지 않은 알림 수 ---
  const unreadCount = useMemo(
    () => notifications.filter(n => !n.read).length,
    [notifications] // 알림 목록 변경될 때만 다시 계산
  );

  // --- 반환 값 ---
  return {
    // 상태
    alarmOpen, setAlarmOpen,
    notifications, unreadCount,

    // 액션 함수
    markAllRead,
    handleDeleteSelected,
    markOneRead,
    handleAlarmItemClick,
  };
}
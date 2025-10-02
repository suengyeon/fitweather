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

export default function useNotiSidebar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [alarmOpen, setAlarmOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // 알림 로드
  useEffect(() => {
    const load = async () => {
      if (!user?.uid) return;
      try {
        const list = await fetchUserNotifications(user.uid);
        setNotifications(list);
      } catch (e) {
        console.error("알림 로드 실패:", e);
        setNotifications([]);
      }
    };
    load();
  }, [user?.uid]);

  // 포커스 시 새로고침
  useEffect(() => {
    const onFocus = async () => {
      if (!user?.uid) return;
      try {
        const list = await fetchUserNotifications(user.uid);
        setNotifications(list);
      } catch (e) {
        console.error("포커스 새로고침 실패:", e);
      }
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [user?.uid]);

  // 전체 읽음
  const markAllRead = async () => {
    if (!user?.uid) return;
    await markAllNotificationsAsReadAPI(user.uid);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // 선택 삭제
  const handleDeleteSelected = async (ids) => {
    if (!user?.uid) return;
    await deleteSelectedNotificationsAPI(ids, user.uid);
    setNotifications(prev => prev.filter(n => !ids.includes(n.id)));
  };

  // 개별 읽음
  const markOneRead = async (id) => {
    if (!user?.uid) return;
    await markNotificationAsReadAPI(id, user.uid);
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  // 알림 클릭
  const handleAlarmItemClick = async (n) => {
    await markOneRead(n.id);

    // 댓글/답글 → 내 기록이면 /record로
    if ((n.type === "comment_on_my_post" || n.type === "reply_to_my_comment") && n.link) {
      const recordId = n.link.split("/feed-detail/")[1];
      if (recordId) {
        try {
          const ref = doc(db, "records", recordId);
          const snap = await getDoc(ref);
          if (snap.exists() && snap.data().uid === user?.uid) {
            navigate("/record", { state: { existingRecord: { id: recordId, ...snap.data() } } });
            return;
          }
        } catch (e) {
          console.error("기록 조회 실패:", e);
        }
      }
    }

    if (n.link) navigate(n.link);
  };

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.read).length,
    [notifications]
  );

  return {
    // 상태
    alarmOpen, setAlarmOpen,
    notifications, unreadCount,

    // 액션
    markAllRead,
    handleDeleteSelected,
    markOneRead,
    handleAlarmItemClick,
  };
}
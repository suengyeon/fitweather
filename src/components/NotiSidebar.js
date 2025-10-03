import React, { useMemo, useState } from "react";
import { XMarkIcon, BellIcon, CheckIcon, TrashIcon, ClockIcon } from "@heroicons/react/24/solid";
import { useNavigate } from "react-router-dom";

// 간단한 유틸: 클래스 합치기
const cx = (...arr) => arr.filter(Boolean).join(" ");

// 알림 제목 생성 함수
const getNotificationTitle = (notification) => {
  switch (notification.type) {
    case 'follow':
      return `${notification.sender?.nickname || '알 수 없음'}님이 구독을 시작했어요`;
    case 'comment_on_my_post':
      return '내 기록에 댓글이 달렸어요';
    case 'reply_to_my_comment':
      return '내 댓글에 답글이 달렸어요';
    default:
      return notification.title || '새 알림';
  }
};

// 알림 내용 생성 함수
const getNotificationMessage = (notification) => {
  switch (notification.type) {
    case 'follow':
      return `${notification.sender?.nickname || '알 수 없음'}이 나를 구독하기 시작했어요.`;
    case 'comment_on_my_post':
      return `${notification.sender?.nickname || '알 수 없음'}: '${notification.message || '댓글 내용'}'`;
    case 'reply_to_my_comment':
      return `답글: '${notification.message || '답글 내용'}'`;
    default:
      return notification.message || '';
  }
};

// 간단한 시간표시(분/시간/일 전)
const timeAgo = (dateish) => {
    let d;
    
    // Firestore Timestamp 객체 처리
    if (dateish && typeof dateish === 'object' && dateish.toDate) {
        d = dateish.toDate();
    }
    // 문자열인 경우
    else if (typeof dateish === "string") {
        d = new Date(dateish);
    }
    // Date 객체인 경우
    else if (dateish instanceof Date) {
        d = dateish;
    }
    // 기타 경우
    else {
        d = new Date(dateish);
    }
    
    // 유효한 날짜인지 확인
    if (!d || isNaN(d.getTime())) {
        return "알 수 없음";
    }
    
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 5) return "방금";
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
};

export default function NotiSidebar({
    isOpen,
    onClose,
    notifications = [],
    onItemClick,
    onMarkAllRead,
    onDeleteSelected,
    onMarkOneRead // 개별 읽음 콜백
}) {
    const navigate = useNavigate();
    
    // 선택 삭제 모드 상태 관리
    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());

    const unreadCount = useMemo(
        () => notifications.filter((n) => !n.read).length,
        [notifications]
    );

    const handleItemClick = (n) => {
        // 삭제 모드일 때는 클릭 이벤트 무시
        if (isDeleteMode) return;
        
        onMarkOneRead?.(n.id);
        if (onItemClick) onItemClick(n);
        else if (n.link) navigate(n.link); // 폴백 네비게이션
        onClose?.();
    };

    // 삭제 모드 토글 핸들러
    const handleDeleteModeToggle = () => {
        if (isDeleteMode) {
            // 삭제 모드 종료 시 선택된 알림들 삭제
            if (selectedIds.size > 0) {
                onDeleteSelected?.(Array.from(selectedIds));
            }
            setIsDeleteMode(false);
            setSelectedIds(new Set());
        } else {
            // 삭제 모드 시작
            setIsDeleteMode(true);
        }
    };

    // 체크박스 변경 핸들러
    const handleCheckboxChange = (notificationId, event) => {
        event.stopPropagation(); // 이벤트 버블링 방지
        
        const newSelectedIds = new Set(selectedIds);
        if (newSelectedIds.has(notificationId)) {
            newSelectedIds.delete(notificationId);
        } else {
            newSelectedIds.add(notificationId);
        }
        setSelectedIds(newSelectedIds);
    };

    return (
        <div className={cx("fixed inset-0 z-50 flex", !isOpen && "pointer-events-none")}>
            {/* 배경 오버레이 */}
            <div
                className={cx(
                    "fixed inset-0 bg-black transition-opacity duration-500",
                    isOpen ? "bg-opacity-50" : "bg-opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* 사이드바 (오른쪽) */}
            <aside
                className={cx(
                    "fixed right-0 top-0 h-full w-80 bg-gray-200 shadow-lg transform transition-transform duration-500 ease-out",
                    isOpen ? "translate-x-0" : "translate-x-full",
                    !isOpen && "pointer-events-none"
                )}
            >
                {/* 헤더 */}
                <div className="px-5 py-4 border-b border-gray-300 flex items-center justify-between">
                    <div className="flex items-center gap-2">

                        <h2 className="text-xl font-bold">알림</h2>
                        {unreadCount > 0 && (
                            <span className=" text-xs px-2 py-0.5 bg-red-500 text-white rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onMarkAllRead}
                            className="flex items-center gap-1 text-sm px-2 py-1 rounded hover:bg-gray-300"
                            title="모두 읽음 처리"
                        >
                            <CheckIcon className="w-4 h-4" />
                            <span>읽음</span>
                        </button>
                        <button
                            onClick={handleDeleteModeToggle}
                            className="flex items-center gap-1 text-sm px-2 py-1 rounded hover:bg-gray-300"
                            title={isDeleteMode ? "삭제 완료" : "선택 삭제"}
                        >
                            <TrashIcon className="w-4 h-4" />
                            <span>{isDeleteMode ? "완료" : "삭제"}</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-300 rounded"
                            title="닫기"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* 목록 */}
                <div className="h-[calc(100%-56px)] overflow-y-auto p-4">
                    {notifications.length === 0 ? (
                        <EmptyState onClose={onClose} />
                    ) : (
                        <ul className="space-y-2">
                            {notifications.map((n) => (
                                <li key={n.id}>
                                    <button
                                        onClick={() => handleItemClick(n)}
                                        className={cx(
                                            "w-full text-left bg-white rounded-xl shadow-sm border border-gray-300 px-3 py-3",
                                            "hover:shadow-md transition-all",
                                            n.read ? "text-gray-400" : "text-gray-800"
                                        )}
                                    >
                                        <div className="flex gap-2">
                                            {/* 체크박스 (삭제 모드일 때만 표시) */}
                                            {isDeleteMode && (
                                                <div className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.has(n.id)}
                                                        onChange={(e) => handleCheckboxChange(n.id, e)}
                                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                                    />
                                                </div>
                                            )}
                                            {/* 썸네일 */}
                                            <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center">
                                                <BellIcon className="w-4 h-4 text-gray-700" />
                                            </div>
                                            {/* 본문 */}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <p className={cx("font-semibold truncate",
                                                            n.read ? "text-gray-400" : "text-gray-800"
                                                        )}
                                                        >
                                                            {getNotificationTitle(n)}
                                                        </p>
                                                        <p className={cx("text-sm line-clamp-2",
                                                            n.read ? "text-gray-400" : "text-gray-700"
                                                        )}
                                                        >
                                                            {getNotificationMessage(n)}
                                                        </p>
                                                    </div>
                                                    {/* 시간/읽음뱃지 */}
                                                    <div className="flex flex-col items-end shrink-0">
                                                        <div className="flex items-center gap-1 text-xs text-gray-600">
                                                            <ClockIcon className="w-3.5 h-3.5" />
                                                            <span>{timeAgo(n.createdAt)}</span>
                                                        </div>

                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </aside >
        </div >
    );
}

function EmptyState() {
    return (
        <div className="h-full flex flex-col items-center justify-center text-gray-600">
            <BellIcon className="w-10 h-10 mb-2" />
            <p className="font-semibold">새로운 알림이 없어요</p>
            <p className="text-sm">댓글, 구독 알림이 여기에 표시됩니다.</p>
        </div>
    );
}

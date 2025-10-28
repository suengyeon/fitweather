import React, { useMemo, useState } from "react";
import { XMarkIcon, BellIcon, CheckIcon, TrashIcon, ClockIcon, PhotoIcon, UserPlusIcon, ChatBubbleLeftIcon } from "@heroicons/react/24/solid";
import { useNavigate } from "react-router-dom";

// --- 유틸리티 함수 ---
// 간단한 유틸 : 클래스 합치기 (Conditional Classnames)
const cx = (...arr) => arr.filter(Boolean).join(" ");

// 사용자 이름 가져오기(nickname 사용)
const getUserName = (sender) => {
  return sender?.nickname || '알 수 없음';
};

// 알림 제목 생성 함수
const getNotificationTitle = (notification) => {
  switch (notification.type) {
    case 'follow':
      return `${getUserName(notification.sender)}님이 구독을 시작했어요`;
    case 'comment_on_my_post':
      return '내 기록에 댓글이 달렸어요';
    case 'reply_to_my_comment':
      return '내 댓글에 답글이 달렸어요';
    case 'new_post_from_following':
      return `${getUserName(notification.sender)}님이 새 기록을 올렸어요`;
    default:
      return notification.title || '새 알림';
  }
};

// 알림 내용 생성 함수(메시지 본문)
const getNotificationMessage = (notification) => {
  switch (notification.type) {
    case 'follow':
      return `${getUserName(notification.sender)}이 나를 구독하기 시작했어요.`;
    case 'comment_on_my_post':
      return `${getUserName(notification.sender)}: '${notification.message || '댓글 내용'}'`;
    case 'reply_to_my_comment':
      return `답글: '${notification.message || '답글 내용'}'`;
    case 'new_post_from_following':
      return '새로운 착장 기록을 확인해보세요!';
    default:
      return notification.message || '';
  }
};

// 알림 타입별 아이콘 반환 함수
const getNotificationIcon = (type) => {
  switch (type) {
    case 'follow':
      return <UserPlusIcon className="w-4 h-4 text-blue-600" />;
    case 'comment_on_my_post':
    case 'reply_to_my_comment':
      return <ChatBubbleLeftIcon className="w-4 h-4 text-green-600" />;
    case 'new_post_from_following':
      return <PhotoIcon className="w-4 h-4 text-purple-600" />;
    default:
      return <BellIcon className="w-4 h-4 text-gray-700" />;
  }
};

// 간단한 시간 표시 함수(방금/분/시간/일 전)
const timeAgo = (dateish) => {
    let d;
    
    // Firestore Timestamp 객체, 문자열, Date 객체 등 다양한 날짜 형식 처리
    if (dateish && typeof dateish === 'object' && dateish.toDate) {
        d = dateish.toDate();
    }
    else if (typeof dateish === "string") {
        d = new Date(dateish);
    }
    else if (dateish instanceof Date) {
        d = dateish;
    }
    else {
        d = new Date(dateish);
    }
    
    // 유효성 검사
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

/**
 * NotiSidebar 컴포넌트 - 알림 목록을 표시&관리하는 오른쪽 슬라이드 사이드바
 */
export default function NotiSidebar({
    isOpen,
    onClose,
    notifications = [], // 알림 데이터 배열
    onItemClick,        // 알림 클릭 시 실행될 콜백(클릭 시 링크 이동 덮어쓸 수 있음)
    onMarkAllRead,      // 모두 읽음 처리 콜백
    onDeleteSelected,   // 선택된 알림 삭제 콜백
    onMarkOneRead       // 개별 알림 읽음 처리 콜백
}) {
    const navigate = useNavigate();
    
    // --- 상태 관리 ---
    const [isDeleteMode, setIsDeleteMode] = useState(false); // 선택 삭제 모드 활성화 여부
    const [selectedIds, setSelectedIds] = useState(new Set()); // 삭제 위해 선택된 알림 ID 집합

    // 읽지 않은 알림 수 계산(notifications 배열 변경될 때만 재계산)
    const unreadCount = useMemo(
        () => notifications.filter((n) => !n.read).length,
        [notifications]
    );

    /**
     * 알림 항목 클릭 핸들러
     * @param {Object} n - 클릭된 알림 객체
     */
    const handleItemClick = (n) => {
        // 1. 삭제 모드 - 클릭 이벤트 무시(체크박스만 동작하도록)
        if (isDeleteMode) return;
        
        // 2. 읽음 처리
        onMarkOneRead?.(n.id);
        
        // 3. 페이지 이동
        if (onItemClick) onItemClick(n); // props로 전달된 커스텀 핸들러 있으면 사용
        else if (n.link) navigate(n.link); // link 필드 이용해 페이지 이동
        
        // 4. 사이드바 닫기
        onClose?.(); 
    };

    /**
     * 삭제 모드 토글 핸들러 - 삭제 모드 진입/종료 및 선택된 항목 삭제 처리
     */
    const handleDeleteModeToggle = () => {
        if (isDeleteMode) {
            // 삭제 모드 종료 - 선택된 항목 있으면 삭제 콜백 호출
            if (selectedIds.size > 0) {
                onDeleteSelected?.(Array.from(selectedIds));
            }
            // 상태 초기화 및 모드 종료
            setIsDeleteMode(false);
            setSelectedIds(new Set());
        } else {
            // 삭제 모드 시작
            setIsDeleteMode(true);
        }
    };

    /**
     * 체크박스 변경 핸들러
     * @param {string} notificationId - 체크박스 변경된 알림 ID
     * @param {React.ChangeEvent} event - 이벤트 객체
     */
    const handleCheckboxChange = (notificationId, event) => {
        event.stopPropagation(); // 버튼 클릭 시 버블링 방지(handleItemClick 방지)
        
        const newSelectedIds = new Set(selectedIds);
        if (newSelectedIds.has(notificationId)) {
            newSelectedIds.delete(notificationId); // 이미 선택되어 있으면 제거
        } else {
            newSelectedIds.add(notificationId); // 선택되어 있지 않으면 추가
        }
        setSelectedIds(newSelectedIds);
    };

    // --- 렌더링 ---
    return (
        <div className={cx("fixed inset-0 z-50 flex", !isOpen && "pointer-events-none")}>
            {/* 1. 배경 오버레이(클릭 시 닫기) */}
            <div
                className={cx(
                    "fixed inset-0 bg-black transition-opacity duration-500",
                    isOpen ? "bg-opacity-50" : "bg-opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* 2. 사이드바 본체(오른쪽에서 슬라이드) */}
            <aside
                className={cx(
                    "fixed right-0 top-0 h-full w-80 bg-gray-200 shadow-lg transform transition-transform duration-500 ease-out",
                    isOpen ? "translate-x-0" : "translate-x-full", // 열림/닫힘 애니메이션
                    !isOpen && "pointer-events-none"
                )}
            >
                {/* 헤더 */}
                <div className="px-5 py-4 border-b border-gray-300 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold">알림</h2>
                        {/* 읽지 않은 알림 카운트 뱃지 */}
                        {unreadCount > 0 && (
                            <span className=" text-xs px-2 py-0.5 bg-red-500 text-white rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {/* 모두 읽음 처리 버튼 */}
                        <button
                            onClick={onMarkAllRead}
                            className="flex items-center gap-1 text-sm px-2 py-1 rounded hover:bg-gray-300"
                            title="모두 읽음 처리"
                        >
                            <CheckIcon className="w-4 h-4" />
                            <span>읽음</span>
                        </button>
                        {/* 선택 삭제/완료 버튼 */}
                        <button
                            onClick={handleDeleteModeToggle}
                            className="flex items-center gap-1 text-sm px-2 py-1 rounded hover:bg-gray-300"
                            title={isDeleteMode ? "삭제 완료" : "선택 삭제"}
                        >
                            <TrashIcon className="w-4 h-4" />
                            <span>{isDeleteMode ? "완료" : "삭제"}</span>
                        </button>
                        {/* 닫기 버튼 */}
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-300 rounded"
                            title="닫기"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* 알림 목록 영역 */}
                <div className="h-[calc(100%-56px)] overflow-y-auto p-4">
                    {notifications.length === 0 ? (
                        <EmptyState onClose={onClose} /> // 알림 없을 때 빈 상태 컴포넌트 표시
                    ) : (
                        <ul className="space-y-2">
                            {notifications.map((n) => (
                                <li key={n.id}>
                                    <button
                                        onClick={() => handleItemClick(n)}
                                        // 읽음 상태 따라 텍스트 색상 및 스타일 변경
                                        className={cx(
                                            "w-full text-left bg-white rounded-xl shadow-sm border border-gray-300 px-3 py-3",
                                            "hover:shadow-md transition-all",
                                            n.read ? "text-gray-400" : "text-gray-800"
                                        )}
                                    >
                                        <div className="flex gap-2">
                                            {/* 체크박스(삭제 모드일 때만 표시) */}
                                            {isDeleteMode && (
                                                <div className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.has(n.id)}
                                                        onChange={(e) => handleCheckboxChange(n.id, e)}
                                                        // 클릭 이벤트 막기 위해 handleCheckboxChange에서 e.stopPropagation() 처리
                                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                                    />
                                                </div>
                                            )}
                                            {/* 썸네일/아이콘 영역 */}
                                            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                                                {getNotificationIcon(n.type)}
                                            </div>
                                            {/* 알림 본문 */}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        {/* 제목 */}
                                                        <p className={cx("font-semibold truncate",
                                                            n.read ? "text-gray-400" : "text-gray-800"
                                                        )}
                                                        >
                                                            {getNotificationTitle(n)}
                                                        </p>
                                                        {/* 메시지 내용 */}
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

/**
 * 알림 목록 비어있을 때 표시되는 상태 컴포넌트
 */
function EmptyState() {
    return (
        <div className="h-full flex flex-col items-center justify-center text-gray-600">
            <BellIcon className="w-10 h-10 mb-2" />
            <p className="font-semibold">새로운 알림이 없어요</p>
            <p className="text-sm">댓글, 구독, 새 기록 알림이 여기에 표시됩니다.</p>
        </div>
    );
}
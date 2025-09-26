import React, { useMemo } from "react";
import { XMarkIcon, BellIcon, CheckIcon, TrashIcon, ClockIcon } from "@heroicons/react/24/solid";
import { useNavigate } from "react-router-dom";
import { buildTitle } from "../utils/notiTitle";

// 간단한 유틸: 클래스 합치기
const cx = (...arr) => arr.filter(Boolean).join(" ");

// 간단한 시간표시(분/시간/일 전)
const timeAgo = (dateish) => {
    const d = typeof dateish === "string" ? new Date(dateish) : dateish;
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 5) return "방금";
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
};

/**
 * props
 * - isOpen: boolean
 * - onClose: () => void
 * - notifications: Array<{
 *     id: string,
 *     kind?: "like"|"comment"|"follow"|"system",
 *     title?: string,
 *     message: string,
 *     link?: string,          // 클릭 시 이동할 경로
 *     createdAt: string|Date, // 날짜
 *     read?: boolean,
 *     avatarUrl?: string      // 보낸 사람/카드 미리보기 썸네일
 *   }>
 * - onItemClick?: (n) => void      // 개별 클릭 훅(없으면 link로 navigate)
 * - onMarkAllRead?: () => void
 * - onClearAll?: () => void
 */
export default function NotiSidebar({
    isOpen,
    onClose,
    notifications = [],
    onItemClick,
    onMarkAllRead,
    onClearAll,
    onMarkOneRead // 개별 읽음 콜백
}) {
    const navigate = useNavigate();

    const unreadCount = useMemo(
        () => notifications.filter((n) => !n.read).length,
        [notifications]
    );

    const handleItemClick = (n) => {
        onMarkOneRead?.(n.id);
        if (onItemClick) onItemClick(n);
        else if (n.link) navigate(n.link); // 폴백 네비게이션
        onClose?.();
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
                            onClick={onClearAll}
                            className="flex items-center gap-1 text-sm px-2 py-1 rounded hover:bg-gray-300"
                            title="모두 삭제"
                        >
                            <TrashIcon className="w-4 h-4" />
                            <span>삭제</span>
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
                                                            {n.title ?? buildTitle(n)}
                                                        </p>
                                                        {n.message && (
                                                            <p className={cx("text-sm line-clamp-2",
                                                                n.read ? "text-gray-400" : "text-gray-700"
                                                            )}
                                                            >
                                                                {n.message}
                                                            </p>
                                                        )}
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

import { useState, useCallback } from "react";

export const useReportHandler = (user, submitReportAPI) => {
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportTarget, setReportTarget] = useState(null); 

    const closeReportModal = useCallback(() => {
        setIsReportModalOpen(false);
        setReportTarget(null);
    }, []);

    const openReportModal = useCallback((targetId, targetUserId, targetType = 'post', recordId = null) => {
        if (!user) {
            alert("로그인 후 신고할 수 있습니다.");
            return;
        }
        setReportTarget({ targetId, targetUserId, targetType, recordId });
        setIsReportModalOpen(true);
    }, [user]);

    const processReport = useCallback(async (targetId, targetUserId, targetType, reason, recordId = null) => {
        if (!user || !user.uid) {
            alert("사용자 정보를 찾을 수 없습니다.");
            return;
        }
        try {
            await submitReportAPI(user.uid, targetUserId, targetId, targetType, reason, recordId);
            alert(`${targetType === 'post' ? '게시물' : '댓글'} 신고가 접수되었습니다.`);
            closeReportModal();
        } catch (error) {
            if (error.message.includes('이미 신고한')) {
                alert(`이미 신고한 ${targetType === 'post' ? '게시물' : '댓글'}입니다.`);
            } else {
                console.error("신고 접수 실패:", error);
                alert(`${targetType === 'post' ? '게시물' : '댓글'} 신고 접수에 실패했습니다.`);
            }
        }
    }, [user, submitReportAPI, closeReportModal]);

    const handleReport = useCallback(async (targetId, targetUserId, reason) => {
        await processReport(targetId, targetUserId, 'post', reason);
    }, [processReport]);

    const handleReportComment = useCallback(async (targetId, targetUserId, reason, recordId) => {
        await processReport(targetId, targetUserId, 'comment', reason, recordId);
    }, [processReport]);

    return {
        isReportModalOpen,
        reportTarget,
        openReportModal,
        closeReportModal, // closeReportModal 추가
        handleReport,
        handleReportComment
    };
};
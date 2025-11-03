import { useState, useEffect } from "react";
import { getReactionSummary, getUserReaction, toggleThumbsUp, toggleThumbsDown } from "../api/reactions"; // API 호출 함수

/**
 * 피드의 좋아요/싫어요 상태 및 토글 로직을 관리하는 Custom Hook.
 */
export const useFeedReactions = (recordId, user) => {
    const [isThumbsUp, setIsThumbsUp] = useState(false); 
    const [thumbsUpCount, setThumbsUpCount] = useState(0); 
    const [isThumbsDown, setIsThumbsDown] = useState(false);
    const [thumbsDownCount, setThumbsDownCount] = useState(0); 

    // 반응 상태 로드(DB 및 로컬 스토리지에서)
    useEffect(() => {
        const loadReactionData = async () => {
            if (!user?.uid || !recordId) return;

            try {
                // DB에서 좋아요/싫어요 합산 및 사용자 반응 상태 병렬 조회
                const [summary, userReaction] = await Promise.all([
                    getReactionSummary(recordId),
                    getUserReaction(recordId, user.uid)
                ]);

                const upCount = summary?.thumbsUpCount || 0;
                const downCount = summary?.thumbsDownCount || 0;
                const isUp = userReaction?.isThumbsUp || false;
                const isDown = userReaction?.isThumbsDown || false;

                // 상태 업데이트
                setThumbsUpCount(upCount);
                setThumbsDownCount(downCount);
                setIsThumbsUp(isUp);
                setIsThumbsDown(isDown);

                // localStorage에 상태 저장(오류 시 복원용 캐시)
                const reactionData = {
                    thumbsUpCount: upCount,
                    thumbsDownCount: downCount,
                    isThumbsUp: isUp,
                    isThumbsDown: isDown,
                    timestamp: Date.now()
                };
                localStorage.setItem(`reaction_${recordId}_${user.uid}`, JSON.stringify(reactionData));

            } catch (error) {
                console.error("반응 데이터 로드 실패:", error);
                // 오류 시 로컬 스토리지에서 복원 시도(1시간 이내 데이터만 사용)
                const savedData = localStorage.getItem(`reaction_${recordId}_${user.uid}`);
                if (savedData) {
                    try {
                        const parsed = JSON.parse(savedData);
                        if (Date.now() - parsed.timestamp < 3600000) { 
                            setThumbsUpCount(parsed.thumbsUpCount || 0);
                            setThumbsDownCount(parsed.thumbsDownCount || 0);
                            setIsThumbsUp(parsed.isThumbsUp || false);
                            setIsThumbsDown(parsed.isThumbsDown || false);
                        }
                    } catch (e) {
                        console.error("저장된 반응 데이터 파싱 실패:", e);
                    }
                }
            }
        };
        loadReactionData();
    }, [user, recordId]);

    // 좋아요 토글 핸들러
    const handleThumbsUp = async (e) => {
        if (e) e.stopPropagation();
        if (!user) return;

        const prevIsUp = isThumbsUp;
        const prevIsDown = isThumbsDown;
        const prevUpCount = thumbsUpCount;
        const prevDownCount = thumbsDownCount;

        // Optimistic UI 업데이트 : 좋아요 상태 토글 및 카운트 변경
        setIsThumbsUp(!prevIsUp);
        setThumbsUpCount(prevIsUp ? prevUpCount - 1 : prevUpCount + 1);

        // 만약 싫어요 상태였다면, 싫어요 취소 처리
        if (prevIsDown) {
            setIsThumbsDown(false);
            setThumbsDownCount(prevDownCount - 1);
        }

        try {
            // 서버에 좋아요 토글 요청
            await toggleThumbsUp(recordId, user.uid);
            
            // 성공 시 localStorage 업데이트 및 전역 이벤트(reactionUpdated) 전송
            const newUpCount = prevIsUp ? prevUpCount - 1 : prevUpCount + 1;
            const newDownCount = prevIsDown ? prevDownCount - 1 : prevDownCount;
            const reactionData = {
                thumbsUpCount: newUpCount,
                thumbsDownCount: newDownCount,
                isThumbsUp: !prevIsUp,
                isThumbsDown: false,
                timestamp: Date.now()
            };
            localStorage.setItem(`reaction_${recordId}_${user.uid}`, JSON.stringify(reactionData));
            window.dispatchEvent(new CustomEvent('reactionUpdated', {
                detail: { recordId, type: 'thumbsUp', isActive: !prevIsUp }
            }));
        } catch (error) {
            console.error('좋아요 처리 실패:', error);
            // 실패 시 Optimistic Update 롤백
            setIsThumbsUp(prevIsUp);
            setThumbsUpCount(prevUpCount);
            setIsThumbsDown(prevIsDown);
            setThumbsDownCount(prevDownCount);
        }
    };

    // 싫어요 토글 핸들러
    const handleThumbsDown = async (e) => {
        if (e) e.stopPropagation();
        if (!user) return;

        const prevIsDown = isThumbsDown;
        const prevIsUp = isThumbsUp;
        const prevDownCount = thumbsDownCount;
        const prevUpCount = thumbsUpCount;

        // Optimistic UI 업데이트 : 싫어요 상태 토글 및 카운트 변경
        setIsThumbsDown(!prevIsDown);
        setThumbsDownCount(prevIsDown ? prevDownCount - 1 : prevDownCount + 1);

        // 만약 좋아요 상태였다면, 좋아요 취소 처리
        if (prevIsUp) {
            setIsThumbsUp(false);
            setThumbsUpCount(prevUpCount - 1);
        }

        try {
            // 서버에 싫어요 토글 요청
            await toggleThumbsDown(recordId, user.uid);

            // 성공 시 localStorage 업데이트 및 전역 이벤트(reactionUpdated) 전송
            const newUpCount = prevIsUp ? prevUpCount - 1 : prevUpCount;
            const newDownCount = prevIsDown ? prevDownCount - 1 : prevDownCount + 1;
            const reactionData = {
                thumbsUpCount: newUpCount,
                thumbsDownCount: newDownCount,
                isThumbsUp: false,
                isThumbsDown: !prevIsDown,
                timestamp: Date.now()
            };
            localStorage.setItem(`reaction_${recordId}_${user.uid}`, JSON.stringify(reactionData));
            window.dispatchEvent(new CustomEvent('reactionUpdated', {
                detail: { recordId, type: 'thumbsDown', isActive: !prevIsDown }
            }));
        } catch (error) {
            console.error('싫어요 처리 실패:', error);
            // 실패 시 Optimistic Update 롤백
            setIsThumbsDown(prevIsDown);
            setThumbsDownCount(prevDownCount);
            setIsThumbsUp(prevIsUp);
            setThumbsUpCount(prevUpCount);
        }
    };

    return {
        isThumbsUp,
        thumbsUpCount,
        isThumbsDown,
        thumbsDownCount,
        handleThumbsUp,
        handleThumbsDown
    };
};
// src/hooks/useFeedSubscription.js

import { useState, useEffect } from "react";
import { toggleSubscription, checkSubscription } from "../api/subscribe"; // 경로는 프로젝트 구조에 맞게 수정하세요

/**
 * 작성자 구독 상태 및 토글 로직을 관리하는 Custom Hook.
 * @param {string | undefined} authorUid - 피드 작성자의 UID
 * @param {object | null} user - 현재 로그인된 사용자 객체 (user.uid)
 * @returns {{ isSubscribed: boolean, handleSubscribe: () => void }}
 */
export const useFeedSubscription = (authorUid, user) => {
    const [isSubscribed, setIsSubscribed] = useState(false);

    // 구독 상태 확인
    useEffect(() => {
        const checkSubscriptionStatus = async () => {
            if (!user?.uid || !authorUid || user.uid === authorUid) {
                setIsSubscribed(false);
                return;
            }
            try {
                const subscribed = await checkSubscription(user.uid, authorUid);
                setIsSubscribed(subscribed);
            } catch (error) {
                console.error("구독 상태 확인 실패:", error);
            }
        };
        checkSubscriptionStatus();
    }, [user?.uid, authorUid]);

    // 구독 토글 핸들러
    const handleSubscribe = async () => {
        if (!user || !authorUid) return;

        const prev = isSubscribed;
        setIsSubscribed(!isSubscribed); // Optimistic UI 업데이트

        try {
            await toggleSubscription(user.uid, authorUid);
        } catch (err) {
            console.error("구독 API 오류:", err);
            setIsSubscribed(prev); // 실패 시 롤백
        }
    };

    return { isSubscribed, handleSubscribe };
};
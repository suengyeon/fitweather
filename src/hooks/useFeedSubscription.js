import { useState, useEffect } from "react";
import { toggleSubscription, checkSubscription } from "../api/subscribe"; 

/**
 * 작성자 구독 상태 및 토글 로직을 관리
 */
export const useFeedSubscription = (authorUid, user) => {
    const [isSubscribed, setIsSubscribed] = useState(false); // 구독 상태

    // 구독 상태 확인
    useEffect(() => {
        const checkSubscriptionStatus = async () => {
            // 로그인 X, 작성자 UID X, 또는 자기 자신이면 확인 불필요
            if (!user?.uid || !authorUid || user.uid === authorUid) {
                setIsSubscribed(false);
                return;
            }
            try {
                // checkSubscription API 호출로 현재 구독 상태 확인
                const subscribed = await checkSubscription(user.uid, authorUid);
                setIsSubscribed(subscribed);
            } catch (error) {
                console.error("구독 상태 확인 실패:", error);
            }
        };
        checkSubscriptionStatus();
    }, [user?.uid, authorUid]); // user.uid 또는 authorUid 변경 시 실행

    // 구독 토글 핸들러
    const handleSubscribe = async () => {
        if (!user || !authorUid) return;

        const prev = isSubscribed;
        setIsSubscribed(!isSubscribed); // Optimistic UI 업데이트 : 상태를 먼저 변경

        try {
            // toggleSubscription API 호출(구독/구독 취소)
            await toggleSubscription(user.uid, authorUid);
        } catch (err) {
            console.error("구독 API 오류:", err);
            setIsSubscribed(prev); // 실패 시 이전 상태로 롤백
        }
    };

    return { isSubscribed, handleSubscribe };
};
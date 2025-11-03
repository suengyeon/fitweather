import { useState, useEffect, useCallback, useMemo } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { createCommentNotification, createReplyNotification } from "../api/subscribe";
import { addReplyRecursively, deleteNodeKeepChildren, findCommentAuthor } from "../utils/commentUtils";

/**
 * 댓글 섹션의 모든 상태, 로직 및 핸들러를 관리하는 커스텀 훅
 */
export const useComments = (recordId, user, feedData, currentUserProfile) => {
    const [comments, setComments] = useState([]); 
    const [isRefreshing, setIsRefreshing] = useState(false); 
    const [newComment, setNewComment] = useState(""); 
    const [replyToCommentId, setReplyToCommentId] = useState(null); 
    const [replyContent, setReplyContent] = useState(""); 

    // 1. commentsRef를 useMemo로 정의 : recordId가 유효할 때만 Firestore 문서 참조 생성
    const commentsRef = useMemo(() => {
        return recordId ? doc(db, "comments", recordId) : null;
    }, [recordId]);

    // 댓글 목록 가져오기 함수
    const fetchComments = useCallback(async () => {
        // 2. commentsRef가 유효할 때만 Firestore 호출 실행
        if (!commentsRef) {
            setComments([]);
            return;
        }
        
        try {
            const commentsSnap = await getDoc(commentsRef);
            if (commentsSnap.exists()) {
                const commentsData = commentsSnap.data();
                setComments(commentsData.comments || []);
            } else {
                setComments([]); // 문서가 없으면 빈 배열
            }
        } catch (error) {
            console.error("댓글 데이터 가져오기 실패:", error);
            setComments([]);
        }
    }, [commentsRef]); 

    // 3. 컴포넌트 마운트 시 및 fetchComments 변경 시 댓글 로드
    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    // 댓글 새로고침 핸들러
    const handleRefreshComments = async () => {
        setIsRefreshing(true);
        await fetchComments();
        setIsRefreshing(false);
    };

    // 댓글 작성 핸들러
    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        // 유효성 검사
        if (!newComment.trim() || !user || !commentsRef) return; 

        // 현재 시각을 한국어 형식으로 포맷
        const timestamp = new Date().toLocaleString('ko-KR', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        }).replace(/\./g, '-').replace(/,/g, '').replace(/\s/g, ' ');

        // 새 댓글 객체 생성(고유 ID 포함)
        const newCommentObj = {
            id: (crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`),
            author: currentUserProfile?.nickname || user.displayName || "익명",
            authorUid: user.uid,
            timestamp: timestamp,
            content: newComment.trim(),
            replies: []
        };

        // Optimistic Update : UI에 즉시 반영
        const updatedComments = [...comments, newCommentObj];
        setComments(updatedComments); 
        setNewComment("");

        try {
            // Firestore 문서 업데이트
            await setDoc(commentsRef, { comments: updatedComments, lastUpdated: new Date() }, { merge: true });

            // 게시글 작성자에게 알림 생성(댓글 작성자가 본인이 아닐 경우)
            if (feedData?.uid !== user.uid) {
                await createCommentNotification(user.uid, feedData.uid, recordId, newComment.trim());
            }

            // Firestore에서 최신 목록 다시 로드 
            const commentsSnap = await getDoc(commentsRef);
            if (commentsSnap.exists()) setComments(commentsSnap.data().comments || []);
        } catch (error) {
            console.error("댓글 저장 실패:", error);
            setComments(comments); // 오류 시 롤백
        }
    };

    // 댓글 삭제 핸들러
    const handleCommentDelete = async (commentId) => {
        if (!window.confirm("댓글을 삭제하시겠습니까?")) return;
        if (!commentsRef) return; 

        try {
            // 댓글 유틸리티 함수 사용하여 댓글 목록에서 삭제
            const { list: updatedList, changed } = deleteNodeKeepChildren(comments, commentId);
            if (!changed) return;

            // Optimistic Update
            setComments(updatedList);

            // Firestore 문서 업데이트
            await setDoc(commentsRef, { comments: updatedList, lastUpdated: new Date() }, { merge: true });

            // Firestore에서 최신 목록 다시 로드
            const snap = await getDoc(commentsRef);
            if (snap.exists()) setComments(snap.data()?.comments || []);
        } catch (err) {
            console.error("댓글 삭제 실패:", err);
        }
    };

    // 답글 입력 모드 토글 핸들러
    const handleReply = (commentId) => {
        if (replyToCommentId === commentId) {
            setReplyToCommentId(null);
            setReplyContent("");
        } else {
            setReplyToCommentId(commentId);
            setReplyContent("");
        }
    };

    // 답글 작성 취소 핸들러
    const handleCancelReply = () => {
        setReplyToCommentId(null);
        setReplyContent("");
    };

    // 답글 작성 핸들러
    const handleReplySubmit = async (e) => {
        e.preventDefault();
        // 유효성 검사
        if (!replyContent.trim() || !replyToCommentId || !user || !commentsRef) return; 

        // 현재 시각 포맷
        const timestamp = new Date().toLocaleString('ko-KR', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        }).replace(/\./g, '-').replace(/,/g, '').replace(/\s/g, ' ');

        // 새 답글 객체 생성
        const newReply = {
            id: (crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`),
            author: currentUserProfile?.nickname || user.displayName || "익명",
            authorUid: user.uid,
            timestamp: timestamp,
            content: replyContent.trim(),
            replies: []
        };

        // Optimistic Update : 유틸리티 함수를 이용해 계층 구조에 답글 추가
        const optimistic = addReplyRecursively(comments, replyToCommentId, newReply);
        setComments(optimistic); 
        setReplyToCommentId(null);
        setReplyContent("");

        try {
            // Firestore 문서 업데이트
            await setDoc(commentsRef, { comments: optimistic, lastUpdated: new Date() }, { merge: true });

            // 원래 댓글 작성자 UID 찾기 및 알림 생성
            const originalCommentAuthor = findCommentAuthor(comments, replyToCommentId);
            if (originalCommentAuthor && originalCommentAuthor !== user.uid) {
                await createReplyNotification(user.uid, originalCommentAuthor, recordId, replyContent.trim());
            }

            // Firestore에서 최신 목록 다시 로드
            const snap = await getDoc(commentsRef);
            if (snap.exists()) setComments(snap.data()?.comments || []);
        } catch (err) {
            console.error("답글 저장 실패:", err);
        }
    };

    // 댓글 상태 및 핸들러 반환
    return {
        comments,
        newComment,
        setNewComment,
        replyToCommentId,
        replyContent,
        setReplyContent,
        isRefreshing,
        handleCommentSubmit,
        handleCommentDelete,
        handleReply,
        handleReplySubmit,
        handleCancelReply,
        handleRefreshComments
    };
};
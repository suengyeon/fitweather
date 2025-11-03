import { useState, useEffect, useCallback, useMemo } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { createCommentNotification, createReplyNotification } from "../api/subscribe";
import { addReplyRecursively, deleteNodeKeepChildren, findCommentAuthor } from "../utils/commentUtils";

export const useComments = (recordId, user, feedData, currentUserProfile) => {
    const [comments, setComments] = useState([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [replyToCommentId, setReplyToCommentId] = useState(null);
    const [replyContent, setReplyContent] = useState("");

    // 1. commentsRef를 useMemo로 정의합니다. recordId가 없을 때는 null을 반환하여 Hooks 규칙을 준수합니다.
    const commentsRef = useMemo(() => {
        return recordId ? doc(db, "comments", recordId) : null;
    }, [recordId]);

    // 댓글 목록 가져오기 함수
    const fetchComments = useCallback(async () => {
        // 2. 실제 Firestore 호출은 commentsRef가 유효할 때만 실행되도록 함수 내부에서 검사합니다.
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
                setComments([]);
            }
        } catch (error) {
            console.error("댓글 데이터 가져오기 실패:", error);
            setComments([]);
        }
    }, [commentsRef]); // commentsRef가 null일 때도 useCallback은 호출됩니다.

    // 3. useEffect는 무조건 호출되지만, 내부에서 fetchComments에 의해 로직이 제어됩니다.
    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    // 댓글 새로고침
    const handleRefreshComments = async () => {
        setIsRefreshing(true);
        await fetchComments();
        setIsRefreshing(false);
    };

    // 댓글 작성 (handleSubmit 등의 모든 함수는 commentsRef 유효성 검사를 통해 제어해야 하지만,
    // recordId 유무는 이미 commentsRef로 체크되므로, 여기서도 commentsRef를 사용합니다.)
    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !user || !commentsRef) return; // ✅ commentsRef 검사

        const timestamp = new Date().toLocaleString('ko-KR', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        }).replace(/\./g, '-').replace(/,/g, '').replace(/\s/g, ' ');

        const newCommentObj = {
            id: (crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`),
            author: currentUserProfile?.nickname || user.displayName || "익명",
            authorUid: user.uid,
            timestamp: timestamp,
            content: newComment.trim(),
            replies: []
        };

        const updatedComments = [...comments, newCommentObj];
        setComments(updatedComments); 
        setNewComment("");

        try {
            await setDoc(commentsRef, { comments: updatedComments, lastUpdated: new Date() }, { merge: true });

            if (feedData?.uid !== user.uid) {
                await createCommentNotification(user.uid, feedData.uid, recordId, newComment.trim());
            }

            const commentsSnap = await getDoc(commentsRef);
            if (commentsSnap.exists()) setComments(commentsSnap.data().comments || []);
        } catch (error) {
            console.error("댓글 저장 실패:", error);
            setComments(comments);
        }
    };

    const handleCommentDelete = async (commentId) => {
        if (!window.confirm("댓글을 삭제하시겠습니까?")) return;
        if (!commentsRef) return; // ✅ commentsRef 검사

        try {
            const { list: updatedList, changed } = deleteNodeKeepChildren(comments, commentId);
            if (!changed) return;

            setComments(updatedList);

            await setDoc(commentsRef, { comments: updatedList, lastUpdated: new Date() }, { merge: true });

            const snap = await getDoc(commentsRef);
            if (snap.exists()) setComments(snap.data()?.comments || []);
        } catch (err) {
            console.error("댓글 삭제 실패:", err);
        }
    };

    const handleReply = (commentId) => {
        if (replyToCommentId === commentId) {
            setReplyToCommentId(null);
            setReplyContent("");
        } else {
            setReplyToCommentId(commentId);
            setReplyContent("");
        }
    };

    const handleCancelReply = () => {
        setReplyToCommentId(null);
        setReplyContent("");
    };

    const handleReplySubmit = async (e) => {
        e.preventDefault();
        if (!replyContent.trim() || !replyToCommentId || !user || !commentsRef) return; // ✅ commentsRef 검사

        const timestamp = new Date().toLocaleString('ko-KR', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        }).replace(/\./g, '-').replace(/,/g, '').replace(/\s/g, ' ');

        const newReply = {
            id: (crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`),
            author: currentUserProfile?.nickname || user.displayName || "익명",
            authorUid: user.uid,
            timestamp: timestamp,
            content: replyContent.trim(),
            replies: []
        };

        const optimistic = addReplyRecursively(comments, replyToCommentId, newReply);
        setComments(optimistic); 
        setReplyToCommentId(null);
        setReplyContent("");

        try {
            await setDoc(commentsRef, { comments: optimistic, lastUpdated: new Date() }, { merge: true });

            const originalCommentAuthor = findCommentAuthor(comments, replyToCommentId);
            if (originalCommentAuthor && originalCommentAuthor !== user.uid) {
                await createReplyNotification(user.uid, originalCommentAuthor, recordId, replyContent.trim());
            }

            const snap = await getDoc(commentsRef);
            if (snap.exists()) setComments(snap.data()?.comments || []);
        } catch (err) {
            console.error("답글 저장 실패:", err);
        }
    };

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
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { HomeIcon, ArrowLeftIcon, HandThumbUpIcon, HandThumbDownIcon, XMarkIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { toggleSubscription, checkSubscription, createCommentNotification, createReplyNotification } from "../api/subscribe";
import { useAuth } from "../contexts/AuthContext";

function addReplyRecursively(nodes, targetId, newReply) {
    if (!Array.isArray(nodes)) return nodes;
    return nodes.map((node) => {
        if (node.id === targetId) {
            const nextReplies = Array.isArray(node.replies) ? [...node.replies, newReply] : [newReply];
            return { ...node, replies: nextReplies };
        }
        if (Array.isArray(node.replies) && node.replies.length > 0) {
            return { ...node, replies: addReplyRecursively(node.replies, targetId, newReply) };
        }
        return node;
    });
}

function deleteNodeKeepChildren(nodes, targetId) {
    if (!Array.isArray(nodes)) return { list: nodes, changed: false };

    let changed = false;
    const result = [];

    for (const node of nodes) {
        if (node.id === targetId) {
            if (Array.isArray(node.replies) && node.replies.length > 0) {
                result.push(...node.replies);
            }
            changed = true;
            continue;
        }

        let nextNode = node;
        if (Array.isArray(node.replies) && node.replies.length > 0) {
            const { list: childList, changed: childChanged } = deleteNodeKeepChildren(node.replies, targetId);
            if (childChanged) {
                changed = true;
                nextNode = { ...node, replies: childList };
            }
        }
        result.push(nextNode);
    }

    return { list: result, changed };
}

function getWeatherEmoji(iconCode) {
    switch (iconCode) {
        case "sunny": return "☀️";
        case "cloudy": return "☁️";
        case "overcast": return "🌥️";
        case "rain": return "🌧️";
        case "snow": return "❄️";
        case "snow_rain": return "🌨️";
        case "shower": return "🌦️";
        default: return "☁️";
    }
}

function FeedDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // 뒤로가기 (likes 분기 제거)
    const handleGoBack = () => {
        if (location.state?.fromRecommend) {
            navigate("/recommend", {
                state: {
                    fromDetail: true,
                    currentFilters: location.state?.currentFilters
                }
            });
        } else if (location.state?.fromFeed) {
            navigate("/feed", {
                state: {
                    fromDetail: true,
                    region: data?.region,
                    date: location.state?.date,
                    year: location.state?.year,
                    month: location.state?.month,
                    day: location.state?.day
                }
            });
        } else {
            navigate("/feed");
        }
    };

    const [formattedDate, setFormattedDate] = useState("");
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [imagePreviewIdx, setImagePreviewIdx] = useState(0);
    const [author, setAuthor] = useState(null);

    const [currentUserProfile, setCurrentUserProfile] = useState(null);

    // 구독 & 평가(좋아요/싫어요) UI 상태
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isThumbsUp, setIsThumbsUp] = useState(false);
    const [thumbsUpCount, setThumbsUpCount] = useState(0);
    const [isThumbsDown, setIsThumbsDown] = useState(false);
    const [thumbsDownCount, setThumbsDownCount] = useState(0);

    // 구독 상태 확인
    useEffect(() => {
        const checkSubscriptionStatus = async () => {
            if (!user?.uid || !data?.uid || user.uid === data.uid) return;
            try {
                const subscribed = await checkSubscription(user.uid, data.uid);
                setIsSubscribed(subscribed);
            } catch (error) {
                console.error("구독 상태 확인 실패:", error);
            }
        };
        if (data?.uid) checkSubscriptionStatus();
    }, [user?.uid, data?.uid]);

    // 댓글 뷰 상태
    const [isCommentViewVisible, setIsCommentViewVisible] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [replyToCommentId, setReplyToCommentId] = useState(null);
    const [replyContent, setReplyContent] = useState("");
    const categoryOrder = ["OUTER", "TOP", "BOTTOM", "SHOES", "ACC"];

    // 댓글 데이터
    const [comments, setComments] = useState([]);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const ref = doc(db, "records", id);
            const snapshot = await getDoc(ref);
            if (snapshot.exists()) {
                const record = snapshot.data();
                setData(record);

                if (record.date) {
                    const [year, month, day] = record.date.split('-').map(Number);
                    let dateString = `${year}년 ${month}월 ${day}일`;
                    if (record.recordedTime) dateString += ` ${record.recordedTime}`;
                    setFormattedDate(dateString);
                }

                // 작성자 정보
                const userRef = doc(db, "users", record.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    setAuthor({ ...userSnap.data(), uid: record.uid });
                } else {
                    setAuthor({ nickname: record.uid, uid: record.uid });
                }
            }
            setLoading(false);
        };
        fetchData();
    }, [id, user]);

    // 현재 로그인 사용자 프로필
    useEffect(() => {
        const fetchCurrentUserProfile = async () => {
            if (!user) return;
            try {
                const userRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) setCurrentUserProfile(userSnap.data());
            } catch (error) {
                console.error("현재 사용자 프로필 가져오기 실패:", error);
            }
        };
        fetchCurrentUserProfile();
    }, [user]);

    // 댓글 로드
    useEffect(() => {
        const fetchComments = async () => {
            try {
                const commentsRef = doc(db, "comments", id);
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
        };
        fetchComments();
    }, [id]);

    if (loading) return <div className="p-6">불러오는 중...</div>;
    if (!data) return <div className="p-6 text-red-500">게시물을 찾을 수 없습니다.</div>;

    const { weather, outfit, memo, imageUrls, feeling } = data;

    // 구독 토글
    const handleSubscribe = async () => {
        if (!user || !data?.uid) return;
        const prev = isSubscribed;
        setIsSubscribed(!isSubscribed);
        try {
            await toggleSubscription(user.uid, data.uid);
        } catch (err) {
            console.error("구독 API 오류:", err);
            setIsSubscribed(prev);
        }
    };

    // 피드 페이지의 평가(좋아요/싫어요) 버튼 UI
    const handleThumbsUp = async (e) => {
        e.stopPropagation();
        if (!user) return;

        const prev = isThumbsUp;
        setIsThumbsUp(!isThumbsUp);
        setThumbsUpCount((p) => (isThumbsUp ? p - 1 : p + 1));

        if (isThumbsDown) {
            setIsThumbsDown(false);
            setThumbsDownCount((p) => p - 1);
        }
        // TODO: 서버 반영 필요 시 추가
    };

    const handleThumbsDown = async (e) => {
        e.stopPropagation();
        if (!user) return;

        const prev = isThumbsDown;
        setIsThumbsDown(!isThumbsDown);
        setThumbsDownCount((p) => (isThumbsDown ? p - 1 : p + 1));

        if (isThumbsUp) {
            setIsThumbsUp(false);
            setThumbsUpCount((p) => p - 1);
        }
        // TODO: 서버 반영 필요 시 추가
    };

    // 댓글 뷰 토글
    const handleCommentViewToggle = () => setIsCommentViewVisible(!isCommentViewVisible);

    // 댓글 새로고침
    const handleRefreshComments = async () => {
        setIsRefreshing(true);
        try {
            const commentsRef = doc(db, "comments", id);
            const commentsSnap = await getDoc(commentsRef);
            if (commentsSnap.exists()) {
                const commentsData = commentsSnap.data();
                setComments(commentsData.comments || []);
            } else {
                setComments([]);
            }
        } catch (error) {
            console.error("댓글 새로고침 실패:", error);
        } finally {
            setIsRefreshing(false);
        }
    };

    // 댓글 작성
    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        const newCommentObj = {
            id: (crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`),
            author: currentUserProfile?.nickname || user?.displayName || "익명",
            authorUid: user?.uid,
            timestamp: new Date().toLocaleString('ko-KR', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit'
            }).replace(/\./g, '-').replace(/,/g, '').replace(/\s/g, ' '),
            content: newComment.trim(),
            replies: []
        };

        try {
            const updatedComments = [...comments, newCommentObj];
            setComments(updatedComments);
            setNewComment("");

            const commentsRef = doc(db, "comments", id);
            await setDoc(commentsRef, { comments: updatedComments, lastUpdated: new Date() }, { merge: true });

            if (data.uid !== user?.uid) {
                await createCommentNotification(user?.uid, data.uid, id, newComment.trim());
            }

            const commentsSnap = await getDoc(commentsRef);
            if (commentsSnap.exists()) {
                const freshData = commentsSnap.data();
                setComments(freshData.comments || []);
            }
        } catch (error) {
            console.error("댓글 저장 실패:", error);
            setComments(comments);
        }
    };

    // 댓글 삭제
    const handleCommentDelete = async (commentId) => {
        if (!window.confirm("댓글을 삭제하시겠습니까?")) return;

        try {
            const { list: updatedList, changed } = deleteNodeKeepChildren(comments, commentId);
            if (!changed) return;

            setComments(updatedList);

            const commentsRef = doc(db, "comments", id);
            await setDoc(commentsRef, { comments: updatedList, lastUpdated: new Date() }, { merge: true });

            const snap = await getDoc(commentsRef);
            if (snap.exists()) setComments(snap.data()?.comments || []);
        } catch (err) {
            console.error("댓글 삭제 실패:", err);
        }
    };

    // 답글
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
        if (!replyContent.trim() || !replyToCommentId) return;

        const newReply = {
            id: (crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`),
            author: currentUserProfile?.nickname || user?.displayName || "익명",
            authorUid: user?.uid,
            timestamp: new Date().toLocaleString('ko-KR', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit'
            }).replace(/\./g, '-').replace(/,/g, '').replace(/\s/g, ' '),
            content: replyContent.trim(),
            replies: []
        };

        const optimistic = addReplyRecursively(comments, replyToCommentId, newReply);
        setComments(optimistic);
        setReplyToCommentId(null);
        setReplyContent("");

        try {
            const commentsRef = doc(db, "comments", id);
            await setDoc(commentsRef, { comments: optimistic, lastUpdated: new Date() }, { merge: true });

            const findCommentAuthor = (comments, commentId) => {
                for (const comment of comments) {
                    if (comment.id === commentId) return comment.authorUid;
                    if (comment.replies && comment.replies.length > 0) {
                        const found = findCommentAuthor(comment.replies, commentId);
                        if (found) return found;
                    }
                }
                return null;
            };

            const originalCommentAuthor = findCommentAuthor(comments, replyToCommentId);
            if (originalCommentAuthor && originalCommentAuthor !== user?.uid) {
                await createReplyNotification(user?.uid, originalCommentAuthor, id, replyContent.trim());
            }

            const snap = await getDoc(commentsRef);
            if (snap.exists()) {
                const fresh = snap.data()?.comments || [];
                setComments(fresh);
            }
        } catch (err) {
            console.error("답글 저장 실패:", err);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            {/* 상단 네비게이션 */}
            <div className="flex justify-between items-center px-4 py-3 bg-blue-100 shadow">
                <button
                    onClick={handleGoBack}
                    className="bg-blue-200 px-3 py-1 rounded-md hover:bg-blue-300"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <h2 className="font-bold text-lg">{formattedDate}</h2>
                <button
                    onClick={() => navigate("/")}
                    className="bg-blue-200 px-3 py-1 rounded-md hover:bg-blue-300"
                >
                    <HomeIcon className="w-5 h-5" />
                </button>
            </div>

            {/* 콘텐츠 */}
            <div className="flex-1 px-4 mt-10 flex flex-col md:items-start md:justify-center md:flex-row gap-6 overflow-y-auto">
                {/* 왼쪽 : 날씨 카드 또는 댓글 섹션 */}
                <div className="w-full md:w-1/3 bg-gray-200 h-[705px] overflow-hidden rounded-lg">
                    {!isCommentViewVisible ? (
                        <div className="px-6 py-6 text-center h-full">
                            <div className="mb-4 flex justify-start">
                                <button
                                    onClick={handleCommentViewToggle}
                                    className="px-3 py-1 bg-white rounded text-sm font-medium hover:bg-gray-100 transition-colors"
                                >
                                    + 댓글 보기
                                </button>
                            </div>

                            <div className="mb-6 flex justify-center">
                                <div className="w-60 h-60 bg-gray-200 rounded flex items-center justify-center text-6xl relative overflow-hidden">
                                    <div className="absolute text-8xl animate-bounce">
                                        {data?.weather?.icon ? getWeatherEmoji(data.weather.icon) : "☁️"}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 items-center">
                                <div className="flex items-center w-60">
                                    <span className="w-28 text-base font-semibold text-left">온도</span>
                                    <div className="ml-auto w-32 h-9 px-2 py-1 border rounded text-sm text-center flex items-center justify-center bg-white">
                                        <span className="text-gray-800">{data?.weather?.temp ?? data?.temp ?? '-'}°C</span>
                                    </div>
                                </div>

                                <div className="flex items-center w-60">
                                    <span className="w-28 text-base font-semibold text-left">강수량</span>
                                    <div className="ml-auto w-32 h-9 px-2 py-1 border rounded text-sm text-center flex items-center justify-center bg-white">
                                        <span className="text-gray-800">{data?.weather?.rain ?? data?.rain ?? '-'}mm</span>
                                    </div>
                                </div>

                                <div className="flex items-center w-60">
                                    <span className="w-28 text-base font-semibold text-left">습도</span>
                                    <div className="ml-auto w-32 h-9 px-2 py-1 border rounded text-sm text-center flex items-center justify-center bg-white">
                                        <span className="text-gray-800">{data?.weather?.humidity ?? data?.humidity ?? '-'}%</span>
                                    </div>
                                </div>

                                <div className="flex items-center w-60">
                                    <span className="w-28 text-base font-semibold text-left">체감</span>
                                    <div className="ml-auto w-32 h-9 px-2 py-1 border rounded text-sm text-center flex items-center justify-center bg-white">
                                        <span className="text-gray-800">{feelingToEmoji(feeling)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-center items-center pt-32">
                                <h1 className="text-5xl font-lilita text-indigo-500">Fitweather</h1>
                            </div>
                        </div>
                    ) : (
                        <CommentSection
                            comments={comments}
                            newComment={newComment}
                            setNewComment={setNewComment}
                            onCommentSubmit={handleCommentSubmit}
                            onCommentDelete={handleCommentDelete}
                            onReply={handleReply}
                            onClose={() => setIsCommentViewVisible(false)}
                            onRefresh={handleRefreshComments}
                            isRefreshing={isRefreshing}
                            replyToCommentId={replyToCommentId}
                            replyContent={replyContent}
                            setReplyContent={setReplyContent}
                            onReplySubmit={handleReplySubmit}
                            onCancelReply={handleCancelReply}
                            user={user}
                            author={author}
                        />
                    )}
                </div>

                {/* 오른쪽: 이미지 & 착장 */}
                <div className="w-full md:w-2/3 bg-white px-6 py-6 h-[705px] overflow-y-auto rounded-lg">
                    {/* 닉네임 + 버튼들 상단 바 */}
                    <div className="relative bg-gray-200 h-12 flex items-center px-4 mb-6">
                        {/* 구독 하트 */}
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSubscribe(); }}
                            onMouseDown={(e) => e.stopPropagation()}
                            style={{
                                cursor: "pointer",
                                fontSize: "24px",
                                transition: "all 0.2s ease",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                border: "none",
                                background: "transparent",
                                color: isSubscribed ? "#dc2626" : "#9ca3af"
                            }}
                            onMouseEnter={(e) => { e.target.style.transform = "scale(1.2)"; }}
                            onMouseLeave={(e) => { e.target.style.transform = "scale(1)"; }}
                        >
                            {isSubscribed ? "♥" : "♡"}
                        </button>

                        {/* 작성자 닉네임 */}
                        <button
                            onClick={() => navigate(`/calendar/${data.uid}`)}
                            className="absolute left-1/2 transform -translate-x-1/2 text-normal font-semibold hover:text-blue-600 hover:underline transition-colors"
                        >
                            {author ? `${author.nickname || author.uid}님의 기록` : ""}
                        </button>

                        {/* 좋아요/싫어요 */}
                        <div className="flex items-center gap-2 ml-auto">
                            <button onClick={handleThumbsUp} className="flex items-center gap-1 px-2 py-1 rounded transition hover:scale-110">
                                <HandThumbUpIcon className={`w-5 h-5 ${isThumbsUp ? 'text-blue-500' : 'text-gray-500'}`} />
                                <span className={`text-sm font-semibold ${isThumbsUp ? 'text-blue-500' : 'text-gray-500'}`}>{thumbsUpCount}</span>
                            </button>

                            <button onClick={handleThumbsDown} className="flex items-center gap-1 px-2 py-1 rounded transition hover:scale-110">
                                <HandThumbDownIcon className={`w-5 h-5 ${isThumbsDown ? 'text-red-500' : 'text-gray-500'}`} />
                                <span className={`text-sm font-semibold ${isThumbsDown ? 'text-red-500' : 'text-gray-500'}`}>{thumbsDownCount}</span>
                            </button>
                        </div>
                    </div>

                    {/* 이미지 + 착장 목록 */}
                    <div className="flex flex-col md:flex-row">
                        {/* 이미지 */}
                        <div className="w-full md:w-1/2 flex flex-col items-center justify-center pl-16">
                            {imageUrls?.length > 0 && (
                                <div className="w-72 aspect-[3/4] relative rounded overflow-hidden border bg-gray-100 mb-4">
                                    <img src={imageUrls[imagePreviewIdx]} alt="outfit" className="w-full h-full object-cover" />
                                    {imageUrls.length > 1 && (
                                        <div className="absolute bottom-2 left-0 right-0 flex justify-between px-2">
                                            <button
                                                onClick={() => setImagePreviewIdx((imagePreviewIdx - 1 + imageUrls.length) % imageUrls.length)}
                                                className="bg-white bg-opacity-70 px-2 py-1 rounded-full"
                                            >
                                                ◀
                                            </button>
                                            <span className="bg-white bg-opacity-70 px-2 py-1 rounded text-sm">
                                                {imagePreviewIdx + 1} / {imageUrls.length}
                                            </span>
                                            <button
                                                onClick={() => setImagePreviewIdx((imagePreviewIdx + 1) % imageUrls.length)}
                                                className="bg-white bg-opacity-70 px-2 py-1 rounded-full"
                                            >
                                                ▶
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* 착장 목록 */}
                        <div className="w-auto ml-12 space-y-4 max-h-96 overflow-y-auto">
                            {categoryOrder.map((category) => (
                                <div key={category}>
                                    <h4 className="font-semibold mb-1 uppercase">{category}</h4>
                                    <ul className="text-sm list-disc list-inside text-gray-700">
                                        {(data.outfit?.[category.toLowerCase()] || []).map((item, idx) => (
                                            <li key={idx}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 피드백 */}
                    {memo && (
                        <div className="w-full bg-gray-200 px-6 py-4 mt-6">
                            <label className="block font-semibold mb-2">Feedback</label>
                            <p className="w-full h-24 px-4 py-2 border rounded bg-white overflow-y-auto">
                                {memo}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function feelingToEmoji(feeling) {
    const map = {
        steam: "🥟 찐만두",
        hot: "🥵 더움",
        nice: "👍🏻 적당",
        cold: "💨 추움",
        ice: "🥶 동태",
    };
    return map[feeling] || feeling;
}

function CommentSection({
    comments,
    newComment,
    setNewComment,
    onCommentSubmit,
    onCommentDelete,
    onReply,
    onClose,
    onRefresh,
    isRefreshing,
    replyToCommentId,
    replyContent,
    setReplyContent,
    onReplySubmit,
    onCancelReply,
    user,
    author
}) {
    const renderComment = (comment, level = 0) => {
        const isIndented = level >= 1;
        return (
            <div key={comment.id} className={`${isIndented ? 'mt-2' : 'mb-4'}`}>
                <div className="bg-white rounded-lg p-3 border w-full">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <div className="font-semibold text-sm text-gray-800 flex items-center gap-2">
                                <span>{isIndented ? `ㄴ ${comment.author}` : comment.author}</span>
                                {(comment.authorUid === author?.uid) && (
                                    <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-md font-medium">
                                        작성자
                                    </span>
                                )}
                            </div>
                            <div className="text-xs text-gray-500">{comment.timestamp}</div>
                        </div>

                        <div className="flex gap-2">
                            <button onClick={() => onReply(comment.id)} className="text-xs text-blue-600 hover:text-blue-800">
                                답글
                            </button>
                            {(comment.authorUid === user?.uid || author?.uid === user?.uid) && (
                                <button onClick={() => onCommentDelete(comment.id)} className="text-xs text-red-600 hover:text-red-800">
                                    삭제
                                </button>
                            )}
                        </div>
                    </div>

                    <p className="text-sm text-gray-700 mb-2">{comment.content}</p>
                </div>

                {replyToCommentId === comment.id && (
                    <div className="mt-2 bg-gray-50 rounded-lg p-3 border">
                        <form onSubmit={onReplySubmit} className="space-y-2">
                            <textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="답글 작성"
                                className="w-full h-16 px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                maxLength={1000}
                            />
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">{replyContent.length}/1000</span>
                                <div className="flex gap-2">
                                    <button type="button" onClick={onCancelReply} className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800">
                                        취소
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!replyContent.trim()}
                                        className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                    >
                                        답글 등록
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                {Array.isArray(comment.replies) && comment.replies.length > 0 && (
                    <div className={`mt-2 ${level === 0 ? 'ml-6' : ''}`}>
                        {comment.replies.map((r) => renderComment(r, 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col rounded-lg overflow-hidden border">
            {/* 헤더 */}
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
                <h3 className="text-lg font-semibold">댓글</h3>
                <div className="flex gap-2">
                    <button
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        title="댓글 새로고침"
                    >
                        <ArrowPathIcon className={`w-5 h-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded">
                        <XMarkIcon className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
            </div>

            {/* 댓글 목록 */}
            <div className="flex-1 overflow-y-auto p-4">
                {comments.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">아직 댓글이 없습니다.</p>
                ) : (
                    comments.map((comment) => renderComment(comment, 0))
                )}
            </div>

            {/* 댓글 입력 폼 */}
            <div className="border-t bg-gray-50 p-4">
                <form onSubmit={onCommentSubmit} className="space-y-3">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="댓글 작성"
                        className="w-full h-20 px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength={1000}
                    />
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">{newComment.length}/1000</span>
                        <button
                            type="submit"
                            disabled={!newComment.trim()}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                        >
                            등록
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default FeedDetail;

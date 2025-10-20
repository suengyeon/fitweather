import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { HomeIcon, ArrowLeftIcon, HandThumbUpIcon, HandThumbDownIcon } from "@heroicons/react/24/outline";
import { toggleSubscription, checkSubscription, createCommentNotification, createReplyNotification } from "../api/subscribe";
import { useAuth } from "../contexts/AuthContext";
import CommentSection from "../components/CommentSection";
import { addReplyRecursively, deleteNodeKeepChildren, findCommentAuthor } from "../utils/commentUtils";
import { getWeatherEmoji, feelingToEmoji } from "../utils/weatherUtils";

function FeedDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // 뒤로가기
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

export default FeedDetail;
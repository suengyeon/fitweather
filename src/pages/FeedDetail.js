// src/pages/FeedDetail.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { HomeIcon, ArrowLeftIcon, HandThumbUpIcon, XMarkIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import WeatherCard from "../components/WeatherCard";
import { toggleLike } from "../api/toggleLike";
import { useAuth } from "../contexts/AuthContext";

// 날씨 아이콘 코드에 따른 이모지 반환 함수
function getWeatherEmoji(iconCode) {
    switch (iconCode) {
        case "sunny": return "☀️";        // 맑음
        case "cloudy": return "☁️";       // 구름많음
        case "overcast": return "🌥️";     // 흐림
        case "rain": return "🌧️";        // 비
        case "snow": return "❄️";        // 눈
        case "snow_rain": return "🌨️";   // 비/눈
        case "shower": return "🌦️";      // 소나기
        default: return "☁️";            // 기본값: 구름
    }
}

function FeedDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // 이전 페이지 경로 확인
    const getPreviousPath = () => {
        // location.state에서 이전 경로 확인
        if (location.state?.fromLikes) {
            return "/mypage_likes";
        }
        // 기본값은 피드로
        return "/feed";
    };

    // 뒤로가기 핸들러
    const handleGoBack = () => {
        console.log("FeedDetail - handleGoBack, location.state:", location.state);

        if (location.state?.fromLikes) {
            // 좋아요한 코디에서 온 경우, 선택된 날짜 정보와 함께 이동
            navigate("/mypage_likes", {
                state: {
                    selectedDate: location.state.selectedDate,
                    availableDates: location.state.availableDates
                }
            });
        } else if (location.state?.fromRecommend) {
            // 상세필터에서 온 경우, 상세필터로 돌아가기
            console.log("FeedDetail - navigating back to recommend");
            navigate("/recommend", {
                state: {
                    fromDetail: true,
                    // 현재 필터 상태 유지
                    currentFilters: location.state?.currentFilters
                }
            });
        } else if (location.state?.fromFeed) {
            // 피드에서 온 경우, 지역 정보 유지
            console.log("FeedDetail - navigating back to feed with fromDetail flag");
            navigate("/feed", {
                state: {
                    fromDetail: true,
                    // 현재 기록의 지역 정보도 함께 전달
                    region: data?.region,
                    // 날짜 정보도 함께 전달
                    date: location.state?.date,
                    year: location.state?.year,
                    month: location.state?.month,
                    day: location.state?.day
                }
            });
        } else {
            // 기본적으로 피드로
            navigate("/feed");
        }
    };
    const [formattedDate, setFormattedDate] = useState("");


    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [liked, setLiked] = useState(false);
    const [imagePreviewIdx, setImagePreviewIdx] = useState(0);
    const [author, setAuthor] = useState(null);
    const [likeCount, setLikeCount] = useState(0);
    const [currentUserProfile, setCurrentUserProfile] = useState(null); // 현재 로그인된 사용자 프로필
    
    // 구독 상태 관리
    const [isSubscribed, setIsSubscribed] = useState(false);
    // 좋아요 상태 관리 (기존 liked와 별도)
    const [isThumbsUp, setIsThumbsUp] = useState(false);
    const [thumbsUpCount, setThumbsUpCount] = useState(156); // 임시 데이터
    
    // 댓글 뷰 상태 관리
    const [isCommentViewVisible, setIsCommentViewVisible] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [replyToCommentId, setReplyToCommentId] = useState(null); // 답글 작성 중인 댓글 ID
    const [replyContent, setReplyContent] = useState(""); // 답글 내용
    const categoryOrder = ["OUTER", "TOP", "BOTTOM", "SHOES", "ACC"];

    // 댓글 데이터 (Firestore에서 불러오기)
    const [comments, setComments] = useState([]);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const ref = doc(db, "records", id);
            const snapshot = await getDoc(ref);
            if (snapshot.exists()) {
                const record = snapshot.data();
                setData(record);
                setLikeCount(record.likes?.length || 0);
                setLiked(user && record.likes?.includes(user.uid));

                // 기록의 실제 날짜를 포맷팅
                if (record.date) {
                    const [year, month, day] = record.date.split('-').map(Number);
                    setFormattedDate(`${year}년 ${month}월 ${day}일`);
                }

                // 작성자 정보 fetch
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

    // 현재 로그인된 사용자의 프로필 정보 가져오기
    useEffect(() => {
        const fetchCurrentUserProfile = async () => {
            if (!user) return;
            
            try {
                const userRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    setCurrentUserProfile(userSnap.data());
                }
            } catch (error) {
                console.error("현재 사용자 프로필 가져오기 실패:", error);
            }
        };
        
        fetchCurrentUserProfile();
    }, [user]);

    // 댓글 데이터 불러오기
    useEffect(() => {
        const fetchComments = async () => {
            try {
                console.log("댓글 데이터 불러오기 시작 - record ID:", id);
                const commentsRef = doc(db, "comments", id);
                const commentsSnap = await getDoc(commentsRef);
                console.log("댓글 문서 존재 여부:", commentsSnap.exists());
                if (commentsSnap.exists()) {
                    const commentsData = commentsSnap.data();
                    console.log("댓글 데이터:", commentsData);
                    setComments(commentsData.comments || []);
                } else {
                    console.log("댓글 문서가 존재하지 않음");
                    // 댓글이 없으면 빈 배열로 초기화
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

    const { date, regionName, weather, outfit, memo, imageUrls, weatherEmojis, feeling } = data;

    // 하트 버튼 클릭 핸들러 (기존 좋아요 기능)
    const handleLike = async () => {
        if (!user) return;
        const newLikes = await toggleLike(id, user.uid);
        setLiked(newLikes.includes(user.uid));
        setLikeCount(newLikes.length);
    };

    // 구독 버튼 클릭 핸들러
    const handleSubscribe = () => {
        setIsSubscribed(!isSubscribed);
        // TODO: 실제 구독 API 호출
    };

    // 좋아요 버튼 클릭 핸들러
    const handleThumbsUp = () => {
        setIsThumbsUp(!isThumbsUp);
        setThumbsUpCount(prev => isThumbsUp ? prev - 1 : prev + 1);
        // TODO: 실제 좋아요 API 호출
    };

    // 댓글 뷰 토글 핸들러
    const handleCommentViewToggle = () => {
        setIsCommentViewVisible(!isCommentViewVisible);
    };

    // 댓글 새로고침 핸들러
    const handleRefreshComments = async () => {
        setIsRefreshing(true);
        try {
            console.log("댓글 새로고침 시작 - record ID:", id);
            const commentsRef = doc(db, "comments", id);
            const commentsSnap = await getDoc(commentsRef);
            console.log("댓글 새로고침 - 문서 존재 여부:", commentsSnap.exists());
            if (commentsSnap.exists()) {
                const commentsData = commentsSnap.data();
                console.log("댓글 새로고침 - 최신 데이터:", commentsData);
                setComments(commentsData.comments || []);
            } else {
                console.log("댓글 새로고침 - 문서가 존재하지 않음");
                setComments([]);
            }
        } catch (error) {
            console.error("댓글 새로고침 실패:", error);
        } finally {
            setIsRefreshing(false);
        }
    };

    // 댓글 작성 핸들러
    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (newComment.trim()) {
            const newCommentObj = {
                id: Date.now(), // 임시 ID 생성
                author: currentUserProfile?.nickname || user?.displayName || "익명", // 현재 로그인된 사용자의 닉네임
                authorUid: user?.uid, // 작성자 UID 추가
                timestamp: new Date().toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                }).replace(/\./g, '-').replace(/,/g, '').replace(/\s/g, ' '),
                content: newComment.trim(),
                replies: []
            };
            
            try {
                // 댓글 목록에 새 댓글 추가
                const updatedComments = [...comments, newCommentObj];
                setComments(updatedComments);
                setNewComment("");
                
                // Firestore에 댓글 저장
                console.log("댓글 저장 시작 - record ID:", id);
                const commentsRef = doc(db, "comments", id);
                await setDoc(commentsRef, {
                    comments: updatedComments,
                    lastUpdated: new Date()
                }, { merge: true });
                
                console.log("새 댓글 추가 성공:", newCommentObj);
                console.log("저장된 댓글 목록:", updatedComments);
                
                // 댓글 목록 다시 불러오기 (다른 사용자에게도 즉시 반영되도록)
                const commentsSnap = await getDoc(commentsRef);
                if (commentsSnap.exists()) {
                    const freshCommentsData = commentsSnap.data();
                    setComments(freshCommentsData.comments || []);
                    console.log("댓글 목록 새로고침 완료:", freshCommentsData.comments);
                }
            } catch (error) {
                console.error("댓글 저장 실패:", error);
                // 실패 시 UI 롤백
                setComments(comments);
            }
        }
    };

    // 댓글 삭제 핸들러
    const handleCommentDelete = async (commentId) => {
        if (window.confirm("댓글을 삭제하시겠습니까?")) {
            try {
                const updatedComments = comments.map(comment => {
                    if (comment.id === commentId) {
                        return null; // 삭제할 댓글
                    }
                    // 대댓글과 답글의 답글에서도 삭제
                    if (comment.replies) {
                        const updatedReplies = comment.replies.map(reply => {
                            if (reply.id === commentId) {
                                return null; // 삭제할 답글
                            }
                            // 답글의 답글에서도 삭제
                            if (reply.replies) {
                                const updatedSubReplies = reply.replies.filter(subReply => subReply.id !== commentId);
                                return { ...reply, replies: updatedSubReplies };
                            }
                            return reply;
                        }).filter(reply => reply !== null); // null인 답글 제거
                        return { ...comment, replies: updatedReplies };
                    }
                    return comment;
                }).filter(comment => comment !== null); // null인 댓글 제거
                
                setComments(updatedComments);
                
                // Firestore에 삭제된 댓글 반영
                const commentsRef = doc(db, "comments", id);
                await setDoc(commentsRef, {
                    comments: updatedComments,
                    lastUpdated: new Date()
                }, { merge: true });
                
                console.log("댓글 삭제:", commentId);
            } catch (error) {
                console.error("댓글 삭제 실패:", error);
                // 실패 시 UI 롤백
                setComments(comments);
            }
        }
    };

    // 답글 작성 시작 핸들러
    const handleReply = (commentId) => {
        setReplyToCommentId(commentId);
        setReplyContent("");
    };

    // 답글 작성 취소 핸들러
    const handleCancelReply = () => {
        setReplyToCommentId(null);
        setReplyContent("");
    };

    // 답글 제출 핸들러
    const handleReplySubmit = async (e) => {
        e.preventDefault();
        if (replyContent.trim() && replyToCommentId) {
            const newReply = {
                id: Date.now(),
                author: currentUserProfile?.nickname || user?.displayName || "익명", // 현재 로그인된 사용자의 닉네임
                authorUid: user?.uid, // 작성자 UID 추가
                timestamp: new Date().toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                }).replace(/\./g, '-').replace(/,/g, '').replace(/\s/g, ' '),
                content: replyContent.trim(),
                replies: []
            };
            
            try {
                const updatedComments = comments.map(comment => {
                    // 원댓글에 답글 추가
                    if (comment.id === replyToCommentId) {
                        return {
                            ...comment,
                            replies: [...(comment.replies || []), newReply]
                        };
                    }
                    // 답글에 답글 추가 (답글의 답글)
                    if (comment.replies) {
                        const updatedReplies = comment.replies.map(reply => {
                            if (reply.id === replyToCommentId) {
                                return {
                                    ...reply,
                                    replies: [...(reply.replies || []), newReply]
                                };
                            }
                            return reply;
                        });
                        return { ...comment, replies: updatedReplies };
                    }
                    return comment;
                });
                
                setComments(updatedComments);
                
                // Firestore에 답글 저장
                const commentsRef = doc(db, "comments", id);
                await setDoc(commentsRef, {
                    comments: updatedComments,
                    lastUpdated: new Date()
                }, { merge: true });
                
                // 답글 작성 완료 후 초기화
                setReplyToCommentId(null);
                setReplyContent("");
                
                console.log("답글 추가:", newReply);
                
                // 댓글 목록 다시 불러오기
                const commentsSnap = await getDoc(commentsRef);
                if (commentsSnap.exists()) {
                    const freshCommentsData = commentsSnap.data();
                    setComments(freshCommentsData.comments || []);
                    console.log("답글 추가 후 댓글 목록 새로고침 완료:", freshCommentsData.comments);
                }
            } catch (error) {
                console.error("답글 저장 실패:", error);
                // 실패 시 UI 롤백
                setComments(comments);
            }
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
                        // 날씨 정보 뷰
                        <div className="px-6 py-6 text-center h-full">
                            {/* 댓글 보기 버튼 */}
                            <div className="mb-4 flex justify-start">
                                <button 
                                    onClick={handleCommentViewToggle}
                                    className="px-3 py-1 bg-white rounded text-sm font-medium hover:bg-gray-100 transition-colors"
                                >
                                    + 댓글 보기
                                </button>
                            </div>

                            {/* 날씨 일러스트 */}
                            <div className="mb-6 flex justify-center">
                                <div className="w-60 h-60 bg-gray-200 rounded flex items-center justify-center text-6xl relative overflow-hidden">
                                    <div className="absolute text-8xl animate-bounce">
                                        {weather?.icon ? getWeatherEmoji(weather.icon) : "☁️"}
                                    </div>
                                </div>
                            </div>

                            {/* 날씨 정보 항목들 */}
                            <div className="flex flex-col gap-4 items-center">
                                {/* 온도 */}
                                <div className="flex items-center w-60">
                                    <span className="w-28 text-base font-semibold text-left">온도</span>
                                    <div className="ml-auto w-32 h-9 px-2 py-1 border rounded text-sm text-center flex items-center justify-center bg-white">
                                        <span className="text-gray-800">{weather?.temp || data?.temp || '-'}°C</span>
                                    </div>
                                </div>

                                {/* 강수량 */}
                                <div className="flex items-center w-60">
                                    <span className="w-28 text-base font-semibold text-left">강수량</span>
                                    <div className="ml-auto w-32 h-9 px-2 py-1 border rounded text-sm text-center flex items-center justify-center bg-white">
                                        <span className="text-gray-800">{weather?.rain || data?.rain || '-'}mm</span>
                                    </div>
                                </div>

                                {/* 습도 */}
                                <div className="flex items-center w-60">
                                    <span className="w-28 text-base font-semibold text-left">습도</span>
                                    <div className="ml-auto w-32 h-9 px-2 py-1 border rounded text-sm text-center flex items-center justify-center bg-white">
                                        <span className="text-gray-800">{weather?.humidity || data?.humidity || '-'}%</span>
                                    </div>
                                </div>

                                {/* 계절 */}
                                <div className="flex items-center w-60">
                                    <span className="w-28 text-base font-semibold text-left">계절</span>
                                    <div className="ml-auto w-32 h-9 px-2 py-1 border rounded text-sm text-center flex items-center justify-center bg-gray-100">
                                        <span className="text-gray-600">이모지</span>
                                    </div>
                                </div>

                                {/* 체감 */}
                                <div className="flex items-center w-60">
                                    <span className="w-28 text-base font-semibold text-left">체감</span>
                                    <div className="ml-auto w-32 h-9 px-2 py-1 border rounded text-sm text-center flex items-center justify-center bg-white">
                                        <span className="text-gray-800">{feelingToEmoji(feeling)}</span>
                                    </div>
                                </div>

                                {/* 스타일 */}
                                <div className="flex items-center w-60">
                                    <span className="w-28 text-base font-semibold text-left">스타일</span>
                                    <div className="ml-auto w-32 h-9 px-2 py-1 border rounded text-sm text-center flex items-center justify-center bg-gray-100">
                                        <span className="text-gray-600">이모지</span>
                                    </div>
                                </div>
                            </div>

                            {/* Fitweather 로고 */}
                            <div className="flex justify-center items-center pt-32">
                                <h1 className="text-5xl font-lilita text-indigo-500">Fitweather</h1>
                            </div>
                        </div>
                            ) : (
                                // 댓글 섹션
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
                                    currentUserProfile={currentUserProfile}
                                    user={user}
                                    author={author}
                                />
                            )}
                </div>

                {/* 오른쪽: 이미지 & 착장 */}
                <div className="w-full md:w-2/3 bg-white px-6 py-6 h-[705px] overflow-y-auto rounded-lg">

                    {/* 닉네임 + 버튼들 상단 바 */}
                    <div className="relative bg-gray-200 h-12 flex items-center px-4 mb-6">
                        <button 
                            onClick={() => navigate(`/calendar/${data.uid}`)}
                            className="absolute left-1/2 transform -translate-x-1/2 text-normal font-semibold hover:text-blue-600 hover:underline transition-colors"
                        >
                            {author ? `${author.nickname || author.uid}님의 기록` : ""}
                        </button>
                        
                        {/* 구독 버튼 (하트 아이콘) */}
                        <button
                            onClick={handleSubscribe}
                            className="ml-auto mr-2 px-2 py-1 rounded text-xl transition hover:scale-110"
                        >
                            {isSubscribed ? (
                                <HeartIconSolid className="w-6 h-6 text-red-500" />
                            ) : (
                                <HeartIcon className="w-6 h-6 text-gray-500" />
                            )}
                        </button>
                        
                        {/* 좋아요 버튼 (엄지척 아이콘) */}
                        <button
                            onClick={handleThumbsUp}
                            className="flex items-center gap-1 px-2 py-1 rounded transition hover:scale-110"
                        >
                            <HandThumbUpIcon 
                                className={`w-5 h-5 ${isThumbsUp ? 'text-blue-500' : 'text-gray-500'}`} 
                            />
                            <span className={`text-sm font-semibold ${isThumbsUp ? 'text-blue-500' : 'text-gray-500'}`}>
                                {thumbsUpCount}
                            </span>
                        </button>
                    </div>

                    {/* 이미지 + 착장 목록 */}
                    <div className="flex flex-col md:flex-row">
                        {/* 이미지 */}
                        <div className="w-full md:w-1/2 flex flex-col items-center justify-center pl-16">
                            {imageUrls?.length > 0 && (
                                <div className="w-72 aspect-[3/4] relative rounded overflow-hidden border bg-gray-100 mb-4">
                                    <img
                                        src={imageUrls[imagePreviewIdx]}
                                        alt="outfit"
                                        className="w-full h-full object-cover"
                                    />
                                    {imageUrls.length > 1 && (
                                        <div className="absolute bottom-2 left-0 right-0 flex justify-between px-2">
                                            <button
                                                onClick={() =>
                                                    setImagePreviewIdx(
                                                        (imagePreviewIdx - 1 + imageUrls.length) % imageUrls.length
                                                    )
                                                }
                                                className="bg-white bg-opacity-70 px-2 py-1 rounded-full"
                                            >
                                                ◀
                                            </button>
                                            <span className="bg-white bg-opacity-70 px-2 py-1 rounded text-sm">
                                                {imagePreviewIdx + 1} / {imageUrls.length}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    setImagePreviewIdx((imagePreviewIdx + 1) % imageUrls.length)
                                                }
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
                                        {(outfit[category.toLowerCase()] || []).map((item, idx) => (
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
                            <p className="w-full h-24 px-4 py-2 border rounded bg-white resize-none overflow-y-auto">
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

// CommentSection 컴포넌트
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
    currentUserProfile,
    user,
    author
}) {
    const renderComment = (comment, isReply = false, isSubReply = false) => (
        <div key={comment.id} className={`${isReply ? 'ml-6 mt-2' : isSubReply ? 'mt-2' : 'mb-4'}`}>
            <div className="bg-white rounded-lg p-3 border">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <div className="font-semibold text-sm text-gray-800 flex items-center gap-2">
                            <span>
                                {isSubReply ? `ㄴㄴ ${comment.author}` : isReply ? `ㄴ ${comment.author}` : comment.author}
                            </span>
                            {(() => {
                                const isAuthor = comment.authorUid === author?.uid;
                                console.log("FeedDetail - 작성자 표시 확인:", {
                                    commentAuthorUid: comment.authorUid,
                                    authorUid: author?.uid,
                                    isAuthor: isAuthor,
                                    commentAuthor: comment.author
                                });
                                return isAuthor;
                            })() && (
                                <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-md font-medium">
                                    작성자
                                </span>
                            )}
                        </div>
                        <div className="text-xs text-gray-500">{comment.timestamp}</div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onReply(comment.id)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                        >
                            답글
                        </button>
                        {/* 댓글 작성자이거나 게시물 작성자만 삭제 가능 */}
                        {(comment.authorUid === user?.uid || 
                          (author && author.uid === user?.uid)) && (
                            <button
                                onClick={() => onCommentDelete(comment.id)}
                                className="text-xs text-red-600 hover:text-red-800"
                            >
                                삭제
                            </button>
                        )}
                    </div>
                </div>
                <p className="text-sm text-gray-700 mb-2">{comment.content}</p>
            </div>

            {/* 답글 작성 폼 */}
            {replyToCommentId === comment.id && (
                <div className={`${isReply ? 'ml-6' : 'ml-0'} mt-2 bg-gray-50 rounded-lg p-3 border`}>
                    <form onSubmit={onReplySubmit} className="space-y-2">
                        <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="답글 작성"
                            className="w-full h-16 px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            maxLength={1000}
                        />
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">
                                {replyContent.length}/1000
                            </span>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={onCancelReply}
                                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                                >
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

            {/* 대댓글 렌더링 */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="mt-2">
                    {comment.replies.map(reply => renderComment(reply, true, isReply))}
                </div>
            )}
        </div>
    );

    return (
        <div className="h-full flex flex-col">
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
                    <button 
                        onClick={onClose}
                        className="p-1 hover:bg-gray-200 rounded"
                    >
                        <XMarkIcon className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
            </div>

            {/* 댓글 목록 */}
            <div className="flex-1 overflow-y-auto p-4">
                {comments.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">아직 댓글이 없습니다.</p>
                ) : (
                    comments.map(comment => renderComment(comment))
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
                        <span className="text-xs text-gray-500">
                            {newComment.length}/1000
                        </span>
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


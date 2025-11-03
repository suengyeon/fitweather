import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { HomeIcon, ArrowLeftIcon, HandThumbUpIcon, HandThumbDownIcon } from "@heroicons/react/24/outline";
import { useFeedDetailData } from "../hooks/useFeedDetailData";
import { useFeedReactions } from "../hooks/useFeedReactions";
import { useFeedSubscription } from "../hooks/useFeedSubscription";
import { useComments } from "../hooks/useComments";
import { useAuth } from "../contexts/AuthContext";
import CommentSection from "../components/CommentSection";
import { getWeatherEmoji, feelingToEmoji } from "../utils/weatherUtils";
import ReportModal from "../components/ReportModal";
import { submitReport } from "../api/reportAPI";
import { getStyleLabel } from "../utils/styleUtils";
import { navBtnStyle, indicatorStyle, dotStyle } from "../components/ImageCarouselStyles";
import { doc, getDoc } from "firebase/firestore"; 
import { db } from "../firebase"; 

function FeedDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    
    // UI 상태: 이미지 캐러셀 및 댓글 뷰
    const [imagePreviewIdx, setImagePreviewIdx] = useState(0);
    const [isCommentViewVisible, setIsCommentViewVisible] = useState(false);

    // 신고 모달 상태
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportTarget, setReportTarget] = useState(null);
    
    // 현재 로그인 사용자 프로필 로직
    const [currentUserProfile, setCurrentUserProfile] = useState(null);
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

    // 1. 피드 상세 데이터 및 작성자 정보 로드
    const { data, author, loading, formattedDate } = useFeedDetailData(id, user); // user를 넘겨 현재 사용자 로직이 병합되는 것을 방지

    // 2. 좋아요/싫어요 로직
    const { 
        isThumbsUp, thumbsUpCount, isThumbsDown, thumbsDownCount, 
        handleThumbsUp, handleThumbsDown 
    } = useFeedReactions(id, user);

    // 3. 구독 로직
    const { isSubscribed, handleSubscribe } = useFeedSubscription(data?.uid, user);

    // 4. 댓글 로직
    const {
        comments, newComment, setNewComment, isRefreshing, 
        replyToCommentId, setReplyContent, replyContent, 
        handleCommentSubmit, handleCommentDelete, handleReply, 
        handleReplySubmit, handleCancelReply, handleRefreshComments
    } = useComments(id, user, data, currentUserProfile);


    // 뒤로가기 로직(Navigation Logic)
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

    // 댓글 뷰 토글(UI Logic)
    const handleCommentViewToggle = () => setIsCommentViewVisible(!isCommentViewVisible);

    // 게시물 신고 처리 
    const handleReport = async (targetId, targetUserId, reason) => {
        try {
            await submitReport(user.uid, targetUserId, targetId, 'post', reason);
            alert('신고가 접수되었습니다.');
        } catch (error) {
            if (error.message.includes('이미 신고한')) {
                alert('이미 신고한 게시물입니다.');
            } else {
                alert('신고 접수에 실패했습니다.');
            }
        }
    };

    // 댓글 신고 처리 
    const handleReportComment = async (targetId, targetUserId, reason) => {
        try {
            await submitReport(user.uid, targetUserId, targetId, 'comment', reason);
            alert('댓글 신고가 접수되었습니다.');
        } catch (error) {
            if (error.message.includes('이미 신고한')) {
                alert('이미 신고한 댓글입니다.');
            } else {
                alert('댓글 신고 접수에 실패했습니다.');
            }
        }
    };

    // 신고 모달 열기(UI Logic)
    const openReportModal = (targetId, targetUserId, targetType = 'post') => {
        setReportTarget({ targetId, targetUserId, targetType });
        setIsReportModalOpen(true);
    };


    // 로딩 및 에러 처리
    if (loading) return <div className="p-6">불러오는 중...</div>;
    if (!data) return <div className="p-6 text-red-500">게시물을 찾을 수 없습니다.</div>;

    const { outfit, memo, imageUrls, feeling } = data;
    const categoryOrder = ["OUTER", "TOP", "BOTTOM", "SHOES", "ACC"]; // UI 상수

    // Base64 이미지 처리 함수(Utility)
    const getImageSrc = (imageUrl) => {
        if (!imageUrl) return null;
        if (imageUrl.startsWith('data:image/')) {
            return imageUrl;
        }
        return imageUrl;
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
                                {/* 계절 정보 */}
                                <div className="flex items-center w-60">
                                    <span className="w-28 text-base font-semibold text-left">계절</span>
                                    <div className="ml-auto w-32 h-9 px-2 py-1 border rounded text-sm text-center flex items-center justify-center bg-white">
                                        <span className="text-gray-800">
                                            {data?.weather?.season ?? data?.season ?? '-'}
                                        </span>
                                    </div>
                                </div>

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

                                <div className="flex items-center w-60">
                                    <span className="w-28 text-base font-semibold text-left">스타일</span>
                                    <div className="ml-auto w-32 h-9 px-2 py-1 border rounded text-sm text-center flex items-center justify-center bg-white">
                                        <span className="text-gray-800">{getStyleLabel(data.style)}</span>
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
                            onClose={handleCommentViewToggle} // Custom Hook 대신 UI 핸들러 사용
                            onRefresh={handleRefreshComments}
                            isRefreshing={isRefreshing}
                            replyToCommentId={replyToCommentId}
                            replyContent={replyContent}
                            setReplyContent={setReplyContent}
                            onReplySubmit={handleReplySubmit}
                            onCancelReply={handleCancelReply}
                            onReportComment={(commentId, authorUid) => openReportModal(commentId, authorUid, 'comment')}
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

                        {/* 좋아요/싫어요/신고 */}
                        <div className="flex items-center gap-2 ml-auto">
                            <button onClick={handleThumbsUp} className="flex items-center gap-1 px-2 py-1 rounded transition hover:scale-110">
                                <HandThumbUpIcon className={`w-5 h-5 ${isThumbsUp ? 'text-blue-500' : 'text-gray-500'}`} />
                                <span className={`text-sm font-semibold ${isThumbsUp ? 'text-blue-500' : 'text-gray-500'}`}>
                                    {isNaN(thumbsUpCount) ? 0 : thumbsUpCount}
                                </span>
                            </button>

                            <button onClick={handleThumbsDown} className="flex items-center gap-1 px-2 py-1 rounded transition hover:scale-110">
                                <HandThumbDownIcon className={`w-5 h-5 ${isThumbsDown ? 'text-red-500' : 'text-gray-500'}`} />
                                <span className={`text-sm font-semibold ${isThumbsDown ? 'text-red-500' : 'text-gray-500'}`}>
                                    {isNaN(thumbsDownCount) ? 0 : thumbsDownCount}
                                </span>
                            </button>

                            {/* 신고 버튼 */}
                            {user && user.uid !== data.uid && (
                                <button
                                    onClick={() => openReportModal(id, data.uid)}
                                    className="flex items-center gap-1 px-2 py-1 rounded transition hover:scale-110 text-red-500 hover:text-red-600 font-semibold"
                                    title="신고하기"
                                >
                                    신고
                                </button>
                            )}
                        </div>
                    </div>

                    {/* 이미지 + 착장 목록 */}
                    <div className="flex flex-col md:flex-row">
                        {/* 이미지 */}
                        <div className="w-full md:w-1/2 flex flex-col items-center justify-center pl-16">
                            {imageUrls?.length > 0 && (
                                <div className="w-72 aspect-[3/4] relative rounded overflow-hidden border bg-gray-100 mb-4">
                                    <img src={getImageSrc(imageUrls[imagePreviewIdx])} alt="outfit" className="w-full h-full object-cover" />
                                    {imageUrls.length > 1 && (
                                        <div className="absolute bottom-2 left-0 right-0 flex justify-between px-2">
                                            <button
                                                onClick={() => setImagePreviewIdx((imagePreviewIdx - 1 + imageUrls.length) % imageUrls.length)}
                                                style={navBtnStyle("left")}
                                            >
                                                ◀
                                            </button>
                                            <div style={indicatorStyle}>
                                                {imageUrls.map((_, i) => (
                                                    <div key={i} style={dotStyle(i === imagePreviewIdx)} />
                                                ))}
                                            </div>
                                            <button
                                                onClick={() => setImagePreviewIdx((imagePreviewIdx + 1) % imageUrls.length)}
                                                style={navBtnStyle("right")}
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

            {/* 신고 모달 */}
            <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                onReport={reportTarget?.targetType === 'comment' ? handleReportComment : handleReport}
                targetType={reportTarget?.targetType || 'post'}
                targetId={reportTarget?.targetId}
                targetUserId={reportTarget?.targetUserId}
            />
        </div>
    );
}
export default FeedDetail;
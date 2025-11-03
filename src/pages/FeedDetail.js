import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { HomeIcon, ArrowLeftIcon, HandThumbUpIcon, HandThumbDownIcon } from "@heroicons/react/24/outline";
import { useFeedDetailData } from "../hooks/useFeedDetailData"; 
import { useFeedReactions } from "../hooks/useFeedReactions"; 
import { useFeedSubscription } from "../hooks/useFeedSubscription"; 
import { useComments } from "../hooks/useComments"; 
import { useAuth } from "../contexts/AuthContext";
import { useReportHandler } from "../hooks/useReportHandler"; 
import CommentSection from "../components/CommentSection"; 
import { getWeatherEmoji, feelingToEmoji } from "../utils/weatherUtils"; 
import ReportModal from "../components/ReportModal"; 
import { submitReport } from "../api/reportAPI"; 
import { getStyleLabel } from "../utils/styleUtils"; 
import { navBtnStyle, indicatorStyle, dotStyle } from "../components/ImageCarouselStyles"; 
import { doc, getDoc } from "firebase/firestore"; 
import { db } from "../firebase"; 

/**
 * FeedDetail 컴포넌트 - 단일 착장 기록의 상세 내용, 상호작용(반응, 구독, 댓글, 신고) 표시
 */
function FeedDetail() {
    const { id } = useParams(); 
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    
    // UI 상태
    const [imagePreviewIdx, setImagePreviewIdx] = useState(0); 
    const [isCommentViewVisible, setIsCommentViewVisible] = useState(false); 

    // 1. 신고 모달 로직 훅 사용
    const {
        isReportModalOpen,
        reportTarget,
        openReportModal,
        closeReportModal, 
        handleReport,
        handleReportComment,
    } = useReportHandler(user, submitReport); // submitReportAPI를 인수로 전달

    // 현재 로그인 사용자 프로필 로직(댓글 author 닉네임 사용을 위해)
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

    // 1. 피드 상세 데이터 및 작성자 정보 로드 훅 사용
    const { data, author, loading, formattedDate } = useFeedDetailData(id, user); 

    // 2. 좋아요/싫어요 로직 훅 사용
    const { 
        isThumbsUp, thumbsUpCount, isThumbsDown, thumbsDownCount, 
        handleThumbsUp, handleThumbsDown 
    } = useFeedReactions(id, user);

    // 3. 구독 로직 훅 사용
    const { isSubscribed, handleSubscribe } = useFeedSubscription(data?.uid, user);

    // 4. 댓글 로직 훅 사용
    const {
        comments, newComment, setNewComment, isRefreshing, 
        replyToCommentId, setReplyContent, replyContent, 
        handleCommentSubmit, handleCommentDelete, handleReply, 
        handleReplySubmit, handleCancelReply, handleRefreshComments
    } = useComments(id, user, data, currentUserProfile);


    // 뒤로가기 로직
    const handleGoBack = () => {
        if (location.state?.fromCalendar && location.state?.targetUserId) {
            // 캘린더에서 온 경우 해당 사용자의 캘린더로 돌아가기
            navigate(`/calendar/${location.state.targetUserId}`);
        } else if (location.state?.fromRecommend) {
            // 추천 피드에서 온 경우 필터 상태를 유지하며 추천 피드로 복귀
            navigate("/recommend", {
                state: {
                    fromDetail: true,
                    currentFilters: location.state?.currentFilters
                }
            });
        } else if (location.state?.fromFeed) {
            // 지역 피드에서 온 경우 날짜/지역 상태를 유지하며 피드로 복귀
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
            // 기본적으로 브라우저 히스토리로 돌아가기
            if (window.history.length > 1) {
                navigate(-1);
            } else {
                navigate("/feed"); // 히스토리가 없으면 피드 목록으로 이동
            }
        }
    };

    // 댓글 뷰 토글
    const handleCommentViewToggle = () => setIsCommentViewVisible(!isCommentViewVisible);

    // 로딩 및 에러 처리
    if (loading) return <div className="p-6">불러오는 중...</div>;
    if (!data) return <div className="p-6 text-red-500">게시물을 찾을 수 없습니다.</div>;

    const { outfit, memo, imageUrls, feeling } = data;
    const categoryOrder = ["OUTER", "TOP", "BOTTOM", "SHOES", "ACC"]; // 착장 카테고리 순서 (UI 상수)

    // Base64 이미지 처리 함수(Base64 데이터 또는 URL 반환)
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
                    onClick={handleGoBack} // 뒤로가기 핸들러
                    className="bg-blue-200 px-3 py-1 rounded-md hover:bg-blue-300"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <h2 className="font-bold text-lg">{formattedDate}</h2> {/* 포맷팅된 날짜 표시 */}
                <button
                    onClick={() => navigate("/")}
                    className="bg-blue-200 px-3 py-1 rounded-md hover:bg-blue-300"
                >
                    <HomeIcon className="w-5 h-5" />
                </button>
            </div>

            {/* 콘텐츠 */}
            <div className="flex-1 px-4 mt-10 flex flex-col md:items-start md:justify-center md:flex-row gap-6 overflow-y-auto">
                {/* 왼쪽 : 날씨/상세 정보 또는 댓글 섹션 */}
                <div className="w-full md:w-1/3 bg-gray-200 h-[705px] overflow-hidden rounded-lg">
                    {!isCommentViewVisible ? (
                        // 날씨/상세 정보 뷰
                        <div className="px-6 py-6 text-center h-full">
                            <div className="mb-4 flex justify-start">
                                {/* 댓글 보기 토글 버튼 */}
                                <button
                                    onClick={handleCommentViewToggle}
                                    className="px-3 py-1 bg-white rounded text-sm font-medium hover:bg-gray-100 transition-colors"
                                >
                                    + 댓글 보기
                                </button>
                            </div>

                            {/* 날씨 아이콘 */}
                            <div className="mb-6 flex justify-center">
                                <div className="w-60 h-60 bg-gray-200 rounded flex items-center justify-center text-6xl relative overflow-hidden">
                                    <div className="absolute text-8xl animate-bounce">
                                        {data?.weather?.icon ? getWeatherEmoji(data.weather.icon) : "☁️"}
                                    </div>
                                </div>
                            </div>

                            {/* 상세 정보 목록 */}
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

                                {/* 온도 */}
                                <div className="flex items-center w-60">
                                    <span className="w-28 text-base font-semibold text-left">온도</span>
                                    <div className="ml-auto w-32 h-9 px-2 py-1 border rounded text-sm text-center flex items-center justify-center bg-white">
                                        <span className="text-gray-800">{data?.weather?.temp ?? data?.temp ?? '-'}°C</span>
                                    </div>
                                </div>
                                
                                {/* 강수량 */}
                                <div className="flex items-center w-60">
                                    <span className="w-28 text-base font-semibold text-left">강수량</span>
                                    <div className="ml-auto w-32 h-9 px-2 py-1 border rounded text-sm text-center flex items-center justify-center bg-white">
                                        <span className="text-gray-800">{data?.weather?.rain ?? data?.rain ?? '-'}mm</span>
                                    </div>
                                </div>

                                {/* 습도 */}
                                <div className="flex items-center w-60">
                                    <span className="w-28 text-base font-semibold text-left">습도</span>
                                    <div className="ml-auto w-32 h-9 px-2 py-1 border rounded text-sm text-center flex items-center justify-center bg-white">
                                        <span className="text-gray-800">{data?.weather?.humidity ?? data?.humidity ?? '-'}%</span>
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
                        // 댓글 섹션 뷰
                        <CommentSection
                            comments={comments} // 댓글 목록
                            newComment={newComment}
                            setNewComment={setNewComment}
                            onCommentSubmit={handleCommentSubmit}
                            onCommentDelete={handleCommentDelete}
                            onReply={handleReply}
                            onClose={handleCommentViewToggle} // 댓글 뷰 닫기
                            onRefresh={handleRefreshComments}
                            isRefreshing={isRefreshing}
                            replyToCommentId={replyToCommentId}
                            replyContent={replyContent}
                            setReplyContent={setReplyContent}
                            onReplySubmit={handleReplySubmit}
                            onCancelReply={handleCancelReply}
                            // 훅의 openReportModal을 사용하여 댓글 신고 처리
                            onReportComment={(commentId, authorUid) => openReportModal(commentId, authorUid, 'comment')} 
                            user={user}
                            author={author} // 게시물 작성자 정보
                        />
                    )}
                </div>

                {/* 오른쪽 : 이미지 & 착장 목록 & 피드백 */}
                <div className="w-full md:w-2/3 bg-white px-6 py-6 h-[705px] overflow-y-auto rounded-lg">
                    {/* 닉네임 + 반응 버튼 상단 바 */}
                    <div className="relative bg-gray-200 h-12 flex items-center px-4 mb-6">
                        {/* 구독 하트 */}
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSubscribe(); }}
                            onMouseDown={(e) => e.stopPropagation()}
                            style={{
                                color: isSubscribed ? "#dc2626" : "#9ca3af" // 구독 상태에 따른 하트 색상
                            }}
                            className="text-2xl transition hover:scale-125"
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
                            {/* 좋아요 버튼 */}
                            <button onClick={handleThumbsUp} className="flex items-center gap-1 px-2 py-1 rounded transition hover:scale-110">
                                <HandThumbUpIcon className={`w-5 h-5 ${isThumbsUp ? 'text-blue-500' : 'text-gray-500'}`} />
                                <span className={`text-sm font-semibold ${isThumbsUp ? 'text-blue-500' : 'text-gray-500'}`}>
                                    {isNaN(thumbsUpCount) ? 0 : thumbsUpCount}
                                </span>
                            </button>

                            {/* 싫어요 버튼 */}
                            <button onClick={handleThumbsDown} className="flex items-center gap-1 px-2 py-1 rounded transition hover:scale-110">
                                <HandThumbDownIcon className={`w-5 h-5 ${isThumbsDown ? 'text-red-500' : 'text-gray-500'}`} />
                                <span className={`text-sm font-semibold ${isThumbsDown ? 'text-red-500' : 'text-gray-500'}`}>
                                    {isNaN(thumbsDownCount) ? 0 : thumbsDownCount}
                                </span>
                            </button>

                            {/* 게시물 신고 버튼(본인 기록 아닐 때만) */}
                            {user && user.uid !== data.uid && (
                                <button
                                    // 훅의 openReportModal을 사용하여 게시물 신고 처리
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
                        {/* 이미지 캐러셀 */}
                        <div className="w-full md:w-1/2 flex flex-col items-center justify-center pl-16">
                            {imageUrls?.length > 0 && (
                                <div className="w-72 aspect-[3/4] relative rounded overflow-hidden border bg-gray-100 mb-4">
                                    <img src={getImageSrc(imageUrls[imagePreviewIdx])} alt="outfit" className="w-full h-full object-cover" />
                                    {/* 네비게이션 버튼 및 인디케이터 */}
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

                        {/* 착장 목록(OUTER, TOP, BOTTOM, SHOES, ACC 순서) */}
                        <div className="w-auto ml-12 space-y-4 max-h-96 overflow-y-auto">
                            {categoryOrder.map((category) => (
                                <div key={category}>
                                    <h4 className="font-semibold mb-1 uppercase">{category}</h4>
                                    <ul className="text-sm list-disc list-inside text-gray-700">
                                        {/* outfit 객체의 소문자 키로 접근 */}
                                        {(data.outfit?.[category.toLowerCase()] || []).map((item, idx) => (
                                            <li key={idx}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 피드백/메모 */}
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
                onClose={closeReportModal} // 훅에서 반환된 closeReportModal 사용
                // 훅에서 반환된 핸들러 사용
                onReport={reportTarget?.targetType === 'comment' ? handleReportComment : handleReport}
                targetType={reportTarget?.targetType || 'post'}
                targetId={reportTarget?.targetId}
                targetUserId={reportTarget?.targetUserId}
            />
        </div>
    );
}
export default FeedDetail;
// src/pages/FeedDetail.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { HomeIcon, ArrowLeftIcon } from "@heroicons/react/24/solid";
import WeatherCard from "../components/WeatherCard";
import { toggleLike } from "../api/toggleLike";
import { useAuth } from "../contexts/AuthContext";

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
    const categoryOrder = ["OUTER", "TOP", "BOTTOM", "SHOES", "ACC"];

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
                    setAuthor(userSnap.data());
                } else {
                    setAuthor({ nickname: record.uid });
                }
            }
            setLoading(false);
        };
        fetchData();
    }, [id, user]);

    if (loading) return <div className="p-6">불러오는 중...</div>;
    if (!data) return <div className="p-6 text-red-500">게시물을 찾을 수 없습니다.</div>;

    const { date, regionName, weather, outfit, memo, imageUrls, weatherEmojis, feeling } = data;

    // 하트 버튼 클릭 핸들러
    const handleLike = async () => {
        if (!user) return;
        const newLikes = await toggleLike(id, user.uid);
        setLiked(newLikes.includes(user.uid));
        setLikeCount(newLikes.length);
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            {/* 상단 네비게이션 */}
            <div className="flex justify-between items-center px-4 py-3 bg-blue-100 shadow">
                <button
                    onClick={handleGoBack}
                    className="bg-blue-300 px-3 py-1 rounded-md hover:bg-blue-400"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <h2 className="font-bold text-lg">{formattedDate}</h2>
                <button
                    onClick={() => navigate("/")}
                    className="bg-blue-300 px-3 py-1 rounded-md hover:bg-blue-400"
                >
                    <HomeIcon className="w-5 h-5" />
                </button>
            </div>

            {/* 콘텐츠 */}
            <div className="flex-1 px-4 mt-10 flex flex-col md:items-start md:justify-center md:flex-row gap-6 overflow-y-auto">
                {/* 왼쪽 : 날씨 카드 */}
                <div className="w-full md:w-1/3 bg-gray-200 px-6 py-6 text-center h-[705px] overflow-hidden rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">{regionName}</h3>
                    
                    {/* 댓글 보기 버튼 */}
                    <div className="mb-4">
                        <button className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors">
                            + 댓글 보기
                        </button>
                    </div>
                    {weather ? (
                        <>
                            <WeatherCard
                                region={regionName}
                                temp={weather.temp}
                                rain={weather.rain}
                                humidity={weather.humidity}
                                desc=""
                                icon={weather.icon}
                                bgColor="bg-gray-200"
                                labelRight={true}
                            />
                            <div className="flex flex-col gap-6 items-center">
                                {/* 체감 */}
                                <div className="flex items-center gap-2">
                                    <span className="text-base font-medium w-12">체감</span>
                                    <div className="bg-white px-4 py-2 rounded w-[120px] text-center">
                                        <span className="text-base font-semibold">{feelingToEmoji(feeling)}</span>
                                    </div>
                                </div>
                                {/* 날씨 */}
                                <div className="flex items-center gap-2">
                                    <span className="text-base font-medium w-12">날씨</span>
                                    <div className="bg-white px-4 py-2 rounded w-[120px] text-center">
                                        {weatherEmojis?.length > 0 && (
                                            <div className="flex justify-center gap-2">
                                                {weatherEmojis.map((emoji, i) => (
                                                    <span key={i} className="text-2xl">{emoji}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                        </>
                    ) : (
                        <p className="text-red-500">날씨 정보를 불러오는 중...</p>
                    )}
                </div>

                {/* 오른쪽: 이미지 & 착장 */}
                <div className="w-full md:w-2/3 bg-white px-6 py-6 h-[705px] overflow-y-auto rounded-lg">

                    {/* 닉네임 + 하트 상단 바 */}
                    <div className="relative bg-gray-200 h-12 flex items-center px-4 mb-6">
                        <button 
                            onClick={() => navigate(`/calendar/${data.uid}`)}
                            className="absolute left-1/2 transform -translate-x-1/2 text-normal font-semibold hover:text-blue-600 hover:underline transition-colors"
                        >
                            {author ? `${author.nickname || author.uid}님의 기록` : ""}
                        </button>
                        <button
                            onClick={handleLike}
                            className="ml-auto px-2 py-1 rounded text-xl transition hover:scale-110"
                        >
                            <span style={{ color: liked ? "red" : "#aaa", fontSize: 28 }}>
                                {liked ? "♥" : "♡"}
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

export default FeedDetail;

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
    const today = new Date();
    const formattedDate = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;


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
            <div className="flex justify-between items-center px-4 py-3 bg-blue-100">
                <button
                    onClick={() => navigate("/feed", { state: { fromCard: true } })}
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
                <div className="w-full md:w-1/3 bg-gray-200 px-6 py-6 text-center min-h-[705px]">
                    <h3 className="text-lg font-semibold mb-5">{regionName}</h3>
                    {weather ? (
                        <>
                            <WeatherCard
                                region={regionName}
                                temp={weather.temp}
                                rain={weather.rain}
                                icon={weather.icon}
                            />
                            <div className="flex justify-center">
                                <div className=" space-y-4 w-[220px] ">
                                    <div className="bg-blue-100 w-full h-10 px-4 py-2 rounded">
                                        <span className="font-semibold">온도 : {weather.temp}°C</span>
                                    </div>
                                    <div className="bg-blue-100 w-full h-10 px-4 py-2 rounded">
                                        <span className="font-semibold">강수량 : {weather.rain}mm</span>
                                    </div>
                                    <div className="bg-blue-100 w-full h-10 px-4 py-2 rounded">
                                        <span className="font-semibold">체감 : {feelingToEmoji(feeling)}</span>
                                    </div>
                                    <div className="bg-blue-100 w-full h-10 px-4 py-2 rounded">
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
                            <div className="text-center pt-16">
                                <h1 className="text-5xl font-lilita text-indigo-500">Fitweather</h1>
                            </div>
                        </>
                    ) : (
                        <p className="text-red-500">날씨 정보를 불러오는 중...</p>
                    )}
                </div>

                {/* 오른쪽: 이미지 & 착장 */}
                <div className="w-full md:w-2/3 bg-white px-6 py-6 min-h-[705px]">

                    {/* 닉네임 + 하트 상단 바 */}
                    <div className="relative bg-gray-200 h-12 flex items-center px-4 mb-6">
                        <span className="absolute left-1/2 transform -translate-x-1/2 text-normal font-semibold">
                            {author ? `${author.nickname || author.uid}님의 기록` : ""}
                        </span>
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

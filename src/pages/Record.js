// src/pages/Record.js
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db, storage } from "../firebase";
import useUserProfile from "../hooks/useUserProfile";
import useWeather from "../hooks/useWeather";
import WeatherCard from "../components/WeatherCard";
import { Bars3Icon, HomeIcon } from "@heroicons/react/24/solid";
import { toast } from "react-toastify";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

function Record() {
  const navigate = useNavigate();
  const today = new Date();
  const formattedDate = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

  const { profile, loading: profileLoading } = useUserProfile();
  const uid = auth.currentUser?.uid;
  const region = profile?.region || "서울";
  const { weather, loading: weatherLoading } = useWeather(region);

  const [image, setImage] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [outfit, setOutfit] = useState({ outer: [], top: [], bottom: [], shoes: [], acc: [] });
  const [feeling, setFeeling] = useState("");
  const [memo, setMemo] = useState("");
  const [regionName, setRegionName] = useState(region);
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [weatherEmojis, setWeatherEmojis] = useState([]);
  const emojiList = [
    "☀️", // 태양
    "🌩️", // 번개
    "❄️", // 눈결정
    "🌧️", // 비
    "💨", // 바람
    "☁️"  // 구름
  ];
  const toggleEmoji = (emoji) => {
    setWeatherEmojis((prev) =>
      prev.includes(emoji)
        ? prev.filter((e) => e !== emoji)
        : prev.length < 2
          ? [...prev, emoji]
          : prev // 최대 2개까지 선택
    );
  };
  const [imagePreviewIdx, setImagePreviewIdx] = useState(0);

  const inputRefs = { outer: useRef(), top: useRef(), bottom: useRef(), shoes: useRef(), acc: useRef() };

  useEffect(() => {
    const regionMap = {
      seoul: "서울", busan: "부산", daegu: "대구", incheon: "인천", gwangju: "광주", daejeon: "대전", ulsan: "울산", suwon: "수원"
    };
    setRegionName(regionMap[region.toLowerCase()] || region);
  }, [region]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).filter(f => f && f.name);
    if (!files.length) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    const maxSizeMB = 3;
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        alert("jpg, png, gif 형식의 이미지 파일만 업로드 가능합니다.");
        return;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        alert(`이미지 용량은 ${maxSizeMB}MB 이하로 업로드해주세요.`);
        return;
      }
    }
    setImage(URL.createObjectURL(files[0]));
    setImageFiles(files);
    setImagePreviewIdx(0);
  };

  const handleAddItem = (category, value) => {
    if (!value.trim()) return;
    setOutfit((prev) => ({ ...prev, [category]: [...prev[category], value] }));
  };

  const handleRemoveItem = (category, idx) => {
    setOutfit((prev) => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== idx)
    }));
  };

  const handleSubmit = async () => {
    if (!uid) { toast.error("로그인이 필요합니다."); return; }
    if (!imageFiles.length || imageFiles.some(f => !f || !f.name)) {
      toast.error("사진을 업로드해주세요."); return; }
    if (!feeling) { toast.error("체감을 선택해주세요."); return; }
    if (typeof weather?.temp === "undefined" || typeof weather?.rain === "undefined") {
      toast.error("날씨 정보가 아직 준비되지 않았습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    if (!storage) {
      toast.error("스토리지 인스턴스가 올바르지 않습니다. 새로고침 후 다시 시도해 주세요.");
      return;
    }
    setLoading(true);
    try {
      // 중복 기록 체크 (오늘 날짜 기준, uid)
      const dateStr = today.toISOString().slice(0, 10);
      const q = query(
        collection(db, "records"),
        where("uid", "==", uid),
        where("date", "==", dateStr)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        toast.error("이미 기록하셨습니다.");
        setLoading(false);
        return;
      }
      // 이미지 업로드 (여러 장)
      const imageUrls = await Promise.all(
        imageFiles.map(async (file) => {
          if (!file || !file.name) throw new Error("잘못된 파일입니다.");
          const imageRef = ref(storage, `records/${uid}/${Date.now()}_${file.name}`);
          await uploadBytes(imageRef, file);
          return await getDownloadURL(imageRef);
        })
      );
      // Firestore 저장 (temp/rain/weather 모두 저장)
      const recordData = {
        uid,
        region,
        regionName,
        date: dateStr,
        temp: weather.temp ?? null,
        rain: weather.rain ?? null,
        weather: {
          temp: weather.temp ?? null,
          rain: weather.rain ?? null,
          icon: weather.icon ?? null,
        },
        outfit,
        feeling,
        memo,
        isPublic,
        imageUrls,
        weatherEmojis,
        createdAt: new Date(),
      };
      await addDoc(collection(db, "records"), recordData);
      toast.success("오늘 기록이 저장되었어요!", { position: "top-center", autoClose: 1200 });
      setTimeout(() => navigate("/calendar"), 1300);
    } catch (err) {
      console.error("저장 오류:", err);
      toast.error("저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) {
    return <div className="p-4 max-w-md mx-auto">사용자 정보를 불러오는 중...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* 상단 네비게이션 */}
      <div className="flex justify-between items-center px-4 py-3 bg-blue-100 shadow">
        <button className="bg-blue-300 px-3 py-1 rounded-md hover:bg-blue-400">
          <Bars3Icon className="w-5 h-5" />
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
      <div className="flex-1 px-4 mt-10 flex flex-col md:flex-row md:items-start md:justify-center gap-6 overflow-y-auto">
        {/* 왼쪽: 날씨 카드 */}
        <div className="w-full md:w-1/3 bg-gray-200 px-6 py-6 text-center">
          <h3 className="text-lg font-semibold mb-3">{regionName}</h3>
          {weatherLoading ? (
            <p className="text-sm text-gray-500">날씨 정보를 불러오는 중...</p>
          ) : weather ? (
            <>
              <WeatherCard
                region={regionName}
                temp={weather.temp}
                rain={weather.rain}
                desc=""
                icon={weather.icon}
              />
              <div className="flex flex-col items-center space-y-6 mt-4">
                <div className="bg-blue-100 px-4 py-2 rounded text-center">
                  <span className="text-lg font-semibold">온도 : {weather.temp}°C</span>
                </div>
                <div className="bg-blue-100 px-4 py-2 rounded text-center">
                  <span className="text-lg font-semibold">강수량 : {weather.rain}mm</span>
                </div>
              </div>
              <div className="mt-6">
                {/* 체감 선택 드롭다운 */}
                <select
                  value={feeling}
                  onChange={(e) => setFeeling(e.target.value)}
                  className="w-36 px-4 py-2 border rounded bg-blue-100"
                >
                  <option value="">체감 선택</option>
                  <option value="steam">🥟 찐만두</option>
                  <option value="hot">🥵 더움</option>
                  <option value="nice">👍🏻 적당</option>
                  <option value="cold">💨 추움</option>
                  <option value="ice">🥶 동태</option>
                </select>
                {/* 날씨 이모지 선택 UI */}
                <div className="mt-4">
                  <label className="block font-semibold mb-2">날씨 이모지 (최대 2개)</label>
                  <div className="flex justify-center">
                    <div className="grid grid-cols-3 gap-2 w-48">
                      {emojiList.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          className={`text-2xl px-2 py-1 rounded ${weatherEmojis.includes(emoji) ? "bg-blue-200" : "bg-gray-100"}`}
                          onClick={() => toggleEmoji(emoji)}
                          disabled={weatherEmojis.length >= 2 && !weatherEmojis.includes(emoji)}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {/* 지역 피드 업로드 체크박스 */}
                <div className="mt-4 flex items-center justify-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="isPublic" className="text-sm text-gray-700">
                    지역 피드에 업로드
                  </label>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-red-500">날씨 정보를 가져올 수 없습니다.</p>
          )}
        </div>
        {/* 오른쪽 입력 폼 */}
        <div className="w-full md:w-2/3 bg-white px-6 py-6 items-center">
          {/* 입력폼 상단 바 */}
          <div className="flex justify-end bg-gray-200 items-center mb-4">
            <button
              onClick={handleSubmit}
              className="px-4 py-2 rounded text-gray-600 font-normal hover:font-bold transition"
              disabled={loading}
            >
              {loading ? "저장 중..." : "저장"}
            </button>
          </div>
          {/* 이미지 업로드 및 미리보기 */}
          <div className="flex flex-col md:flex-row gap-4 w-full">
            {/* 이미지 미리보기 영역 */}
            <div className="w-full md:w-1/2 flex flex-col items-center justify-center">
              {imageFiles.length === 0 ? (
                <label
                  htmlFor="imageUpload"
                  className="w-72 aspect-[3/4] border-2 border-gray-300 bg-gray-100 rounded-md flex justify-center items-center text-gray-600 cursor-pointer hover:bg-gray-200"
                >
                  사진 추가
                  <input
                    id="imageUpload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="w-72 aspect-[3/4] border rounded mt-2 p-2 bg-gray-100 flex flex-col items-center justify-center relative">
                  <img
                    src={URL.createObjectURL(imageFiles[imagePreviewIdx])}
                    alt="preview"
                    className="w-full h-full object-cover rounded"
                  />
                  {imageFiles.length > 1 && (
                    <div className="absolute bottom-2 left-0 right-0 flex justify-between px-2">
                      <button
                        type="button"
                        className="bg-white bg-opacity-70 rounded-full px-2 py-1 text-lg"
                        onClick={() => setImagePreviewIdx((prev) => (prev - 1 + imageFiles.length) % imageFiles.length)}
                        disabled={imageFiles.length <= 1}
                      >
                        ◀
                      </button>
                      <span className="text-xs text-gray-700 mx-2">{imagePreviewIdx + 1} / {imageFiles.length}</span>
                      <button
                        type="button"
                        className="bg-white bg-opacity-70 rounded-full px-2 py-1 text-lg"
                        onClick={() => setImagePreviewIdx((prev) => (prev + 1) % imageFiles.length)}
                        disabled={imageFiles.length <= 1}
                      >
                        ▶
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* 착장 입력 필드 (outer, top, bottom 등) */}
            <div className="w-full md:w-1/2 space-y-4 max-h-96 overflow-y-auto">
              {Object.keys(inputRefs).map((category) => {
                const inputRef = inputRefs[category];
                return (
                  <div key={category}>
                    <div className="flex gap-2 items-center">
                      <input
                        ref={inputRef}
                        placeholder={category.toUpperCase()}
                        className="flex-1 px-4 py-2 border rounded bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const value = inputRef.current.value;
                          handleAddItem(category, value);
                          inputRef.current.value = "";
                        }}
                        className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
                      >
                        +
                      </button>
                    </div>
                    {outfit[category].length > 0 && (
                      <ul className="ml-2 mt-1 text-sm text-gray-600">
                        {outfit[category].map((item, idx) => (
                          <li key={idx} className="flex items-center gap-1">
                            • {item}
                            <button
                              type="button"
                              className="ml-1 px-2 py-1 rounded bg-gray-200 hover:bg-red-200 text-xs text-red-500 hover:text-red-700 transition"
                              onClick={() => handleRemoveItem(category, idx)}
                            >
                              -
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {/* 피드백 입력 영역 */}
          <div className="w-full bg-gray-200 px-6 py-4 mt-6">
            <label className="block font-semibold mb-2">Feedback</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="오늘의 착장은 어땠나요?"
              className="w-full h-24 px-4 py-2 border rounded bg-white resize-none overflow-y-auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Record;
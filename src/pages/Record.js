// src/pages/Record.js
import { useState, useEffect, useRef } from "react";
import { db, storage } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Bars3Icon, HomeIcon } from "@heroicons/react/24/solid";
import useWeather from "../hooks/useWeather";
import WeatherCard from "../components/WeatherCard";
import useUserProfile from "../hooks/useUserProfile";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Record() {
  const navigate = useNavigate();
  const today = new Date();
  const formattedDate = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

  const { profile } = useUserProfile();
  const { user } = useAuth();
  const region = profile?.region || "서울";
  const { weather, loading: weatherLoading } = useWeather(region);

  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [outfit, setOutfit] = useState({ outer: [], top: [], bottom: [], shoes: [], acc: [], });
  const [feeling, setFeeling] = useState("");
  const [memo, setMemo] = useState("");
  const [regionName, setRegionName] = useState(region);
  const [isPublic, setIsPublic] = useState(false);

  const inputRefs = { outer: useRef(), top: useRef(), bottom: useRef(), shoes: useRef(), acc: useRef(), };

  useEffect(() => {
    const regionMap = {
      seoul: "서울",
      busan: "부산",
      daegu: "대구",
      incheon: "인천",
      gwangju: "광주",
      daejeon: "대전",
      ulsan: "울산",
      suwon: "수원",
    };
    setRegionName(regionMap[region.toLowerCase()] || region);
  }, [region]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    const maxSizeMB = 3;

    if (!allowedTypes.includes(file.type)) {
      alert("jpg, png, gif 형식의 이미지 파일만 업로드 가능합니다.");
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`이미지 용량은 ${maxSizeMB}MB 이하로 업로드해주세요.`);
      return;
    }

    setImage(URL.createObjectURL(file));
    setImageFile(file);
  };

  const handleAddItem = (category, value) => {
    if (!value.trim()) return;
    setOutfit((prev) => ({
      ...prev,
      [category]: [...prev[category], value],
    }));
  };

  const handleSubmit = async () => {
    try {
      if (!user) {
        alert("로그인이 필요합니다.");
        return;
      }
      if (!imageFile) {
        alert("사진을 업로드해주세요.");
        return;
      }
      if (!feeling) {
        alert("체감을 선택해주세요.");
        return;
      }

      // 🔥 1. 이미지 업로드 → Storage
      const imageRef = ref(storage, `records/${user.uid}/${Date.now()}_${imageFile.name}`);
      await uploadBytes(imageRef, imageFile);
      const imageUrl = await getDownloadURL(imageRef);

      // 🔥 2. Firestore 저장
      const recordData = {
        uid: user.uid,
        region,
        regionName,
        weather: {
          temp: weather?.temp || null,
          rain: weather?.rain || null,
          icon: weather?.icon || null,
        },
        outfit, feeling, memo, isPublic, imageUrl,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "records"), recordData);

      // ✅ 성공 메시지
      toast.success("오늘 기록이 저장되었어요!", {
        position: "top-center",
        autoClose: 2000,
      });

      setTimeout(() => navigate("/calendar"), 2200); // Toast가 보이고 나서 이동
    } catch (error) {
      console.error("🔥 저장 오류:", error);
      alert("저장 실패. 다시 시도해주세요.");
    }
  };

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
            >
              저장
            </button>
          </div>
          {/* 이미지 업로드 및 미리보기 */}
          <div className="flex flex-col md:flex-row gap-4 w-full">
            <div className="w-full md:w-1/2 flex justify-center items-center">
              {!image ? (
                <label
                  htmlFor="imageUpload"
                  className="w-72 aspect-[3/4] border-2 border-gray-300 bg-gray-100 rounded-md flex justify-center items-center text-gray-600 cursor-pointer hover:bg-gray-200"
                >
                  사진 추가
                  <input
                    id="imageUpload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="w-72 aspect-[3/4] border rounded mt-2 p-2 bg-gray-100 flex justify-center">
                  <img
                    src={image}
                    alt="preview"
                    className="w-full h-full object-cover rounded"
                  />
                </div>
              )}
            </div>

            {/* 착장 입력 필드 (outer, top, bottom 등) */}
            <div className="w-full md:w-1/2 space-y-4">
              {["outer", "top", "bottom", "shoes", "acc"].map((category) => {
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
                          <li key={idx}>• {item}</li>
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
              className="w-full h-24 px-4 py-2 border rounded bg-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Record;

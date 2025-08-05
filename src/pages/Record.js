// src/pages/Record.js
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { auth, db, storage } from "../firebase";
import useUserProfile from "../hooks/useUserProfile";
import useWeather from "../hooks/useWeather";
import WeatherCard from "../components/WeatherCard";
import { Bars3Icon, HomeIcon, ArrowLeftIcon } from "@heroicons/react/24/solid";
import { toast } from "react-toastify";
import { collection, query, where, getDocs, addDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "../contexts/AuthContext";
import { doc } from "firebase/firestore";
import Sidebar from "../components/Sidebar";

function formatDateLocal(date) {
  return date.toLocaleDateString("sv-SE"); // YYYY-MM-DD 형식 (KST 기준)
}


function Record() {
  const today = new Date();
  const navigate = useNavigate();
  const location = useLocation();
  const existingRecord = location.state?.existingRecord || null;
  const passedDateStr = location.state?.date || null;
  // existingRecord가 있으면 그 날짜를 사용, 없으면 passedDateStr 사용
  const dateStr = existingRecord?.date || passedDateStr;
  const dateObj = dateStr ? new Date(dateStr) : new Date();
  const formattedDate = `${dateObj.getFullYear()}년 ${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일`;

  const { profile, loading: profileLoading } = useUserProfile();
  const { user } = useAuth();
  const [regionName, setRegionName] = useState("");

  // 오늘 날짜인지 확인하는 함수
  const isToday = (dateStr) => {
    const today = new Date();
    const targetDate = new Date(dateStr);
    return today.toDateString() === targetDate.toDateString();
  };

  // 지역 정보 설정: 기록이 있으면 기록의 지역, 없으면 사용자 기본 지역 또는 Home에서 전달받은 지역
  const [selectedRegion, setSelectedRegion] = useState(() => {
    if (existingRecord?.region) {
      return existingRecord.region; // 기존 기록이 있으면 기록의 지역
    }
    // 과거 날짜이고 기록이 없으면 사용자 기본 지역 사용
    const isTodayDate = isToday(dateStr);
    if (!isTodayDate) {
      return profile?.region; // 과거 날짜는 사용자 기본 지역
    }
    return location.state?.selectedRegion || profile?.region; // 오늘 날짜는 Home에서 전달받은 지역 또는 사용자 기본 지역
  });

  // 날씨 정보 설정: 기록이 있으면 기록된 날씨, 없으면 기본값 (온도/습도/강수량은 0)
  const [weather, setWeather] = useState(() => {
    if (existingRecord?.weather) {
      return existingRecord.weather; // 기존 기록이 있으면 기록된 날씨 정보 사용
    }
    // 기록이 없으면 기본값 (온도/습도/강수량은 0)
    return {
      temp: 0,
      rain: 0,
      humidity: 0,
      icon: "sunny"
    };
  });
  const [image, setImage] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [outfit, setOutfit] = useState({ outer: [], top: [], bottom: [], shoes: [], acc: [] });
  const [feeling, setFeeling] = useState("");
  const [memo, setMemo] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [weatherEmojis, setWeatherEmojis] = useState([]);
  const emojiList = ["☀️", "🌩️", "❄️", "🌧️", "💨", "☁️"];
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [recordId, setRecordId] = useState(null);


  const inputRefs = { outer: useRef(), top: useRef(), bottom: useRef(), shoes: useRef(), acc: useRef() };

  // 날씨 API 연동 (오늘 날짜일 때만, 선택된 지역 사용)
  const { weather: apiWeather, loading: apiWeatherLoading } = useWeather(
    isToday(dateStr) ? selectedRegion : null
  );

  // 날씨 로딩 상태 설정 (오늘 날짜일 때만 API 로딩 상태 사용)
  const weatherLoading = isToday(dateStr) ? apiWeatherLoading : false;

  // 지역 변경 핸들러
  const handleRegionChange = (newRegion) => {
    setSelectedRegion(newRegion);
    // 지역 변경 시 날씨 정보 초기화 (오늘 날짜인 경우에만)
    if (isToday(dateStr) && !existingRecord) {
      setWeather(prev => ({
        ...prev,
        temp: 0,
        rain: 0,
        humidity: 0,
        icon: "sunny"
      }));
    }
  };

  useEffect(() => {
    if (selectedRegion) {
      const regionMap = {
        Baengnyeongdo: "백령도",
        Incheon: "인천",
        Seoul: "서울",
        Chuncheon: "춘천",
        Gangneung: "강릉",
        Ulleungdo: "울릉도/독도",
        Hongseong: "홍성",
        Suwon: "수원",
        Cheongju: "청주",
        Andong: "안동",
        Jeonju: "전주",
        Daejeon: "대전",
        Daegu: "대구",
        Pohang: "포항",
        Heuksando: "흑산도",
        Mokpo: "목포",
        Jeju: "제주",
        Ulsan: "울산",
        Yeosu: "여수",
        Changwon: "창원",
        Busan: "부산",
        Gwangju: "광주"
      };
      setRegionName(regionMap[selectedRegion] || selectedRegion);
    }
  }, [selectedRegion]);

  // 오늘 날짜이고 API 날씨 데이터가 있으면 업데이트 (기록이 없을 때만)
  useEffect(() => {
    if (isToday(dateStr) && apiWeather && !existingRecord) {
      setWeather(prev => ({
        ...prev,
        temp: apiWeather.temp || 0,
        rain: apiWeather.rain || 0,
        humidity: apiWeather.humidity || 0,
        icon: apiWeather.icon || "sunny"
      }));
    }
  }, [apiWeather, dateStr, existingRecord, selectedRegion]);

  // 날씨 정보 직접 수정 함수들
  const handleWeatherChange = (field, value) => {
    setWeather(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleWeatherIconChange = (icon) => {
    setWeather(prev => ({
      ...prev,
      icon: icon
    }));
  };

  useEffect(() => {
    if (existingRecord) {
      setIsEditMode(true);
      setRecordId(existingRecord.id);

      // 기존 기록의 지역 정보 설정 (이미 위에서 설정했지만 확실히 하기 위해)
      if (existingRecord.region) {
        setSelectedRegion(existingRecord.region);
      }

      setOutfit(existingRecord.outfit || {});
      setFeeling(existingRecord.feeling || "");
      setMemo(existingRecord.memo || "");
      setIsPublic(existingRecord.isPublic || false);
      setWeatherEmojis(existingRecord.weatherEmojis || []);
      setImageFiles(existingRecord.imageUrls.map((url) => ({ name: url, isUrl: true })));
      setImagePreviewIdx(0);
    }
  }, [existingRecord]);

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

    setImageFiles((prev) => {
      const newList = [...prev, ...files];

      // 처음 업로드인 경우만 preview 초기화
      if (prev.length === 0 && newList.length > 0) {
        setImage(URL.createObjectURL(newList[0]));
        setImagePreviewIdx(0);
      }

      return newList;
    });
  };

  const handleImageDelete = () => {
    if (imageFiles.length === 0) return;

    const confirmDelete = window.confirm("현재 사진을 삭제하시겠어요?");
    if (!confirmDelete) return;

    setImageFiles((prev) => {
      const newList = prev.filter((_, index) => index !== imagePreviewIdx);

      // 삭제 후 이미지 인덱스 조정
      if (newList.length === 0) {
        setImage(null);
        setImagePreviewIdx(0);
      } else if (imagePreviewIdx >= newList.length) {
        setImagePreviewIdx(newList.length - 1);
      }

      return newList;
    });
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

  const handleDelete = async () => {
    if (!recordId) return;
    const confirmDelete = window.confirm("정말 삭제하시겠어요?");
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "records", recordId));
      toast.success("기록이 삭제되었어요!", { autoClose: 1200 });
      setTimeout(() => navigate("/calendar"), 1300);
    } catch (err) {
      console.error("삭제 오류:", err);
      toast.error("삭제에 실패했습니다.");
    }
  };


  const handleSubmit = async () => {
    if (!user) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    if (!imageFiles.length || imageFiles.some(f => !f || (!f.name && !f.isUrl))) {
      toast.error("사진을 업로드해주세요.");
      return;
    }

    if (!feeling) {
      toast.error("체감을 선택해주세요.");
      return;
    }

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
      // 이미 위에서 계산된 dateStr 사용

      // ✅ (수정 모드가 아닐 때만) 중복 기록 체크
      if (!isEditMode) {
        const q = query(
          collection(db, "records"),
          where("uid", "==", user.uid),
          where("date", "==", dateStr)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          toast.error("이미 기록하셨습니다.");
          setLoading(false);
          return;
        }
      }

      // ✅ 이미지 업로드: 새로 추가된 이미지만 업로드, 기존은 그대로 사용
      const imageUrls = await Promise.all(
        imageFiles.map(async (file) => {
          if (file.isUrl) return file.name; // 기존 URL
          if (!file || !file.name) throw new Error("잘못된 파일입니다.");
          const imageRef = ref(storage, `records/${user.uid}/${Date.now()}_${file.name}`);
          await uploadBytes(imageRef, file);
          return await getDownloadURL(imageRef);
        })
      );

      const recordData = {
        uid: user.uid,
        region: profile?.region,
        regionName,
        date: dateStr,
        temp: weather.temp ?? null,
        rain: weather.rain ?? null,
        humidity: weather.humidity ?? null,
        weather: {
          temp: weather.temp ?? null,
          rain: weather.rain ?? null,
          humidity: weather.humidity ?? null,
          icon: weather.icon ?? null,
        },
        outfit,
        feeling,
        memo,
        isPublic,
        imageUrls,
        weatherEmojis,
        updatedAt: new Date(),
        nickname: profile?.nickname || user.uid,
      };

      if (isEditMode && recordId) {
        // ✅ 기존 기록 수정 - date 필드는 변경하지 않음
        const updateData = { ...recordData };
        delete updateData.createdAt; // createdAt 필드만 제거
        await updateDoc(doc(db, "records", recordId), updateData);
        toast.success("기록이 수정되었어요!", { position: "top-center", autoClose: 1200 });
      } else {
        // ✅ 새 기록 저장
        recordData.createdAt = new Date();
        recordData.likes = [];
        await addDoc(collection(db, "records"), recordData);
        toast.success("기록이 저장되었어요!", { position: "top-center", autoClose: 1200 });
      }

      // 수정 모드일 때는 선택한 날짜 정보를 캘린더에 전달
      if (isEditMode) {
        setTimeout(() => navigate("/calendar", { state: { selectedDate: dateStr } }), 1300);
      } else {
        setTimeout(() => navigate("/calendar"), 1300);
      }
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
    <div className="min-h-screen bg-gray-100 flex flex-col relative">
      {/* 사이드바 */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {/* 상단 네비게이션 */}
      <div className="flex justify-between items-center px-4 py-3 bg-blue-100 shadow">
        <button
          onClick={() => navigate(-1)}
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
      <div className="flex-1 px-4 mt-10 flex flex-col md:flex-row md:items-start md:justify-center gap-6 overflow-y-auto">
        {/* 왼쪽: 날씨 카드 */}
        <div className="w-full md:w-1/3 bg-gray-200 px-6 py-6 text-center min-h-[705px] rounded-lg">
          {/* 지역 선택 드롭다운 */}
          <div className="mb-4">
            <select
              value={selectedRegion || "Seoul"}
              onChange={e => handleRegionChange(e.target.value)}
              className="w-30 px-4 py-2 border rounded bg-white text-center"
            >
              <option value="Baengnyeongdo">백령도</option>
              <option value="Incheon">인천</option>
              <option value="Seoul">서울</option>
              <option value="Chuncheon">춘천</option>
              <option value="Gangneung">강릉</option>
              <option value="Ulleungdo">울릉도/독도</option>
              <option value="Hongseong">홍성</option>
              <option value="Suwon">수원</option>
              <option value="Cheongju">청주</option>
              <option value="Andong">안동</option>
              <option value="Jeonju">전주</option>
              <option value="Daejeon">대전</option>
              <option value="Daegu">대구</option>
              <option value="Pohang">포항</option>
              <option value="Heuksando">흑산도</option>
              <option value="Mokpo">목포</option>
              <option value="Jeju">제주</option>
              <option value="Ulsan">울산</option>
              <option value="Yeosu">여수</option>
              <option value="Changwon">창원</option>
              <option value="Busan">부산</option>
              <option value="Gwangju">광주</option>
            </select>
          </div>
          {weatherLoading ? (
            <p className="text-sm text-gray-500">날씨 정보를 불러오는 중...</p>
          ) : weather ? (
            <>
              {/* 커스텀 날씨 일러스트 카드 (화살표 선택 가능) */}
              <div className="flex flex-col items-center">
                {/* 날씨 아이콘 박스 */}
                <div className="relative">
                  <div className="w-60 h-60 bg-gray-200 rounded flex items-center justify-center text-6xl relative overflow-hidden">
                    <div className="absolute text-8xl animate-bounce">
                      {weather.icon === "rain" ? "☔️" : "☀️"}
                    </div>
                  </div>

                  {/* 과거 날짜에서만 화살표 버튼 표시 */}
                  {!isEditMode && !isToday(dateStr) && (
                    <>
                      {/* 왼쪽 화살표 */}
                      <button
                        onClick={() => handleWeatherIconChange("sunny")}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-70 rounded-full px-2 py-1 text-lg hover:bg-opacity-90 transition-colors"
                      >
                        ◀
                      </button>
                      {/* 오른쪽 화살표 */}
                      <button
                        onClick={() => handleWeatherIconChange("rain")}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-70 rounded-full px-2 py-1 text-lg hover:bg-opacity-90 transition-colors"
                      >
                        ▶
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* 날씨 정보 직접 수정 영역 */}
              <div className=" space-y-3">
                {/* 온도 입력 */}
                <div className="flex items-center justify-center space-x-4">
                  <span className="text-base font-semibold">온도 </span>
                  <input
                    type="number"
                    value={weather.temp || ""}
                    onChange={(e) => handleWeatherChange("temp", parseInt(e.target.value) || 0)}
                    className="w-20 px-2 py-1 border rounded text-center"
                    placeholder="0"
                    disabled={isToday(dateStr)}
                  />
                  <span className="text-base font-semibold">°C</span>
                </div>

                {/* 강수량 입력 */}
                <div className="flex items-center justify-center space-x-4">
                  <span className="text-base font-semibold">강수량 </span>
                  <input
                    type="number"
                    value={weather.rain || ""}
                    onChange={(e) => handleWeatherChange("rain", parseInt(e.target.value) || 0)}
                    className="w-20 px-2 py-1 border rounded text-center"
                    placeholder="0"
                    disabled={isToday(dateStr)}
                  />
                  <span className="text-base font-semibold">mm</span>
                </div>

                {/* 습도 입력 */}
                <div className="flex items-center justify-center space-x-4">
                  <span className="text-base font-semibold">습도 </span>
                  <input
                    type="number"
                    value={weather.humidity || ""}
                    onChange={(e) => handleWeatherChange("humidity", parseInt(e.target.value) || 0)}
                    className="w-20 px-2 py-1 border rounded text-center"
                    placeholder="0"
                    disabled={isToday(dateStr)}
                  />
                  <span className="text-base font-semibold">%</span>
                </div>
              </div>

              <div className="mt-4 space-x-4">
                {/* 체감 선택 드롭다운 */}
                <span className="text-base font-semibold">체감</span>
                <select
                  value={feeling}
                  onChange={(e) => setFeeling(e.target.value)}
                  className="w-25 px-4 py-2 border rounded text-center"
                >
                  <option value="" className="text-gray-500">선택</option>
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
        <div className="w-full md:w-2/3 bg-white px-6 py-6 items-center min-h-[705px] rounded-lg">
          {/* 입력폼 상단 바 */}
          <div className="flex justify-end bg-gray-200 items-center mb-4 ">
            <button
              onClick={handleSubmit}
              className="px-4 py-2 rounded text-gray-600 font-normal hover:font-bold transition"
              disabled={loading}
            >
              {loading ? "저장 중..." : "저장"}
            </button>

            {/* ✅ 삭제 버튼 (수정 모드일 때만) */}
            {isEditMode && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-red-600 font-normal hover:bg-red-300 transition bg-red-200"
              >
                삭제
              </button>
            )}
          </div>
          {/* 이미지 업로드 및 미리보기 */}
          <div className="flex flex-col md:flex-row gap-4 w-full">
            {/* 이미지 미리보기 영역 */}
            <div className="w-full md:w-1/2 flex flex-col items-center justify-center ">
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
                <div className="w-72 aspect-[3/4] relative rounded overflow-hidden border bg-gray-100 mt-2 p-2">
                  {/* 이미지 미리보기 */}
                  <img
                    src={
                      imageFiles[imagePreviewIdx]?.isUrl
                        ? imageFiles[imagePreviewIdx].name // URL 그대로 사용
                        : URL.createObjectURL(imageFiles[imagePreviewIdx]) // 새로 업로드한 파일
                    }
                    alt="preview"
                    className="w-full h-full object-cover rounded object-cover"
                  />

                  {/* ◀ / ▶ 이미지 전환 버튼 */}
                  {imageFiles.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setImagePreviewIdx((prev) => (prev - 1 + imageFiles.length) % imageFiles.length)
                        }
                        style={navBtnStyle("left")}
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setImagePreviewIdx((prev) => (prev + 1) % imageFiles.length)
                        }
                        style={navBtnStyle("right")}
                      >
                        ›
                      </button>
                      {/* 이미지 인디케이터 */}
                      <div style={indicatorStyle}>
                        {imageFiles.map((_, i) => (
                          <div key={i} style={dotStyle(i === imagePreviewIdx)} />
                        ))}
                      </div>
                    </>
                  )}

                  {/* ✅ + 사진 추가 버튼 (좌상단) */}
                  <label
                    htmlFor="imageUpload"
                    className="absolute top-3 left-3 bg-white bg-opacity-70 text-sm text-gray-700 px-2 py-1 rounded cursor-pointer hover:bg-opacity-90 z-10"
                  >
                    + 사진 추가
                    <input
                      id="imageUpload"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>

                  {/* 🗑️ 사진 삭제 버튼 (우상단) */}
                  <button
                    type="button"
                    onClick={handleImageDelete}
                    className="absolute top-3 right-3 bg-red-500 bg-opacity-80 text-white text-sm px-2 py-1 rounded cursor-pointer hover:bg-opacity-100 z-10"
                  >
                    🗑️ 삭제
                  </button>
                </div>

              )}
            </div>

            {/* 착장 입력 필드 (outer, top, bottom 등) */}
            <div className="w-full md:w-1/2 space-y-4 max-h-96 overflow-y-auto pr-6">
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


    </div >
  );
}

// 스타일 함수
// --- 캐러셀 스타일 함수들 (FeedCard.js 스타일과 동일) ---
const navBtnStyle = (side) => ({
  position: "absolute",
  [side]: "12px",
  top: "50%",
  transform: "translateY(-50%)",
  background: "rgba(0,0,0,0.5)",
  color: "white",
  border: "none",
  borderRadius: "50%",
  width: "28px",
  height: "28px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontSize: "16px",
  zIndex: 10
});

const indicatorStyle = {
  position: "absolute",
  bottom: "14px",
  left: "50%",
  transform: "translateX(-50%)",
  display: "flex",
  gap: "4px",
  zIndex: 10
};

const dotStyle = (active) => ({
  width: "6px",
  height: "6px",
  borderRadius: "50%",
  backgroundColor: active ? "white" : "rgba(255,255,255,0.5)"
});


export default Record;
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useUserProfile from "../hooks/useUserProfile";
import useWeather from "../hooks/useWeather";
import { useAuth } from "../contexts/AuthContext";
import { useComments } from "../hooks/useComments";
import { useRecordForm } from "../hooks/useRecordForm";
import { HomeIcon, ArrowLeftIcon } from "@heroicons/react/24/solid";
import { BellIcon } from "@heroicons/react/24/outline";
import MenuSidebar from "../components/MenuSidebar";
import NotiSidebar from "../components/NotiSidebar";
import useNotiSidebar from "../hooks/useNotiSidebar";
import { getPastWeatherData, fetchAndSavePastWeather, deletePastWeatherData, savePastWeatherData } from "../api/pastWeather";
import { fetchKmaPastWeather } from "../api/kmaPastWeather";
import CommentSection from "../components/CommentSection";
import { getWeatherEmoji, feelingToEmoji } from "../utils/weatherUtils";
import { regionMap } from "../constants/regionData";
import { styleOptions } from "../constants/styleOptions";
import { outfitOptionTexts } from "../constants/outfitOptionTexts";
import { weatherService } from "../api/weatherService";
import { getStyleCode } from "../utils/styleUtils";
import { navBtnStyle, indicatorStyle, dotStyle } from "../components/ImageCarouselStyles";

// 이미지 압축 함수
const compressImage = (file, maxWidth = 600, quality = 0.6) => {
  return new Promise((resolve, reject) => {
    // ... 이미지 압축 로직
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      
      if (compressedBase64.length > 400 * 1024) { 
        const strongerCompressed = canvas.toDataURL('image/jpeg', 0.4);
        resolve(strongerCompressed);
      } else {
        resolve(compressedBase64);
      }
    };
    
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Record 컴포넌트 - 착장 기록을 작성/수정하는 페이지
 */
function Record() {
  const navigate = useNavigate();
  const location = useLocation();
  const existingRecord = location.state?.existingRecord || null; // 기존 기록 데이터(수정 모드)
  const passedDateStr = location.state?.date || null;
  const dateStr = existingRecord?.date || passedDateStr;
  const dateObj = dateStr ? new Date(dateStr) : new Date();
  const formattedDate = `${dateObj.getFullYear()}년 ${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일`;

  const { profile, loading: profileLoading } = useUserProfile();
  const { user } = useAuth();
  
  const [isCommentViewVisible, setIsCommentViewVisible] = useState(false); // 댓글 섹션 토글
  
  // 현재 날짜인지 확인하는 유틸리티
  const isToday = (ds) => {
    const today = new Date();
    const targetDate = new Date(ds);
    return today.toDateString() === targetDate.toDateString();
  };

  // --- 1. 지역 및 날씨 상태 ---
  const [selectedRegion, setSelectedRegion] = useState(() => {
    if (existingRecord?.region) return existingRecord.region;
    return location.state?.selectedRegion || "Seoul";
  });
  const handleRegionChange = (newRegion) => setSelectedRegion(newRegion);
  const regionName = regionMap[selectedRegion] || selectedRegion; 

  // 사용자 프로필 지역 설정(최초 로드 시)
  useEffect(() => {
    if (profile?.region && !existingRecord?.region) {
      const isTodayDate = isToday(dateStr);
      if (!isTodayDate) {
        setSelectedRegion(profile.region);
      } else if (!location.state?.selectedRegion) {
        setSelectedRegion(profile.region);
      }
    }
  }, [profile?.region, existingRecord?.region, dateStr, location.state?.selectedRegion]);

  // 오늘 날짜의 날씨
  const { weather: apiWeather, loading: apiWeatherLoading } = useWeather(
    isToday(dateStr) ? selectedRegion : null
  );

  // 과거 날씨 데이터 상태
  const [pastWeather, setPastWeather] = useState(null);
  const [pastWeatherLoading, setPastWeatherLoading] = useState(false);

  // 과거 날씨 데이터 로드 및 저장 로직
  useEffect(() => {
    const loadPastWeather = async () => {
      if (isToday(dateStr) || !selectedRegion) {
        setPastWeather(null);
        return;
      }

      setPastWeatherLoading(true);
      try {
        // Firestore에서 저장된 과거 날씨 데이터 확인
        const savedData = await getPastWeatherData(dateStr, selectedRegion);
        if (savedData) {
          // 기본값인지 확인 (온도 20, 습도 60, 강수량 0, 계절 초가을)
          const isDefaultValue = 
            savedData.avgTemp === "20" && 
            savedData.avgRain === "0" && 
            savedData.avgHumidity === "60" &&
            savedData.season === "초가을";
          
          if (dateStr === "2025-09-12" || isDefaultValue) {
            // 특정 날짜의 테스트 데이터 또는 기본값 삭제 로직
            console.log("⚠️ 기본값 데이터 감지, 삭제 후 API 재시도:", dateStr);
            await deletePastWeatherData(dateStr, selectedRegion);
          } else {
            // 저장된 데이터 사용
            setPastWeather({
              temp: savedData.avgTemp, rain: savedData.avgRain, humidity: savedData.avgHumidity,
              icon: savedData.iconCode, season: savedData.season, sky: savedData.sky, pty: savedData.pty
            });
            setPastWeatherLoading(false);
            return;
          }
        }

        // KMA API에서 과거 날씨 가져오기 및 저장
        let pastData = await fetchKmaPastWeather(dateStr, selectedRegion);
        if (pastData) {
          await savePastWeatherData(dateStr, selectedRegion, pastData);
        } else {
          // KMA 실패 시 대체 API 사용 
          const fallbackData = await fetchAndSavePastWeather(dateStr, selectedRegion);
          if (fallbackData) pastData = fallbackData;
        }

        // 최종 날씨 설정 또는 기본값 설정
        if (pastData) {
          setPastWeather({
            temp: pastData.avgTemp, rain: pastData.avgRain, humidity: pastData.avgHumidity,
            icon: pastData.iconCode, season: pastData.season, sky: pastData.sky, pty: pastData.pty
          });
        } else {
          // 최종 실패 시 기본 날씨 값 설정
          setPastWeather({ temp: "20", rain: "0", humidity: "60", icon: "rain", season: "초가을", sky: "1", pty: "1" });
        }
      } catch (error) {
        console.error("과거 날씨 데이터 로드 실패:", error);
        setPastWeather({ temp: "20", rain: "0", humidity: "60", icon: "sunny", season: "초가을", sky: "1", pty: "0" });
      } finally {
        setPastWeatherLoading(false);
      }
    };

    loadPastWeather();
  }, [dateStr, selectedRegion]);

  // 최종 날씨 결정(기존 기록 > 오늘 API > 과거 API/기본값)
  const weather = existingRecord?.weather ||
    (isToday(dateStr) ? apiWeather : pastWeather) || {
    temp: 20, rain: 0, humidity: 60, icon: "sunny", season: "초가을"
  };

  const loading = profileLoading || (isToday(dateStr) ? apiWeatherLoading : pastWeatherLoading);

  // --- 2. 폼 로직 Hook 적용 ---
  const {
    outfit, selectedItems, customInputMode, customInputs, feeling, style, memo, isPublic, 
    imageFiles, imagePreviewIdx, submitLoading, isEditMode,
    setImagePreviewIdx, setFeeling, setStyle, setMemo, setIsPublic,
    handleImageChange, handleImageDelete, handleSelectChange, handleCustomInputChange, 
    handleBackToDropdown, handleAddSelectedItem, handleRemoveItem,
    handleSubmit, handleDelete
  } = useRecordForm(
    existingRecord, 
    dateStr, 
    weather, 
    selectedRegion,
    regionName, 
    profile, 
    compressImage, 
    weatherService 
  );
  
  // 기존 기록의 스타일을 폼 상태에 설정
  useEffect(() => {
    if (existingRecord?.style) {
      const styleCode = getStyleCode(existingRecord.style);
      setStyle(styleCode);
    }
  }, [existingRecord?.style, setStyle]);
  
  // --- 3. 댓글 로직 Hook 적용 ---
  const {
    comments, newComment, setNewComment, replyToCommentId, replyContent, setReplyContent,
    isRefreshing, handleCommentSubmit, handleCommentDelete, handleReply, handleReplySubmit,
    handleCancelReply, handleRefreshComments
  } = useComments(existingRecord?.id || '', user, existingRecord, profile);

  // --- 4. 기타 UI 및 상태 ---
  const regionOptions = Object.entries(regionMap).map(([key, value]) => ({ value: key, label: value }));
  
  // 알림 및 메뉴 사이드바 훅
  const { alarmOpen, setAlarmOpen,
    notifications, unreadCount,
    markAllRead, handleDeleteSelected,
    markOneRead, handleAlarmItemClick,
    reportNotificationPopup
  } = useNotiSidebar();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 체감 옵션 텍스트 포맷팅
  const getFeelingTextForOption = (feelingCode) => {
    const result = feelingToEmoji(feelingCode);
    if (result && result.includes(' ')) {
      const [emoji, text] = result.split(' ');
      return `${emoji} (${text})`;
    }
    return result;
  };


  if (profileLoading) {
    return <div className="p-4 max-w-md mx-auto">사용자 정보를 불러오는 중...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col relative">
      {/* 사이드바 */}
      <MenuSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <NotiSidebar
        isOpen={alarmOpen}
        onClose={() => setAlarmOpen(false)}
        notifications={notifications}
        onMarkAllRead={markAllRead}
        onDeleteSelected={handleDeleteSelected}
        onMarkOneRead={markOneRead}
        onItemClick={handleAlarmItemClick}
        reportNotificationPopup={reportNotificationPopup}
      />

      {/* 상단 네비게이션 */}
      <div className="flex justify-between items-center px-4 py-3 bg-blue-100 shadow">
        {/* 뒤로가기 버튼 */}
        <button
          onClick={() => navigate(-1)}
          className="bg-blue-200 px-3 py-1 rounded-md hover:bg-blue-300"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-lg">{formattedDate}</h2>
        <div className="flex items-center space-x-4">
          {/* 홈 버튼 */}
          <button
            onClick={() => navigate("/")}
            className="bg-blue-200 px-3 py-1 rounded-md hover:bg-blue-300"
          >
            <HomeIcon className="w-5 h-5" />
          </button>
          {/* 알림 버튼 */}
          <button
            className="relative flex items-center justify-center 
              bg-white w-7 h-7 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={() => setAlarmOpen(true)}
            aria-label="알림 열기"
          >
            <BellIcon className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-2 w-1.5 h-1.5 bg-red-500 rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 px-4 mt-10 flex flex-col md:flex-row md:items-start md:justify-center gap-6 overflow-y-auto">
        {/* 왼쪽 : 날씨 카드 또는 댓글 섹션 */}
        <div className="relative w-full md:w-1/3 bg-gray-200 h-[705px] rounded-lg">
          {!isCommentViewVisible ? (
            // 날씨 정보 뷰
            <div className="px-6 py-6 text-center h-full flex flex-col">
              {/* +댓글 보기 버튼 - 기존 기록(수정 모드)이 있을 때만 표시 */}
              {existingRecord && (
                <div className="mb-4 flex justify-start">
                  <button
                    onClick={() => setIsCommentViewVisible(true)}
                    className="px-3 py-1 bg-white rounded text-sm font-medium hover:bg-gray-100 transition-colors"
                  >
                    +댓글 보기
                  </button>
                </div>
              )}

              {/* 지역 선택 드롭다운 */}
              <div className="mb-8">
                <select
                  value={selectedRegion || "Seoul"}
                  onChange={e => handleRegionChange(e.target.value)}
                  className="w-30 px-4 py-2 border rounded bg-white text-center"
                >
                  {regionOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {/* 날씨 일러스트 */}
              {!loading && weather && (
                <div className="mb-4 flex justify-center">
                  <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-6xl animate-bounce">
                      {getWeatherEmoji(weather.icon)}
                    </span>
                  </div>
                </div>
              )}

              {loading ? (
                <p className="text-sm text-gray-500">날씨 정보를 불러오는 중...</p>
              ) : weather ? (
                <>
                  <div className="mt-8 space-y-6">
                    {/* 계절 */}
                    <div className="flex justify-center">
                      <div className="flex items-center w-60">
                        <span className="w-28 text-base font-semibold text-left">계절</span>
                        <div className="ml-auto w-32 h-9 px-3 py-1 bg-white rounded text-sm font-medium flex items-center justify-center">
                          {weather.season || "초가을"}
                        </div>
                      </div>
                    </div>

                    {/* 온도 */}
                    <div className="flex justify-center">
                      <div className="flex items-center w-60">
                        <span className="w-28 text-base font-semibold text-left">온도</span>
                        <div className="ml-auto w-32 h-9 px-3 py-1 bg-white rounded text-sm font-medium flex items-center justify-center">
                          {weather?.temp || 0}°C
                        </div>
                      </div>
                    </div>

                    {/* 강수량 */}
                    <div className="flex justify-center">
                      <div className="flex items-center w-60">
                        <span className="w-28 text-base font-semibold text-left">강수량</span>
                        <div className="ml-auto w-32 h-9 px-3 py-1 bg-white rounded text-sm font-medium flex items-center justify-center">
                          {weather?.rain || 0}mm
                        </div>
                      </div>
                    </div>

                    {/* 습도 */}
                    <div className="flex justify-center">
                      <div className="flex items-center w-60">
                        <span className="w-28 text-base font-semibold text-left">습도</span>
                        <div className="ml-auto w-32 h-9 px-3 py-1 bg-white rounded text-sm font-medium flex items-center justify-center">
                          {weather?.humidity || 0}%
                        </div>
                      </div>
                    </div>

                    {/* 체감 선택 */}
                    <div className="flex justify-center">
                      <div className="flex items-center w-60">
                        <span className="w-28 text-base font-semibold text-left">체감</span>
                        <select
                          value={feeling}
                          onChange={(e) => setFeeling(e.target.value)}
                          className="ml-auto w-32 h-9 px-3 py-1 border rounded text-sm text-center flex items-center justify-center"
                        >
                          <option value="" className="text-gray-500">선택</option>
                          <option value="steam">{getFeelingTextForOption("steam")}</option>
                          <option value="hot">{getFeelingTextForOption("hot")}</option>
                          <option value="nice">{getFeelingTextForOption("nice")}</option>
                          <option value="cold">{getFeelingTextForOption("cold")}</option>
                          <option value="ice">{getFeelingTextForOption("ice")}</option>
                        </select>
                      </div>
                    </div>

                    {/* 스타일 선택 */}
                    <div className="flex justify-center">
                      <div className="flex items-center w-60">
                        <span className="w-28 text-base font-semibold text-left">스타일</span>
                        <select 
                          value={style}
                          onChange={(e) => setStyle(e.target.value)}
                          className="ml-auto w-32 h-9 px-2 py-1 border rounded text-sm text-center flex items-center justify-center"
                        >
                          <option value="" className="text-gray-500">선택</option>
                          {styleOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-red-500">날씨 정보를 가져올 수 없습니다.</p>
              )}
            </div>
          ) : (
            // 댓글 섹션
            <div className="h-full">
              <CommentSection
                comments={comments}
                newComment={newComment}
                setNewComment={setNewComment}
                onCommentSubmit={handleCommentSubmit}
                onCommentDelete={handleCommentDelete}
                onReply={handleReply}
                onClose={() => setIsCommentViewVisible(false)} // 댓글 뷰 닫기
                onRefresh={handleRefreshComments}
                isRefreshing={isRefreshing}
                replyToCommentId={replyToCommentId}
                replyContent={replyContent}
                setReplyContent={setReplyContent}
                onReplySubmit={handleReplySubmit}
                onCancelReply={handleCancelReply}
                user={user}
                author={{ ...profile, uid: user?.uid }}
              />
            </div>
          )}
        </div>

        {/* 오른쪽 입력 폼 */}
        <div className="w-full md:w-2/3 bg-white px-6 py-6 items-center min-h-[705px] rounded-lg">
          {/* 입력폼 상단 바 */}
          <div className="flex items-center justify-between bg-gray-200 mb-4 px-4 h-12">
            {/* 피드 공개 체크박스 */}
            <div className="flex items-center gap-2 ml-2">
              <input
                type="checkbox"
                id="feedCheckbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="feedCheckbox" className="font-medium text-gray-600">
                피드
              </label>
            </div>

            {/* 우측 액션 : 저장 / 삭제 */}
            <div className="flex items-center">
              <button
                onClick={handleSubmit}
                className="px-4 py-2 rounded text-gray-600 font-medium hover:font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {submitLoading ? "저장 중..." : "저장"}
              </button>

              {isEditMode && (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-red-500 font-medium hover:font-bold transition"
                >
                  삭제
                </button>
              )}
            </div>
          </div>

          {/* 이미지 업로드 및 미리보기 */}
          <div className="flex flex-col md:flex-row gap-4 w-full">
            {/* 이미지 미리보기 영역 */}
            <div className="w-full md:w-1/2 flex flex-col items-center justify-center ">
              {imageFiles.length === 0 ? (
                // 이미지 없을 때 : 업로드 버튼
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
                // 이미지 있을 때 : 미리보기 및 컨트롤
                <div className="w-72 aspect-[3/4] relative rounded overflow-hidden border bg-gray-100 mt-2 p-2">
                  {/* 이미지 표시 */}
                  <img
                    src={
                      imageFiles[imagePreviewIdx]?.isUrl
                        ? imageFiles[imagePreviewIdx].name
                        : URL.createObjectURL(imageFiles[imagePreviewIdx])
                    }
                    alt="preview"
                    className="w-full h-full object-cover rounded object-cover"
                  />

                  {/* 이미지 전환 버튼(캐러셀) */}
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

                  {/* + 사진 추가 버튼(좌상단) */}
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

            {/* 착장 선택 드롭다운 (Outer, Top, Bottom, Shoes, Acc) */}
            <div className="w-full md:w-1/2 space-y-4 max-h-96 overflow-y-auto pr-10">
              {/* Outer 드롭다운/입력 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Outer</label>
                <div className="flex gap-2 items-center">
                  {customInputMode.outer ? (
                    // 직접 입력 모드
                    <div className="flex gap-2 items-center w-80">
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded bg-white"
                        placeholder="직접 입력하세요"
                        value={customInputs.outer}
                        onChange={(e) => handleCustomInputChange("outer", e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSelectedItem("outer")}
                      />
                      <button
                        type="button"
                        onClick={() => handleBackToDropdown("outer")}
                        className="px-2 py-1 bg-gray-300 rounded hover:bg-gray-400 text-xs"
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    // 드롭다운 선택 모드
                    <select
                      className="w-80 px-3 py-2 border rounded bg-white"
                      value={selectedItems.outer}
                      onChange={(e) => handleSelectChange("outer", e.target.value)}
                    >
                      <option value="">선택하세요</option>
                      {Object.keys(outfitOptionTexts.outer).map(value => (
                        <option key={value} value={value}>
                          {value === 'custom' ? '직접입력' : outfitOptionTexts.outer[value]}
                        </option>
                      ))}
                    </select>
                  )}
                  <button
                    type="button"
                    onClick={() => handleAddSelectedItem("outer")}
                    className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    +
                  </button>
                </div>
                {/* 선택된 아이템 목록 */}
                {outfit.outer.length > 0 && (
                  <ul className="ml-2 mt-1 text-sm text-gray-600">
                    {outfit.outer.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-1">
                        • {item}
                        <button
                          type="button"
                          className="ml-1 mb-1 px-2 py-0.5 rounded bg-gray-200 hover:bg-red-200 text-xs text-red-500 hover:text-red-700 transition"
                          onClick={() => handleRemoveItem("outer", idx)}
                        >
                          -
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Top 드롭다운/입력 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Top</label>
                <div className="flex gap-2 items-center">
                  {customInputMode.top ? (
                    <div className="flex gap-2 items-center w-80">
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded bg-white"
                        placeholder="직접 입력하세요"
                        value={customInputs.top}
                        onChange={(e) => handleCustomInputChange("top", e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSelectedItem("top")}
                      />
                      <button
                        type="button"
                        onClick={() => handleBackToDropdown("top")}
                        className="px-2 py-1 bg-gray-300 rounded hover:bg-gray-400 text-xs"
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <select
                      className="w-80 px-3 py-2 border rounded bg-white"
                      value={selectedItems.top}
                      onChange={(e) => handleSelectChange("top", e.target.value)}
                    >
                      <option value="">선택하세요</option>
                      {Object.keys(outfitOptionTexts.top).map(value => (
                        <option key={value} value={value}>
                          {value === 'custom' ? '직접입력' : outfitOptionTexts.top[value]}
                        </option>
                      ))}
                    </select>
                  )}
                  <button
                    type="button"
                    onClick={() => handleAddSelectedItem("top")}
                    className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    +
                  </button>
                </div>
                {outfit.top.length > 0 && (
                  <ul className="ml-2 mt-1 text-sm text-gray-600">
                    {outfit.top.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-1">
                        • {item}
                        <button
                          type="button"
                          className="ml-1 mb-1 px-2 py-0.5 rounded bg-gray-200 hover:bg-red-200 text-xs text-red-500 hover:text-red-700 transition"
                          onClick={() => handleRemoveItem("top", idx)}
                        >
                          -
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Bottom 드롭다운/입력 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bottom</label>
                <div className="flex gap-2 items-center">
                  {customInputMode.bottom ? (
                    <div className="flex gap-2 items-center w-80">
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded bg-white"
                        placeholder="직접 입력하세요"
                        value={customInputs.bottom}
                        onChange={(e) => handleCustomInputChange("bottom", e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSelectedItem("bottom")}
                      />
                      <button
                        type="button"
                        onClick={() => handleBackToDropdown("bottom")}
                        className="px-2 py-1 bg-gray-300 rounded hover:bg-gray-400 text-xs"
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <select
                      className="w-80 px-3 py-2 border rounded bg-white"
                      value={selectedItems.bottom}
                      onChange={(e) => handleSelectChange("bottom", e.target.value)}
                    >
                      <option value="">선택하세요</option>
                      {Object.keys(outfitOptionTexts.bottom).map(value => (
                        <option key={value} value={value}>
                          {value === 'custom' ? '직접입력' : outfitOptionTexts.bottom[value]}
                        </option>
                      ))}
                    </select>
                  )}
                  <button
                    type="button"
                    onClick={() => handleAddSelectedItem("bottom")}
                    className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    +
                  </button>
                </div>
                {outfit.bottom.length > 0 && (
                  <ul className="ml-2 mt-1 text-sm text-gray-600">
                    {outfit.bottom.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-1">
                        • {item}
                        <button
                          type="button"
                          className="ml-1 mb-1 px-2 py-0.5 rounded bg-gray-200 hover:bg-red-200 text-xs text-red-500 hover:text-red-700 transition"
                          onClick={() => handleRemoveItem("bottom", idx)}
                        >
                          -
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Shoes 드롭다운/입력 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shoes</label>
                <div className="flex gap-2 items-center">
                  {customInputMode.shoes ? (
                    <div className="flex gap-2 items-center w-80">
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded bg-white"
                        placeholder="직접 입력하세요"
                        value={customInputs.shoes}
                        onChange={(e) => handleCustomInputChange("shoes", e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSelectedItem("shoes")}
                      />
                      <button
                        type="button"
                        onClick={() => handleBackToDropdown("shoes")}
                        className="px-2 py-1 bg-gray-300 rounded hover:bg-gray-400 text-xs"
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <select
                      className="w-80 px-3 py-2 border rounded bg-white"
                      value={selectedItems.shoes}
                      onChange={(e) => handleSelectChange("shoes", e.target.value)}
                    >
                      <option value="">선택하세요</option>
                      {Object.keys(outfitOptionTexts.shoes).map(value => (
                        <option key={value} value={value}>
                          {value === 'custom' ? '직접입력' : outfitOptionTexts.shoes[value]}
                        </option>
                      ))}
                    </select>
                  )}
                  <button
                    type="button"
                    onClick={() => handleAddSelectedItem("shoes")}
                    className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    +
                  </button>
                </div>
                {outfit.shoes.length > 0 && (
                  <ul className="ml-2 mt-1 text-sm text-gray-600">
                    {outfit.shoes.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-1">
                        • {item}
                        <button
                          type="button"
                          className="ml-1 mb-1 px-2 py-0.5 rounded bg-gray-200 hover:bg-red-200 text-xs text-red-500 hover:text-red-700 transition"
                          onClick={() => handleRemoveItem("shoes", idx)}
                        >
                          -
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Acc 드롭다운/입력 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Acc</label>
                <div className="flex gap-2 items-center">
                  {customInputMode.acc ? (
                    <div className="flex gap-2 items-center w-80">
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded bg-white"
                        placeholder="직접 입력하세요"
                        value={customInputs.acc}
                        onChange={(e) => handleCustomInputChange("acc", e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSelectedItem("acc")}
                      />
                      <button
                        type="button"
                        onClick={() => handleBackToDropdown("acc")}
                        className="px-2 py-1 bg-gray-300 rounded hover:bg-gray-400 text-xs"
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <select
                      className="w-80 px-3 py-2 border rounded bg-white"
                      value={selectedItems.acc}
                      onChange={(e) => handleSelectChange("acc", e.target.value)}
                    >
                      <option value="">선택하세요</option>
                      {Object.keys(outfitOptionTexts.acc).map(value => (
                        <option key={value} value={value}>
                          {value === 'custom' ? '직접입력' : outfitOptionTexts.acc[value]}
                        </option>
                      ))}
                    </select>
                  )}
                  <button
                    type="button"
                    onClick={() => handleAddSelectedItem("acc")}
                    className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    +
                  </button>
                </div>
                {outfit.acc.length > 0 && (
                  <ul className="ml-2 mt-1 text-sm text-gray-600">
                    {outfit.acc.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-1">
                        • {item}
                        <button
                          type="button"
                          className="ml-1 mb-1 px-2 py-0.5 rounded bg-gray-200 hover:bg-red-200 text-xs text-red-500 hover:text-red-700 transition"
                          onClick={() => handleRemoveItem("acc", idx)}
                        >
                          -
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
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
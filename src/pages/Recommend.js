// src/pages/Recommend.js
import React, { useEffect, useState } from "react";
import FeedCard from "../components/FeedCard";
import { getAllRecords } from "../api/getAllRecords";
import { toggleLike } from "../api/toggleLike";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Bars3Icon, HomeIcon } from "@heroicons/react/24/solid";
import { BellIcon } from "@heroicons/react/24/outline";
import MenuSidebar from "../components/MenuSidebar";
import NotiSidebar from "../components/NotiSidebar";
import useNotiSidebar from "../hooks/useNotiSidebar";

function Recommend() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [outfits, setOutfits] = useState([]);
  const [filteredOutfits, setFilteredOutfits] = useState([]);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { alarmOpen, setAlarmOpen,
    notifications, unreadCount,
    markAllRead, handleDeleteSelected,
    markOneRead, handleAlarmItemClick,
  } = useNotiSidebar();

  const [excludeMyRecords, setExcludeMyRecords] = useState(false);
  const [onlyMyRecords, setOnlyMyRecords] = useState(false);
  const [likedOnly, setLikedOnly] = useState(false);

  // ✅ 계절 코드↔한글 레이블 매핑 (레코드가 한글, 셀렉트는 코드여도 매칭 가능)
  const seasonMap = {
    earlyspring: "초봄",
    spring: "봄",
    latespring: "늦봄",
    earlysummer: "초여름",
    summer: "여름",
    latesummer: "늦여름",
    earlyautumn: "초가을",
    autumn: "가을",
    lateautumn: "늦가을",
    earlywinter: "초겨울",
    winter: "겨울",
    latewinter: "늦겨울",
  };
  const normalizeSeason = (v) => (v ? (seasonMap[v] || v) : "");

  // ✅ 스타일 매칭 (영문/한글/복합 레이블 모두 인식)
  const styleAliases = {
    casual: ["casual", "캐주얼"],
    minimal: ["minimal", "미니멀"],
    formal: ["formal", "포멀"],
    sporty: ["sporty", "스포티", "액티브", "스포티/액티브"],
    street: ["street", "시크", "스트릿", "시크/스트릿"],
    feminine: ["feminine", "러블리", "페미닌", "러블리/페미닌"],
  };
  const matchesStyle = (recordStyleField, filterKey) => {
    if (!filterKey) return true;
    // record.styles (array) 또는 record.style (string) 모두 대응
    const wanted = styleAliases[filterKey] || [filterKey];
    const checkOne = (s) =>
      !!wanted.find((w) => String(s).toLowerCase() === String(w).toLowerCase());
    if (Array.isArray(recordStyleField)) {
      return recordStyleField.some(checkOne);
    }
    if (recordStyleField == null) return false;
    return checkOne(recordStyleField);
  };

  // ⭐ 필터 상태 (region, feeling + season, style)
  const [filters, setFilters] = useState(() => {
    const saved = sessionStorage.getItem("recommendFilters");
    if (saved) {
      try {
        const p = JSON.parse(saved);
        return {
          region: p.region || "",
          feeling: p.feeling || "",
          season: p.season || "", // ← 추가
          style: p.style || "",   // ← 추가
        };
      } catch {
        /* ignore */
      }
    }
    return { region: "", feeling: "", season: "", style: "" };
  });

  // 지역 목록
  const regionMap = {
    Incheon: "인천",
    Seoul: "서울",
    Chuncheon: "춘천",
    Gangneung: "강릉",
    Ulleungdo: "울릉도/독도",
    Suwon: "수원",
    Cheongju: "청주",
    Jeonju: "전주",
    Daejeon: "대전",
    Daegu: "대구",
    Pohang: "포항",
    Mokpo: "목포",
    Jeju: "제주",
    Ulsan: "울산",
    Yeosu: "여수",
    Busan: "부산",
    Gwangju: "광주",
  };

  // 체감 옵션
  const feelingOptions = [
    { value: "steam", label: "🥟 (찐만두)", emoji: "🥟" },
    { value: "hot", label: "🥵 (더움)", emoji: "🥵" },
    { value: "nice", label: "👍🏻 (적당)", emoji: "👍🏻" },
    { value: "cold", label: "💨 (추움)", emoji: "💨" },
    { value: "ice", label: "🥶 (동태)", emoji: "🥶" },
  ];

  // 모든 기록 가져오기 (전체 기록)
  useEffect(() => {
    const fetchAllRecords = async () => {
      try {
        const records = await getAllRecords();
        setOutfits(records);
        setFilteredOutfits(records);
      } catch (error) {
        console.error("Error fetching records:", error);
      }
    };
    fetchAllRecords();
  }, []);

  // 다른 페이지에서 전달된 필터 적용 (region/feeling만 유지하던 기존 로직)
  useEffect(() => {
    if (location.state?.userFilters && location.state?.userRegion) {
      const userRegion = location.state.userRegion;
      setFilters((prev) => ({ ...prev, region: userRegion, feeling: "" }));
    } else if (location.state?.currentWeather) {
      const currentWeather = location.state.currentWeather;
      setFilters((prev) => ({
        ...prev,
        region: currentWeather.region || "",
        feeling: "",
      }));
    } else if (location.state?.fromDetail && location.state?.currentFilters) {
      const cf = location.state.currentFilters;
      setFilters((prev) => ({
        ...prev,
        region: cf.region || "",
        feeling: cf.feeling || "",
        // season/style은 기존 저장값 유지
      }));
    }
  }, [location.state]);

  // 필터 적용
  useEffect(() => {
    // 필터 활성 여부
    const hasFilters =
      !!filters.region ||
      !!filters.feeling ||
      !!filters.season ||
      !!filters.style ||
      excludeMyRecords ||
      onlyMyRecords ||
      likedOnly;
    setHasActiveFilters(hasFilters);

    let filtered = [...outfits];

    filtered = filtered.filter((record) => {
      // 나의 기록 제외/만
      if (excludeMyRecords && user?.uid && record.uid === user.uid) return false;
      if (onlyMyRecords) {
        if (!user?.uid) return false;
        if (record.uid !== user.uid) return false;
      }

      // 내가 좋아요 한 코디
      if (likedOnly) {
        if (!user?.uid) return false;
        const likesArr = Array.isArray(record.likes) ? record.likes : [];
        if (!likesArr.includes(user.uid)) return false;
      }

      // 지역
      if (filters.region && record.region !== filters.region) return false;

      // 체감
      if (filters.feeling && record.feeling !== filters.feeling) return false;

      // ✅ 계절: record.season(한글) 또는 record.weather?.season 등에서 비교
      if (filters.season) {
        const wantedKo = normalizeSeason(filters.season); // 코드→한글
        const recSeason =
          record.season ||
          record.weather?.season ||
          record.meta?.season ||
          "";
        if (normalizeSeason(recSeason) !== wantedKo) return false;
      }

      // ✅ 스타일: record.style(string) 또는 record.styles(array) 대응
      if (filters.style) {
        const recStyle = record.styles ?? record.style ?? null;
        if (!matchesStyle(recStyle, filters.style)) return false;
      }

      return true;
    });

    // 정렬: 1차 좋아요 내림차순, 2차 싫어요 오름차순
    filtered.sort((a, b) => {
      const aLikes = a.likes?.length || 0;
      const bLikes = b.likes?.length || 0;
      const aDislikes = a.dislikes?.length || 0;
      const bDislikes = b.dislikes?.length || 0;

      // 1차: 좋아요 개수 내림차순
      if (aLikes !== bLikes) {
        return bLikes - aLikes;
      }
      // 2차: 싫어요 개수 오름차순 (적은 순서대로)
      return aDislikes - bDislikes;
    });

    setFilteredOutfits(filtered);
  }, [
    outfits,
    filters,
    excludeMyRecords,
    onlyMyRecords,
    likedOnly,
    user,
  ]);

  // 필터 상태 저장
  useEffect(() => {
    sessionStorage.setItem("recommendFilters", JSON.stringify(filters));
  }, [filters]);

  // 좋아요 토글
  const handleToggleLike = async (recordId, liked) => {
    if (!user) return;
    await toggleLike(recordId, user.uid);
    setOutfits((prev) =>
      prev.map((record) =>
        record.id === recordId
          ? {
            ...record,
            likes: liked
              ? record.likes.filter((uid) => uid !== user.uid)
              : [...(record.likes || []), user.uid],
          }
          : record
      )
    );
  };

  // 필터 핸들러
  const handleRegionChange = (region) =>
    setFilters((prev) => ({ ...prev, region }));
  const handleFeelingChange = (feeling) =>
    setFilters((prev) => ({ ...prev, feeling }));
  const handleSeasonChange = (season) =>
    setFilters((prev) => ({ ...prev, season }));
  const handleStyleChange = (style) =>
    setFilters((prev) => ({ ...prev, style }));

  const clearFilters = () => {
    setFilters({ region: "", feeling: "", season: "", style: "" });
    setExcludeMyRecords(false);
    setOnlyMyRecords(false);
    setLikedOnly(false);
  };

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
      />
      {/* 상단 네비게이션 */}
      <div className="flex justify-between items-center px-4 py-3 bg-blue-100 shadow">
        <button
          className="bg-blue-200 px-3 py-1 rounded-md hover:bg-blue-300"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Bars3Icon className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-lg">추천 코디</h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/")}
            className="bg-blue-200 px-3 py-1 rounded-md hover:bg-blue-300"
          >
            <HomeIcon className="w-5 h-5" />
          </button>
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

      {/* 뒤로가기 버튼 */}
      <div className="flex justify-start items-center px-4 py-3 bg-white shadow-sm">
        <button
          onClick={() => navigate("/recommend-view")}
          className="bg-gray-400 hover:bg-gray-600 text-white px-4 py-1.5 rounded-md text-sm flex items-center gap-2"
        >
          ← 뒤로가기
        </button>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 px-4 mt-10 flex flex-col md:flex-row gap-6 mb-10">
        {/* 왼쪽: 필터 패널 */}
        <div className="w-full md:w-1/4 bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">필터</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              초기화
            </button>
          </div>

          {/* 체크박스들 */}
          <div className="mb-6 space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="excludeMyRecords"
                checked={excludeMyRecords}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setExcludeMyRecords(checked);
                  if (checked) {
                    setOnlyMyRecords(false);
                    setLikedOnly(false);
                  }
                }}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="excludeMyRecords" className="ml-2 text-sm text-gray-700">
                나의 기록 제외
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="onlyMyRecords"
                checked={onlyMyRecords}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setOnlyMyRecords(checked);
                  if (checked) {
                    setExcludeMyRecords(false);
                    setLikedOnly(false);
                  }
                }}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="onlyMyRecords" className="ml-2 text-sm text-gray-700">
                나의 기록만
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="likedOnly"
                checked={likedOnly}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setLikedOnly(checked);
                  if (checked) {
                    setOnlyMyRecords(false);
                    setExcludeMyRecords(false);
                  }
                }}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="likedOnly" className="ml-2 text-sm text-gray-700">
                내가 좋아요 한 코디
              </label>
            </div>
          </div>

          {/* 지역 */}
          <div className="mb-6">
            <label className="block text-base font-semibold mb-2">지역</label>
            <select
              value={filters.region}
              onChange={(e) => handleRegionChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-center"
            >
              <option value="">전체 지역</option>
              {Object.entries(regionMap).map(([eng, kor]) => (
                <option key={eng} value={eng}>
                  {kor}
                </option>
              ))}
            </select>
          </div>

          {/* 체감 */}
          <div className="mb-6">
            <label className="block text-base font-semibold mb-3">체감</label>
            <select
              value={filters.feeling}
              onChange={(e) => handleFeelingChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-center"
            >
              <option value="">전체</option>
              {feelingOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* ✅ 계절 */}
          <div className="mb-5">
            <label className="block text-base font-semibold mb-3">계절</label>
            <select
              value={filters.season}
              onChange={(e) => handleSeasonChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-center"
            >
              <option value="">전체</option>
              <option value="earlyspring">초봄</option>
              <option value="spring">봄</option>
              <option value="latespring">늦봄</option>
              <option value="earlysummer">초여름</option>
              <option value="summer">여름</option>
              <option value="latesummer">늦여름</option>
              <option value="earlyautumn">초가을</option>
              <option value="autumn">가을</option>
              <option value="lateautumn">늦가을</option>
              <option value="earlywinter">초겨울</option>
              <option value="winter">겨울</option>
              <option value="latewinter">늦겨울</option>
            </select>
          </div>

          {/* ✅ 스타일 */}
          <div className="mb-5">
            <label className="block text-base font-semibold mb-3">스타일</label>
            <select
              value={filters.style}
              onChange={(e) => handleStyleChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-center"
            >
              <option value="">전체</option>
              <option value="casual">캐주얼</option>
              <option value="minimal">미니멀</option>
              <option value="formal">포멀</option>
              <option value="sporty">스포티/액티브</option>
              <option value="street">시크/스트릿</option>
              <option value="feminine">러블리/페미닌</option>
            </select>
          </div>
        </div>

        {/* 오른쪽: 코디 목록 */}
        <div className="w-full md:w-3/4 bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">
              총 {filteredOutfits.length}개의 코디
            </h3>
            <p className="text-sm text-gray-600">
              좋아요 순으로 정렬된 추천 코디입니다.
            </p>
          </div>

          {filteredOutfits.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-2">
                {hasActiveFilters ? "조건에 맞는 코디가 없습니다" : "필터를 설정해주세요"}
              </p>
              <p className="text-sm text-gray-400">
                {hasActiveFilters
                  ? "필터를 조정해보세요"
                  : "지역/체감/계절/스타일 또는 '나의 기록 제외/만'을 설정해보세요"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredOutfits.map((outfit) => (
                <FeedCard
                  key={outfit.id}
                  record={outfit}
                  currentUserUid={user?.uid}
                  onToggleLike={handleToggleLike}
                  currentFilters={filters}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Recommend;

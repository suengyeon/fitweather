import React, { useEffect, useState, useMemo } from "react";
import FeedCard from "../components/FeedCard";
import { getRecords } from "../api/getRecords";
import { toggleLike } from "../api/toggleLike";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Bars3Icon, HomeIcon } from "@heroicons/react/24/solid";
import { BellIcon } from "@heroicons/react/24/outline";
import MenuSidebar from "../components/MenuSidebar";
import NotiSidebar from "../components/NotiSidebar";
import useNotiSidebar from "../hooks/useNotiSidebar";
import { getWeatherEmoji } from "../utils/weatherUtils"; 
import { regionMap } from "../constants/regionData";
import { styleOptions } from "../constants/styleOptions"; 

function Feed() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [outfits, setOutfits] = useState([]);
  const [order, setOrder] = useState("popular"); // 인기순 or 최신순
  const [region, setRegion] = useState(""); // 초기값 빈 문자열
  const [style, setStyle] = useState("casual"); // 스타일 필터 (기본값: 캐주얼)
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
    alarmOpen, setAlarmOpen,
    notifications, unreadCount,
    markAllRead, handleDeleteSelected,
    markOneRead, handleAlarmItemClick,
  } = useNotiSidebar();

  // 날씨 정보는 저장된 데이터만 사용 (API 호출 없음)

  // 세션스토리지에서 저장된 지역 정보 가져오기
  const getStoredRegion = () => {
    const stored = sessionStorage.getItem('feedRegion');
    console.log("Feed - getStoredRegion called, result:", stored);
    return stored || "";
  };

  // 세션스토리지에서 저장된 날짜 정보 가져오기
  const getStoredDate = () => {
    // 홈에서 직접 들어온 경우에만 세션스토리지 클리어하고 오늘 날짜 사용
    const isFromHome = !location.state?.fromCard && !location.state?.fromDetail;
    if (isFromHome) {
      sessionStorage.removeItem('feedDate');
      sessionStorage.removeItem('feedRegion'); // 지역 정보도 클리어
      const today = new Date();
      return {
        year: today.getFullYear(),
        month: today.getMonth() + 1,
        day: today.getDate()
      };
    }

    // 저장된 날짜가 있으면 사용 (브라우저 뒤로가기 포함)
    const stored = sessionStorage.getItem('feedDate');
    if (stored) {
      const [year, month, day] = stored.split('-').map(Number);
      return { year, month, day };
    }

    // 기본적으로는 오늘 날짜
    const today = new Date();
    return {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      day: today.getDate()
    };
  };

  // 날짜 선택 상태
  const [selectedYear, setSelectedYear] = useState(getStoredDate().year);
  const [selectedMonth, setSelectedMonth] = useState(getStoredDate().month);
  const [selectedDay, setSelectedDay] = useState(getStoredDate().day);
  const [selectedDate, setSelectedDate] = useState(() => {
    const { year, month, day } = getStoredDate();
    const monthStr = String(month).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${monthStr}-${dayStr}`;
  });

  // 사용자 region fetch
  useEffect(() => {
    async function fetchUserRegion() {
      if (!user) return;

      console.log("Feed - location.state:", location.state);
      console.log("Feed - stored region:", getStoredRegion());

      // FeedDetail에서 뒤로가기로 돌아온 경우 세션스토리지 지역 유지
      if (location.state?.fromDetail) {
        const storedRegion = getStoredRegion();
        console.log("Feed - fromDetail, using stored region:", storedRegion);
        if (storedRegion) {
          setRegion(storedRegion);
        }

        // 세션스토리지에 없으면 전달받은 지역 정보 사용
        if (location.state?.region) {
          console.log("Feed - fromDetail, using passed region:", location.state.region);
          setRegion(location.state.region);
          // 세션스토리지에도 저장
          sessionStorage.setItem('feedRegion', location.state.region);
        }

        // 전달받은 날짜 정보가 있으면 적용
        if (location.state?.year && location.state?.month && location.state?.day) {
          console.log("Feed - fromDetail, using passed date:", location.state.year, location.state.month, location.state.day);
          setSelectedYear(location.state.year);
          setSelectedMonth(location.state.month);
          setSelectedDay(location.state.day);
          // 세션스토리지에도 저장
          sessionStorage.setItem('feedDate', `${location.state.year}-${location.state.month}-${location.state.day}`);
        }

        return;
      }

      // 세션스토리지에서 저장된 지역이 있으면 사용
      const storedRegion = getStoredRegion();
      if (storedRegion) {
        console.log("Feed - using stored region:", storedRegion);
        setRegion(storedRegion);
        return;
      }

      // 저장된 지역이 없으면 사용자 기본 지역 사용
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userRegion = userSnap.data().region || "Seoul";
        console.log("Feed - using user default region:", userRegion);
        setRegion(userRegion);
      } else {
        console.log("Feed - using default region: Seoul");
        setRegion("Seoul");
      }
    }
    fetchUserRegion();
  }, [user, location.state]);

  // 날짜가 변경될 때 selectedDate 업데이트 및 세션스토리지에 저장
  useEffect(() => {
    const date = new Date(selectedYear, selectedMonth - 1, selectedDay);
    // 로컬 시간을 사용하여 YYYY-MM-DD 형식으로 변환
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const newSelectedDate = `${year}-${month}-${day}`;
    setSelectedDate(newSelectedDate);

    // 세션스토리지에 날짜 정보 저장 (카드 상세보기 후 뒤로가기 시 사용)
    console.log("Feed - saving date to sessionStorage:", `${selectedYear}-${selectedMonth}-${selectedDay}`);
    sessionStorage.setItem('feedDate', `${selectedYear}-${selectedMonth}-${selectedDay}`);
  }, [selectedYear, selectedMonth, selectedDay]);

  // region/order/style/selectedDate 바뀔 때마다 records fetch
  useEffect(() => {
    if (!region) return;
    getRecords(region, order, selectedDate).then(records => {
      // 스타일 필터링 적용
      const filteredRecords = records.filter(record => {
        // 스타일이 설정되지 않은 기록은 모든 스타일에 포함
        if (!record.style) return true;
        return record.style === style;
      });
      setOutfits(filteredRecords);
    });
  }, [region, order, style, selectedDate]);

  // 지역 변경 시 세션스토리지에 저장
  useEffect(() => {
    if (region) {
      console.log("Feed - saving region to sessionStorage:", region);
      sessionStorage.setItem('feedRegion', region);
      // 저장 후 즉시 확인
      const saved = sessionStorage.getItem('feedRegion');
      console.log("Feed - immediately after saving, sessionStorage contains:", saved);
    }
  }, [region]);

  // 좋아요 토글 함수 (Firestore + UI 동기화)
  const handleToggleLike = async (recordId, liked) => {
    if (!user) return;
    await toggleLike(recordId, user.uid);
    setOutfits(prev =>
      prev.map(record =>
        record.id === recordId
          ? {
            ...record,
            likes: liked
              ? record.likes.filter(uid => uid !== user.uid)
              : [...record.likes, user.uid],
          }
          : record
      )
    );
  };

  // 인기순일 때 TOP3 분리 (useMemo로 자동 재정렬)
  const isPopular = order === "popular";
  const { top3, rest } = useMemo(() => {
    let top3 = [];
    let rest = outfits;

    if (isPopular && outfits.length > 0) {
      const sorted = [...outfits].sort((a, b) => {
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
      top3 = sorted.slice(0, 3);
      rest = sorted.slice(3);
    }

    return { top3, rest };
  }, [outfits, isPopular]);

  // 연도, 월, 일 옵션 생성
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  // 선택된 연도와 월에 따른 일 수 계산
  const getDaysInMonth = (year, month) => {
    return new Date(year, month, 0).getDate();
  };
  const days = Array.from({ length: getDaysInMonth(selectedYear, selectedMonth) }, (_, i) => i + 1);

  // Tailwind CSS 클래스 상수는 가독성 개선을 위해 컴포넌트 내부에 정의할 수 있습니다.
  const navButtonClasses = "bg-blue-200 px-3 py-1 rounded-md hover:bg-blue-300";

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
          className={navButtonClasses} // 클래스 상수 사용
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Bars3Icon className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-lg">우리 동네</h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/")}
            className={navButtonClasses} // 클래스 상수 사용
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

      {/* 콘텐츠 */}
      <div className="flex-1 px-4 mt-10 flex md:flex-row gap-6 h-[700px]">
        {/* 왼쪽: 지역/정렬/날씨 카드 영역 */}
        <div className="w-full md:w-1/4 bg-gray-200 px-6 py-6 text-center overflow-hidden rounded-lg h-[700px]">
          <h3 className="text-lg font-semibold mb-3">{regionMap[region] || region}</h3>

          {/* 날씨 일러스트 */}
          <div className="flex justify-center items-center mb-6" style={{ minHeight: 120 }}>
            {outfits.length > 0 && outfits[0].weather ? (
              // 저장된 날씨 정보 표시 (API 호출 없음)
              <div className="flex flex-col items-center">
                <div className="w-60 h-60 bg-gray-200 rounded flex items-center justify-center text-6xl relative overflow-hidden">
                  <div className="absolute text-8xl">
                    {getWeatherEmoji(outfits[0].weather.icon)}
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  {outfits[0].weather.temp}°C
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">해당 날짜의 날씨 정보가 없습니다.</p>
            )}
          </div>

          <div className="flex flex-col items-center gap-8 mt-6">
            {/* 지역 */}
            <div className="flex items-center justify-between gap-4 w-60">
              <label htmlFor="region" className="font-semibold">지역</label>
              <select
                id="region"
                value={region}
                onChange={e => {
                  const newRegion = e.target.value;
                  console.log("Feed - region changed to:", newRegion);
                  setRegion(newRegion);
                }}
                className="w-32 px-3 py-2 rounded text-sm text-center"
              >
                {/* regionMap의 키를 사용하여 옵션 생성 */}
                {Object.entries(regionMap).map(([eng, kor]) => (
                  <option key={eng} value={eng}>{kor}</option>
                ))}
              </select>
            </div>

            {/* 정렬 */}
            <div className="flex items-center justify-between gap-4 w-60">
              <label htmlFor="sort" className="font-semibold">정렬</label>
              <select
                id="sort"
                value={order}
                onChange={e => setOrder(e.target.value)}
                className="w-32 px-3 py-2 rounded text-sm text-center"
              >
                <option value="" className="text-gray-500">선택</option>
                <option value="popular">인기순</option>
                <option value="latest">최신순</option>
              </select>
            </div>

            {/* 스타일 */}
            <div className="flex items-center justify-between gap-4 w-60">
              <label htmlFor="style" className="font-semibold">스타일</label>
              <select
                id="style"
                value={style}
                onChange={e => setStyle(e.target.value)}
                className="w-32 px-3 py-2 rounded  text-sm text-center"
              >
                <option value="" className="text-gray-500">선택</option>
                {/* 분리된 styleOptions를 사용하여 옵션 생성 */}
                {styleOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>


          {/* 로고 */}
          <div className="flex justify-center items-center pt-32">
            <h1 className="text-5xl font-lilita text-indigo-500">Fitweather</h1>
          </div>
        </div>

        {/* 오른쪽: 피드 카드 영역 */}
        <div className="w-full md:w-3/4 bg-white rounded-lg flex flex-col h-[700px]">
          {/* 선택된 날짜 드롭다운 */}
          <div className="px-6 py-4 bg-gray-50 border-b rounded-t-lg">
            <div className="flex justify-center items-center gap-3 mb-2">
              {/* 연도 드롭다운 */}
              <div className="flex items-center gap-1">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-2 py-1 rounded bg-white text-sm text-center w-[80px]"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <span className="text-sm font-medium">년</span>
              </div>

              {/* 월 드롭다운 */}
              <div className="flex items-center gap-1">
                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    const newMonth = parseInt(e.target.value);
                    setSelectedMonth(newMonth);
                    setSelectedDay(1);
                  }}
                  className="px-2 py-1 rounded bg-white text-sm text-center w-[60px]"
                >
                  {months.map((month) => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
                <span className="text-sm font-medium">월</span>
              </div>

              {/* 일 드롭다운 */}
              <div className="flex items-center gap-1">
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                  className="px-2 py-1 rounded bg-white text-sm text-center w-[60px]"
                >
                  {days.map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
                <span className="text-sm font-medium">일</span>
              </div>
            </div>

            <p className="text-sm text-gray-500 text-center">
              총 {outfits.length}개의 기록이 있습니다.
            </p>
          </div>

          {/* TOP3 강조 */}
          {isPopular && top3.length > 0 && (
            <div className="w-full bg-gray-200 px-6 pb-4 pt-4 overflow-x-auto">
              <div className="flex justify-center gap-20 min-w-max">
                {top3.map((outfit, idx) => (
                  <FeedCard
                    key={outfit.id}
                    record={outfit}
                    currentUserUid={user?.uid}
                    onToggleLike={handleToggleLike}
                    rank={idx + 1}
                    selectedDate={selectedDate}
                    selectedYear={selectedYear}
                    selectedMonth={selectedMonth}
                    selectedDay={selectedDay}
                  />
                ))}
              </div>
            </div>
          )}
          {/* 나머지 피드 카드 목록 */}
          <div className="mt-4 flex-1 overflow-y-auto px-6 pb-6">
            {outfits.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">해당 날짜에 기록이 없습니다.</p>
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-4">
                {(isPopular ? rest : outfits).map(outfit => (
                  <FeedCard
                    key={outfit.id}
                    record={outfit}
                    currentUserUid={user?.uid}
                    onToggleLike={handleToggleLike}
                    selectedDate={selectedDate}
                    selectedYear={selectedYear}
                    selectedMonth={selectedDay}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div >
  );
}

export default Feed;
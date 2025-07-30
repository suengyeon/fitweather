import React, { useEffect, useState } from "react";
import FeedCard from "../components/FeedCard";
import { getRecords } from "../api/getRecords";
import { toggleLike } from "../api/toggleLike";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Bars3Icon, HomeIcon } from "@heroicons/react/24/solid";
import useWeather from "../hooks/useWeather";
import WeatherCard from "../components/WeatherCard";
import Sidebar from "../components/Sidebar";

function Feed() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [outfits, setOutfits] = useState([]);
  const [order, setOrder] = useState("popular"); // 인기순 or 최신순
  const [region, setRegion] = useState(""); // 초기값 빈 문자열
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // 세션스토리지에서 저장된 날짜 정보 가져오기
  const getStoredDate = () => {
    // 홈에서 직접 들어온 경우 세션스토리지 클리어하고 오늘 날짜 사용
    const isFromHome = !location.state?.fromCard;
    if (isFromHome) {
      sessionStorage.removeItem('feedDate');
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

  // 날씨 데이터 fetch
  const { weather, loading: weatherLoading } = useWeather(region);

  // 사용자 region fetch
  useEffect(() => {
    async function fetchUserRegion() {
      if (!user) return;
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setRegion(userSnap.data().region || "Seoul");
      } else {
        setRegion("Seoul");
      }
    }
    fetchUserRegion();
  }, [user]);

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
    sessionStorage.setItem('feedDate', `${selectedYear}-${selectedMonth}-${selectedDay}`);
  }, [selectedYear, selectedMonth, selectedDay]);

  // region/order/selectedDate 바뀔 때마다 records fetch
  useEffect(() => {
    if (!region) return;
    getRecords(region, order, selectedDate).then(setOutfits);
  }, [region, order, selectedDate]);

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

  // 인기순일 때 TOP3 분리
  const isPopular = order === "popular";
  let top3 = [];
  let rest = outfits;
  if (isPopular && outfits.length > 0) {
    const sorted = [...outfits].sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
    top3 = sorted.slice(0, 3);
    rest = sorted.slice(3);
  }

  // regionMap for dropdown (전체 지역 목록)
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
    Busan: "부산"
  };

  // 연도, 월, 일 옵션 생성
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  
  // 선택된 연도와 월에 따른 일 수 계산
  const getDaysInMonth = (year, month) => {
    return new Date(year, month, 0).getDate();
  };
  const days = Array.from({ length: getDaysInMonth(selectedYear, selectedMonth) }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col relative">
      {/* 사이드바 */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {/* 상단 네비게이션 */}
      <div className="flex justify-between items-center px-4 py-3 bg-blue-100">
        <button 
          className="bg-blue-300 px-3 py-1 rounded-md hover:bg-blue-400"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Bars3Icon className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-lg">우리 동네</h2>
        <button
          onClick={() => navigate("/")}
          className="bg-blue-300 px-3 py-1 rounded-md hover:bg-blue-400"
        >
          <HomeIcon className="w-5 h-5" />
        </button>
      </div>
      {/* 콘텐츠 */}
      <div className="flex-1 px-4 mt-10 flex md:flex-row gap-6 h-[700px]">
        {/* 왼쪽: 지역/정렬/날씨 카드 영역 */}
                 <div className="w-full md:w-1/4 bg-gray-200 px-6 py-6 text-center overflow-hidden rounded h-[700px]">
                     <h3 className="text-lg font-semibold mb-3">{regionMap[region] || region}</h3>
           
           {/* 날씨 일러스트 */}
           <div className="flex justify-center items-center mb-6" style={{ minHeight: 120 }}>
             {weatherLoading ? (
               <p className="text-sm text-gray-500">날씨 정보를 불러오는 중...</p>
             ) : weather ? (
               <div className="flex flex-col items-center">
                 {/* 날씨 아이콘 박스 */}
                                   <div className={`w-60 h-60 bg-gray-200 rounded mb-8 flex items-center justify-center text-6xl relative overflow-hidden`}>
                    <div 
                      className="absolute text-8xl animate-bounce"
                    >
                      {weather.icon === "rain" ? "☔️" : "☀️"}
                    </div>
                  </div>
               </div>
             ) : (
               <p className="text-sm text-red-500">날씨 정보를 가져올 수 없습니다.</p>
             )}
           </div>
           

           <div className="flex flex-col items-center gap-4 mt-6 relative">
             <div className="flex items-center gap-2 relative">
               <label htmlFor="region">지역</label>
               <select
                 id="region"
                 value={region}
                 onChange={e => setRegion(e.target.value)}
                 className="px-3 py-2 rounded bg-blue-100 border relative z-10"
                 style={{ overflow: 'visible' }}
               >
                 {Object.entries(regionMap).map(([eng, kor]) => (
                   <option key={eng} value={eng}>{kor}</option>
                 ))}
               </select>
             </div>
             <div className="flex items-center gap-2 mt-4 relative">
               <label htmlFor="sort">정렬</label>
               <select
                 id="sort"
                 value={order}
                 onChange={e => setOrder(e.target.value)}
                 className="px-3 py-2 rounded bg-blue-100 border relative z-10"
                 style={{ overflow: 'visible' }}
               >
                 <option value="popular">인기순</option>
                 <option value="latest">최신순</option>
               </select>
             </div>
           </div>
           
           {/* 로고 */}
           <div className="text-center pt-16">
             <h1 className="text-5xl font-lilita text-indigo-500">Fitweather</h1>
           </div>
        </div>

        {/* 오른쪽: 피드 카드 영역 */}
        <div className="w-full md:w-3/4 bg-white rounded flex flex-col h-[700px]">
          {/* 선택된 날짜 표시 및 날짜 선택 드롭다운 */}
          <div className="px-6 py-4 bg-gray-50 border-b">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-gray-700">
                {selectedYear}년 {selectedMonth}월 {selectedDay}일 기록
              </h3>
              {/* 날짜 선택 드롭다운 */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedYear}
                  onChange={e => setSelectedYear(parseInt(e.target.value))}
                  className="px-2 py-1 rounded bg-white border text-sm"
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}년</option>
                  ))}
                </select>
                <select
                  value={selectedMonth}
                  onChange={e => {
                    const newMonth = parseInt(e.target.value);
                    setSelectedMonth(newMonth);
                    setSelectedDay(1);
                  }}
                  className="px-2 py-1 rounded bg-white border text-sm"
                >
                  {months.map(month => (
                    <option key={month} value={month}>{month}월</option>
                  ))}
                </select>
                <select
                  value={selectedDay}
                  onChange={e => setSelectedDay(parseInt(e.target.value))}
                  className="px-2 py-1 rounded bg-white border text-sm"
                >
                  {days.map(day => (
                    <option key={day} value={day}>{day}일</option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              총 {outfits.length}개의 기록이 있습니다.
            </p>
          </div>
          {/* TOP3 강조 */}
          {isPopular && top3.length > 0 && (
            <div className="w-full bg-gray-200 rounded px-6 pb-6 pt-4">
              <div className="flex justify-center gap-20">
                {top3.map((outfit, idx) => (
                  <FeedCard
                    key={outfit.id}
                    record={outfit}
                    currentUserUid={user?.uid}
                    onToggleLike={handleToggleLike}
                    rank={idx + 1}
                  />
                ))}
              </div>
            </div>
          )}
          {/* 나머지 피드 카드 목록 */}
          <div className="flex-1 overflow-y-auto px-6 pb-6 mt-6">
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
                  />
                ))}
              </div>
            )}
          </div>
                 </div>
       </div>
     </div>
   );
 }
 
 export default Feed;

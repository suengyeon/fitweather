import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { fetchLikedOutfitsByDate, fetchLikedOutfitDates } from "../utils/firestore";
import LikedDatePicker from "../components/LikedDatePicker";
import LikedList from "../components/LikedList";
import { Bars3Icon, HomeIcon } from "@heroicons/react/24/solid";

export default function MyPageLikes() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [year, setYear] = useState(null);
  const [month, setMonth] = useState(null);
  const [day, setDay] = useState(null);
  const [likedOutfits, setLikedOutfits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [availableDates, setAvailableDates] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 날짜 선택 핸들러
  const handleDateChange = ({ year, month, day }) => {
    setYear(year);
    setMonth(month);
    setDay(day);
  };

  // 날짜 목록 fetch 및 location.state에서 복원
  useEffect(() => {
    if (user) {
      if (location.state?.selectedDate && location.state?.availableDates) {
        const [y, m, d] = location.state.selectedDate.split("-").map(Number);
        setYear(y); setMonth(m); setDay(d);
        setAvailableDates(location.state.availableDates);
      } else {
        loadAvailableDates();
      }
    }
    // eslint-disable-next-line
  }, [user, location.state]);

  const loadAvailableDates = async () => {
    try {
      setLoading(true);
      const dates = await fetchLikedOutfitDates(user.uid);
      setAvailableDates(dates);
      // 가장 최근 날짜를 기본 선택
      if (dates.length > 0) {
        const [y, m, d] = dates[0].split("-").map(Number);
        setYear(y); setMonth(m); setDay(d);
      }
    } catch (error) {
      console.error("날짜 목록 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  // 날짜가 완전히 선택된 경우에만 fetch
  useEffect(() => {
    if (year && month && day && user) {
      loadLikedOutfits();
    } else {
      setLikedOutfits([]);
    }
    // eslint-disable-next-line
  }, [year, month, day, user]);

  const loadLikedOutfits = async () => {
    try {
      setLoading(true);
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const outfits = await fetchLikedOutfitsByDate(user.uid, dateStr);
      setLikedOutfits(outfits);
    } catch (error) {
      setLikedOutfits([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (outfitId) => {
    if (year && month && day) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      navigate(`/FeedDetail/${outfitId}`, {
        state: {
          fromLikes: true,
          selectedDate: dateStr,
          availableDates: availableDates
        }
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">로그인이 필요합니다.</p>
          <button
            onClick={() => navigate("/login")}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            로그인하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* 상단 네비게이션 */}
      <div className="flex justify-between items-center px-4 py-3 bg-blue-100">
        <button 
          className="bg-blue-300 px-3 py-1 rounded-md hover:bg-blue-400"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Bars3Icon className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-lg">내가 좋아요한 코디</h2>
        <button
          onClick={() => navigate("/")}
          className="bg-blue-300 px-3 py-1 rounded-md hover:bg-blue-400"
        >
          <HomeIcon className="w-5 h-5" />
        </button>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 px-4 mt-10 flex md:flex-row gap-6 h-[700px]">
        {/* 왼쪽: 날짜 선택 영역 */}
        <div className="w-full md:w-1/4 bg-gray-200 px-6 py-6 text-center overflow-hidden rounded h-[700px]">
          <LikedDatePicker
            year={year}
            month={month}
            day={day}
            availableDates={availableDates}
            onDateChange={handleDateChange}
            loading={loading}
          />
          {/* 로고 */}
          <div className="text-center pt-16">
            <h1 className="text-5xl font-lilita text-indigo-500">Fitweather</h1>
          </div>
        </div>

        {/* 오른쪽: 좋아요한 코디 리스트 영역 */}
        <div className="w-full md:w-3/4 bg-white rounded flex flex-col h-[700px]">
          <LikedList
            outfits={likedOutfits}
            loading={loading}
            selectedDate={year && month && day ? `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}` : null}
            onCardClick={handleCardClick}
          />
        </div>
      </div>
    </div>
  );
} 
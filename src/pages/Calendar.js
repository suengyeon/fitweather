import React, { useEffect, useState } from "react";
import Calendar from "react-calendar";
import { useNavigate, useLocation } from "react-router-dom";
import { Bars3Icon, HomeIcon } from "@heroicons/react/24/solid";
import { getDocs, collection, query, where } from "firebase/firestore";
import { db } from "../firebase";
import useUserProfile from "../hooks/useUserProfile";
import { useAuth } from "../contexts/AuthContext";
import Sidebar from "../components/Sidebar";
import "react-calendar/dist/Calendar.css";
import "../pages/Calendar.css";

function formatDateLocal(date) {
  return date.toLocaleDateString("sv-SE");
}

const years = Array.from({ length: 5 }, (_, i) => 2023 + i);
const months = [
  { label: "1월", value: 0 },
  { label: "2월", value: 1 },
  { label: "3월", value: 2 },
  { label: "4월", value: 3 },
  { label: "5월", value: 4 },
  { label: "6월", value: 5 },
  { label: "7월", value: 6 },
  { label: "8월", value: 7 },
  { label: "9월", value: 8 },
  { label: "10월", value: 9 },
  { label: "11월", value: 10 },
  { label: "12월", value: 11 },
];

function CalendarPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { profile } = useUserProfile();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Record 페이지에서 전달받은 선택된 날짜가 있으면 사용, 없으면 오늘 날짜
  const selectedDateFromRecord = location.state?.selectedDate;
  const initialDate = selectedDateFromRecord ? new Date(selectedDateFromRecord) : new Date();

  const [value, setValue] = useState(initialDate);
  const [calendarDate, setCalendarDate] = useState(initialDate);
  const [outfitMap, setOutfitMap] = useState({});
  const todayStr = formatDateLocal(new Date());

  // 🔄 사용자 기록 불러오기
  useEffect(() => {
    if (!user?.uid) return;

    const fetchData = async () => {
      const q = query(collection(db, "records"), where("uid", "==", user.uid));
      const snap = await getDocs(q);

      const map = {};
      snap.forEach((doc) => {
        const data = doc.data();
        if (data.date) {
          map[data.date] = { ...data, id: doc.id };
        }
      });

      setOutfitMap(map);
    };

    fetchData();
  }, [user?.uid]);

  // 📆 달력 이동 시 드롭다운 동기화
  const handleActiveStartDateChange = ({ activeStartDate }) => {
    setCalendarDate(activeStartDate);
  };

  // 📌 날짜 클릭 시 기록 페이지 이동
  const handleDateClick = (date) => {
    const dateStr = formatDateLocal(date);
    const existingRecord = outfitMap[dateStr];

    if (existingRecord) {
      navigate(`/record`, { state: { existingRecord } });
    } else {
      navigate("/record", { state: { date: dateStr } });
    }
  };

  // 📌 날짜 타일에 이모지 + 날짜 표시
const tileContent = ({ date, view }) => {
  if (view !== "month") return null;

  const dateStr = formatDateLocal(date);
  const record = outfitMap[dateStr];
  const weather = record?.weatherEmojis?.slice(0, 2).join(" ");
  const feelingEmoji =
    {
      steam: "🥟",
      hot: "🥵",
      nice: "👍🏻",
      cold: "💨",
      ice: "🥶",
    }[record?.feeling] || "";

  return (
    <div className="calendar-tile-content">
      {/* 상단: 날짜와 날씨 이모지 */}
      <div className="calendar-tile-top">
        <span className="calendar-date">{date.getDate()}</span>
        <span className="calendar-weather">{weather}</span>
      </div>
      {/* 하단: 체감 이모지 */}
      {feelingEmoji && <div className="calendar-feeling">{feelingEmoji}</div>}
    </div>
  );
};

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {/* 상단 네비게이션 */}
      <div className="flex justify-between items-center px-4 py-3 bg-blue-100">
        <button
          className="bg-blue-300 px-3 py-1 rounded-md hover:bg-blue-400"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Bars3Icon className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-lg">Calendar</h2>
        <button
          onClick={() => navigate("/")}
          className="bg-blue-300 px-3 py-1 rounded-md hover:bg-blue-400"
        >
          <HomeIcon className="w-5 h-5" />
        </button>
      </div>

      {/* 캘린더 */}
      <div className="flex justify-center py-6 px-4">
        <div className="w-full max-w-[900px] mx-auto px-4">
          <Calendar
            value={value}
            onClickDay={handleDateClick}
            tileContent={tileContent}
            formatDay={() => ""}
            activeStartDate={calendarDate}
            onActiveStartDateChange={handleActiveStartDateChange}
            tileClassName={({ date, view }) => {
              if (view !== "month") return "";

              const dateStr = formatDateLocal(date);
              const isOtherMonth = date.getMonth() !== calendarDate.getMonth();
              const hasRecord = !!outfitMap[dateStr];
              if (isOtherMonth) return "hidden-date";     // 다른 달: 숨김
              if (hasRecord) return "has-record";         // 기록 있음: 굵게 표시
              return "";
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default CalendarPage;
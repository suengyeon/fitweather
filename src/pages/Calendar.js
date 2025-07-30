import React, { useEffect, useState } from "react";
import Calendar from "react-calendar";
import { useNavigate, useLocation } from "react-router-dom";
import { Bars3Icon, HomeIcon, ChevronUpDownIcon } from "@heroicons/react/24/solid";
import { getDocs, collection, query, where } from "firebase/firestore";
import { db } from "../firebase";
import useUserProfile from "../hooks/useUserProfile";
import { useAuth } from "../contexts/AuthContext";
import { Listbox } from "@headlessui/react";
import { CheckIcon } from "@heroicons/react/20/solid";
import Sidebar from "../components/Sidebar";

import "react-calendar/dist/Calendar.css";

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

  // 📌 날짜 타일에 이모지 표시
  const tileContent = ({ date, view }) => {
    if (view !== "month") return null;
    const dateStr = formatDateLocal(date);
    const record = outfitMap[dateStr];

    return (
      <div className="text-xs text-center leading-tight">
        {record ? (
          <div>
            {/* ✅ 날씨 이모지 최대 2개 */}
            <div className="mb-1">{record.weatherEmojis?.slice(0, 2).join(" ")}</div>

            {/* ✅ 체감 이모지 */}
            <div>
              {{
                steam: "🥟",
                hot: "🥵",
                nice: "👍🏻",
                cold: "💨",
                ice: "🥶",
              }[record.feeling] || ""}
            </div>
          </div>
        ) : null}
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

      {/* 연/월 드롭다운 */}
      <div className="flex justify-center items-center gap-4 mt-6">
        {/* 년도 드롭다운 */}
        <Listbox value={calendarDate.getFullYear()} onChange={(year) => {
          const newDate = new Date(calendarDate);
          newDate.setFullYear(year);
          setCalendarDate(newDate);
        }}>
          <div className="relative w-24">
            <Listbox.Button className="w-full bg-white border border-gray-300 rounded-md py-2 pl-3 pr-8 text-left shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-300 text-sm">
              {calendarDate.getFullYear()}년
              <span className="absolute right-2 top-2">
                <ChevronUpDownIcon className="h-4 w-4 text-gray-400" />
              </span>
            </Listbox.Button>
            <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
              {years.map((year) => (
                <Listbox.Option
                  key={year}
                  value={year}
                  className={({ active }) =>
                    `cursor-pointer select-none py-2 pl-4 pr-4 ${active ? "bg-blue-100 text-blue-900" : "text-gray-900"}`
                  }
                >
                  {({ selected }) => (
                    <>
                      <span className={selected ? "font-semibold" : "font-normal"}>
                        {year}년
                      </span>
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </div>
        </Listbox>

        {/* 월 드롭다운 */}
        <Listbox
          value={calendarDate.getMonth()}
          onChange={(month) => {
            const newDate = new Date(calendarDate);
            newDate.setMonth(month);
            setCalendarDate(newDate);
          }}
        >
          <div className="relative w-24">
            <Listbox.Button className="w-full bg-white border border-gray-300 rounded-md py-2 pl-3 pr-8 text-left shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-300 text-sm">
              {months.find((m) => m.value === calendarDate.getMonth()).label}
              <span className="absolute right-2 top-2">
                <ChevronUpDownIcon className="h-4 w-4 text-gray-400" />
              </span>
            </Listbox.Button>
            <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
              {months.map((month) => (
                <Listbox.Option
                  key={month.value}
                  value={month.value}
                  className={({ active }) =>
                    `cursor-pointer select-none py-2 pl-4 pr-4 ${active ? "bg-blue-100 text-blue-900" : "text-gray-900"}`
                  }>
                  {({ selected }) => (
                    <>
                      <span className={selected ? "font-semibold" : "font-normal"}>
                        {month.label}
                      </span>
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </div>
        </Listbox>
      </div>

      {/* 캘린더 */}
      <div className="flex justify-center py-6 px-4">
        <div className="w-[400px] sm:w-[500px] md:w-[600px]">
          <Calendar
            value={value}
            onClickDay={handleDateClick}
            tileContent={tileContent}
            formatDay={(locale, date) => date.getDate()}
            tileClassName={({ date }) => {
              const dateStr = formatDateLocal(date);
              const day = date.getDay(); // 0 = Sunday, 6 = Saturday

              if (dateStr === todayStr) {
                return "font-bold";
              }

              if (day === 0) return "text-red-500";     // Sunday
              if (day === 6) return "text-blue-500";    // Saturday

              return null; // 평일
            }}


            activeStartDate={calendarDate}
            onActiveStartDateChange={handleActiveStartDateChange}
            showNavigation={false}
          />
        </div>
      </div>
    </div>
  );
}

export default CalendarPage;

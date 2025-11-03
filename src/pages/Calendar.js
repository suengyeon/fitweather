import React, { useState, useCallback } from "react";
import Calendar from "react-calendar";
import { useNavigate, useParams } from "react-router-dom";
import { Bars3Icon, HomeIcon } from "@heroicons/react/24/solid";
import { BellIcon } from "@heroicons/react/24/outline";
import useNotiSidebar from "../hooks/useNotiSidebar"; 
import { useCalendarLogic } from "../hooks/useCalendarLogic"; 
import MenuSidebar from "../components/MenuSidebar";
import NotiSidebar from "../components/NotiSidebar";
import "react-calendar/dist/Calendar.css";
import "../pages/Calendar.css";
import { getWeatherEmoji, feelingToEmoji } from "../utils/weatherUtils";
import { formatDateLocal } from "../utils/calendarUtils"; 

function CalendarPage() {
  const navigate = useNavigate();
  const { uid } = useParams(); // URL에서 사용자 ID 가져오기

  // 1. Sidebar 및 Notification 상태/로직
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
    alarmOpen, setAlarmOpen,
    notifications, unreadCount,
    markAllRead, handleDeleteSelected,
    markOneRead, handleAlarmItemClick,
  } = useNotiSidebar();

  // 2. 🌟 캘린더 핵심 로직 적용
  const {
    value, 
    calendarDate, 
    outfitMap, 
    todayStr,
    isOwnCalendar, 
    targetUser, 
    isPublic,
    handleDateClick, 
    handleActiveStartDateChange, 
    handlePublicToggle,
  } = useCalendarLogic(uid);

  // 📌 날짜 타일에 이모지 + 날짜 표시
  const tileContent = useCallback(({ date, view }) => {
    if (view !== "month") return null;

    const dateStr = formatDateLocal(date);
    const record = outfitMap[dateStr];
    const weatherEmoji = getWeatherEmoji(record?.weather?.icon ?? record?.icon ?? "");
    const feelingText = record?.feeling ? feelingToEmoji(record.feeling) : null;
    const feelingEmoji = feelingText ? feelingText.split(' ')[0] : "";

    return (
      <div className="calendar-tile-content">
        {/* 상단: 날짜와 날씨 이모지 */}
        <div className="calendar-tile-top">
          <span className="calendar-date">{date.getDate()}</span>
          <span className="calendar-weather">{weatherEmoji}</span>
        </div>
        {/* 하단: 체감 이모지 */}
        {feelingEmoji && <div className="calendar-feeling">{feelingEmoji}</div>}
      </div>
    );
  }, [outfitMap]); // outfitMap이 변경될 때만 재생성되도록 useCallback 사용

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
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
      <div className="relative flex justify-between items-center px-4 py-3 bg-blue-100 shadow">
        {/* 왼쪽: 햄버거 버튼 */}
        <button
          className="bg-blue-200 px-3 py-1 rounded-md hover:bg-blue-300"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Bars3Icon className="w-5 h-5" />
        </button>

        {/* 가운데: 제목 (항상 중앙 고정) */}
        <h2 className="absolute left-1/2 -translate-x-1/2 font-bold text-lg">
          {/* targetUser 정보는 훅에서 가져옴 */}
          {isOwnCalendar ? "My Calendar" : `${targetUser?.nickname || "사용자"}님의 Calendar`}
        </h2>

        {/* 오른쪽: 체크박스 + 홈버튼 + 알림 버튼 */}
        <div className="flex items-center space-x-4">
          {isOwnCalendar && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="publicCalendar"
                checked={isPublic} // 훅에서 가져온 상태
                onChange={handlePublicToggle} // 훅에서 가져온 핸들러
                className="w-4 h-4"
              />
              <label htmlFor="publicCalendar" className="text-sm text-gray-700">
                캘린더 공개
              </label>
            </div>
          )}
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

      {/* 캘린더 */}
      <div className="flex justify-center py-6 px-4">
        <div className="w-full max-w-[900px] mx-auto px-4">
          <Calendar
            className="w-full max-w-none m-4 p-6 rounded-lg border-2 border-gray-200 font-sans"
            value={value} // 훅에서 가져온 상태
            onClickDay={handleDateClick} // 훅에서 가져온 핸들러
            tileContent={tileContent} // useCallback으로 감싸진 렌더링 함수
            formatDay={() => ""}
            activeStartDate={calendarDate} // 훅에서 가져온 상태
            onActiveStartDateChange={handleActiveStartDateChange} // 훅에서 가져온 핸들러
            tileClassName={({ date, view }) => {
              if (view !== "month") return "";
              const dateStr = formatDateLocal(date);
              const isOtherMonth = date.getMonth() !== calendarDate.getMonth();
              const hasRecord = !!outfitMap[dateStr]; // 훅에서 가져온 데이터 사용

              const baseClasses = "p-2 h-[100px] align-top relative text-sm";
              let addedClasses = "";

              if (date.getDay() === 0) {
                addedClasses += " text-red-500";
              } else if (date.getDay() === 6) {
                addedClasses += " text-blue-500";
              }

              if (isOtherMonth) {
                return "invisible " + baseClasses;
              }
              if (hasRecord) {
                return "font-bold " + baseClasses + addedClasses;
              }
              if (dateStr === todayStr) { // 훅에서 가져온 오늘 날짜 문자열
                return "bg-blue-100 text-black rounded-md hover:bg-blue-300 " + baseClasses + addedClasses;
              }

              return baseClasses + addedClasses;
            }}
            navigationLabel={({ date, label, locale, view }) => {
              if (view === 'month') {
                const year = date.getFullYear();
                const month = date.getMonth() + 1;
                return (
                  <div className="flex justify-center items-center gap-2 font-bold">
                    <span>{year}년</span>
                    <span>{month}월</span>
                  </div>
                );
              }
              return label;
            }}
            nextLabel=">"
            prevLabel="<"
            next2Label={null}
            prev2Label={null}
          />
        </div>
      </div>
    </div>
  );
}

export default CalendarPage;
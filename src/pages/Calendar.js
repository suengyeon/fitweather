import React, { useState, useEffect, useRef, useCallback } from "react";
import Calendar from "react-calendar";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Bars3Icon, HomeIcon } from "@heroicons/react/24/solid";
import { BellIcon } from "@heroicons/react/24/outline";
import { getDocs, collection, query, where, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import useUserProfile from "../hooks/useUserProfile";
import { useAuth } from "../contexts/AuthContext";
import useNotiSidebar from "../hooks/useNotiSidebar";
import MenuSidebar from "../components/MenuSidebar";
import NotiSidebar from "../components/NotiSidebar";
import "react-calendar/dist/Calendar.css";
import "../pages/Calendar.css";
import { getWeatherEmoji, feelingToEmoji } from "../utils/weatherUtils";
import { formatDateLocal } from "../utils/calendarUtils";

/**
 * CalendarPage 컴포넌트 - 사용자 착장 기록을 월별 캘린더 형태로 표시
 */
function CalendarPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { uid } = useParams(); // URL에서 대상 사용자 ID 가져오기(타인 캘린더 조회 시)
  const { user } = useAuth(); // 현재 로그인된 사용자
  const { profile } = useUserProfile(); // 현재 사용자 프로필

  // 1. Sidebar 및 Notification 상태/로직
  const [sidebarOpen, setSidebarOpen] = useState(false); // 메뉴 사이드바 열림/닫힘
  // useNotiSidebar 훅을 통해 알림 관련 상태와 핸들러 가져오기
  const {
    alarmOpen, setAlarmOpen,
    notifications, unreadCount,
    markAllRead, handleDeleteSelected,
    markOneRead, handleAlarmItemClick,
  } = useNotiSidebar();

  // Record 페이지에서 전달받은 선택된 날짜 또는 오늘 날짜로 초기화
  const selectedDateFromRecord = location.state?.selectedDate;
  const initialDate = selectedDateFromRecord ? new Date(selectedDateFromRecord) : new Date();

  // 캘린더 상태
  const [value, setValue] = useState(initialDate);
  const [calendarDate, setCalendarDate] = useState(initialDate);
  const [outfitMap, setOutfitMap] = useState({});
  const [targetUser, setTargetUser] = useState(null);
  const [isPublic, setIsPublic] = useState(false);
  const todayStr = formatDateLocal(new Date());
  const hasShownPrivateAlert = useRef(false);

  // 현재 사용자 ID(자신의 캘린더인지 다른 사용자의 캘린더인지 구분)
  const currentUserId = uid || user?.uid;
  const isOwnCalendar = !uid || uid === user?.uid;

  // 사용자 정보 및 공개 여부 불러오기
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUserId) return;

      // 다른 사용자의 캘린더인 경우
      if (!isOwnCalendar) {
        const userRef = doc(db, "users", currentUserId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          setTargetUser(userData);
          setIsPublic(userData.isPublic || false);

          // 공개되지 않은 캘린더인 경우 접근 거부 및 리디렉션
          if (!userData.isPublic) {
            if (!hasShownPrivateAlert.current) {
              hasShownPrivateAlert.current = true;
              alert("이 사용자의 캘린더는 비공개입니다.");
              window.history.back(); // 이전 페이지로 이동
            }
            return;
          }
        } else {
          // 사용자 문서 찾을 수 없음 처리
          if (!hasShownPrivateAlert.current) {
            hasShownPrivateAlert.current = true;
            alert("사용자를 찾을 수 없습니다.");
            window.history.back();
          }
          return;
        }
      } else {
        // 자신의 캘린더인 경우 : useUserProfile에서 가져온 프로필 사용
        setTargetUser(profile);
        setIsPublic(profile?.isPublic || false);
      }
    };

    fetchUserData();
  }, [currentUserId, isOwnCalendar, profile, navigate]);

  // 사용자 기록 불러오기
  useEffect(() => {
    if (!currentUserId) return;

    const fetchData = async () => {
      console.log("캘린더 기록 조회 시작, UID:", currentUserId);

      // 'records' 컬렉션에서 해당 사용자 UID와 일치하는 모든 기록 조회
      const q = query(collection(db, "records"), where("uid", "==", currentUserId));
      const snap = await getDocs(q);

      const map = {};

      snap.forEach((doc) => {
        const data = doc.data();

        // date 필드만 사용하고, date가 Timestamp라면 변환, 문자열이면 그대로 사용
        let dateStr = data.date;

        // Firestore Timestamp 객체일 경우 처리
        if (data.date && typeof data.date.toDate === 'function') {
          dateStr = formatDateLocal(data.date.toDate()); // YYYY-MM-DD
        } else if (typeof data.date === 'string' && data.date.includes('T')) {
          // ISO 문자열일 경우 YYYY-MM-DD 부분만 사용
          dateStr = data.date.split('T')[0];
        } else if (typeof data.date !== 'string' || !data.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // date 필드가 없거나 YYYY-MM-DD 형식이 아니면 경고
          console.warn("날짜 필드가 유효하지 않거나 없습니다:", doc.id, data.date);
          return;
        }

        if (dateStr) {
          map[dateStr] = { ...data, id: doc.id }; // 날짜를 키로 기록 맵에 저장
        } else {
          console.warn("날짜 필드 처리 실패:", doc.id);
        }
      });

      setOutfitMap(map); // 최종 기록 맵 상태 업데이트
    };

    // 기록 로드는 항상 시도(권한은 fetchUserData에서 이미 검사)
    fetchData();
  }, [currentUserId]);

  // 달력 이동 시 드롭다운 동기화(activeStartDate 변경 시 상태 업데이트)
  const handleActiveStartDateChange = useCallback(({ activeStartDate }) => {
    setCalendarDate(activeStartDate);
  }, []);

  // 날짜 클릭 시 기록 페이지 이동/생성
  const handleDateClick = (date) => {
    const dateStr = formatDateLocal(date);
    const existingRecord = outfitMap[dateStr];

    // 미래 날짜 체크(자신의 캘린더에서만)
    if (isOwnCalendar) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const clickedDate = new Date(date);
      clickedDate.setHours(0, 0, 0, 0);

      if (clickedDate > today) {
        alert("미래 날짜는 기록할 수 없습니다.");
        return;
      }
    }

    if (existingRecord) {
      if (isOwnCalendar) {
        // 자신의 기록: Record 페이지로 이동(수정)
        navigate(`/record`, { state: { existingRecord } });
      } else {
        // 다른 사용자의 기록: FeedDetail 페이지로 이동(조회)
        navigate(`/feed-detail/${existingRecord.id}`, {
          state: {
            fromCalendar: true,
            targetUserId: currentUserId
          }
        });
      }
    } else if (isOwnCalendar) {
      // 자신의 캘린더에서만 새 기록 생성 가능
      const isToday = dateStr === todayStr;
      const state = { date: dateStr };

      if (isToday) {
        state.selectedRegion = profile?.region; // 오늘 날짜면 프로필 지역 전달
      }

      navigate("/record", { state }); // 새 기록 생성 페이지로 이동
    }
  };

  // 공개 여부 토글 함수(자신의 'users' 문서 업데이트)
  const handlePublicToggle = async () => {
    if (!isOwnCalendar || !user?.uid) return;

    const newPublicState = !isPublic;

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        isPublic: newPublicState
      });

      setIsPublic(newPublicState);
      alert(newPublicState ? "캘린더가 공개되었습니다." : "캘린더가 비공개로 설정되었습니다.");
    } catch (error) {
      console.error("공개 여부 업데이트 실패:", error);
      alert("공개 여부 변경에 실패했습니다.");
    }
  };

  // 📌 날짜 타일에 이모지 + 날짜 표시(tileContent)
  const tileContent = useCallback(({ date, view }) => {
    if (view !== "month") return null;

    const dateStr = formatDateLocal(date);
    const record = outfitMap[dateStr]; // 해당 날짜의 기록 가져오기

    // 기록이 있는 경우 : 날씨 및 체감 이모지 추출
    let weatherEmoji = '';
    let feelingEmoji = '';

    if (record) {
      const weatherIconCode = record?.weather?.icon ?? record?.icon ?? "";
      weatherEmoji = getWeatherEmoji(weatherIconCode);

      const feelingText = record?.feeling ? feelingToEmoji(record.feeling) : null;
      feelingEmoji = feelingText ? feelingText.split(' ')[0] : "";
    }

    return (
      <div className="calendar-tile-content w-full h-full">
        {/* 상단 : 날짜 및 날씨 이모지 */}
        <div className="flex justify-between items-center w-full gap-0">
          {/* 날짜 숫자는 항상 렌더링 */}
          <span className="text-s font-medium">{date.getDate()}</span>
          <span className="text-base">
            {record ? weatherEmoji : '\u00a0'}
          </span>
        </div>

        {/* 하단 : 체감 이모지 */}
        <div className="w-full text-center mt-0.5" style={{ height: '1.2em' }}> 
          <span className="text-xl">
            {record && feelingEmoji ? feelingEmoji : '\u00a0'}
          </span>
        </div>
      </div>
    );
  }, [outfitMap]);

  // --- 렌더링 ---
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* 메뉴 및 알림 사이드바 */}
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
        {/* 왼쪽 */}
        <button
          className="bg-blue-200 px-3 py-1 rounded-md hover:bg-blue-300"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Bars3Icon className="w-5 h-5" />
        </button>

        {/* 가운데 */}
        <h2 className="absolute left-1/2 -translate-x-1/2 font-bold text-lg">
          {isOwnCalendar ? "My Calendar" : `${targetUser?.nickname || "사용자"}님의 Calendar`}
        </h2>

        {/* 오른쪽 */}
        <div className="flex items-center space-x-4">
          {/* 캘린더 공개 여부 체크박스(자신의 캘린더일 경우만 표시) */}
          {isOwnCalendar && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="publicCalendar"
                checked={isPublic}
                onChange={handlePublicToggle}
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
          {/* 알림 버튼 (unreadCount 표시) */}
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

      {/* 캘린더 본체 */}
      <div className="flex justify-center py-6 px-4">
        <div className="w-full max-w-[900px] mx-auto px-4">
          <Calendar
            className="w-full max-w-none m-4 p-6 rounded-lg border-2 border-gray-200 font-sans"
            value={value}
            onClickDay={handleDateClick}
            tileContent={tileContent}
            formatDay={() => ""} // 날짜 숫자만 표시하도록 포맷팅 비활성화
            activeStartDate={calendarDate}
            onActiveStartDateChange={handleActiveStartDateChange}
            tileClassName={({ date, view }) => {
              if (view !== "month") return "";
              const dateStr = formatDateLocal(date);
              const isOtherMonth = date.getMonth() !== calendarDate.getMonth();
              const hasRecord = !!outfitMap[dateStr]; // 기록 존재 여부

              const baseClasses = "p-2 h-[100px] align-top relative text-sm";
              let addedClasses = "";

              // 주말 색상 지정
              if (date.getDay() === 0) {
                addedClasses += " text-red-500";
              } else if (date.getDay() === 6) {
                addedClasses += " text-blue-500";
              }

              // 타일 클래스 최종 결정
              if (isOtherMonth) {
                return "invisible " + baseClasses; // 이전/다음 달 날짜 숨김
              }
              if (hasRecord) {
                return "font-bold " + baseClasses + addedClasses; // 기록 있으면 폰트 굵게
              }
              if (dateStr === todayStr) {
                return "bg-blue-100 text-black rounded-md hover:bg-blue-300 " + baseClasses + addedClasses; // 오늘 날짜 배경색
              }
              return baseClasses + addedClasses;
            }}
            navigationLabel={({ date, view }) => {
              if (view === 'month') {
                // 네비게이션 라벨을 'YYYY년 MM월' 형식으로 커스터마이징
                const year = date.getFullYear();
                const month = date.getMonth() + 1;
                return (
                  <div className="flex justify-center items-center gap-2 font-bold">
                    <span>{year}년</span>
                    <span>{month}월</span>
                  </div>
                );
              }
              return null;
            }}
            nextLabel=">"
            prevLabel="<"
            next2Label=">>"
            prev2Label="<<"
          />
        </div>
      </div>
    </div>
  );
}

export default CalendarPage;
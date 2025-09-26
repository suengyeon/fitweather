import React, { useEffect, useState } from "react";
import Calendar from "react-calendar";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Bars3Icon, HomeIcon } from "@heroicons/react/24/solid";
import { getDocs, collection, query, where, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import useUserProfile from "../hooks/useUserProfile";
import { useAuth } from "../contexts/AuthContext";
import MenuSidebar from "../components/MenuSidebar";
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
  const { uid } = useParams(); // URL에서 사용자 ID 가져오기
  const { user } = useAuth();
  const { profile } = useUserProfile();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [targetUser, setTargetUser] = useState(null);
  const [isPublic, setIsPublic] = useState(false);

  // Record 페이지에서 전달받은 선택된 날짜가 있으면 사용, 없으면 오늘 날짜
  const selectedDateFromRecord = location.state?.selectedDate;
  const initialDate = selectedDateFromRecord ? new Date(selectedDateFromRecord) : new Date();

  const [value, setValue] = useState(initialDate);
  const [calendarDate, setCalendarDate] = useState(initialDate);
  const [outfitMap, setOutfitMap] = useState({});
  const todayStr = formatDateLocal(new Date());

  // 현재 사용자 ID (자신의 캘린더인지 다른 사용자의 캘린더인지 구분)
  const currentUserId = uid || user?.uid;
  const isOwnCalendar = !uid || uid === user?.uid;

  // 🔄 사용자 정보 및 공개 여부 불러오기
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

          // 공개되지 않은 캘린더인 경우 접근 거부
          if (!userData.isPublic) {
            alert("이 사용자의 캘린더는 비공개입니다.");
            navigate("/feed");
            return;
          }
        } else {
          alert("사용자를 찾을 수 없습니다.");
          navigate("/feed");
          return;
        }
      } else {
        // 자신의 캘린더인 경우
        setTargetUser(profile);
        setIsPublic(profile?.isPublic || false);
        console.log("자신의 캘린더 - isPublic 상태:", profile?.isPublic);
      }
    };

    fetchUserData();
  }, [currentUserId, isOwnCalendar, profile, navigate]);

  // 🔄 사용자 기록 불러오기
  useEffect(() => {
    if (!currentUserId) return;

    const fetchData = async () => {
      const q = query(collection(db, "records"), where("uid", "==", currentUserId));
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
  }, [currentUserId]);

  // 📆 달력 이동 시 드롭다운 동기화
  const handleActiveStartDateChange = ({ activeStartDate }) => {
    setCalendarDate(activeStartDate);
  };

  // 📌 날짜 클릭 시 기록 페이지 이동
  const handleDateClick = (date) => {
    const dateStr = formatDateLocal(date);
    const existingRecord = outfitMap[dateStr];

    // 미래 날짜 체크 (자신의 캘린더에서만)
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
        // 자신의 기록: Record 페이지로 이동
        navigate(`/record`, { state: { existingRecord } });
      } else {
        // 다른 사용자의 기록: FeedDetail 페이지로 이동
        navigate(`/feed/${existingRecord.id}`, {
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
        state.selectedRegion = profile?.region;
      }

      navigate("/record", { state });
    }
  };

  // 공개 여부 토글 함수
  const handlePublicToggle = async () => {
    if (!isOwnCalendar || !user?.uid) return;

    const newPublicState = !isPublic;

    try {
      console.log("공개 여부 변경 중:", newPublicState);
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        isPublic: newPublicState
      });

      // 상태 업데이트
      setIsPublic(newPublicState);
      console.log("공개 여부 변경 완료:", newPublicState);

      // 성공 메시지
      alert(newPublicState ? "캘린더가 공개되었습니다." : "캘린더가 비공개로 설정되었습니다.");
    } catch (error) {
      console.error("공개 여부 업데이트 실패:", error);
      alert("공개 여부 변경에 실패했습니다.");
    }
  };

  const getWeatherEmoji = (iconCode) => {
    switch (iconCode) {
      case "sunny": return "☀️";
      case "cloudy": return "☁️";
      case "overcast": return "🌥️";
      case "rain": return "🌧️";
      case "snow": return "❄️";
      case "snow_rain": return "🌨️";
      case "shower": return "🌦️";
      default: return "";
    }
  };

  // 📌 날짜 타일에 이모지 + 날짜 표시
  const tileContent = ({ date, view }) => {
    if (view !== "month") return null;

    const dateStr = formatDateLocal(date);
    const record = outfitMap[dateStr];
    const weatherEmoji = getWeatherEmoji(record?.weather?.icon ?? record?.icon ?? "");
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
          <span className="calendar-weather">{weatherEmoji}</span>
        </div>
        {/* 하단: 체감 이모지 */}
        {feelingEmoji && <div className="calendar-feeling">{feelingEmoji}</div>}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <MenuSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
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
          {isOwnCalendar ? "My Calendar" : `${targetUser?.nickname || "사용자"}님의 Calendar`}
        </h2>

        {/* 오른쪽: 체크박스 + 홈버튼 */}
        <div className="flex items-center gap-3">
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
        </div>
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
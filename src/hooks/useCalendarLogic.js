import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getDocs, collection, query, where, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase"; 
import { useAuth } from "../contexts/AuthContext"; 
import useUserProfile from "../hooks/useUserProfile"; 
import { formatDateLocal } from "../utils/calendarUtils"; 

// 오늘의 날짜를 'YYYY-MM-DD' 형식으로 미리 계산
const todayStr = formatDateLocal(new Date());

/**
 * 캘린더 페이지의 핵심 로직을 처리하는 커스텀 훅
 */
export const useCalendarLogic = (urlUid) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { profile } = useUserProfile();

  // 현재 사용자 ID(urlUid가 없으면 자신의 캘린더)
  const currentUserId = urlUid || user?.uid;
  const isOwnCalendar = !urlUid || urlUid === user?.uid;

  // Record 페이지에서 전달받은 날짜 또는 오늘 날짜를 초기값으로 설정
  const selectedDateFromRecord = location.state?.selectedDate;
  const initialDate = selectedDateFromRecord ? new Date(selectedDateFromRecord) : new Date();

  // 캘린더 상태
  const [value, setValue] = useState(initialDate); // react-calendar의 value
  const [calendarDate, setCalendarDate] = useState(initialDate); // 현재 보여지는 월
  const [outfitMap, setOutfitMap] = useState({}); // 날짜별 기록 데이터 맵

  // 사용자 정보 및 권한 상태
  const [targetUser, setTargetUser] = useState(null);
  const [isPublic, setIsPublic] = useState(false);
  const hasShownPrivateAlert = useRef(false); // 비공개 캘린더 접근 경고 중복 방지

  // --- 1. 사용자 정보 및 공개 여부 불러오기 ---
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUserId) return;

      if (!isOwnCalendar) {
        // 다른 사용자의 캘린더 : Firestore 'users' 문서 조회
        const userRef = doc(db, "users", currentUserId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          setTargetUser(userData);
          const publicStatus = userData.isPublic || false;
          setIsPublic(publicStatus);

          // 비공개 캘린더 접근 시 차단 및 리다이렉션
          if (!publicStatus) {
            if (!hasShownPrivateAlert.current) {
              hasShownPrivateAlert.current = true;
              alert("이 사용자의 캘린더는 비공개입니다.");
              navigate("/feed", { replace: true });
            }
          }
        } else {
          // 사용자 찾을 수 없음 처리
          if (!hasShownPrivateAlert.current) {
            hasShownPrivateAlert.current = true;
            alert("사용자를 찾을 수 없습니다.");
            navigate("/feed", { replace: true });
          }
        }
      } else {
        // 자신의 캘린더 : useUserProfile 훅에서 가져온 정보 사용
        setTargetUser(profile);
        setIsPublic(profile?.isPublic || false);
      }
    };

    fetchUserData();
  }, [currentUserId, isOwnCalendar, profile, navigate]);


  // --- 2. 사용자 기록 불러오기 ---
  useEffect(() => {
    if (!currentUserId) return;

    const fetchData = async () => {
      // 비공개 캘린더이면서 자신의 캘린더가 아니면 데이터를 불러오지 않음
      if (!isOwnCalendar && targetUser && !targetUser.isPublic) {
          setOutfitMap({});
          return;
      }
      
      // 'records' 컬렉션에서 해당 사용자의 모든 기록 조회 쿼리
      const q = query(collection(db, "records"), where("uid", "==", currentUserId));
      const snap = await getDocs(q);

      const map = {};
      // 날짜(date)를 키로 하는 기록 맵 생성
      snap.forEach((doc) => {
        const data = doc.data();
        if (data.date) {
          map[data.date] = { ...data, id: doc.id };
        }
      });

      setOutfitMap(map);
    };

    // targetUser 상태가 확정(다른 사용자 캘린더)되거나 자신의 캘린더일 때 기록 로드
    if (isOwnCalendar || targetUser) {
        fetchData();
    }
  }, [currentUserId, isOwnCalendar, targetUser]);


  // --- 3. 이벤트 핸들러 ---

  // 📌 날짜 클릭 시 기록 페이지 이동/조회
  const handleDateClick = useCallback((date) => {
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
        // 자신의 기록 : Record 페이지로 이동(수정)
        navigate(`/record`, { state: { existingRecord } });
      } else {
        // 다른 사용자의 기록 : FeedDetail 페이지로 이동(조회)
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

      if (isToday && profile?.region) {
        state.selectedRegion = profile.region;
      }

      navigate("/record", { state });
    }
    // outfitMap이 변경될 때마다 갱신 필요
  }, [isOwnCalendar, outfitMap, currentUserId, navigate, profile]); 

  // 달력 이동 시 드롭다운 동기화(활성 월 변경 시 상태 업데이트)
  const handleActiveStartDateChange = useCallback(({ activeStartDate }) => {
    setCalendarDate(activeStartDate);
  }, []);

  // 공개 여부 토글 함수(자신의 캘린더에서만 가능)
  const handlePublicToggle = useCallback(async () => {
    if (!isOwnCalendar || !user?.uid) return;

    const newPublicState = !isPublic;

    try {
      // Firestore 'users' 문서의 isPublic 필드 업데이트
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
  }, [isOwnCalendar, user?.uid, isPublic]);

  return {
    // 캘린더 상태
    value,
    setValue,
    calendarDate,
    outfitMap,
    todayStr,

    // 사용자/권한 상태
    currentUserId,
    isOwnCalendar,
    targetUser,
    isPublic,
    
    // 핸들러
    handleDateClick,
    handleActiveStartDateChange,
    handlePublicToggle,
  };
};
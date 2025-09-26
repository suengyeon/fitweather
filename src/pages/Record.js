// src/pages/Record.js
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { auth, db, storage } from "../firebase";
import useUserProfile from "../hooks/useUserProfile";
import useWeather from "../hooks/useWeather";
import { HomeIcon, ArrowLeftIcon } from "@heroicons/react/24/solid";
import { XMarkIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import { collection, query, where, getDocs, addDoc, deleteDoc, updateDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "../contexts/AuthContext";
import MenuSidebar from "../components/MenuSidebar";
import { getPastWeatherData, fetchAndSavePastWeather, deletePastWeatherData, savePastWeatherData } from "../api/pastWeather";
import { fetchKmaPastWeather } from "../api/kmaPastWeather";

function formatDateLocal(date) {
  return date.toLocaleDateString("sv-SE"); // YYYY-MM-DD 형식 (KST 기준)
}

function isToday(dateStr) {
  const today = new Date();
  const todayStr = formatDateLocal(today);
  return dateStr === todayStr;
}

// 날씨 아이콘 코드에 따른 이모지 반환 함수
function getWeatherEmoji(iconCode) {
  switch (iconCode) {
    case "sunny": return "☀️";        // 맑음
    case "cloudy": return "☁️";       // 구름많음
    case "overcast": return "🌥️";     // 흐림
    case "rain": return "🌧️";        // 비
    case "snow": return "❄️";        // 눈
    case "snow_rain": return "🌨️";   // 비/눈
    case "shower": return "🌦️";      // 소나기
    default: return "☁️";            // 기본값: 구름
  }
}

function addReplyRecursively(nodes, targetId, newReply) {
  if (!Array.isArray(nodes)) return nodes;
  return nodes.map((node) => {
    if (node.id === targetId) {
      const nextReplies = Array.isArray(node.replies) ? [...node.replies, newReply] : [newReply];
      return { ...node, replies: nextReplies };
    }
    if (Array.isArray(node.replies) && node.replies.length > 0) {
      return { ...node, replies: addReplyRecursively(node.replies, targetId, newReply) };
    }
    return node;
  });
}

// targetId에 해당하는 노드만 지우고, 그 노드의 자식(replies)은 같은 위치로 승격하여 보존
function deleteNodeKeepChildren(nodes, targetId) {
  if (!Array.isArray(nodes)) return { list: nodes, changed: false };

  let changed = false;
  const result = [];

  for (const node of nodes) {
    if (node.id === targetId) {
      // ✅ 이 노드만 삭제하고, 자식들을 같은 레벨로 승격
      if (Array.isArray(node.replies) && node.replies.length > 0) {
        result.push(...node.replies);
      }
      changed = true;
      continue; // 현재 노드는 추가하지 않음
    }

    // 자식들 재귀 처리
    let nextNode = node;
    if (Array.isArray(node.replies) && node.replies.length > 0) {
      const { list: childList, changed: childChanged } = deleteNodeKeepChildren(node.replies, targetId);
      if (childChanged) {
        changed = true;
        nextNode = { ...node, replies: childList };
      }
    }
    result.push(nextNode);
  }

  return { list: result, changed };
}

function Record() {
  const today = new Date();
  const navigate = useNavigate();
  const location = useLocation();
  const existingRecord = location.state?.existingRecord || null;
  const passedDateStr = location.state?.date || null;
  // existingRecord가 있으면 그 날짜를 사용, 없으면 passedDateStr 사용
  const dateStr = existingRecord?.date || passedDateStr;
  const dateObj = dateStr ? new Date(dateStr) : new Date();
  const formattedDate = `${dateObj.getFullYear()}년 ${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일`;

  const { profile, loading: profileLoading } = useUserProfile();
  const { user } = useAuth();
  const [regionName, setRegionName] = useState("");

  // 댓글 관련 상태 (기록이 있을 때만 사용)
  const [isCommentViewVisible, setIsCommentViewVisible] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyToCommentId, setReplyToCommentId] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 오늘 날짜인지 확인하는 함수
  const isToday = (dateStr) => {
    const today = new Date();
    const targetDate = new Date(dateStr);
    return today.toDateString() === targetDate.toDateString();
  };

  // 지역 정보 설정: 기록이 있으면 기록의 지역, 없으면 사용자 기본 지역 또는 Home에서 전달받은 지역
  const [selectedRegion, setSelectedRegion] = useState(() => {
    if (existingRecord?.region) {
      return existingRecord.region; // 기존 기록이 있으면 기록의 지역
    }
    return location.state?.selectedRegion || "Seoul"; // 기본값: 서울
  });

  // profile이 로드된 후 selectedRegion 업데이트
  useEffect(() => {
    if (profile?.region && !existingRecord?.region) {
      const isTodayDate = isToday(dateStr);
      if (!isTodayDate) {
        // 과거 날짜는 사용자 기본 지역 사용
        setSelectedRegion(profile.region);
      } else if (!location.state?.selectedRegion) {
        // 오늘 날짜이고 Home에서 전달받은 지역이 없으면 사용자 기본 지역 사용
        setSelectedRegion(profile.region);
      }
    }
  }, [profile?.region, existingRecord?.region, dateStr, location.state?.selectedRegion]);

  const [image, setImage] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [outfit, setOutfit] = useState({ outer: [], top: [], bottom: [], shoes: [], acc: [] });
  const [selectedItems, setSelectedItems] = useState({ outer: "", top: "", bottom: "", shoes: "", acc: "" });
  const [customInputMode, setCustomInputMode] = useState({ outer: false, top: false, bottom: false, shoes: false, acc: false });
  const [customInputs, setCustomInputs] = useState({ outer: "", top: "", bottom: "", shoes: "", acc: "" });
  const [feeling, setFeeling] = useState("");
  const [memo, setMemo] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [weatherEmojis, setWeatherEmojis] = useState([]);
  const [imagePreviewIdx, setImagePreviewIdx] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [recordId, setRecordId] = useState(null);

  const inputRefs = { outer: useRef(), top: useRef(), bottom: useRef(), shoes: useRef(), acc: useRef() };

  // 날씨 API 연동 (오늘 날짜일 때만)
  const { weather: apiWeather, loading: apiWeatherLoading } = useWeather(
    isToday(dateStr) ? selectedRegion : null
  );

  // 과거 날씨 데이터 상태
  const [pastWeather, setPastWeather] = useState(null);
  const [pastWeatherLoading, setPastWeatherLoading] = useState(false);

  // 과거 날짜일 때 저장된 날씨 데이터 불러오기
  useEffect(() => {
    const loadPastWeather = async () => {
      console.log("날짜 확인:", dateStr, "오늘인가?", isToday(dateStr), "지역:", selectedRegion);

      if (isToday(dateStr) || !selectedRegion) {
        console.log("오늘 날짜이거나 지역이 없어서 과거 날씨 로딩 건너뜀");
        setPastWeather(null);
        return;
      }

      setPastWeatherLoading(true);
      try {
        console.log("과거 날씨 데이터 불러오기:", dateStr, selectedRegion);

        // 먼저 저장된 데이터 확인
        const savedData = await getPastWeatherData(dateStr, selectedRegion);
        if (savedData) {
          console.log("저장된 과거 날씨 데이터 발견:", savedData);
          console.log("강수량:", savedData.avgRain, "온도:", savedData.avgTemp);

          // 9월 12일이면 항상 삭제하고 다시 생성 (강수량 데이터 확인을 위해)
          if (dateStr === "2025-09-12") {
            console.log("9월 12일 데이터 삭제 후 다시 생성 (강수량 데이터 확인)");
            await deletePastWeatherData(dateStr, selectedRegion);
            // 삭제 후 계속 진행하여 새로운 데이터 생성
          } else {
            const weatherData = {
              temp: savedData.avgTemp,
              rain: savedData.avgRain,
              humidity: savedData.avgHumidity,
              icon: savedData.iconCode,
              season: savedData.season,
              sky: savedData.sky,
              pty: savedData.pty
            };
            setPastWeather(weatherData);
            setPastWeatherLoading(false);
            return;
          }
        }

        // 저장된 데이터가 없으면 과거 관측 API에서 직접 가져오기
        console.log("🌧️ 기상청 과거 관측 API 직접 호출:", dateStr, selectedRegion);
        console.log("🔍 fetchKmaPastWeather 함수 호출 시작");
        let pastData = await fetchKmaPastWeather(dateStr, selectedRegion);
        console.log("🔍 fetchKmaPastWeather 함수 호출 완료, 결과:", pastData);

        if (pastData) {
          console.log("✅ 기상청 과거 관측 API에서 데이터 가져옴:", pastData);
          // 실제 데이터 저장
          await savePastWeatherData(dateStr, selectedRegion, pastData);
        } else {
          console.log("⚠️ 과거 관측 API 실패, fetchAndSavePastWeather 시도");
          const fallbackData = await fetchAndSavePastWeather(dateStr, selectedRegion);
          if (fallbackData) {
            pastData = fallbackData;
          }
        }
        if (pastData) {
          const weatherData = {
            temp: pastData.avgTemp,
            rain: pastData.avgRain,
            humidity: pastData.avgHumidity,
            icon: pastData.iconCode,
            season: pastData.season,
            sky: pastData.sky,
            pty: pastData.pty
          };
          setPastWeather(weatherData);
          console.log("과거 날씨 데이터 로드 완료:", weatherData);
        } else {
          // API에서도 데이터를 가져올 수 없으면 기본값 사용
          const defaultWeather = {
            temp: "20",
            rain: "0",
            humidity: "60",
            icon: "sunny",
            season: "초가을",
            sky: "1",
            pty: "0"
          };
          setPastWeather(defaultWeather);
          console.log("기본값 사용:", defaultWeather);
        }
      } catch (error) {
        console.error("과거 날씨 데이터 로드 실패:", error);
        // 에러 발생 시에도 기본값 사용
        const defaultWeather = {
          temp: "20",
          rain: "0",
          humidity: "60",
          icon: "sunny",
          season: "초가을",
          sky: "1",
          pty: "0"
        };
        setPastWeather(defaultWeather);
      } finally {
        setPastWeatherLoading(false);
      }
    };

    loadPastWeather();
  }, [dateStr, selectedRegion]);

  // 날씨 정보 설정: 기록이 있으면 기록된 날씨, 오늘 날짜면 실시간 날씨, 과거 날짜면 저장된 과거 날씨 사용
  const weather = existingRecord?.weather ||
    (isToday(dateStr) ? apiWeather : pastWeather) || {
    temp: 20,
    rain: 0,
    humidity: 60,
    icon: "sunny",
    season: "초가을"
  };

  // 로딩 상태: 오늘은 API 로딩, 과거는 과거 데이터 로딩
  const loading = profileLoading ||
    (isToday(dateStr) ? apiWeatherLoading : pastWeatherLoading);


  // 지역 변경 핸들러
  const handleRegionChange = (newRegion) => {
    setSelectedRegion(newRegion);
    // 지역 변경 시 날씨 정보는 useWeather 훅에서 자동으로 업데이트됨
  };

  useEffect(() => {
    if (selectedRegion) {
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
        Gwangju: "광주"
      };
      setRegionName(regionMap[selectedRegion] || selectedRegion);
    }
  }, [selectedRegion]);

  useEffect(() => {
    if (existingRecord) {
      setIsEditMode(true);
      setRecordId(existingRecord.id);

      // 기존 기록의 지역 정보 설정 (이미 위에서 설정했지만 확실히 하기 위해)
      if (existingRecord.region) {
        setSelectedRegion(existingRecord.region);
      }

      setOutfit(existingRecord.outfit || {});
      setFeeling(existingRecord.feeling || "");
      setMemo(existingRecord.memo || "");
      setIsPublic(existingRecord.isPublic || false);
      setWeatherEmojis(existingRecord.weatherEmojis || []);
      setImageFiles(existingRecord.imageUrls.map((url) => ({ name: url, isUrl: true })));
      setImagePreviewIdx(0);
    }
  }, [existingRecord]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).filter(f => f && f.name);
    if (!files.length) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    const maxSizeMB = 3;
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        alert("jpg, png, gif 형식의 이미지 파일만 업로드 가능합니다.");
        return;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        alert(`이미지 용량은 ${maxSizeMB}MB 이하로 업로드해주세요.`);
        return;
      }
    }

    setImageFiles((prev) => {
      const newList = [...prev, ...files];

      // 처음 업로드인 경우만 preview 초기화
      if (prev.length === 0 && newList.length > 0) {
        setImage(URL.createObjectURL(newList[0]));
        setImagePreviewIdx(0);
      }

      return newList;
    });
  };

  const handleImageDelete = () => {
    if (imageFiles.length === 0) return;

    const confirmDelete = window.confirm("현재 사진을 삭제하시겠어요?");
    if (!confirmDelete) return;

    setImageFiles((prev) => {
      const newList = prev.filter((_, index) => index !== imagePreviewIdx);

      // 삭제 후 이미지 인덱스 조정
      if (newList.length === 0) {
        setImage(null);
        setImagePreviewIdx(0);
      } else if (imagePreviewIdx >= newList.length) {
        setImagePreviewIdx(newList.length - 1);
      }

      return newList;
    });
  };

  const handleAddItem = (category, value) => {
    if (!value.trim()) return;
    setOutfit((prev) => ({ ...prev, [category]: [...prev[category], value] }));
  };

  const handleRemoveItem = (category, idx) => {
    setOutfit((prev) => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== idx)
    }));
  };

  // 드롭다운 선택 핸들러
  const handleSelectChange = (category, value) => {
    if (value === "custom") {
      // 직접입력 모드로 전환
      setCustomInputMode((prev) => ({ ...prev, [category]: true }));
      setSelectedItems((prev) => ({ ...prev, [category]: "" }));
    } else {
      // 일반 선택
      setCustomInputMode((prev) => ({ ...prev, [category]: false }));
      setSelectedItems((prev) => ({ ...prev, [category]: value }));
    }
  };

  // 직접입력 핸들러
  const handleCustomInputChange = (category, value) => {
    setCustomInputs((prev) => ({ ...prev, [category]: value }));
  };

  // 직접입력에서 드롭다운으로 돌아가기
  const handleBackToDropdown = (category) => {
    setCustomInputMode((prev) => ({ ...prev, [category]: false }));
    setCustomInputs((prev) => ({ ...prev, [category]: "" }));
  };

  // + 버튼 클릭 핸들러
  const handleAddSelectedItem = (category) => {
    let valueToAdd = "";

    if (customInputMode[category]) {
      // 직접입력 모드인 경우
      valueToAdd = customInputs[category];
      if (!valueToAdd.trim()) return;
      // 직접입력 후 드롭다운으로 돌아가기
      setCustomInputMode((prev) => ({ ...prev, [category]: false }));
      setCustomInputs((prev) => ({ ...prev, [category]: "" }));
    } else {
      // 일반 드롭다운 선택인 경우
      const selectedValue = selectedItems[category];
      if (!selectedValue) return;

      // 선택된 옵션의 텍스트를 가져오기 위해 옵션 목록에서 찾기
      const optionTexts = {
        outer: { jacket: "재킷", blazer: "점퍼", coat: "코트", cardigan: "가디건", hoodzipup: "후드집업", blazer: "블레이저", windbreak: "바람막이", jersey: "저지", padding: "패딩" },
        top: { tshirt: "티셔츠", shirt: "셔츠", blouse: "블라우스", tank: "탱크톱", sweater: "스웨터" },
        bottom: { jeans: "청바지", pants: "바지", shorts: "반바지", skirt: "치마", leggings: "레깅스" },
        shoes: { sneakers: "스니커즈", boots: "부츠", sandals: "샌들", heels: "힐", loafers: "로퍼" },
        acc: { bag: "가방", hat: "모자", scarf: "스카프", watch: "시계", jewelry: "액세서리" }
      };

      valueToAdd = optionTexts[category][selectedValue] || selectedValue;
      setSelectedItems((prev) => ({ ...prev, [category]: "" }));
    }

    setOutfit((prev) => ({ ...prev, [category]: [...prev[category], valueToAdd] }));
  };

  const handleDelete = async () => {
    if (!recordId) return;
    const confirmDelete = window.confirm("정말 삭제하시겠어요?");
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "records", recordId));
      toast.success("기록이 삭제되었어요!", { autoClose: 1200 });
      setTimeout(() => navigate("/calendar"), 1300);
    } catch (err) {
      console.error("삭제 오류:", err);
      toast.error("삭제에 실패했습니다.");
    }
  };

  const handleSubmit = async () => {
    console.log("저장 시작 - 사용자:", user?.uid);

    if (!user) {
      console.log("저장 실패: 로그인 필요");
      toast.error("로그인이 필요합니다.");
      return;
    }

    console.log("이미지 파일 확인:", imageFiles);
    if (!imageFiles.length || imageFiles.some(f => !f || (!f.name && !f.isUrl))) {
      console.log("저장 실패: 이미지 없음");
      toast.error("사진을 업로드해주세요.");
      return;
    }

    console.log("체감 확인:", feeling);
    if (!feeling) {
      console.log("저장 실패: 체감 선택 안됨");
      toast.error("체감을 선택해주세요.");
      return;
    }

    console.log("날씨 정보 확인:", weather);
    if (typeof weather?.temp === "undefined" || typeof weather?.rain === "undefined") {
      console.log("저장 실패: 날씨 정보 없음");
      toast.error("날씨 정보가 아직 준비되지 않았습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    console.log("스토리지 확인:", storage);
    if (!storage) {
      console.log("저장 실패: 스토리지 없음");
      toast.error("스토리지 인스턴스가 올바르지 않습니다. 새로고침 후 다시 시도해 주세요.");
      return;
    }

    console.log("저장 진행 중...");
    setSubmitLoading(true);

    try {
      console.log("저장 데이터 준비 중...");
      console.log("수정 모드:", isEditMode);
      console.log("날짜:", dateStr);

      // ✅ (수정 모드가 아닐 때만) 중복 기록 체크
      if (!isEditMode) {
        console.log("중복 기록 체크 중...");
        const q = query(
          collection(db, "records"),
          where("uid", "==", user.uid),
          where("date", "==", dateStr)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          console.log("저장 실패: 중복 기록");
          toast.error("이미 기록하셨습니다.");
          setSubmitLoading(false);
          return;
        }
        console.log("중복 기록 없음, 계속 진행");
      }

      // ✅ 이미지 업로드: 새로 추가된 이미지만 업로드, 기존은 그대로 사용
      console.log("이미지 업로드 시작...");
      const imageUrls = await Promise.all(
        imageFiles.map(async (file) => {
          if (file.isUrl) return file.name; // 기존 URL
          if (!file || !file.name) throw new Error("잘못된 파일입니다.");
          const imageRef = ref(storage, `records/${user.uid}/${Date.now()}_${file.name}`);
          await uploadBytes(imageRef, file);
          return await getDownloadURL(imageRef);
        })
      );
      console.log("이미지 업로드 완료:", imageUrls);

      const recordData = {
        uid: user.uid,
        region: profile?.region,
        regionName,
        date: dateStr,
        temp: weather.temp ?? null,
        rain: weather.rain ?? null,
        humidity: weather.humidity ?? null,
        weather: {
          temp: weather.temp ?? null,
          rain: weather.rain ?? null,
          humidity: weather.humidity ?? null,
          icon: weather.icon ?? null,
        },
        outfit,
        feeling,
        memo,
        isPublic,
        imageUrls,
        weatherEmojis,
        updatedAt: new Date(),
        nickname: profile?.nickname || user.uid,
        // 기록한 날짜와 시간 추가
        recordedDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD 형식
        recordedTime: new Date().toLocaleTimeString('ko-KR', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit'
        }), // HH:MM 형식
        recordedAt: new Date(), // 전체 날짜시간 (ISO 형식)
      };

      console.log("저장할 데이터:", recordData);

      if (isEditMode && recordId) {
        // ✅ 기존 기록 수정 - date 필드는 변경하지 않음
        console.log("기록 수정 중...");
        const updateData = { ...recordData };
        delete updateData.createdAt; // createdAt 필드만 제거
        await updateDoc(doc(db, "records", recordId), updateData);
        console.log("기록 수정 완료");
        toast.success("기록이 수정되었어요!", { position: "top-center", autoClose: 1200 });
      } else {
        // ✅ 새 기록 저장
        console.log("새 기록 저장 중...");
        recordData.createdAt = new Date();
        recordData.likes = [];
        const docRef = await addDoc(collection(db, "records"), recordData);
        console.log("새 기록 저장 완료, ID:", docRef.id);
        toast.success("기록이 저장되었어요!", { position: "top-center", autoClose: 1200 });
      }

      // 수정 모드일 때는 선택한 날짜 정보를 캘린더에 전달
      if (isEditMode) {
        setTimeout(() => navigate("/calendar", { state: { selectedDate: dateStr } }), 1300);
      } else {
        setTimeout(() => navigate("/calendar"), 1300);
      }
    } catch (err) {
      console.error("저장 오류 발생:", err);
      console.error("오류 상세:", err.message);
      console.error("오류 스택:", err.stack);
      toast.error(`저장에 실패했습니다: ${err.message}`);
    } finally {
      console.log("저장 프로세스 종료");
      setSubmitLoading(false);
    }
  };

  // 댓글 관련 함수들 (기록이 있을 때만 사용)
  const handleCommentViewToggle = () => {
    setIsCommentViewVisible(!isCommentViewVisible);
  };

  // 댓글 새로고침 핸들러
  const handleRefreshComments = async () => {
    if (!existingRecord?.id) return;

    setIsRefreshing(true);
    try {
      console.log("Record - 댓글 새로고침 시작 - record ID:", existingRecord.id);
      const commentsRef = doc(db, "comments", existingRecord.id);
      const commentsSnap = await getDoc(commentsRef);
      console.log("Record - 댓글 새로고침 - 문서 존재 여부:", commentsSnap.exists());
      if (commentsSnap.exists()) {
        const commentsData = commentsSnap.data();
        console.log("Record - 댓글 새로고침 - 최신 데이터:", commentsData);
        setComments(commentsData.comments || []);
      } else {
        console.log("Record - 댓글 새로고침 - 문서가 존재하지 않음");
        setComments([]);
      }
    } catch (error) {
      console.error("Record - 댓글 새로고침 실패:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // 댓글 데이터 불러오기
  useEffect(() => {
    const fetchComments = async () => {
      if (!existingRecord?.id) return;

      try {
        console.log("Record - 댓글 데이터 불러오기 시작 - record ID:", existingRecord.id);
        const commentsRef = doc(db, "comments", existingRecord.id);
        const commentsSnap = await getDoc(commentsRef);
        console.log("Record - 댓글 문서 존재 여부:", commentsSnap.exists());
        if (commentsSnap.exists()) {
          const commentsData = commentsSnap.data();
          console.log("Record - 댓글 데이터:", commentsData);
          setComments(commentsData.comments || []);
        } else {
          console.log("Record - 댓글 문서가 존재하지 않음");
          setComments([]);
        }
      } catch (error) {
        console.error("Record - 댓글 데이터 가져오기 실패:", error);
        setComments([]);
      }
    };

    fetchComments();
  }, [existingRecord?.id]);

  // 댓글 작성 핸들러
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (newComment.trim() && existingRecord?.id) {
      const newCommentObj = {
        id: (crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`),
        author: profile?.nickname || user?.displayName || "익명",
        authorUid: user?.uid,
        timestamp: new Date().toLocaleString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }).replace(/\./g, '-').replace(/,/g, '').replace(/\s/g, ' '),
        content: newComment.trim(),
        replies: []
      };

      try {
        const updatedComments = [...comments, newCommentObj];
        setComments(updatedComments);
        setNewComment("");

        console.log("Record - 댓글 저장 시작 - record ID:", existingRecord.id);
        const commentsRef = doc(db, "comments", existingRecord.id);
        await setDoc(commentsRef, {
          comments: updatedComments,
          lastUpdated: new Date()
        }, { merge: true });

        console.log("Record - 새 댓글 추가 성공:", newCommentObj);
        console.log("Record - 저장된 댓글 목록:", updatedComments);

        // 댓글 목록 다시 불러오기 (다른 사용자에게도 즉시 반영되도록)
        const commentsSnap = await getDoc(commentsRef);
        if (commentsSnap.exists()) {
          const freshCommentsData = commentsSnap.data();
          setComments(freshCommentsData.comments || []);
          console.log("Record - 댓글 목록 새로고침 완료:", freshCommentsData.comments);
        }
      } catch (error) {
        console.error("Record - 댓글 저장 실패:", error);
        setComments(comments);
      }
    }
  };

  // 댓글 삭제 핸들러
  const handleCommentDelete = async (commentId) => {
    if (!window.confirm("댓글을 삭제하시겠습니까?")) return;
    if (!existingRecord?.id) return;

    try {
      const { list: updatedList, changed } = deleteNodeKeepChildren(comments, commentId);
      if (!changed) return;

      setComments(updatedList);

      const commentsRef = doc(db, "comments", existingRecord.id);
      await setDoc(
        commentsRef,
        { comments: updatedList, lastUpdated: new Date() },
        { merge: true }
      );

      const snap = await getDoc(commentsRef);
      if (snap.exists()) setComments(snap.data()?.comments || []);
    } catch (err) {
      console.error("Record - 댓글 삭제 실패:", err);
    }
  };


  // 답글 작성 시작 핸들러
  const handleReply = (commentId) => {
    if (replyToCommentId === commentId) {
      setReplyToCommentId(null);
      setReplyContent("");
    } else {
      setReplyToCommentId(commentId);
      setReplyContent("");
    }
  };

  // 답글 작성 취소 핸들러
  const handleCancelReply = () => {
    setReplyToCommentId(null);
    setReplyContent("");
  };

  // 답글 제출 핸들러
  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyContent.trim() || !replyToCommentId) return;
    if (!existingRecord?.id) return; // ✅ 기록 ID 없으면 종료

    const newReply = {
      id: (crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`),
      author: profile?.nickname || user?.displayName || "익명", // ✅ currentUserProfile → profile
      authorUid: user?.uid,
      timestamp: new Date().toLocaleString('ko-KR', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      }).replace(/\./g, '-').replace(/,/g, '').replace(/\s/g, ' '),
      content: replyContent.trim(),
      replies: []
    };

    // 1) 낙관적 업데이트
    const optimistic = addReplyRecursively(comments, replyToCommentId, newReply);
    setComments(optimistic);
    setReplyToCommentId(null);
    setReplyContent("");

    try {
      // 2) 서버 반영  ✅ id → existingRecord.id
      const commentsRef = doc(db, "comments", existingRecord.id);
      await setDoc(commentsRef, { comments: optimistic, lastUpdated: new Date() }, { merge: true });

      // 3) 서버 기준 동기화
      const snap = await getDoc(commentsRef);
      if (snap.exists()) {
        const fresh = snap.data()?.comments || [];
        setComments(fresh);
      }
    } catch (err) {
      console.error("답글 저장 실패:", err);
      // 화면은 유지하고 에러만 로그/토스트
    }
  };

  if (profileLoading) {
    return <div className="p-4 max-w-md mx-auto">사용자 정보를 불러오는 중...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col relative">
      {/* 사이드바 */}
      <MenuSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {/* 상단 네비게이션 */}
      <div className="flex justify-between items-center px-4 py-3 bg-blue-100 shadow">
        <button
          onClick={() => navigate(-1)}
          className="bg-blue-200 px-3 py-1 rounded-md hover:bg-blue-400"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-lg">{formattedDate}</h2>
        <button
          onClick={() => navigate("/")}
          className="bg-blue-200 px-3 py-1 rounded-md hover:bg-blue-400"
        >
          <HomeIcon className="w-5 h-5" />
        </button>
      </div>
      {/* 콘텐츠 */}
      <div className="flex-1 px-4 mt-10 flex flex-col md:flex-row md:items-start md:justify-center gap-6 overflow-y-auto">
        {/* 왼쪽: 날씨 카드 또는 댓글 섹션 */}
        <div className="relative w-full md:w-1/3 bg-gray-200 h-[705px] rounded-lg">
          {!isCommentViewVisible ? (
            // 날씨 정보 뷰
            <div className="px-6 py-6 text-center h-full flex flex-col">
              {/* +댓글 보기 버튼 - 기존 기록이 있을 때만 표시 */}
              {existingRecord && (
                <div className="mb-4 flex justify-start">
                  <button
                    onClick={handleCommentViewToggle}
                    className="px-3 py-1 bg-white rounded text-sm font-medium hover:bg-gray-100 transition-colors"
                  >
                    +댓글 보기
                  </button>
                </div>
              )}
              {/* 지역 선택 드롭다운 */}
              <div className="mb-8">
                <select
                  value={selectedRegion || "Seoul"}
                  onChange={e => handleRegionChange(e.target.value)}
                  className="w-30 px-4 py-2 border rounded bg-white text-center"
                >
                  <option value="Incheon">인천</option>
                  <option value="Seoul">서울</option>
                  <option value="Chuncheon">춘천</option>
                  <option value="Gangneung">강릉</option>
                  <option value="Ulleungdo">울릉도/독도</option>
                  <option value="Suwon">수원</option>
                  <option value="Cheongju">청주</option>
                  <option value="Jeonju">전주</option>
                  <option value="Daejeon">대전</option>
                  <option value="Daegu">대구</option>
                  <option value="Pohang">포항</option>
                  <option value="Mokpo">목포</option>
                  <option value="Jeju">제주</option>
                  <option value="Ulsan">울산</option>
                  <option value="Yeosu">여수</option>
                  <option value="Busan">부산</option>
                  <option value="Gwangju">광주</option>
                </select>
              </div>

              {/* 날씨 일러스트 - 로딩 중이 아닐 때만 표시 */}
              {!loading && weather && (
                <div className="mb-4 flex justify-center">
                  <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-6xl animate-bounce">
                      {getWeatherEmoji(weather.icon)}
                    </span>
                  </div>
                </div>
              )}
              {loading ? (
                <p className="text-sm text-gray-500">날씨 정보를 불러오는 중...</p>
              ) : weather ? (
                <>
                  {/* 날씨 정보 필드들 */}
                  <div className="mt-8 space-y-6">
                    {/* 계절 */}
                    <div className="flex justify-center">
                      <div className="flex items-center w-60">
                        <span className="w-28 text-base font-semibold text-left">계절</span>
                        <div className="ml-auto w-32 h-9 px-3 py-1 bg-white rounded text-sm font-medium flex items-center justify-center">
                          {weather.season || "초가을"}
                        </div>
                      </div>
                    </div>

                    {/* 온도 */}
                    <div className="flex justify-center">
                      <div className="flex items-center w-60">
                        <span className="w-28 text-base font-semibold text-left">온도</span>
                        <div className="ml-auto w-32 h-9 px-3 py-1 bg-white rounded text-sm font-medium flex items-center justify-center">
                          {weather?.temp || 0}°C
                        </div>
                      </div>
                    </div>

                    {/* 강수량 */}
                    <div className="flex justify-center">
                      <div className="flex items-center w-60">
                        <span className="w-28 text-base font-semibold text-left">강수량</span>
                        <div className="ml-auto w-32 h-9 px-3 py-1 bg-white rounded text-sm font-medium flex items-center justify-center">
                          {weather?.rain || 0}mm
                        </div>
                      </div>
                    </div>

                    {/* 습도 */}
                    <div className="flex justify-center">
                      <div className="flex items-center w-60">
                        <span className="w-28 text-base font-semibold text-left">습도</span>
                        <div className="ml-auto w-32 h-9 px-3 py-1 bg-white rounded text-sm font-medium flex items-center justify-center">
                          {weather?.humidity || 0}%
                        </div>
                      </div>
                    </div>

                    {/* 체감 선택 */}
                    <div className="flex justify-center">
                      <div className="flex items-center w-60">
                        <span className="w-28 text-base font-semibold text-left">체감</span>
                        <select
                          value={feeling}
                          onChange={(e) => setFeeling(e.target.value)}
                          className="ml-auto w-32 h-9 px-3 py-1 border rounded text-sm text-center flex items-center justify-center"
                        >
                          <option value="" className="text-gray-500">선택</option>
                          <option value="steam">🥟 (찐만두)</option>
                          <option value="hot">🥵 (더움)</option>
                          <option value="nice">👍🏻 (적당)</option>
                          <option value="cold">💨 (추움)</option>
                          <option value="ice">🥶 (동태)</option>
                        </select>
                      </div>
                    </div>

                    {/* 스타일 선택 */}
                    <div className="flex justify-center">
                      <div className="flex items-center w-60">
                        <span className="w-28 text-base font-semibold text-left">스타일</span>
                        <select className="ml-auto w-32 h-9 px-2 py-1 border rounded text-sm text-center flex items-center justify-center">
                          <option value="" className="text-gray-500">선택</option>
                          <option value="casual">캐주얼</option>
                          <option value="minimal">미니멀</option>
                          <option value="formal">포멀</option>
                          <option value="sporty">스포티/액티브</option>
                          <option value="street">시크/스트릿</option>
                          <option value="feminine">러블리/페미닌</option>
                        </select>
                      </div>
                    </div>
                  </div>

                </>
              ) : (
                <p className="text-sm text-red-500">날씨 정보를 가져올 수 없습니다.</p>
              )}
            </div>
          ) : (
            // 댓글 섹션
            <div className="h-full">
              <CommentSection
                comments={comments}
                newComment={newComment}
                setNewComment={setNewComment}
                onCommentSubmit={handleCommentSubmit}
                onCommentDelete={handleCommentDelete}
                onReply={handleReply}
                onClose={() => setIsCommentViewVisible(false)}
                onRefresh={handleRefreshComments}
                isRefreshing={isRefreshing}
                replyToCommentId={replyToCommentId}
                replyContent={replyContent}
                setReplyContent={setReplyContent}
                onReplySubmit={handleReplySubmit}
                onCancelReply={handleCancelReply}
                currentUserProfile={profile}
                user={user}
                author={{ ...profile, uid: user?.uid }}
              />
            </div>
          )}
        </div>

        {/* 오른쪽 입력 폼 */}
        <div className="w-full md:w-2/3 bg-white px-6 py-6 items-center min-h-[705px] rounded-lg">
          {/* 입력폼 상단 바 */}
          <div className="flex items-center justify-between bg-gray-200 mb-4 px-4 h-12">
            {/* 피드 체크박스 */}
            <div className="flex items-center gap-2 ml-2">
              <input
                type="checkbox"
                id="feedCheckbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="feedCheckbox" className="font-medium text-gray-600">
                피드
              </label>
            </div>

            {/* 우측 액션: 저장 → 삭제 */}
            <div className="flex items-center">
              <button
                onClick={handleSubmit}
                className="px-4 py-2 rounded text-gray-600 font-medium hover:font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {submitLoading ? "저장 중..." : "저장"}
              </button>

              {isEditMode && (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2  text-red-500 font-medium hover:font-bold transition"
                >
                  삭제
                </button>
              )}
            </div>
          </div>

          {/* 이미지 업로드 및 미리보기 */}
          <div className="flex flex-col md:flex-row gap-4 w-full">
            {/* 이미지 미리보기 영역 */}
            <div className="w-full md:w-1/2 flex flex-col items-center justify-center ">
              {imageFiles.length === 0 ? (
                <label
                  htmlFor="imageUpload"
                  className="w-72 aspect-[3/4] border-2 border-gray-300 bg-gray-100 rounded-md flex justify-center items-center text-gray-600 cursor-pointer hover:bg-gray-200"
                >
                  사진 추가
                  <input
                    id="imageUpload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="w-72 aspect-[3/4] relative rounded overflow-hidden border bg-gray-100 mt-2 p-2">
                  {/* 이미지 미리보기 */}
                  <img
                    src={
                      imageFiles[imagePreviewIdx]?.isUrl
                        ? imageFiles[imagePreviewIdx].name // URL 그대로 사용
                        : URL.createObjectURL(imageFiles[imagePreviewIdx]) // 새로 업로드한 파일
                    }
                    alt="preview"
                    className="w-full h-full object-cover rounded object-cover"
                  />

                  {/* ◀ / ▶ 이미지 전환 버튼 */}
                  {imageFiles.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setImagePreviewIdx((prev) => (prev - 1 + imageFiles.length) % imageFiles.length)
                        }
                        style={navBtnStyle("left")}
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setImagePreviewIdx((prev) => (prev + 1) % imageFiles.length)
                        }
                        style={navBtnStyle("right")}
                      >
                        ›
                      </button>
                      {/* 이미지 인디케이터 */}
                      <div style={indicatorStyle}>
                        {imageFiles.map((_, i) => (
                          <div key={i} style={dotStyle(i === imagePreviewIdx)} />
                        ))}
                      </div>
                    </>
                  )}

                  {/* ✅ + 사진 추가 버튼 (좌상단) */}
                  <label
                    htmlFor="imageUpload"
                    className="absolute top-3 left-3 bg-white bg-opacity-70 text-sm text-gray-700 px-2 py-1 rounded cursor-pointer hover:bg-opacity-90 z-10"
                  >
                    + 사진 추가
                    <input
                      id="imageUpload"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>

                  {/* 🗑️ 사진 삭제 버튼 (우상단) */}
                  <button
                    type="button"
                    onClick={handleImageDelete}
                    className="absolute top-3 right-3 bg-red-500 bg-opacity-80 text-white text-sm px-2 py-1 rounded cursor-pointer hover:bg-opacity-100 z-10"
                  >
                    🗑️ 삭제
                  </button>
                </div>

              )}
            </div>

            {/* 착장 선택 드롭다운 (outer, top, bottom 등) */}
            <div className="w-full md:w-1/2 space-y-4 max-h-96 overflow-y-auto pr-10">
              {/* Outer 드롭다운 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Outer</label>
                <div className="flex gap-2 items-center">
                  {customInputMode.outer ? (
                    <div className="flex gap-2 items-center w-80">
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded bg-white"
                        placeholder="직접 입력하세요"
                        value={customInputs.outer}
                        onChange={(e) => handleCustomInputChange("outer", e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddSelectedItem("outer")}
                      />
                      <button
                        type="button"
                        onClick={() => handleBackToDropdown("outer")}
                        className="px-2 py-1 bg-gray-300 rounded hover:bg-gray-400 text-xs"
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <select
                      className="w-80 px-3 py-2 border rounded bg-white"
                      value={selectedItems.outer}
                      onChange={(e) => handleSelectChange("outer", e.target.value)}
                    >
                      <option value="">선택하세요</option>
                      <option value="jacket">재킷</option>
                      <option value="blazer">점퍼</option>
                      <option value="coat">코트</option>
                      <option value="cardigan">가디건</option>
                      <option value="hoodzipup">후드집업</option>
                      <option value="blazer">블레이저</option>
                      <option value="windbreak">바람막이</option>
                      <option value="jersey">저지</option>
                      <option value="padding">패딩</option>
                      <option value="custom">직접입력</option>
                    </select>
                  )}
                  <button
                    type="button"
                    onClick={() => handleAddSelectedItem("outer")}
                    className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    +
                  </button>
                </div>
                {outfit.outer.length > 0 && (
                  <ul className="ml-2 mt-1 text-sm text-gray-600">
                    {outfit.outer.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-1">
                        • {item}
                        <button
                          type="button"
                          className="ml-1 mb-1 px-2 py-0.5 rounded bg-gray-200 hover:bg-red-200 text-xs text-red-500 hover:text-red-700 transition"
                          onClick={() => handleRemoveItem("outer", idx)}
                        >
                          -
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Top 드롭다운 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Top</label>
                <div className="flex gap-2 items-center">
                  {customInputMode.top ? (
                    <div className="flex gap-2 items-center w-80">
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded bg-white"
                        placeholder="직접 입력하세요"
                        value={customInputs.top}
                        onChange={(e) => handleCustomInputChange("top", e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddSelectedItem("top")}
                      />
                      <button
                        type="button"
                        onClick={() => handleBackToDropdown("top")}
                        className="px-2 py-1 bg-gray-300 rounded hover:bg-gray-400 text-xs"
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <select
                      className="w-80 px-3 py-2 border rounded bg-white"
                      value={selectedItems.top}
                      onChange={(e) => handleSelectChange("top", e.target.value)}
                    >
                      <option value="">선택하세요</option>
                      <option value="tshirt">티셔츠</option>
                      <option value="shirt">셔츠</option>
                      <option value="blouse">블라우스</option>
                      <option value="tank">탱크톱</option>
                      <option value="sweater">스웨터</option>
                      <option value="custom">직접입력</option>
                    </select>
                  )}
                  <button
                    type="button"
                    onClick={() => handleAddSelectedItem("top")}
                    className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    +
                  </button>
                </div>
                {outfit.top.length > 0 && (
                  <ul className="ml-2 mt-1 text-sm text-gray-600">
                    {outfit.top.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-1">
                        • {item}
                        <button
                          type="button"
                          className="ml-1 mb-1 px-2 py-0.5 rounded bg-gray-200 hover:bg-red-200 text-xs text-red-500 hover:text-red-700 transition"
                          onClick={() => handleRemoveItem("top", idx)}
                        >
                          -
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Bottom 드롭다운 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bottom</label>
                <div className="flex gap-2 items-center">
                  {customInputMode.bottom ? (
                    <div className="flex gap-2 items-center w-80">
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded bg-white"
                        placeholder="직접 입력하세요"
                        value={customInputs.bottom}
                        onChange={(e) => handleCustomInputChange("bottom", e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddSelectedItem("bottom")}
                      />
                      <button
                        type="button"
                        onClick={() => handleBackToDropdown("bottom")}
                        className="px-2 py-1 bg-gray-300 rounded hover:bg-gray-400 text-xs"
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <select
                      className="w-80 px-3 py-2 border rounded bg-white"
                      value={selectedItems.bottom}
                      onChange={(e) => handleSelectChange("bottom", e.target.value)}
                    >
                      <option value="">선택하세요</option>
                      <option value="jeans">청바지</option>
                      <option value="pants">바지</option>
                      <option value="shorts">반바지</option>
                      <option value="skirt">치마</option>
                      <option value="leggings">레깅스</option>
                      <option value="custom">직접입력</option>
                    </select>
                  )}
                  <button
                    type="button"
                    onClick={() => handleAddSelectedItem("bottom")}
                    className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    +
                  </button>
                </div>
                {outfit.bottom.length > 0 && (
                  <ul className="ml-2 mt-1 text-sm text-gray-600">
                    {outfit.bottom.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-1">
                        • {item}
                        <button
                          type="button"
                          className="ml-1 mb-1 px-2 py-0.5 rounded bg-gray-200 hover:bg-red-200 text-xs text-red-500 hover:text-red-700 transition"
                          onClick={() => handleRemoveItem("bottom", idx)}
                        >
                          -
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Shoes 드롭다운 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shoes</label>
                <div className="flex gap-2 items-center">
                  {customInputMode.shoes ? (
                    <div className="flex gap-2 items-center w-80">
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded bg-white"
                        placeholder="직접 입력하세요"
                        value={customInputs.shoes}
                        onChange={(e) => handleCustomInputChange("shoes", e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddSelectedItem("shoes")}
                      />
                      <button
                        type="button"
                        onClick={() => handleBackToDropdown("shoes")}
                        className="px-2 py-1 bg-gray-300 rounded hover:bg-gray-400 text-xs"
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <select
                      className="w-80 px-3 py-2 border rounded bg-white"
                      value={selectedItems.shoes}
                      onChange={(e) => handleSelectChange("shoes", e.target.value)}
                    >
                      <option value="">선택하세요</option>
                      <option value="sneakers">스니커즈</option>
                      <option value="boots">부츠</option>
                      <option value="sandals">샌들</option>
                      <option value="heels">힐</option>
                      <option value="loafers">로퍼</option>
                      <option value="custom">직접입력</option>
                    </select>
                  )}
                  <button
                    type="button"
                    onClick={() => handleAddSelectedItem("shoes")}
                    className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    +
                  </button>
                </div>
                {outfit.shoes.length > 0 && (
                  <ul className="ml-2 mt-1 text-sm text-gray-600">
                    {outfit.shoes.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-1">
                        • {item}
                        <button
                          type="button"
                          className="ml-1 mb-1 px-2 py-0.5 rounded bg-gray-200 hover:bg-red-200 text-xs text-red-500 hover:text-red-700 transition"
                          onClick={() => handleRemoveItem("shoes", idx)}
                        >
                          -
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Acc 드롭다운 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Acc</label>
                <div className="flex gap-2 items-center">
                  {customInputMode.acc ? (
                    <div className="flex gap-2 items-center w-80">
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded bg-white"
                        placeholder="직접 입력하세요"
                        value={customInputs.acc}
                        onChange={(e) => handleCustomInputChange("acc", e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddSelectedItem("acc")}
                      />
                      <button
                        type="button"
                        onClick={() => handleBackToDropdown("acc")}
                        className="px-2 py-1 bg-gray-300 rounded hover:bg-gray-400 text-xs"
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <select
                      className="w-80 px-3 py-2 border rounded bg-white"
                      value={selectedItems.acc}
                      onChange={(e) => handleSelectChange("acc", e.target.value)}
                    >
                      <option value="">선택하세요</option>
                      <option value="bag">가방</option>
                      <option value="hat">모자</option>
                      <option value="scarf">스카프</option>
                      <option value="watch">시계</option>
                      <option value="jewelry">액세서리</option>
                      <option value="custom">직접입력</option>
                    </select>
                  )}
                  <button
                    type="button"
                    onClick={() => handleAddSelectedItem("acc")}
                    className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    +
                  </button>
                </div>
                {outfit.acc.length > 0 && (
                  <ul className="ml-2 mt-1 text-sm text-gray-600">
                    {outfit.acc.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-1">
                        • {item}
                        <button
                          type="button"
                          className="ml-1 mb-1 px-2 py-0.5 rounded bg-gray-200 hover:bg-red-200 text-xs text-red-500 hover:text-red-700 transition"
                          onClick={() => handleRemoveItem("acc", idx)}
                        >
                          -
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
          {/* 피드백 입력 영역 */}
          <div className="w-full bg-gray-200 px-6 py-4 mt-6">
            <label className="block font-semibold mb-2">Feedback</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="오늘의 착장은 어땠나요?"
              className="w-full h-24 px-4 py-2 border rounded bg-white resize-none overflow-y-auto"
            />
          </div>
        </div>
      </div>


    </div >
  );
}

function CommentSection({
  comments,
  newComment,
  setNewComment,
  onCommentSubmit,
  onCommentDelete,
  onReply,
  onClose,
  onRefresh,
  isRefreshing,
  replyToCommentId,
  replyContent,
  setReplyContent,
  onReplySubmit,
  onCancelReply,
  currentUserProfile,
  user,
  author
}) {
  // 같은 너비 유지: level=0(원댓글), level>=1(답글/답글의답글 모두 같은 라인)
  const renderComment = (comment, level = 0) => {
    const isReply = level >= 1;

    return (
      <div key={comment.id} className={`${isReply ? 'mt-2' : 'mb-4'}`}>
        <div className="bg-white rounded-lg p-3 border w-full">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="font-semibold text-sm text-gray-800 flex items-center gap-2">
                <span>{isReply ? `ㄴ ${comment.author}` : comment.author}</span>
                {(comment.authorUid === author?.uid) && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-md font-medium">
                    작성자
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500">{comment.timestamp}</div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => onReply(comment.id)} className="text-xs text-blue-600 hover:text-blue-800">
                답글
              </button>
              {(comment.authorUid === user?.uid || author?.uid === user?.uid) && (
                <button onClick={() => onCommentDelete(comment.id)} className="text-xs text-red-600 hover:text-red-800">
                  삭제
                </button>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-700 mb-2">{comment.content}</p>
        </div>

        {/* 답글 작성 폼 */}
        {replyToCommentId === comment.id && (
          <div className={`mt-2 bg-gray-50 rounded-lg p-3 border ${isReply ? '' : ''}`}>
            <form onSubmit={onReplySubmit} className="space-y-2">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="답글 작성"
                className="w-full h-16 px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={1000}
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">{replyContent.length}/1000</span>
                <div className="flex gap-2">
                  <button type="button" onClick={onCancelReply} className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800">
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={!replyContent.trim()}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    답글 등록
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* 대댓글 렌더링 */}
        {Array.isArray(comment.replies) && comment.replies.length > 0 && (
          <div className={`mt-2 ${level === 0 ? 'ml-6' : ''}`}>
            {comment.replies.map((r) => renderComment(r, 1))} {/* 레벨은 1로 고정 */}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* 헤더 */}
      <div className="flex justify-between items-center p-4 border-b bg-gray-50">
        <h3 className="text-lg font-semibold">댓글</h3>
        <div className="flex gap-2">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            title="댓글 새로고침"
          >
            <ArrowPathIcon className={`w-5 h-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded">
            <XMarkIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* 댓글 목록 */}
      <div className="flex-1 overflow-y-auto p-4">
        {comments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">아직 댓글이 없습니다.</p>
        ) : (
          comments.map((comment) => renderComment(comment, 0))  // ✅ level=0에서 시작
        )}
      </div>

      {/* 댓글 입력 폼 */}
      <div className="border-t bg-gray-50 p-4">
        <form onSubmit={onCommentSubmit} className="space-y-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="댓글 작성"
            className="w-full h-20 px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={1000}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">{newComment.length}/1000</span>
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
            >
              등록
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// 스타일 함수
// --- 캐러셀 스타일 함수들 (FeedCard.js 스타일과 동일) ---
const navBtnStyle = (side) => ({
  position: "absolute",
  [side]: "12px",
  top: "50%",
  transform: "translateY(-50%)",
  background: "rgba(0,0,0,0.5)",
  color: "white",
  border: "none",
  borderRadius: "50%",
  width: "28px",
  height: "28px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontSize: "16px",
  zIndex: 10
});

const indicatorStyle = {
  position: "absolute",
  bottom: "14px",
  left: "50%",
  transform: "translateX(-50%)",
  display: "flex",
  gap: "4px",
  zIndex: 10
};

const dotStyle = (active) => ({
  width: "6px",
  height: "6px",
  borderRadius: "50%",
  backgroundColor: active ? "white" : "rgba(255,255,255,0.5)"
});

export default Record;
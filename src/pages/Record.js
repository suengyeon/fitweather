// src/pages/Record.js
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { db } from "../firebase";
import useUserProfile from "../hooks/useUserProfile";
import useWeather from "../hooks/useWeather";
import { HomeIcon, ArrowLeftIcon } from "@heroicons/react/24/solid";
import { BellIcon } from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import { collection, query, where, getDocs, addDoc, deleteDoc, updateDoc, doc, getDoc, setDoc } from "firebase/firestore";
// Firebase Storage 제거 - Base64 인코딩 사용
import { useAuth } from "../contexts/AuthContext";
import MenuSidebar from "../components/MenuSidebar";
import NotiSidebar from "../components/NotiSidebar";
import useNotiSidebar from "../hooks/useNotiSidebar";
import { getPastWeatherData, fetchAndSavePastWeather, deletePastWeatherData, savePastWeatherData } from "../api/pastWeather";
import { fetchKmaPastWeather } from "../api/kmaPastWeather";
import { createCommentNotification, createReplyNotification } from "../api/subscribe";
import CommentSection from "../components/CommentSection";
import { getWeatherEmoji, feelingToEmoji } from "../utils/weatherUtils";
import { addReplyRecursively, deleteNodeKeepChildren, findCommentAuthor } from "../utils/commentUtils";
import { regionMap } from "../constants/regionData";
import { styleOptions } from "../constants/styleOptions";
import { outfitOptionTexts } from "../constants/outfitOptionTexts";
import { outfitOptions } from "../constants/outfitOptions";
import { weatherService } from "../api/weatherService";
import { getStyleLabel, getStyleCode } from "../utils/styleUtils";
import { navBtnStyle, indicatorStyle, dotStyle } from "../components/ImageCarouselStyles";

// 이미지 압축 함수 (더 강력한 압축)
const compressImage = (file, maxWidth = 600, quality = 0.6) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // 원본 비율 유지하면서 크기 조정 (더 작게)
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      // 이미지 그리기
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // 압축된 Base64 반환 (품질 낮춤)
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      
      // 만약 여전히 크다면 더 강하게 압축
      if (compressedBase64.length > 400 * 1024) { // 400KB 초과시
        const strongerCompressed = canvas.toDataURL('image/jpeg', 0.4);
        resolve(strongerCompressed);
      } else {
        resolve(compressedBase64);
      }
    };
    
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

function Record() {
  const navigate = useNavigate();
  const location = useLocation();
  const existingRecord = location.state?.existingRecord || null;
  const passedDateStr = location.state?.date || null;
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

  // 오늘 날짜인지 확인 (컴포넌트 내부 버전만 사용)
  const isToday = (ds) => {
    const today = new Date();
    const targetDate = new Date(ds);
    return today.toDateString() === targetDate.toDateString();
  };

  // 지역 정보 설정
  const [selectedRegion, setSelectedRegion] = useState(() => {
    if (existingRecord?.region) return existingRecord.region;
    return location.state?.selectedRegion || "Seoul";
  });

  // profile 로드 이후 selectedRegion 업데이트
  useEffect(() => {
    if (profile?.region && !existingRecord?.region) {
      const isTodayDate = isToday(dateStr);
      if (!isTodayDate) {
        setSelectedRegion(profile.region);
      } else if (!location.state?.selectedRegion) {
        setSelectedRegion(profile.region);
      }
    }
  }, [profile?.region, existingRecord?.region, dateStr, location.state?.selectedRegion]);

  // 기존 기록이 있을 때 스타일 설정
  useEffect(() => {
    if (existingRecord?.style) {
      const styleCode = getStyleCode(existingRecord.style);
      console.log("📝 기존 기록에서 스타일 불러오기:", { 
        original: existingRecord.style, 
        converted: styleCode 
      });
      console.log("🔍 styleOptions 확인:", styleOptions.map(opt => ({ value: opt.value, label: opt.label })));
      console.log("🎯 설정할 style 값:", styleCode);
      setStyle(styleCode);
    }
  }, [existingRecord?.style]);

  const regionOptions = Object.entries(regionMap).map(([key, value]) => ({ value: key, label: value }));
  const [imageFiles, setImageFiles] = useState([]);
  const [outfit, setOutfit] = useState({ outer: [], top: [], bottom: [], shoes: [], acc: [] });
  const [selectedItems, setSelectedItems] = useState({ outer: "", top: "", bottom: "", shoes: "", acc: "" });
  const [customInputMode, setCustomInputMode] = useState({ outer: false, top: false, bottom: false, shoes: false, acc: false });
  const [customInputs, setCustomInputs] = useState({ outer: "", top: "", bottom: "", shoes: "", acc: "" });
  const [feeling, setFeeling] = useState("");
  const [style, setStyle] = useState("");
  
  // style 상태 변경 감지
  useEffect(() => {
    console.log("🎨 style 상태 변경:", style);
  }, [style]);
  const [memo, setMemo] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [weatherEmojis, setWeatherEmojis] = useState([]);
  const [imagePreviewIdx, setImagePreviewIdx] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { alarmOpen, setAlarmOpen,
    notifications, unreadCount,
    markAllRead, handleDeleteSelected,
    markOneRead, handleAlarmItemClick,
  } = useNotiSidebar();

  const [isEditMode, setIsEditMode] = useState(false);
  const [recordId, setRecordId] = useState(null);

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
      if (isToday(dateStr) || !selectedRegion) {
        setPastWeather(null);
        return;
      }

      setPastWeatherLoading(true);
      try {
        // 저장된 데이터 확인
        const savedData = await getPastWeatherData(dateStr, selectedRegion);
        if (savedData) {
          // 2025-09-12는 강수량 검증을 위한 강제 재생성 로직 (유지)
          if (dateStr === "2025-09-12") {
            await deletePastWeatherData(dateStr, selectedRegion);
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

        // 저장된 데이터가 없으면 API 호출
        let pastData = await fetchKmaPastWeather(dateStr, selectedRegion);
        if (pastData) {
          await savePastWeatherData(dateStr, selectedRegion, pastData);
        } else {
          const fallbackData = await fetchAndSavePastWeather(dateStr, selectedRegion);
          if (fallbackData) pastData = fallbackData;
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
        } else {
          setPastWeather({
            temp: "20",
            rain: "0",
            humidity: "60",
            icon: "sunny",
            season: "초가을",
            sky: "1",
            pty: "0"
          });
        }
      } catch (error) {
        console.error("과거 날씨 데이터 로드 실패:", error);
        setPastWeather({
          temp: "20",
          rain: "0",
          humidity: "60",
          icon: "sunny",
          season: "초가을",
          sky: "1",
          pty: "0"
        });
      } finally {
        setPastWeatherLoading(false);
      }
    };

    loadPastWeather();
  }, [dateStr, selectedRegion]);

  // 날씨 정보 선택
  const weather = existingRecord?.weather ||
    (isToday(dateStr) ? apiWeather : pastWeather) || {
    temp: 20,
    rain: 0,
    humidity: 60,
    icon: "sunny",
    season: "초가을"
  };

  // 로딩 상태
  const loading = profileLoading ||
    (isToday(dateStr) ? apiWeatherLoading : pastWeatherLoading);

  // 지역 변경
  const handleRegionChange = (newRegion) => setSelectedRegion(newRegion);

  // regionMap 사용 (import된 상수)
  useEffect(() => {
    if (selectedRegion) {
      setRegionName(regionMap[selectedRegion] || selectedRegion);
    }
  }, [selectedRegion]);


  useEffect(() => {
    if (existingRecord) {
      setIsEditMode(true);
      setRecordId(existingRecord.id);
      if (existingRecord.region) setSelectedRegion(existingRecord.region);

      setOutfit(existingRecord.outfit || {});
      setFeeling(existingRecord.feeling || "");
      // setStyle은 useEffect에서 처리 (한글 → 영문 변환)
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
      if (prev.length === 0 && newList.length > 0) {
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
      if (newList.length === 0) {
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

  // 드롭다운 선택
  const handleSelectChange = (category, value) => {
    if (value === "custom") {
      setCustomInputMode((prev) => ({ ...prev, [category]: true }));
      setSelectedItems((prev) => ({ ...prev, [category]: "" }));
    } else {
      setCustomInputMode((prev) => ({ ...prev, [category]: false }));
      setSelectedItems((prev) => ({ ...prev, [category]: value }));
    }
  };

  const handleCustomInputChange = (category, value) => {
    setCustomInputs((prev) => ({ ...prev, [category]: value }));
  };

  const handleBackToDropdown = (category) => {
    setCustomInputMode((prev) => ({ ...prev, [category]: false }));
    setCustomInputs((prev) => ({ ...prev, [category]: "" }));
  };

  // + 버튼
  const handleAddSelectedItem = (category) => {
    let valueToAdd = "";

    if (customInputMode[category]) {
      valueToAdd = customInputs[category];
      if (!valueToAdd.trim()) return;
      setCustomInputMode((prev) => ({ ...prev, [category]: false }));
      setCustomInputs((prev) => ({ ...prev, [category]: "" }));
    } else {
      const selectedValue = selectedItems[category];
      if (!selectedValue) return;
      // outfitOptionTexts 사용
      valueToAdd = outfitOptionTexts[category][selectedValue] || selectedValue;
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
    if (!user) {
      toast.error("로그인이 필요합니다.");
      return;
    }
    if (!imageFiles.length || imageFiles.some(f => !f || (!f.name && !f.isUrl))) {
      toast.error("사진을 업로드해주세요.");
      return;
    }
    if (!feeling) {
      toast.error("체감을 선택해주세요.");
      return;
    }
    if (typeof weather?.temp === "undefined" || typeof weather?.rain === "undefined") {
      toast.error("날씨 정보가 아직 준비되지 않았습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    // Storage 체크 제거 - Base64 인코딩 사용

    setSubmitLoading(true);

    try {
      // (신규일 때만) 중복 체크
      if (!isEditMode) {
        const q = query(
          collection(db, "records"),
          where("uid", "==", user.uid),
          where("date", "==", dateStr)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          toast.error("이미 기록하셨습니다.");
          setSubmitLoading(false);
          return;
        }
      }

      // 이미지 처리 (Base64 인코딩으로 Firestore에 직접 저장)
      console.log("📸 이미지 처리 시작:", { 
        imageFilesCount: imageFiles.length, 
        imageFiles: imageFiles.map(f => ({ name: f.name, isUrl: f.isUrl }))
      });
      
      const imageUrls = await Promise.all(
        imageFiles.map(async (file, index) => {
          console.log(`📸 이미지 ${index + 1} 처리 중:`, { name: file.name, isUrl: file.isUrl });
          if (file.isUrl) {
            console.log(`📸 기존 URL 사용: ${file.name}`);
            return file.name; // 기존 URL
          }
          if (!file || !file.name) throw new Error("잘못된 파일입니다.");
          
          try {
            // 이미지 압축 후 Base64로 인코딩
            const compressedBase64 = await compressImage(file);
            
            // 압축 후 크기 체크 (Firestore 문서 크기 제한 고려)
            const maxSize = 500 * 1024; // 500KB
            if (compressedBase64.length > maxSize) {
              throw new Error(`압축 후에도 파일이 너무 큽니다. 더 작은 이미지를 선택해주세요. (압축 후: ${(compressedBase64.length / 1024).toFixed(2)}KB)`);
            }
            
            console.log(`📸 압축된 Base64 인코딩 완료: ${file.name} (${compressedBase64.length} chars)`);
            return compressedBase64;
          } catch (error) {
            console.error(`📸 이미지 압축 실패:`, error);
            throw new Error(`이미지 처리 실패: ${error.message}`);
          }
        })
      );
      
      console.log("📸 최종 imageUrls:", imageUrls);

      const convertedStyle = getStyleLabel(style);
      console.log("🎨 스타일 변환:", { original: style, converted: convertedStyle });
      
      const recordData = {
        uid: user.uid,
        region: selectedRegion, // profile?.region 대신 selectedRegion 사용
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
          season: weatherService.getSeason(weather.temp, dateObj),
        },
        outfit,
        feeling,
        style: convertedStyle, // 스타일을 한글로 변환하여 저장
        memo,
        isPublic,
        imageUrls,
        weatherEmojis,
        updatedAt: new Date(),
        nickname: profile?.nickname || user.uid,
        recordedDate: new Date().toISOString().split('T')[0],
        recordedTime: new Date().toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        recordedAt: new Date(),
      };
      
      console.log("💾 저장할 recordData:", recordData);
      console.log("🎯 저장할 style 필드:", recordData.style);
      console.log("📸 저장할 imageUrls:", recordData.imageUrls);

      if (isEditMode && recordId) {
        const updateData = { ...recordData };
        delete updateData.createdAt;
        await updateDoc(doc(db, "records", recordId), updateData);
        console.log("✅ 기록 업데이트 성공:", { recordId, style: updateData.style });
        toast.success("기록이 수정되었어요!", { position: "top-center", autoClose: 1200 });
      } else {
        recordData.createdAt = new Date();
        recordData.likes = [];
        const docRef = await addDoc(collection(db, "records"), recordData);
        console.log("✅ 기록 저장 성공:", { id: docRef.id, style: recordData.style });
        toast.success("기록이 저장되었어요!", { position: "top-center", autoClose: 1200 });
      }

      if (isEditMode) {
        setTimeout(() => navigate("/calendar", { state: { selectedDate: dateStr } }), 1300);
      } else {
        setTimeout(() => navigate("/calendar"), 1300);
      }
    } catch (err) {
      console.error("저장 오류 발생:", err);
      toast.error(`저장에 실패했습니다: ${err.message}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  // 댓글 관련
  const handleCommentViewToggle = () => setIsCommentViewVisible(!isCommentViewVisible);

  const handleRefreshComments = async () => {
    if (!existingRecord?.id) return;

    setIsRefreshing(true);
    try {
      const commentsRef = doc(db, "comments", existingRecord.id);
      const commentsSnap = await getDoc(commentsRef);
      if (commentsSnap.exists()) {
        const commentsData = commentsSnap.data();
        setComments(commentsData.comments || []);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error("Record - 댓글 새로고침 실패:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const fetchComments = async () => {
      if (!existingRecord?.id) return;
      try {
        const commentsRef = doc(db, "comments", existingRecord.id);
        const commentsSnap = await getDoc(commentsRef);
        if (commentsSnap.exists()) {
          const commentsData = commentsSnap.data();
          setComments(commentsData.comments || []);
        } else {
          setComments([]);
        }
      } catch (error) {
        console.error("Record - 댓글 데이터 가져오기 실패:", error);
        setComments([]);
      }
    };
    fetchComments();
  }, [existingRecord?.id]);

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

        const commentsRef = doc(db, "comments", existingRecord.id);
        await setDoc(commentsRef, {
          comments: updatedComments,
          lastUpdated: new Date()
        }, { merge: true });

        if (existingRecord.uid !== user?.uid) {
          await createCommentNotification(
            user?.uid,
            existingRecord.uid,
            existingRecord.id,
            newComment.trim()
          );
        }

        const commentsSnap = await getDoc(commentsRef);
        if (commentsSnap.exists()) {
          const freshCommentsData = commentsSnap.data();
          setComments(freshCommentsData.comments || []);
        }
      } catch (error) {
        console.error("Record - 댓글 저장 실패:", error);
        setComments(comments);
      }
    }
  };

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

  const handleReply = (commentId) => {
    if (replyToCommentId === commentId) {
      setReplyToCommentId(null);
      setReplyContent("");
    } else {
      setReplyToCommentId(commentId);
      setReplyContent("");
    }
  };

  const handleCancelReply = () => {
    setReplyToCommentId(null);
    setReplyContent("");
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyContent.trim() || !replyToCommentId) return;
    if (!existingRecord?.id) return;

    const newReply = {
      id: (crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`),
      author: profile?.nickname || user?.displayName || "익명",
      authorUid: user?.uid,
      timestamp: new Date().toLocaleString('ko-KR', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      }).replace(/\./g, '-').replace(/,/g, '').replace(/\s/g, ' '),
      content: replyContent.trim(),
      replies: []
    };

    const optimistic = addReplyRecursively(comments, replyToCommentId, newReply);
    setComments(optimistic);
    setReplyToCommentId(null);
    setReplyContent("");

    try {
      const commentsRef = doc(db, "comments", existingRecord.id);
      await setDoc(commentsRef, { comments: optimistic, lastUpdated: new Date() }, { merge: true });

      const originalCommentAuthor = findCommentAuthor(comments, replyToCommentId);
      if (originalCommentAuthor && originalCommentAuthor !== user?.uid) {
        await createReplyNotification(
          user?.uid,
          originalCommentAuthor,
          existingRecord.id,
          replyContent.trim()
        );
      }

      const snap = await getDoc(commentsRef);
      if (snap.exists()) {
        const fresh = snap.data()?.comments || [];
        setComments(fresh);
      }
    } catch (err) {
      console.error("답글 저장 실패:", err);
    }
  };

  // Select 옵션 표시를 위해 느낌표와 텍스트를 결합하는 함수
  const getFeelingTextForOption = (feelingCode) => {
    const result = feelingToEmoji(feelingCode);
    // '🥟 찐만두' 형태를 '🥟 (찐만두)' 형태로 변환 (Select Box용)
    if (result && result.includes(' ')) {
      const [emoji, text] = result.split(' ');
      return `${emoji} (${text})`;
    }
    return result;
  };


  if (profileLoading) {
    return <div className="p-4 max-w-md mx-auto">사용자 정보를 불러오는 중...</div>;
  }

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
          onClick={() => navigate(-1)}
          className="bg-blue-200 px-3 py-1 rounded-md hover:bg-blue-300"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-lg">{formattedDate}</h2>
        <div className="flex items-center space-x-4">
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
                    onClick={() => setIsCommentViewVisible(true)}
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
                  {regionOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {/* 날씨 일러스트 */}
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
                          <option value="steam">{getFeelingTextForOption("steam")}</option>
                          <option value="hot">{getFeelingTextForOption("hot")}</option>
                          <option value="nice">{getFeelingTextForOption("nice")}</option>
                          <option value="cold">{getFeelingTextForOption("cold")}</option>
                          <option value="ice">{getFeelingTextForOption("ice")}</option>
                        </select>
                      </div>
                    </div>

                    {/* 스타일 선택 */}
                    <div className="flex justify-center">
                      <div className="flex items-center w-60">
                        <span className="w-28 text-base font-semibold text-left">스타일</span>
                        <select 
                          value={style}
                          onChange={(e) => setStyle(e.target.value)}
                          className="ml-auto w-32 h-9 px-2 py-1 border rounded text-sm text-center flex items-center justify-center"
                        >
                          <option value="" className="text-gray-500">선택</option>
                          {styleOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
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
                  className="px-4 py-2 text-red-500 font-medium hover:font-bold transition"
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
                        ? imageFiles[imagePreviewIdx].name
                        : URL.createObjectURL(imageFiles[imagePreviewIdx])
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

            {/* 착장 선택 드롭다운 */}
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
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSelectedItem("outer")}
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
                      {outfitOptions.outer.map(value => (
                        <option key={value} value={value}>
                          {value === 'custom' ? '직접입력' : outfitOptionTexts.outer[value]}
                        </option>
                      ))}
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
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSelectedItem("top")}
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
                      {outfitOptions.top.map(value => (
                        <option key={value} value={value}>
                          {value === 'custom' ? '직접입력' : outfitOptionTexts.top[value]}
                        </option>
                      ))}
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
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSelectedItem("bottom")}
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
                      {outfitOptions.bottom.map(value => (
                        <option key={value} value={value}>
                          {value === 'custom' ? '직접입력' : outfitOptionTexts.bottom[value]}
                        </option>
                      ))}
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
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSelectedItem("shoes")}
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
                      {outfitOptions.shoes.map(value => (
                        <option key={value} value={value}>
                          {value === 'custom' ? '직접입력' : outfitOptionTexts.shoes[value]}
                        </option>
                      ))}
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
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSelectedItem("acc")}
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
                      {outfitOptions.acc.map(value => (
                        <option key={value} value={value}>
                          {value === 'custom' ? '직접입력' : outfitOptionTexts.acc[value]}
                        </option>
                      ))}
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
    </div>
  );
}

export default Record;
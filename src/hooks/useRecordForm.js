import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { collection, query, where, getDocs, addDoc, deleteDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase"; 
import { useAuth } from "../contexts/AuthContext"; 
import { getStyleLabel } from "../utils/styleUtils"; 
import { outfitOptionTexts } from "../constants/outfitOptionTexts"; 

/**
 * 착장 기록(Record) 페이지의 모든 폼 상태, 핸들러, CRUD 로직을 관리하는 커스텀 훅
 */
export const useRecordForm = (existingRecord, dateStr, weather, selectedRegion, regionName, profile, compressImage, weatherService) => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // 폼 상태
    const [imageFiles, setImageFiles] = useState([]); 
    const [outfit, setOutfit] = useState({ outer: [], top: [], bottom: [], shoes: [], acc: [] }); 
    const [selectedItems, setSelectedItems] = useState({ outer: "", top: "", bottom: "", shoes: "", acc: "" });
    const [customInputMode, setCustomInputMode] = useState({ outer: false, top: false, bottom: false, shoes: false, acc: false });
    const [customInputs, setCustomInputs] = useState({ outer: "", top: "", bottom: "", shoes: "", acc: "" }); 
    const [feeling, setFeeling] = useState(""); 
    const [style, setStyle] = useState(""); 
    const [memo, setMemo] = useState(""); 
    const [isPublic, setIsPublic] = useState(false); 
    const [submitLoading, setSubmitLoading] = useState(false); 
    const [imagePreviewIdx, setImagePreviewIdx] = useState(0);
    
    // 수정 모드 상태
    const [isEditMode, setIsEditMode] = useState(false);
    const [recordId, setRecordId] = useState(null);

    // 기존 기록 데이터 로드(수정 모드 진입)
    useEffect(() => {
        if (existingRecord) {
            setIsEditMode(true);
            setRecordId(existingRecord.id);
            // 기존 데이터로 폼 필드 초기화
            setStyle(existingRecord.styleCode || getStyleCode(existingRecord.style) || "");
            setOutfit(existingRecord.outfit || { outer: [], top: [], bottom: [], shoes: [], acc: [] });
            setFeeling(existingRecord.feeling || "");
            setMemo(existingRecord.memo || "");
            setIsPublic(existingRecord.isPublic || false);
            // 기존 URL 이미지를 isUrl 플래그와 함께 로드
            setImageFiles(existingRecord.imageUrls?.map((url) => ({ name: url, isUrl: true })) || []);
            setImagePreviewIdx(0);
        }
    }, [existingRecord]);

    // --- 이미지 핸들러 ---
    const handleImageChange = (e) => {
        const files = Array.from(e.target.files).filter(f => f && f.name);
        if (!files.length) return;

        const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
        const maxSizeMB = 3;
        // 파일 타입 및 크기 유효성 검사
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

        // 현재 인덱스의 이미지 파일 삭제
        setImageFiles((prev) => {
            const newList = prev.filter((_, index) => index !== imagePreviewIdx);
            // 프리뷰 인덱스 조정(리스트 길이를 초과하지 않도록)
            if (newList.length === 0) {
                setImagePreviewIdx(0);
            } else if (imagePreviewIdx >= newList.length) {
                setImagePreviewIdx(newList.length - 1);
            }
            return newList;
        });
    };

    // --- 옷차림 선택 핸들러 ---
    const handleSelectChange = (category, value) => {
        if (value === "custom") {
            setCustomInputMode((prev) => ({ ...prev, [category]: true })); // 커스텀 모드 전환
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
        // 커스텀 모드 해제 및 값 초기화
        setCustomInputMode((prev) => ({ ...prev, [category]: false }));
        setCustomInputs((prev) => ({ ...prev, [category]: "" }));
        setSelectedItems((prev) => ({ ...prev, [category]: "" }));
    };

    const handleAddSelectedItem = (category) => {
        let valueToAdd = "";

        if (customInputMode[category]) {
            // 커스텀 입력 모드일 때
            valueToAdd = customInputs[category];
            if (!valueToAdd.trim()) return;
            // 입력 후 상태 초기화
            setCustomInputMode((prev) => ({ ...prev, [category]: false }));
            setCustomInputs((prev) => ({ ...prev, [category]: "" }));
        } else {
            // 드롭다운 선택 모드일 때
            const selectedValue = selectedItems[category];
            if (!selectedValue) return;
            // 옵션 코드를 한글 텍스트로 변환하여 사용
            valueToAdd = outfitOptionTexts[category][selectedValue] || selectedValue;
            setSelectedItems((prev) => ({ ...prev, [category]: "" }));
        }

        // 해당 카테고리 outfit 배열에 항목 추가
        setOutfit((prev) => ({ ...prev, [category]: [...prev[category], valueToAdd] }));
    };

    const handleRemoveItem = (category, idx) => {
        // 해당 카테고리 outfit 배열에서 특정 인덱스 항목 제거
        setOutfit((prev) => ({
            ...prev,
            [category]: prev[category].filter((_, i) => i !== idx)
        }));
    };

    // --- CRUD 함수 ---
    const handleDelete = async () => {
        if (!recordId) return;
        const confirmDelete = window.confirm("정말 삭제하시겠어요?");
        if (!confirmDelete) return;

        try {
            // Firestore 'records' 문서 삭제
            await deleteDoc(doc(db, "records", recordId));
            toast.success("기록이 삭제되었어요!", { autoClose: 1200 });
            setTimeout(() => navigate("/calendar"), 1300); // 캘린더 페이지로 리디렉션
        } catch (err) {
            console.error("삭제 오류:", err);
            toast.error("삭제에 실패했습니다.");
        }
    };

    const handleSubmit = async () => {
        // 폼 유효성 검사
        if (!user) { toast.error("로그인이 필요합니다."); return; }
        if (!imageFiles.length || imageFiles.some(f => !f || (!f.name && !f.isUrl))) { toast.error("사진을 업로드해주세요."); return; }
        if (!feeling) { toast.error("체감을 선택해주세요."); return; }
        if (typeof weather?.temp === "undefined" || typeof weather?.rain === "undefined") {
            toast.error("날씨 정보가 아직 준비되지 않았습니다. 잠시 후 다시 시도해 주세요.");
            return;
        }

        setSubmitLoading(true);

        try {
            // 1. 중복 체크(수정 모드가 아닐 때만)
            if (!isEditMode) {
                const q = query(
                    collection(db, "records"),
                    where("uid", "==", user.uid),
                    where("date", "==", dateStr)
                );
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    toast.error("이미 해당 날짜에 기록하셨습니다.");
                    setSubmitLoading(false);
                    return;
                }
            }
            
            // 2. 이미지 처리 및 Base64 변환
            if (!compressImage) throw new Error("compressImage 함수가 전달되지 않았습니다.");

            const imageUrls = await Promise.all(
                imageFiles.map(async (file) => {
                    if (file.isUrl) return file.name; // 기존 URL은 그대로 반환
                    
                    const compressedBase64 = await compressImage(file); // 이미지 압축 및 Base64 변환
                    
                    const maxSize = 500 * 1024; // 500KB
                    if (compressedBase64.length > maxSize * 1.5) {
                         throw new Error(`이미지 크기가 너무 큽니다. (처리 후: ${(compressedBase64.length / 1024).toFixed(2)}KB)`);
                    }
                    return compressedBase64;
                })
            );

            // 3. 데이터 준비
            const convertedStyle = getStyleLabel(style); // 스타일 코드를 한글 레이블로 변환
            const dateObj = new Date(dateStr);
            
            const recordData = {
                uid: user.uid,
                region: selectedRegion,
                regionName,
                date: dateStr,
                weather: {
                    temp: weather.temp ?? null,
                    rain: weather.rain ?? null,
                    humidity: weather.humidity ?? null,
                    icon: weather.icon ?? null,
                    // weatherService를 사용하여 계절 정보 추가
                    season: (weather.temp !== undefined && weather.temp !== null && weatherService && weatherService.getSeason) 
                            ? weatherService.getSeason(weather.temp, dateObj) 
                            : null,
                },
                outfit,
                feeling,
                style: convertedStyle, // 한글 레이블
                styleCode: style, // 영문 코드
                memo,
                isPublic,
                imageUrls,
                updatedAt: new Date(),
                nickname: profile?.nickname || user.uid,
            };

            // 4. 저장 또는 수정
            if (isEditMode && recordId) {
                const updateData = { ...recordData };
                delete updateData.createdAt; // createdAt 필드는 수정하지 않음
                // Firestore 'records' 문서 업데이트
                await updateDoc(doc(db, "records", recordId), updateData); 
                toast.success("기록이 수정되었어요!", { autoClose: 1200 });
            } else {
                recordData.createdAt = new Date();
                recordData.likes = []; // 새 기록이므로 좋아요 배열 초기화
                // Firestore 'records' 컬렉션에 새 문서 추가
                await addDoc(collection(db, "records"), recordData); 
                toast.success("기록이 저장되었어요!", { autoClose: 1200 });
            }

            // 5. 페이지 이동(캘린더로 이동하며 기록 날짜 상태 전달)
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

    return {
        // 상태
        outfit, selectedItems, customInputMode, customInputs, feeling, style, memo, isPublic, 
        imageFiles, imagePreviewIdx, submitLoading, isEditMode,
        // Setter 함수
        setImageFiles, setImagePreviewIdx, setFeeling, setStyle, setMemo, setIsPublic,
        // 핸들러 함수
        handleImageChange, handleImageDelete, handleSelectChange, handleCustomInputChange, 
        handleBackToDropdown, handleAddSelectedItem, handleRemoveItem,
        // CRUD 함수
        handleSubmit, handleDelete
    };
};

// Record.js에서 스타일 한글을 영문 코드로 변환하는 getStyleCode 함수(임시)
function getStyleCode(styleLabel) {
    const styleOptions = [
        { value: 'modern', label: '모던/시크' },
        { value: 'casual', label: '캐주얼' },
        { value: 'street', label: '스트릿' },
    ];
    const option = styleOptions.find(opt => opt.label === styleLabel);
    return option ? option.value : '';
}
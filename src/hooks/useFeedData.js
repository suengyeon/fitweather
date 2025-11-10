import { useState, useEffect, useMemo } from "react";
import { getRecords } from "../api/getRecords"; 
import { toggleLike } from "../api/toggleLike"; 
import { getStyleLabel } from "../utils/styleUtils"; 
import { useAuth } from "../contexts/AuthContext"; 

/**
 * 피드 데이터를 불러오고 필터링 및 좋아요 상태 관리를 담당하는 커스텀 훅
 */
export function useFeedData(region, order, style, dateState) {
  const { user } = useAuth();
  const [outfits, setOutfits] = useState([]); 
  const [isLoading, setIsLoading] = useState(false);

  // 선택된 날짜 문자열 계산(YYYY-MM-DD 형식)
  const selectedDate = useMemo(() => {
    const { year, month, day } = dateState;
    // 필수 날짜 정보 없으면 빈 문자열 반환
    if (year === 0 || month === 0 || day === 0) return ''; 
    const date = new Date(year, month - 1, day);
    const yearStr = date.getFullYear();
    const monthStr = String(date.getMonth() + 1).padStart(2, '0');
    const dayStr = String(date.getDate()).padStart(2, '0');
    return `${yearStr}-${monthStr}-${dayStr}`;
  }, [dateState]); // dateState 변경 시에만 재계산

  // region/order/style/selectedDate 바뀔 때마다 records fetch
  useEffect(() => {
    // 필수 의존성(지역, 날짜) 없으면 실행하지 않음
    if (!region || !selectedDate) return; 

    const fetchRecords = async () => {
      setIsLoading(true);
      try {
        // Firestore에서 기록 조회(지역, 정렬, 날짜 기준)
        const records = await getRecords(region, order, selectedDate);
        
        // 스타일 필터링 적용
        const filteredRecords = records.filter(record => {
          if (!style) return true; // 필터가 없으면 모두 포함
          
          // 기록의 스타일과 필터의 스타일 라벨이 일치하는지 확인
          const recordStyleLabel = record.style; 
          const filterStyleLabel = getStyleLabel(style);

          return recordStyleLabel === filterStyleLabel;
        });
        
        setOutfits(filteredRecords);
      } catch (error) {
        console.error("피드 데이터 로딩 실패:", error);
        setOutfits([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecords();
  }, [region, order, style, selectedDate]);

  // 좋아요 토글 함수(Firestore + UI 동기화)
  const handleToggleLike = async (recordId, isLiked) => {
    if (!user) return;
    
    // 1. DB 업데이트(토글)
    await toggleLike(recordId, user.uid);
    
    // 2. UI 상태 업데이트(Optimistic Update 대신, 토글 결과에 기반하여 배열 업데이트)
    setOutfits(prev =>
      prev.map(record =>
        record.id === recordId
          ? {
            ...record,
            // 좋아요 취소/추가에 따라 likes 배열 업데이트
            likes: isLiked 
              ? record.likes.filter(uid => uid !== user.uid) // 좋아요 취소 : UID 제거
              : [...record.likes, user.uid], // 좋아요 추가 : UID 추가
          }
          : record
      )
    );
  };
  
  // FeedDetail 반응 변경 이벤트 처리(Thumbs Reaction 업데이트)
  useEffect(() => {
    const handleReactionUpdate = (event) => {
      const { recordId, type, thumbsUpCount, thumbsDownCount } = event.detail;

      // 이벤트에 카운트가 포함되어 있으면 직접 사용, 없으면 기존 방식으로 계산
      if (thumbsUpCount !== undefined || thumbsDownCount !== undefined) {
        setOutfits(prevOutfits =>
          prevOutfits.map(outfit => {
            if (outfit.id === recordId) {
              const updatedOutfit = { ...outfit };
              
              // 이벤트에서 전달된 카운트로 직접 업데이트
              if (thumbsUpCount !== undefined) {
                updatedOutfit.thumbsUpCount = Math.max(0, thumbsUpCount);
              }
              if (thumbsDownCount !== undefined) {
                updatedOutfit.thumbsDownCount = Math.max(0, thumbsDownCount);
              }
              
              return updatedOutfit;
            }
            return outfit;
          })
        );
      } else {
        // 기존 방식 (하위 호환성)
        const { isActive } = event.detail;
        setOutfits(prevOutfits =>
          prevOutfits.map(outfit => {
            if (outfit.id === recordId) {
              const updatedOutfit = { ...outfit };
              
              // 좋아요/싫어요 카운트 업데이트
              if (type === 'thumbsUp') {
                // isActive가 true면 +1, false면 -1
                updatedOutfit.thumbsUpCount = (updatedOutfit.thumbsUpCount || 0) + (isActive ? 1 : -1);
              } else if (type === 'thumbsDown') {
                updatedOutfit.thumbsDownCount = (updatedOutfit.thumbsDownCount || 0) + (isActive ? 1 : -1);
              }
              
              // 카운트 음수 방지(0 미만으로 내려가지 않도록)
              updatedOutfit.thumbsUpCount = Math.max(0, updatedOutfit.thumbsUpCount);
              updatedOutfit.thumbsDownCount = Math.max(0, updatedOutfit.thumbsDownCount);
              return updatedOutfit;
            }
            return outfit;
          })
        );
      }
    };

    // 전역 이벤트 리스너 등록 및 해제(FeedDetail과의 통신용)
    window.addEventListener('reactionUpdated', handleReactionUpdate);
    return () => window.removeEventListener('reactionUpdated', handleReactionUpdate);
  }, []); 

  return { outfits, selectedDate, isLoading, handleToggleLike };
}
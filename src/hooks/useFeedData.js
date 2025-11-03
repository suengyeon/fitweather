import { useState, useEffect, useMemo } from "react";
import { getRecords } from "../api/getRecords"; // (필요) API 호출 함수
import { toggleLike } from "../api/toggleLike"; // (필요) API 호출 함수
import { getStyleLabel } from "../utils/styleUtils"; // (필요) 스타일 유틸리티
import { useAuth } from "../contexts/AuthContext"; // (필요) 사용자 인증 Context

/**
 * 피드 데이터를 불러오고 필터링 및 좋아요 상태 관리를 담당하는 커스텀 훅
 */
export function useFeedData(region, order, style, dateState) {
  const { user } = useAuth();
  const [outfits, setOutfits] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // 선택된 날짜 문자열 계산 (기존 useMemo 로직)
  const selectedDate = useMemo(() => {
    const { year, month, day } = dateState;
    // 초기 상태이거나 날짜가 선택되지 않았다면 빈 문자열 반환
    if (year === 0 || month === 0 || day === 0) return ''; 
    const date = new Date(year, month - 1, day);
    const yearStr = date.getFullYear();
    const monthStr = String(date.getMonth() + 1).padStart(2, '0');
    const dayStr = String(date.getDate()).padStart(2, '0');
    return `${yearStr}-${monthStr}-${dayStr}`;
  }, [dateState]);

  // region/order/style/selectedDate 바뀔 때마다 records fetch
  useEffect(() => {
    // 필수 의존성이 없으면 실행하지 않음
    if (!region || !selectedDate) return; 

    const fetchRecords = async () => {
      setIsLoading(true);
      try {
        const records = await getRecords(region, order, selectedDate);
        
        // 스타일 필터링 적용 (기존 로직 유지)
        const filteredRecords = records.filter(record => {
          if (!style) return true; // 필터가 없으면 모두 포함
          
          // record.style (DB 저장값)과 필터 값 비교
          const recordStyleLabel = record.style; 
          const filterStyleLabel = getStyleLabel(style); // 필터 value를 label로 변환

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

  // 좋아요 토글 함수 (Firestore + UI 동기화)
  const handleToggleLike = async (recordId, isLiked) => {
    if (!user) return;
    
    // 1. DB 업데이트
    await toggleLike(recordId, user.uid);
    
    // 2. UI 상태 업데이트
    setOutfits(prev =>
      prev.map(record =>
        record.id === recordId
          ? {
            ...record,
            likes: isLiked 
              ? record.likes.filter(uid => uid !== user.uid) // 좋아요 취소
              : [...record.likes, user.uid], // 좋아요 추가
          }
          : record
      )
    );
  };
  
  // FeedDetail 반응 변경 이벤트 처리 (기존 로직 유지)
  useEffect(() => {
    const handleReactionUpdate = (event) => {
      const { recordId, type, isActive } = event.detail;
      console.log('반응 업데이트 이벤트 수신:', { recordId, type, isActive });

      setOutfits(prevOutfits =>
        prevOutfits.map(outfit => {
          if (outfit.id === recordId) {
            const updatedOutfit = { ...outfit };
            // 좋아요/싫어요 카운트 업데이트
            if (type === 'thumbsUp') {
              updatedOutfit.thumbsUpCount = (updatedOutfit.thumbsUpCount || 0) + (isActive ? 1 : -1);
            } else if (type === 'thumbsDown') {
              updatedOutfit.thumbsDownCount = (updatedOutfit.thumbsDownCount || 0) + (isActive ? 1 : -1);
            }
            // 카운트 음수 방지
            updatedOutfit.thumbsUpCount = Math.max(0, updatedOutfit.thumbsUpCount);
            updatedOutfit.thumbsDownCount = Math.max(0, updatedOutfit.thumbsDownCount);
            return updatedOutfit;
          }
          return outfit;
        })
      );
    };

    window.addEventListener('reactionUpdated', handleReactionUpdate);
    return () => window.removeEventListener('reactionUpdated', handleReactionUpdate);
  }, []); // 의존성 배열에 order나 outfits를 넣지 않아도 setOutfits 내부에서 이전 상태를 참조하므로 괜찮음

  return { outfits, selectedDate, isLoading, handleToggleLike };
}
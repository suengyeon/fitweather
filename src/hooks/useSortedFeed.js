import { useState, useEffect, useMemo } from "react";
import { getReactionSummary } from "../api/reactions"; 
import { sortRecords } from "../utils/sortingUtils"; 

/**
 * 피드 목록을 인기순으로 정렬하고 TOP3를 분리하는 커스텀 훅
 */
export function useSortedFeed(outfits, isPopular) {
  const [sortedOutfits, setSortedOutfits] = useState([]); 
  const [isLoadingReactions, setIsLoadingReactions] = useState(false); 

  // 인기순 정렬을 위한 반응 데이터 로드 및 정렬
  useEffect(() => {
    if (isPopular && outfits.length > 0) {
      setIsLoadingReactions(true);
      
      const loadReactionDataAndSort = async () => {
        try {
          // 각 피드에 대한 좋아요/싫어요 카운트 로드(이미 있는 경우 재사용)
          const outfitsWithReactions = await Promise.all(
            outfits.map(async (outfit) => {
              if (outfit.thumbsUpCount !== undefined && outfit.thumbsDownCount !== undefined) {
                  return outfit;
              }
              
              const reactionSummary = await getReactionSummary(outfit.id); // DB에서 반응 카운트 조회
              return {
                ...outfit,
                thumbsUpCount: reactionSummary.thumbsUpCount || 0,
                thumbsDownCount: reactionSummary.thumbsDownCount || 0
              };
            })
          );

          // 정렬 유틸리티 사용(인기순 'popular' 기준 정렬)
          const sorted = sortRecords(outfitsWithReactions, "popular");

          setSortedOutfits(sorted);
        } catch (error) {
          console.error("반응 데이터 로드 및 정렬 실패:", error);
          setSortedOutfits(outfits); // 실패 시 원본 목록 사용
        } finally {
          setIsLoadingReactions(false);
        }
      };

      loadReactionDataAndSort();
    } else {
      // 인기순이 아니거나 목록이 비어 있으면 원본 목록 사용
      setSortedOutfits(outfits);
    }
  }, [outfits, isPopular]); // outfits 또는 isPopular 변경 시 재실행

  // TOP3와 나머지 목록 분리(sortedOutfits 또는 isPopular 변경 시 재계산)
  const { top3, rest } = useMemo(() => {
    let top3 = [];
    let rest = sortedOutfits;

    if (isPopular && sortedOutfits.length > 0) {
      // 인기순일 경우 상위 3개 분리
      top3 = sortedOutfits.slice(0, 3);
      rest = sortedOutfits.slice(3);
    }

    return { top3, rest };
  }, [sortedOutfits, isPopular]);

  return { top3, rest, isLoadingReactions };
}
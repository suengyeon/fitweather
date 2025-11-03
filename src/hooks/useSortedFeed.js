import { useState, useEffect, useMemo } from "react";
import { getReactionSummary } from "../api/reactions"; // (필요) API 호출 함수
import { sortRecords } from "../utils/sortingUtils"; // (필요) 정렬 유틸리티

/**
 * 피드 목록을 인기순으로 정렬하고 TOP3를 분리하는 커스텀 훅
 */
export function useSortedFeed(outfits, isPopular) {
  const [sortedOutfits, setSortedOutfits] = useState([]);
  const [isLoadingReactions, setIsLoadingReactions] = useState(false);

  // 인기순 정렬을 위한 반응 데이터 로드 및 정렬 (기존 로직 유지)
  useEffect(() => {
    if (isPopular && outfits.length > 0) {
      setIsLoadingReactions(true);
      
      const loadReactionDataAndSort = async () => {
        try {
          // 각 피드에 대한 좋아요/싫어요 카운트 로드
          const outfitsWithReactions = await Promise.all(
            outfits.map(async (outfit) => {
              // 이미 좋아요/싫어요 카운트가 있는 경우 (예: useFeedData에서 업데이트된 경우) 재사용
              if (outfit.thumbsUpCount !== undefined && outfit.thumbsDownCount !== undefined) {
                  return outfit;
              }
              
              const reactionSummary = await getReactionSummary(outfit.id);
              return {
                ...outfit,
                thumbsUpCount: reactionSummary.thumbsUpCount || 0,
                thumbsDownCount: reactionSummary.thumbsDownCount || 0
              };
            })
          );

          // 정렬 유틸리티 사용 (thumbsUpCount 기반 인기순 정렬)
          // sortRecords는 outfitsWithReactions 배열을 복사하여 정렬하므로 안전함
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
  }, [outfits, isPopular]); // outfits가 변경되거나 isPopular 상태가 변경될 때 재실행

  // TOP3와 나머지 목록 분리 (기존 useMemo 로직 유지)
  const { top3, rest } = useMemo(() => {
    let top3 = [];
    let rest = sortedOutfits;

    if (isPopular && sortedOutfits.length > 0) {
      top3 = sortedOutfits.slice(0, 3);
      rest = sortedOutfits.slice(3);
    }

    return { top3, rest };
  }, [sortedOutfits, isPopular]);

  return { top3, rest, isLoadingReactions };
}
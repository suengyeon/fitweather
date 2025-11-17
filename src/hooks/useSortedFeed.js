import { useState, useEffect, useMemo } from "react";
import { getReactionSummary } from "../api/reactions"; 
import { sortRecords } from "../utils/sortingUtils"; 

/**
 * 피드 목록을 인기순으로 정렬하고 TOP3를 분리하는 커스텀 훅
 */
export function useSortedFeed(outfits, isPopular) {
  const [reactionDataMap, setReactionDataMap] = useState(new Map()); // 기록 ID -> 카운트 데이터 맵
  const [isLoadingReactions, setIsLoadingReactions] = useState(false); 

  // outfits 배열의 ID 목록 추출 (초기 로드 시에만 사용)
  const outfitIdsKey = useMemo(() => {
    return outfits.map(o => o.id).sort().join(',');
  }, [outfits.map(o => o.id).sort().join(',')]);

  // 인기순 정렬을 위한 반응 데이터 로드 (초기 로드 시에만, outfits 배열의 ID 목록이 변경될 때만)
  useEffect(() => {
    if (!isPopular || outfits.length === 0) {
      setReactionDataMap(new Map());
      return;
    }
    
    setIsLoadingReactions(true);
    
    const loadReactionData = async () => {
      try {
        const newMap = new Map(reactionDataMap);
        
        // 카운트가 없는 기록만 조회 (reactionDataMap에 없는 것만)
        const recordsToLoad = outfits.filter(outfit => {
          // outfits 배열에 이미 카운트가 있으면 스킵하고 reactionDataMap에 반영
          if (outfit.thumbsUpCount !== undefined && outfit.thumbsDownCount !== undefined) {
            newMap.set(outfit.id, {
              thumbsUpCount: outfit.thumbsUpCount,
              thumbsDownCount: outfit.thumbsDownCount
            });
            return false;
          }
          // reactionDataMap에 없으면 로드 필요
          return !newMap.has(outfit.id);
        });
        
        if (recordsToLoad.length > 0) {
          const loadedData = await Promise.all(
            recordsToLoad.map(async (outfit) => {
              const reactionSummary = await getReactionSummary(outfit.id);
              return {
                id: outfit.id,
                thumbsUpCount: reactionSummary.thumbsUpCount || 0,
                thumbsDownCount: reactionSummary.thumbsDownCount || 0
              };
            })
          );
          
          loadedData.forEach(data => {
            newMap.set(data.id, data);
          });
        }
        
        setReactionDataMap(newMap);
      } catch (error) {
        console.error("반응 데이터 로드 실패:", error);
      } finally {
        setIsLoadingReactions(false);
      }
    };

    loadReactionData();
  }, [isPopular, outfitIdsKey]); // outfits 배열의 ID 목록이 변경될 때만 실행

  // reactionUpdated 이벤트로 outfits 배열의 카운트가 업데이트되면 reactionDataMap도 동기화
  useEffect(() => {
    if (!isPopular) return;

    // outfits 배열에 카운트가 있으면 reactionDataMap에 반영
    const newMap = new Map(reactionDataMap);
    outfits.forEach(outfit => {
      if (outfit.thumbsUpCount !== undefined && outfit.thumbsDownCount !== undefined) {
        newMap.set(outfit.id, {
          thumbsUpCount: outfit.thumbsUpCount,
          thumbsDownCount: outfit.thumbsDownCount
        });
      }
    });
    
    // 변경사항이 있으면 업데이트
    if (newMap.size !== reactionDataMap.size || 
        Array.from(newMap.entries()).some(([id, data]) => {
          const old = reactionDataMap.get(id);
          return !old || old.thumbsUpCount !== data.thumbsUpCount || old.thumbsDownCount !== data.thumbsDownCount;
        })) {
      setReactionDataMap(newMap);
    }
  }, [outfits, isPopular]); // outfits 배열의 카운트가 업데이트되면 reactionDataMap 동기화

  // outfits 배열을 직접 사용하여 정렬 (카운트는 outfits 또는 reactionDataMap에서 가져옴)
  const sortedOutfits = useMemo(() => {
    if (!isPopular) {
      return outfits;
    }
    
    // outfits 배열에 카운트를 병합하여 정렬
    const outfitsWithCounts = outfits.map(outfit => {
      // outfits 배열에 이미 카운트가 있으면 우선 사용 (실시간 업데이트된 값)
      if (outfit.thumbsUpCount !== undefined && outfit.thumbsDownCount !== undefined) {
        return outfit;
      }
      
      // reactionDataMap에서 카운트 가져오기
      const reactionData = reactionDataMap.get(outfit.id);
      if (reactionData) {
        return {
          ...outfit,
          thumbsUpCount: reactionData.thumbsUpCount,
          thumbsDownCount: reactionData.thumbsDownCount
        };
      }
      
      // 카운트가 없으면 0으로 설정
      return {
        ...outfit,
        thumbsUpCount: 0,
        thumbsDownCount: 0
      };
    });
    
    return sortRecords(outfitsWithCounts, "popular");
  }, [outfits, reactionDataMap, isPopular]);

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
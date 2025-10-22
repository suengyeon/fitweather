/**
 * 정렬 유틸리티 함수들
 */

/**
 * 인기순 정렬 함수
 * 1차: 좋아요 개수 내림차순
 * 2차: 싫어요 개수 오름차순 (적은 순서대로)
 * 3차: 기록 시간 오름차순 (빠른 순서대로)
 * @param {Array} records - 정렬할 기록 배열
 * @param {Object} options - 정렬 옵션
 * @param {boolean} options.useThumbsCount - thumbsUpCount/thumbsDownCount 사용 여부
 * @returns {Array} 정렬된 배열
 */
export function sortByPopularity(records, options = {}) {
  const { useThumbsCount = false } = options;
  
  return [...records].sort((a, b) => {
    // 좋아요 수 비교
    const aLikes = useThumbsCount ? (a.thumbsUpCount || 0) : (a.likes?.length || 0);
    const bLikes = useThumbsCount ? (b.thumbsUpCount || 0) : (b.likes?.length || 0);
    
    // 싫어요 수 비교
    const aDislikes = useThumbsCount ? (a.thumbsDownCount || 0) : (a.dislikes?.length || 0);
    const bDislikes = useThumbsCount ? (b.thumbsDownCount || 0) : (b.dislikes?.length || 0);
    
    // 1차: 좋아요 개수 내림차순
    if (aLikes !== bLikes) {
      return bLikes - aLikes;
    }
    
    // 2차: 싫어요 개수 오름차순 (적은 순서대로)
    if (aDislikes !== bDislikes) {
      return aDislikes - bDislikes;
    }
    
    // 3차: 기록 시간 오름차순 (빠른 순서대로)
    const aTime = new Date(a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt);
    const bTime = new Date(b.createdAt?.toDate ? b.createdAt.toDate() : b.createdAt);
    return aTime - bTime;
  });
}

/**
 * 최신순 정렬 함수
 * @param {Array} records - 정렬할 기록 배열
 * @returns {Array} 정렬된 배열
 */
export function sortByLatest(records) {
  return [...records].sort((a, b) => {
    const aTime = new Date(a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt);
    const bTime = new Date(b.createdAt?.toDate ? b.createdAt.toDate() : b.createdAt);
    return bTime - aTime; // 최신순이므로 내림차순
  });
}

/**
 * 통합 정렬 함수
 * @param {Array} records - 정렬할 기록 배열
 * @param {string} order - 정렬 순서 ("popular" | "latest")
 * @param {Object} options - 정렬 옵션
 * @returns {Array} 정렬된 배열
 */
export function sortRecords(records, order = "latest", options = {}) {
  switch (order) {
    case "popular":
      return sortByPopularity(records, options);
    case "latest":
      return sortByLatest(records);
    default:
      return records;
  }
}

/**
 * 정렬 유틸리티 함수들
 */

/**
 * 인기순 정렬 함수(다중 조건 정렬)
 */
export function sortByPopularity(records, options = {}) {
  const { useThumbsCount = true } = options;
  
  return [...records].sort((a, b) => { // 원본 배열의 불변성을 위해 복사본에 정렬
    // 좋아요 수 결정(thumbsUpCount 우선, 없으면 likes.length 사용)
    let aLikes = 0;
    let bLikes = 0;
    
    if (useThumbsCount) {
      aLikes = a.thumbsUpCount ?? a.likes?.length ?? 0;
      bLikes = b.thumbsUpCount ?? b.likes?.length ?? 0;
    } else {
      aLikes = a.likes?.length ?? a.thumbsUpCount ?? 0;
      bLikes = b.likes?.length ?? b.thumbsUpCount ?? 0;
    }
    
    // 싫어요 수 결정(thumbsDownCount 우선, 없으면 dislikes.length 사용)
    let aDislikes = 0;
    let bDislikes = 0;
    
    if (useThumbsCount) {
      aDislikes = a.thumbsDownCount ?? a.dislikes?.length ?? 0;
      bDislikes = b.thumbsDownCount ?? b.dislikes?.length ?? 0;
    } else {
      aDislikes = a.dislikes?.length ?? a.thumbsDownCount ?? 0;
      bDislikes = b.dislikes?.length ?? b.thumbsDownCount ?? 0;
    }
    
    // 1차 : 좋아요 개수 내림차순(b - a, 높은순)
    if (aLikes !== bLikes) {
      return bLikes - aLikes;
    }
    
    // 2차 : 싫어요 개수 오름차순(a - b, 적은게 우선)
    if (aDislikes !== bDislikes) {
      return aDislikes - bDislikes;
    }
    
    // 3차 : 기록 시간 내림차순(b - a, 최신이 우선)
    // Firestore Timestamp 및 일반 Date/문자열 처리
    const aTime = new Date(a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt);
    const bTime = new Date(b.createdAt?.toDate ? b.createdAt.toDate() : b.createdAt);
    return bTime.getTime() - aTime.getTime();
  });
}

/**
 * 최신순 정렬 함수
 */
export function sortByLatest(records) {
  return [...records].sort((a, b) => { // 원본 배열의 불변성을 위해 복사본에 정렬
    // Firestore Timestamp 및 일반 Date/문자열 처리
    const aTime = new Date(a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt);
    const bTime = new Date(b.createdAt?.toDate ? b.createdAt.toDate() : b.createdAt);
    // 최신순이므로 내림차순(b - a)
    return bTime.getTime() - aTime.getTime(); 
  });
}

/**
 * 통합 정렬 함수
 */
export function sortRecords(records, order = "latest", options = {}) {
  switch (order) {
    case "popular":
      return sortByPopularity(records, options); // 인기순 정렬 호출
    case "latest":
      return sortByLatest(records); // 최신순 정렬 호출
    default:
      return records; // 정의된 정렬 순서가 아니면 원본 배열 반환
  }
}
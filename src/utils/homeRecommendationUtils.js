import { getAllPublicRecords } from './firebaseQueries'; 
import { sortRecords } from './sortingUtils'; 
import { getSeasonInfo } from './seasonUtils'; 
import { getStyleLabel } from './styleUtils'; 

/**
 * 계절별 추천 데이터 가져오기(지역 무관, 인기순 정렬)
 */
export async function getHomeRecommendations(userStyle = null, exactSeason = null) {
  try {
    console.log("🏠 홈화면 추천 요청:", { userStyle, exactSeason });
    
    // 현재 날짜 기준 계절 정보 가져오기
    const seasonInfo = getSeasonInfo(new Date());
    
    // 모든 공개 기록 조회(최대 200개)
    const allRecords = await getAllPublicRecords(200);
    
    // 1. 계절별 필터링(현재 계절에 해당하는 모든 기록)
    const seasonFilteredRecords = filterBySeason(allRecords, seasonInfo.season, exactSeason);
    
    // 2. 스타일 필터링(선택된 경우)
    let filteredRecords = seasonFilteredRecords;
    if (userStyle && userStyle.trim() !== "") {
      filteredRecords = filterByStyle(seasonFilteredRecords, userStyle);
    } else {
      console.log("👕 스타일 필터링 건너뜀 (전체)");
    }
    
    // 3. 정렬(좋아요 내림차순 → 싫어요 오름차순 → 최신순, 'popular' 기준)
    const sortedRecords = sortRecords(filteredRecords, "popular");
    
    // 4. 상위 3개 반환
    const topRecommendations = sortedRecords.slice(0, 3);
    
    console.log("🏆 최종 추천 결과:", topRecommendations.map(r => ({
      id: r.id,
      style: r.style,
      region: r.region,
      thumbsUp: r.thumbsUpCount,
      thumbsDown: r.thumbsDownCount,
      createdAt: r.createdAt
    })));
    
    return topRecommendations;
    
  } catch (error) {
    console.error("홈화면 추천 오류:", error);
    return [];
  }
}

/**
 * 계절별 필터링(정확한 계절 매칭)
 */
function filterBySeason(records, currentSeason, exactSeason = null) {
  // exactSeason이 없으면 getSeasonInfo로 기본값 설정
  if (!exactSeason) {
    const seasonInfo = getSeasonInfo(new Date());
    exactSeason = seasonInfo.label; // 한글 레이블 사용
  }
  
  console.log("🎯 홈화면 계절:", exactSeason);
  
  return records.filter(record => {
    // 1. record.season(한글 레이블)과 exactSeason(한글 레이블) 정확히 매칭
    if (record.season) {
      const matches = record.season === exactSeason;
      return matches;
    }
    
    // 2. record.weather?.season(한글 레이블)과 exactSeason 매칭
    if (record.weather?.season) {
      const matches = record.weather.season === exactSeason;
      return matches;
    }
    
    // 3. 계절 정보 없으면 날짜 기반으로 추정하여 매칭
    if (record.createdAt) {
      const recordDate = record.createdAt.toDate ? record.createdAt.toDate() : new Date(record.createdAt);
      const recordSeasonInfo = getSeasonInfo(recordDate);
      return recordSeasonInfo.season === currentSeason; // 영문 코드 기준으로 매칭
    }
    
    // 계절 정보 전혀 없으면 제외
    return false;
  });
}

/**
 * 스타일별 필터링
 */
function filterByStyle(records, targetStyle) {
  // targetStyle(영문 코드)을 한글 레이블로 변환
  const targetStyleLabel = getStyleLabel(targetStyle);
  
  console.log("🎨 스타일 필터링:", { targetStyle, targetStyleLabel });
  
  return records.filter(record => {
    // 기록의 style 필드와 targetStyle(영문 코드) 또는 targetStyleLabel(한글 레이블) 중 하나라도 일치하는지 확인
    
    // 1. 영문 코드로 직접 비교
    if (record.style === targetStyle) {
      return true;
    }
    
    // 2. 한글 레이블로 비교
    if (record.style === targetStyleLabel) {
      return true;
    }
    
    // 3. outfit.style 필드가 존재하는 경우 비교
    if (record.outfit && record.outfit.style === targetStyleLabel) {
      return true;
    }
    
    return false;
  });
}

/**
 * 새로고침을 위한 랜덤 추천(인기순 상위 10개에서 랜덤하게 3개 선택)
 */
export async function getRandomHomeRecommendations(userStyle = null, exactSeason = null) {
  try {
    console.log("🔄 랜덤 추천 요청:", { userStyle, exactSeason });
    
    // 모든 공개 기록 조회
    const allRecords = await getAllPublicRecords(200);
    
    // 계절별 필터링
    const seasonInfo = getSeasonInfo(new Date());
    const seasonFilteredRecords = filterBySeason(allRecords, seasonInfo.season, exactSeason);
    
    // 스타일 필터링(선택된 경우)
    let filteredRecords = seasonFilteredRecords;
    if (userStyle && userStyle.trim() !== "") {
      filteredRecords = filterByStyle(seasonFilteredRecords, userStyle);
    } 
    
    // 정렬 (좋아요 기반 인기순으로 전체 정렬)
    const sortedRecords = sortRecords(filteredRecords, "popular");
    
    // 상위 10개 기록 추출
    const topRecords = sortedRecords.slice(0, 10);
    
    // 상위 10개에서 랜덤하게 3개 선택 (shuffle 후 3개 슬라이스)
    const shuffled = topRecords.sort(() => Math.random() - 0.5);
    const randomRecommendations = shuffled.slice(0, 3);
    
    console.log("🎲 랜덤 추천 결과:", randomRecommendations.map(r => ({
      id: r.id,
      style: r.style,
      region: r.region,
      thumbsUp: r.thumbsUpCount,
      thumbsDown: r.thumbsDownCount
    })));
    
    return randomRecommendations;
    
  } catch (error) {
    console.error("랜덤 추천 오류:", error);
    return [];
  }
}
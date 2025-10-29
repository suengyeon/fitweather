/**
 * 홈화면 추천 로직
 */

import { getTodayPublicRecords, getAllPublicRecords } from './firebaseQueries';
import { sortRecords } from './sortingUtils';
import { getSeasonInfo } from './seasonUtils';
import { getStyleLabel } from './styleUtils';

/**
 * 계절별 추천 데이터 가져오기(지역 무관)
 * @param {string} userStyle - 사용자 스타일(선택사항)
 * @param {string} exactSeason - 홈화면에 표시된 정확한 계절
 * @returns {Promise<Array>} 추천 데이터 배열
 */
export async function getHomeRecommendations(userStyle = null, exactSeason = null) {
  try {
    console.log("🏠 홈화면 추천 요청:", { userStyle, exactSeason });
    console.log("🔍 userStyle 타입:", typeof userStyle, "값:", userStyle);
    
    // 현재 날짜 기준 계절 정보 가져오기
    const seasonInfo = getSeasonInfo(new Date());
    console.log("📅 현재 계절 정보:", seasonInfo);
    
    // 모든 공개 기록 조회(지역 상관없이)
    const allRecords = await getAllPublicRecords(200);
    console.log("📊 전체 기록:", allRecords.length, "개");
    
    // 계절별 필터링(현재 계절에 해당하는 모든 기록)
    const seasonFilteredRecords = filterBySeason(allRecords, seasonInfo.season, exactSeason);
    console.log("🍂 계절 필터링 후:", seasonFilteredRecords.length, "개");
    
    // 스타일 필터링(선택된 경우)
    let filteredRecords = seasonFilteredRecords;
    if (userStyle && userStyle.trim() !== "") {
      filteredRecords = filterByStyle(seasonFilteredRecords, userStyle);
      console.log("👕 스타일 필터링 후:", filteredRecords.length, "개");
    } else {
      console.log("👕 스타일 필터링 건너뜀 (전체)");
    }
    
    // 정렬(좋아요 내림차순 → 싫어요 오름차순 → 최신순)
    const sortedRecords = sortRecords(filteredRecords, "popular");
    
    // 상위 3개 반환
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
 * @param {Array} records - 기록 배열
 * @param {string} currentSeason - 현재 계절(영문)
 * @param {string} exactSeason - 홈화면에 표시된 정확한 계절(한글)
 * @returns {Array} 필터링된 기록 배열
 */
function filterBySeason(records, currentSeason, exactSeason = null) {
  // exactSeason이 없으면 getSeasonInfo로 기본값 설정
  if (!exactSeason) {
    const seasonInfo = getSeasonInfo(new Date());
    exactSeason = seasonInfo.label;
  }
  
  console.log("🎯 홈화면 계절:", exactSeason);
  
  return records.filter(record => {
    // 기록에 계절 정보 있으면 정확히 매칭
    if (record.season) {
      const matches = record.season === exactSeason;
      console.log(`📊 기록 계절: "${record.season}" vs 홈화면: "${exactSeason}" → ${matches ? '매칭' : '불일치'}`);
      return matches;
    }
    
    // weather.season 있으면 확인
    if (record.weather?.season) {
      const matches = record.weather.season === exactSeason;
      console.log(`📊 기록 weather.season: "${record.weather.season}" vs 홈화면: "${exactSeason}" → ${matches ? '매칭' : '불일치'}`);
      return matches;
    }
    
    // 계절 정보 없으면 날짜 기반으로 추정
    if (record.createdAt) {
      const recordDate = record.createdAt.toDate ? record.createdAt.toDate() : new Date(record.createdAt);
      const recordSeasonInfo = getSeasonInfo(recordDate);
      return recordSeasonInfo.season === currentSeason;
    }
    
    // 계절 정보 전혀 없으면 제외
    return false;
  });
}

/**
 * 스타일별 필터링
 * @param {Array} records - 기록 배열
 * @param {string} targetStyle - 대상 스타일
 * @returns {Array} 필터링된 기록 배열
 */
function filterByStyle(records, targetStyle) {
  // targetStyle이 영문 코드인 경우 한글로 변환
  const targetStyleLabel = getStyleLabel(targetStyle);
  
  console.log("🎨 스타일 필터링:", { targetStyle, targetStyleLabel });
  
  return records.filter(record => {
    // 1. 영문 코드로 직접 비교(기존 기록들)
    if (record.style === targetStyle) {
      console.log(`✅ 영문 스타일 매칭: "${record.style}" === "${targetStyle}"`);
      return true;
    }
    
    // 2. 한글로 변환해서 비교(새로 저장된 기록들)
    if (record.style === targetStyleLabel) {
      console.log(`✅ 한글 스타일 매칭: "${record.style}" === "${targetStyleLabel}"`);
      return true;
    }
    
    // 3. 스타일이 중첩 구조에 있는 경우(outfit.style)
    if (record.outfit && record.outfit.style === targetStyleLabel) {
      console.log(`✅ outfit 스타일 매칭: "${record.outfit.style}" === "${targetStyleLabel}"`);
      return true;
    }
    
    console.log(`❌ 스타일 불일치: "${record.style}" !== "${targetStyle}" && "${record.style}" !== "${targetStyleLabel}"`);
    return false;
  });
}

/**
 * 새로고침을 위한 랜덤 추천(지역 무관)
 * @param {string} userStyle - 사용자 스타일(선택사항)
 * @param {string} exactSeason - 홈화면에 표시된 정확한 계절(한글)
 * @returns {Promise<Array>} 랜덤 추천 데이터 배열
 */
export async function getRandomHomeRecommendations(userStyle = null, exactSeason = null) {
  try {
    console.log("🔄 랜덤 추천 요청:", { userStyle, exactSeason });
    
    // 모든 공개 기록 조회
    const allRecords = await getAllPublicRecords(200);
    console.log("📊 전체 기록:", allRecords.length, "개");
    
    // 계절별 필터링
    const seasonInfo = getSeasonInfo(new Date());
    const seasonFilteredRecords = filterBySeason(allRecords, seasonInfo.season, exactSeason);
    console.log("🍂 계절 필터링 후:", seasonFilteredRecords.length, "개");
    
    // 스타일 필터링(선택된 경우)
    let filteredRecords = seasonFilteredRecords;
    if (userStyle && userStyle.trim() !== "") {
      filteredRecords = filterByStyle(seasonFilteredRecords, userStyle);
      console.log("👕 스타일 필터링 후:", filteredRecords.length, "개");
    } else {
      console.log("👕 스타일 필터링 건너뜀 (전체)");
    }
    
    // 정렬
    const sortedRecords = sortRecords(filteredRecords, "popular");
    
    // 상위 10개에서 랜덤하게 3개 선택
    const topRecords = sortedRecords.slice(0, 10);
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

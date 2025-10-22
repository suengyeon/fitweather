import { getReactionSummary } from "../api/reactions";

/**
 * 계절 유사도 계산
 * @param {string} season1 - 첫 번째 계절
 * @param {string} season2 - 두 번째 계절
 * @returns {number} 유사도 점수 (0-1)
 */
export function calculateSeasonSimilarity(season1, season2) {
  if (!season1 || !season2) return 0;
  if (season1 === season2) return 1;

  const seasonMap = {
    'spring': 1,
    'summer': 2,
    'autumn': 3,
    'winter': 4
  };

  const s1 = seasonMap[season1.toLowerCase()];
  const s2 = seasonMap[season2.toLowerCase()];

  if (!s1 || !s2) return 0;

  // 인접한 계절은 높은 유사도
  const diff = Math.abs(s1 - s2);
  if (diff === 1 || diff === 3) return 0.8; // 인접 계절
  if (diff === 2) return 0.4; // 반대 계절
  return 0;
}

/**
 * 스타일 유사도 계산
 * @param {string} style1 - 첫 번째 스타일
 * @param {string} style2 - 두 번째 스타일
 * @returns {number} 유사도 점수 (0-1)
 */
export function calculateStyleSimilarity(style1, style2) {
  if (!style1 || !style2) return 0;
  if (style1 === style2) return 1;

  // 스타일 유사도 매핑
  const styleGroups = {
    'casual': ['basic', 'minimal'],
    'formal': ['business', 'elegant'],
    'basic': ['casual', 'minimal'],
    'sporty': ['active', 'athletic'],
    'feminine': ['romantic', 'girly'],
    'street': ['urban', 'hip-hop']
  };
  
  console.log(`🔍 스타일 유사도 계산: ${style1} vs ${style2}`);

  // 같은 그룹 내 스타일은 유사도 0.7
  for (const [group, styles] of Object.entries(styleGroups)) {
    if (styles.includes(style1.toLowerCase()) && styles.includes(style2.toLowerCase())) {
      return 0.7;
    }
    if (style1.toLowerCase() === group && styles.includes(style2.toLowerCase())) {
      return 0.7;
    }
    if (style2.toLowerCase() === group && styles.includes(style1.toLowerCase())) {
      return 0.7;
    }
  }

  return 0;
}

/**
 * 오늘 날짜 기준 추천 로직
 * @param {string} userRegion - 사용자 지역
 * @param {string} userStyle - 사용자 스타일
 * @returns {Promise<Array>} 추천 결과
 */
export async function getTodayRecommendations(userRegion, userStyle) {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    console.log("🔍 오늘 날짜 추천 요청:", { userRegion, userStyle, todayStr });
    
    // 오늘 날짜의 모든 공개 기록 가져오기
    const { collection, query, where, getDocs, orderBy } = await import("firebase/firestore");
    const { db } = await import("../firebase");
    
    // outfits와 records 컬렉션 모두 확인
    const outfitsQuery = query(
      collection(db, "outfits"),
      where("date", "==", todayStr),
      where("isPublic", "==", true)
    );
    
    const recordsQuery = query(
      collection(db, "records"),
      where("date", "==", todayStr),
      where("isPublic", "==", true)
    );
    
    console.log("🔍 오늘 outfits 컬렉션 쿼리 실행");
    const outfitsSnapshot = await getDocs(outfitsQuery);
    console.log("📊 오늘 outfits 컬렉션 결과:", outfitsSnapshot.size, "개");
    
    console.log("🔍 오늘 records 컬렉션 쿼리 실행");
    const recordsSnapshot = await getDocs(recordsQuery);
    console.log("📊 오늘 records 컬렉션 결과:", recordsSnapshot.size, "개");
    
    // 두 컬렉션의 결과를 합치기
    const allRecords = [];
    
    outfitsSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log("📄 오늘 outfits 기록:", { id: doc.id, date: data.date, isPublic: data.isPublic, style: data.style, region: data.region });
      allRecords.push({
        id: doc.id,
        ...data
      });
    });
    
    recordsSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log("📄 오늘 records 기록:", { 
        id: doc.id, 
        date: data.date, 
        isPublic: data.isPublic, 
        style: data.style, 
        region: data.region,
        outfit: data.outfit,
        fullData: data
      });
      allRecords.push({
        id: doc.id,
        ...data
      });
    });
    
    console.log("📊 오늘 전체 기록 수 (outfits + records):", allRecords.length);
    
    const records = allRecords;
    
    if (records.length === 0) {
      console.log("❌ 오늘 날짜에 기록이 없음");
      return [];
    }
    
    // 반응 데이터와 함께 처리
    const recordsWithReactions = await Promise.all(
      records.map(async (record) => {
        try {
          const reactionSummary = await getReactionSummary(record.id);
          return {
            ...record,
            thumbsUpCount: reactionSummary.thumbsUpCount || 0,
            thumbsDownCount: reactionSummary.thumbsDownCount || 0
          };
        } catch (error) {
          console.error(`반응 데이터 로드 실패 (${record.id}):`, error);
          return {
            ...record,
            thumbsUpCount: 0,
            thumbsDownCount: 0
          };
        }
      })
    );
    
    // 필터링 및 점수 계산
    const scoredRecords = recordsWithReactions.map(record => {
      let score = 0;
      
      // 지역 일치: +0.3
      if (record.region === userRegion) {
        score += 0.3;
      }
      
      // 스타일 완전 일치: +0.5
      if (record.style === userStyle) {
        score += 0.5;
        console.log(`✅ 스타일 완전 일치: ${record.id} (${record.style} === ${userStyle})`);
      } else if (record.style) {
        // 스타일 유사도: +0.2
        const styleSimilarity = calculateStyleSimilarity(record.style, userStyle);
        score += styleSimilarity * 0.2;
        console.log(`🔄 스타일 유사도: ${record.id} (${record.style} vs ${userStyle}) = ${styleSimilarity}`);
      }
      
      // 좋아요 수 정규화 (최대 10개 기준)
      const normalizedLikes = Math.min(record.thumbsUpCount / 10, 1);
      score += normalizedLikes * 0.3;
      
      console.log(`📊 점수 계산: ${record.id} - 총점: ${score}, 지역: ${record.region === userRegion ? '일치' : '불일치'}, 스타일: ${record.style}, 좋아요: ${record.thumbsUpCount}`);
      
      return {
        ...record,
        recommendationScore: score
      };
    });
    
    // 점수 기준 정렬
    scoredRecords.sort((a, b) => {
      if (a.recommendationScore !== b.recommendationScore) {
        return b.recommendationScore - a.recommendationScore;
      }
      
      // 점수가 같으면 좋아요 수 기준
      if (a.thumbsUpCount !== b.thumbsUpCount) {
        return b.thumbsUpCount - a.thumbsUpCount;
      }
      
      // 좋아요 수도 같으면 싫어요 적은 순
      if (a.thumbsDownCount !== b.thumbsDownCount) {
        return a.thumbsDownCount - b.thumbsDownCount;
      }
      
      // 모두 같으면 지역 일치 우선
      if (a.region === userRegion && b.region !== userRegion) return -1;
      if (b.region === userRegion && a.region !== userRegion) return 1;
      
      return 0;
    });
    
    console.log("🏆 오늘 추천 결과:", scoredRecords.slice(0, 3).map(r => ({
      id: r.id,
      score: r.recommendationScore,
      likes: r.thumbsUpCount,
      region: r.region,
      style: r.style
    })));
    
    return scoredRecords.slice(0, 3);
    
  } catch (error) {
    console.error("오늘 추천 로직 오류:", error);
    return [];
  }
}

/**
 * 과거 기록 기준 추천 로직
 * @param {string} userRegion - 사용자 지역
 * @param {string} userStyle - 사용자 스타일
 * @returns {Promise<Array>} 추천 결과
 */
export async function getPastRecommendations(userRegion, userStyle) {
  try {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    
    // 현재 계절 계산
    let currentSeason;
    if (currentMonth >= 3 && currentMonth <= 5) currentSeason = 'spring';
    else if (currentMonth >= 6 && currentMonth <= 8) currentSeason = 'summer';
    else if (currentMonth >= 9 && currentMonth <= 11) currentSeason = 'autumn';
    else currentSeason = 'winter';
    
    console.log("🔍 과거 기록 추천 요청:", { userRegion, userStyle, currentSeason });
    
    // 과거 기록 가져오기 (최근 1년)
    const { collection, query, where, getDocs, orderBy } = await import("firebase/firestore");
    const { db } = await import("../firebase");
    
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    // 인덱스 없이도 작동하도록 단순한 쿼리 사용
    // outfits와 records 컬렉션 모두 확인
    const outfitsQuery = query(
      collection(db, "outfits"),
      where("isPublic", "==", true)
    );
    
    const recordsQuery = query(
      collection(db, "records"),
      where("isPublic", "==", true)
    );
    
    console.log("🔍 outfits 컬렉션 쿼리 실행");
    const outfitsSnapshot = await getDocs(outfitsQuery);
    console.log("📊 outfits 컬렉션 결과:", outfitsSnapshot.size, "개");
    
    console.log("🔍 records 컬렉션 쿼리 실행");
    const recordsSnapshot = await getDocs(recordsQuery);
    console.log("📊 records 컬렉션 결과:", recordsSnapshot.size, "개");
    
    // 두 컬렉션의 결과를 합치기
    const allRecords = [];
    
    outfitsSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log("📄 outfits 기록:", { id: doc.id, isPublic: data.isPublic, style: data.style, region: data.region });
      allRecords.push({
        id: doc.id,
        ...data
      });
    });
    
    recordsSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log("📄 records 기록:", { 
        id: doc.id, 
        isPublic: data.isPublic, 
        style: data.style, 
        region: data.region,
        outfit: data.outfit,
        fullData: data
      });
      allRecords.push({
        id: doc.id,
        ...data
      });
    });
    
    console.log("📊 전체 기록 수 (outfits + records):", allRecords.length);
    
    // allRecords를 records로 사용
    const records = allRecords;
    
    // 클라이언트 사이드에서 날짜 필터링 (1년 이내)
    
    const filteredRecords = records.filter(record => {
      const recordDate = record.createdAt?.toDate ? record.createdAt.toDate() : new Date(record.createdAt);
      return recordDate >= oneYearAgo;
    });
    
    console.log("📊 1년 이내 기록 수:", filteredRecords.length);
    
    if (filteredRecords.length === 0) {
      console.log("❌ 1년 이내 기록이 없음");
      return [];
    }
    
    // 반응 데이터와 함께 처리
    const recordsWithReactions = await Promise.all(
      filteredRecords.map(async (record) => {
        try {
          const reactionSummary = await getReactionSummary(record.id);
          return {
            ...record,
            thumbsUpCount: reactionSummary.thumbsUpCount || 0,
            thumbsDownCount: reactionSummary.thumbsDownCount || 0
          };
        } catch (error) {
          console.error(`반응 데이터 로드 실패 (${record.id}):`, error);
          return {
            ...record,
            thumbsUpCount: 0,
            thumbsDownCount: 0
          };
        }
      })
    );
    
    // 필터링 및 점수 계산
    const scoredRecords = recordsWithReactions.map(record => {
      let score = 0;
      
      // 지역 일치: +0.3
      if (record.region === userRegion) {
        score += 0.3;
      }
      
      // 스타일 완전 일치: +0.5
      if (record.style === userStyle) {
        score += 0.5;
      } else if (record.style) {
        // 스타일 유사도: +0.2
        const styleSimilarity = calculateStyleSimilarity(record.style, userStyle);
        score += styleSimilarity * 0.2;
      }
      
      // 계절 유사도: +0.2
      if (record.season) {
        const seasonSimilarity = calculateSeasonSimilarity(record.season, currentSeason);
        score += seasonSimilarity * 0.2;
      }
      
      // 좋아요 수 정규화 (최대 10개 기준)
      const normalizedLikes = Math.min(record.thumbsUpCount / 10, 1);
      score += normalizedLikes * 0.3;
      
      return {
        ...record,
        recommendationScore: score
      };
    });
    
    // 점수 기준 정렬
    scoredRecords.sort((a, b) => {
      if (a.recommendationScore !== b.recommendationScore) {
        return b.recommendationScore - a.recommendationScore;
      }
      
      // 점수가 같으면 좋아요 수 기준
      if (a.thumbsUpCount !== b.thumbsUpCount) {
        return b.thumbsUpCount - a.thumbsUpCount;
      }
      
      // 좋아요 수도 같으면 싫어요 적은 순
      if (a.thumbsDownCount !== b.thumbsDownCount) {
        return a.thumbsDownCount - b.thumbsDownCount;
      }
      
      // 모두 같으면 지역 일치 우선
      if (a.region === userRegion && b.region !== userRegion) return -1;
      if (b.region === userRegion && a.region !== userRegion) return 1;
      
      return 0;
    });
    
    console.log("🏆 과거 추천 결과:", scoredRecords.slice(0, 3).map(r => ({
      id: r.id,
      score: r.recommendationScore,
      likes: r.thumbsUpCount,
      region: r.region,
      style: r.style,
      season: r.season
    })));
    
    return scoredRecords.slice(0, 3);
    
  } catch (error) {
    console.error("과거 추천 로직 오류:", error);
    return [];
  }
}

/**
 * 통합 추천 로직
 * @param {string} userRegion - 사용자 지역
 * @param {string} userStyle - 사용자 스타일
 * @returns {Promise<Array>} 최종 추천 결과
 */
export async function getSmartRecommendations(userRegion, userStyle) {
  try {
    console.log("🚀 스마트 추천 시작:", { userRegion, userStyle });
    
    // 1. 오늘 날짜 기준 추천 시도
    const todayRecommendations = await getTodayRecommendations(userRegion, userStyle);
    
    // 2. 오늘 추천이 있으면 반환
    if (todayRecommendations.length > 0) {
      console.log("✅ 오늘 날짜 기준 추천 사용");
      return todayRecommendations;
    }
    
    // 3. 오늘 추천이 없으면 과거 기록 기준 추천
    console.log("📅 오늘 추천 없음, 과거 기록 기준 추천 사용");
    const pastRecommendations = await getPastRecommendations(userRegion, userStyle);
    
    return pastRecommendations;
    
  } catch (error) {
    console.error("스마트 추천 오류:", error);
    return [];
  }
}

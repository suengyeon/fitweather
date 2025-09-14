// 커뮤니티 기반 추천 시스템

import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  doc,
  getDoc
} from 'firebase/firestore';

/**
 * 커뮤니티 기반 추천 엔진
 */
class CommunityBasedRecommendationEngine {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5분 캐시
  }

  /**
   * 메인 추천 함수 - 사용자들이 올린 코디 기반
   */
  async getCommunityBasedRecommendation(conditions, userId = null) {
    try {
      const { temp, weather, humidity, windSpeed, date, styleTags } = conditions;
      
      // 1. 유사한 조건의 인기 코디 찾기
      const popularOutfits = await this.findPopularOutfits(conditions);
      
      // 2. 사용자별 맞춤 추천 (로그인한 경우)
      let personalizedRecommendation = null;
      if (userId) {
        personalizedRecommendation = await this.getPersonalizedFromCommunity(userId, conditions);
      }
      
      // 3. 트렌드 기반 추천
      const trendRecommendation = await this.getTrendBasedRecommendation(conditions);
      
      // 4. 결과 통합
      const finalRecommendation = this.combineRecommendations([
        { type: 'popular', data: popularOutfits, weight: 0.4 },
        { type: 'personalized', data: personalizedRecommendation, weight: 0.3 },
        { type: 'trend', data: trendRecommendation, weight: 0.3 }
      ]);

      return {
        ...finalRecommendation,
        source: 'community',
        confidence: this.calculateConfidence(finalRecommendation),
        reasoning: this.generateReasoning(finalRecommendation, conditions),
        alternatives: this.generateAlternatives(finalRecommendation),
        communityStats: {
          totalOutfits: popularOutfits.length,
          avgLikes: this.calculateAverageLikes(popularOutfits),
          topUsers: this.getTopContributors(popularOutfits)
        }
      };
    } catch (error) {
      console.error('커뮤니티 기반 추천 오류:', error);
      return this.getFallbackRecommendation(conditions);
    }
  }

  /**
   * 유사한 조건의 인기 코디 찾기
   */
  async findPopularOutfits(conditions) {
    const cacheKey = `popular_${JSON.stringify(conditions)}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      // 온도 범위로 필터링 (±3도)
      const tempRange = this.getTemperatureRange(conditions.temp);
      
      const q = query(
        collection(db, 'records'),
        where('isPublic', '==', true),
        where('tempRange', '==', tempRange),
        orderBy('likeCount', 'desc'),
        limit(20)
      );

      const querySnapshot = await getDocs(q);
      const outfits = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (this.matchesConditions(data, conditions)) {
          outfits.push({
            id: doc.id,
            ...data,
            relevanceScore: this.calculateRelevanceScore(data, conditions)
          });
        }
      });

      // 관련도 점수로 정렬
      outfits.sort((a, b) => b.relevanceScore - a.relevanceScore);
      
      this.setCachedData(cacheKey, outfits);
      return outfits.slice(0, 10);
    } catch (error) {
      console.error('인기 코디 조회 오류:', error);
      return [];
    }
  }

  /**
   * 사용자별 맞춤 추천 (커뮤니티 데이터 기반)
   */
  async getPersonalizedFromCommunity(userId, conditions) {
    try {
      // 1. 사용자의 과거 좋아요한 코디 분석
      const likedOutfits = await this.getUserLikedOutfits(userId);
      
      // 2. 좋아요한 코디와 유사한 스타일의 인기 코디 찾기
      const similarOutfits = await this.findSimilarOutfits(likedOutfits, conditions);
      
      // 3. 사용자와 비슷한 취향의 다른 사용자들 찾기
      const similarUsers = await this.findSimilarUsers(userId);
      
      // 4. 비슷한 사용자들이 좋아한 코디 추천
      const collaborativeOutfits = await this.getCollaborativeRecommendations(similarUsers, conditions);
      
      return {
        likedBased: similarOutfits,
        collaborative: collaborativeOutfits,
        userProfile: this.analyzeUserProfile(likedOutfits)
      };
    } catch (error) {
      console.error('개인화 추천 오류:', error);
      return null;
    }
  }

  /**
   * 트렌드 기반 추천
   */
  async getTrendBasedRecommendation(conditions) {
    try {
      const now = new Date();
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      // 최근 1주일간의 인기 코디
      const q = query(
        collection(db, 'records'),
        where('isPublic', '==', true),
        where('createdAt', '>=', lastWeek),
        orderBy('createdAt', 'desc'),
        orderBy('likeCount', 'desc'),
        limit(15)
      );

      const querySnapshot = await getDocs(q);
      const trendingOutfits = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (this.matchesConditions(data, conditions)) {
          trendingOutfits.push({
            id: doc.id,
            ...data,
            trendScore: this.calculateTrendScore(data)
          });
        }
      });

      return trendingOutfits.sort((a, b) => b.trendScore - a.trendScore).slice(0, 5);
    } catch (error) {
      console.error('트렌드 추천 오류:', error);
      return [];
    }
  }

  /**
   * 사용자가 좋아요한 코디 조회
   */
  async getUserLikedOutfits(userId) {
    try {
      const q = query(
        collection(db, 'likes'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const querySnapshot = await getDocs(q);
      const likedOutfitIds = [];
      
      querySnapshot.forEach((doc) => {
        likedOutfitIds.push(doc.data().outfitId);
      });

      // 좋아요한 코디의 상세 정보 조회
      const outfits = [];
      for (const outfitId of likedOutfitIds) {
        const outfitDoc = await getDoc(doc(db, 'records', outfitId));
        if (outfitDoc.exists()) {
          outfits.push({ id: outfitDoc.id, ...outfitDoc.data() });
        }
      }

      return outfits;
    } catch (error) {
      console.error('사용자 좋아요 코디 조회 오류:', error);
      return [];
    }
  }

  /**
   * 유사한 스타일의 코디 찾기
   */
  async findSimilarOutfits(likedOutfits, conditions) {
    if (likedOutfits.length === 0) return [];

    // 좋아요한 코디의 공통 스타일 태그 추출
    const commonTags = this.extractCommonTags(likedOutfits);
    
    try {
      const q = query(
        collection(db, 'records'),
        where('isPublic', '==', true),
        where('styleTags', 'array-contains-any', commonTags.slice(0, 10)),
        orderBy('likeCount', 'desc'),
        limit(10)
      );

      const querySnapshot = await getDocs(q);
      const similarOutfits = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (this.matchesConditions(data, conditions)) {
          similarOutfits.push({
            id: doc.id,
            ...data,
            similarityScore: this.calculateSimilarityScore(data, likedOutfits)
          });
        }
      });

      return similarOutfits.sort((a, b) => b.similarityScore - a.similarityScore);
    } catch (error) {
      console.error('유사 코디 조회 오류:', error);
      return [];
    }
  }

  /**
   * 비슷한 취향의 사용자 찾기
   */
  async findSimilarUsers(userId) {
    try {
      // 사용자의 좋아요 패턴 분석
      const userLikes = await this.getUserLikedOutfits(userId);
      const userTags = this.extractCommonTags(userLikes);
      
      if (userTags.length === 0) return [];

      // 같은 태그를 좋아하는 다른 사용자들 찾기
      const q = query(
        collection(db, 'likes'),
        where('outfitId', 'in', userLikes.slice(0, 10).map(o => o.id))
      );

      const querySnapshot = await getDocs(q);
      const userSimilarity = new Map();
      
      querySnapshot.forEach((doc) => {
        const likeData = doc.data();
        if (likeData.userId !== userId) {
          const current = userSimilarity.get(likeData.userId) || 0;
          userSimilarity.set(likeData.userId, current + 1);
        }
      });

      // 유사도가 높은 사용자들 반환
      return Array.from(userSimilarity.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([userId]) => userId);
    } catch (error) {
      console.error('유사 사용자 조회 오류:', error);
      return [];
    }
  }

  /**
   * 협업 필터링 추천
   */
  async getCollaborativeRecommendations(similarUsers, conditions) {
    if (similarUsers.length === 0) return [];

    try {
      const recommendations = [];
      
      for (const userId of similarUsers) {
        const userLikes = await this.getUserLikedOutfits(userId);
        const recentLikes = userLikes
          .filter(outfit => this.matchesConditions(outfit, conditions))
          .slice(0, 3);
        
        recommendations.push(...recentLikes);
      }

      // 중복 제거 및 정렬
      const uniqueRecommendations = recommendations.filter((outfit, index, self) => 
        index === self.findIndex(o => o.id === outfit.id)
      );

      return uniqueRecommendations
        .sort((a, b) => b.likeCount - a.likeCount)
        .slice(0, 5);
    } catch (error) {
      console.error('협업 필터링 오류:', error);
      return [];
    }
  }

  /**
   * 추천 결과 통합
   */
  combineRecommendations(recommendations) {
    const combined = {
      recommendedItems: [],
      sourceOutfits: [],
      reasoning: []
    };

    recommendations.forEach(({ type, data, weight }) => {
      if (!data) return;

      switch (type) {
        case 'popular':
          combined.sourceOutfits.push(...data.slice(0, 3));
          combined.reasoning.push(`${data.length}개의 인기 코디에서 추천`);
          break;
        case 'personalized':
          if (data.likedBased) {
            combined.sourceOutfits.push(...data.likedBased.slice(0, 2));
            combined.reasoning.push('당신이 좋아한 스타일과 유사한 코디');
          }
          if (data.collaborative) {
            combined.sourceOutfits.push(...data.collaborative.slice(0, 2));
            combined.reasoning.push('비슷한 취향의 사용자들이 좋아한 코디');
          }
          break;
        case 'trend':
          combined.sourceOutfits.push(...data.slice(0, 2));
          combined.reasoning.push('최근 트렌드 코디');
          break;
      }
    });

    // 중복 제거
    const uniqueOutfits = combined.sourceOutfits.filter((outfit, index, self) => 
      index === self.findIndex(o => o.id === outfit.id)
    );

    // 아이템 추출 및 정리
    combined.recommendedItems = this.extractItemsFromOutfits(uniqueOutfits);
    combined.sourceOutfits = uniqueOutfits;

    return combined;
  }

  /**
   * 코디에서 아이템 추출
   */
  extractItemsFromOutfits(outfits) {
    const itemFrequency = new Map();
    
    outfits.forEach(outfit => {
      if (outfit.outfit) {
        Object.values(outfit.outfit).forEach(items => {
          if (Array.isArray(items)) {
            items.forEach(item => {
              const current = itemFrequency.get(item) || 0;
              itemFrequency.set(item, current + 1);
            });
          }
        });
      }
    });

    // 빈도순으로 정렬하여 상위 아이템 반환
    return Array.from(itemFrequency.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([item]) => item);
  }

  /**
   * 유틸리티 함수들
   */
  getTemperatureRange(temp) {
    if (temp < 0) return 'very_cold';
    if (temp < 10) return 'cold';
    if (temp < 20) return 'cool';
    if (temp < 25) return 'warm';
    if (temp < 30) return 'hot';
    return 'very_hot';
  }

  matchesConditions(outfit, conditions) {
    const tempDiff = Math.abs(outfit.weather?.temp - conditions.temp);
    const weatherMatch = !conditions.weather || outfit.weather?.icon === conditions.weather;
    
    return tempDiff <= 3 && weatherMatch;
  }

  calculateRelevanceScore(outfit, conditions) {
    let score = 0;
    
    // 좋아요 수 기반 점수
    score += (outfit.likeCount || 0) * 0.3;
    
    // 온도 일치도
    const tempDiff = Math.abs(outfit.weather?.temp - conditions.temp);
    score += Math.max(0, 10 - tempDiff) * 0.4;
    
    // 날씨 일치도
    if (outfit.weather?.icon === conditions.weather) {
      score += 20 * 0.3;
    }
    
    return score;
  }

  calculateTrendScore(outfit) {
    const now = new Date();
    const createdAt = new Date(outfit.createdAt);
    const daysDiff = (now - createdAt) / (1000 * 60 * 60 * 24);
    
    // 최근일수록 높은 점수, 좋아요 수도 고려
    return (outfit.likeCount || 0) / (1 + daysDiff);
  }

  calculateSimilarityScore(outfit, likedOutfits) {
    if (likedOutfits.length === 0) return 0;
    
    let score = 0;
    const outfitTags = outfit.styleTags || [];
    
    likedOutfits.forEach(liked => {
      const likedTags = liked.styleTags || [];
      const commonTags = outfitTags.filter(tag => likedTags.includes(tag));
      score += commonTags.length;
    });
    
    return score / likedOutfits.length;
  }

  extractCommonTags(outfits) {
    const tagFrequency = new Map();
    
    outfits.forEach(outfit => {
      (outfit.styleTags || []).forEach(tag => {
        const current = tagFrequency.get(tag) || 0;
        tagFrequency.set(tag, current + 1);
      });
    });
    
    return Array.from(tagFrequency.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([tag]) => tag);
  }

  analyzeUserProfile(likedOutfits) {
    const tags = this.extractCommonTags(likedOutfits);
    const avgLikes = likedOutfits.reduce((sum, outfit) => sum + (outfit.likeCount || 0), 0) / likedOutfits.length;
    
    return {
      preferredTags: tags,
      avgLikes: avgLikes,
      totalLikes: likedOutfits.length
    };
  }

  calculateConfidence(recommendation) {
    const { sourceOutfits } = recommendation;
    if (sourceOutfits.length === 0) return 0.3;
    
    const avgLikes = sourceOutfits.reduce((sum, outfit) => sum + (outfit.likeCount || 0), 0) / sourceOutfits.length;
    const baseConfidence = Math.min(0.9, 0.4 + (avgLikes / 10) * 0.3);
    
    return Math.round(baseConfidence * 100) / 100;
  }

  generateReasoning(recommendation, conditions) {
    const { reasoning } = recommendation;
    return reasoning.join(', ') + ` (${conditions.temp}°C ${conditions.weather} 날씨 기준)`;
  }

  generateAlternatives(recommendation) {
    const { sourceOutfits } = recommendation;
    if (sourceOutfits.length < 2) return [];
    
    return [
      {
        type: 'style_variation',
        items: sourceOutfits.slice(1, 3).map(outfit => 
          this.extractItemsFromOutfits([outfit])
        ).flat(),
        description: '다른 스타일 옵션'
      }
    ];
  }

  calculateAverageLikes(outfits) {
    if (outfits.length === 0) return 0;
    return outfits.reduce((sum, outfit) => sum + (outfit.likeCount || 0), 0) / outfits.length;
  }

  getTopContributors(outfits) {
    const contributors = new Map();
    
    outfits.forEach(outfit => {
      const userId = outfit.userId;
      const current = contributors.get(userId) || 0;
      contributors.set(userId, current + 1);
    });
    
    return Array.from(contributors.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([userId, count]) => ({ userId, count }));
  }

  getFallbackRecommendation(conditions) {
    return {
      recommendedItems: ['기본 티셔츠', '청바지', '스니커즈'],
      sourceOutfits: [],
      reasoning: '커뮤니티 데이터를 불러올 수 없어 기본 추천을 제공합니다',
      alternatives: [],
      confidence: 0.3,
      source: 'fallback',
      communityStats: {
        totalOutfits: 0,
        avgLikes: 0,
        topUsers: []
      }
    };
  }

  // 캐시 관리
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    return null;
  }

  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}

// 싱글톤 인스턴스
const communityRecommendationEngine = new CommunityBasedRecommendationEngine();

export default communityRecommendationEngine;


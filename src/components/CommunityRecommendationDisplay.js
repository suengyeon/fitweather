// 커뮤니티 기반 추천 표시 컴포넌트

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function CommunityRecommendationDisplay({ recommendation, onFeedback }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedItems, setSelectedItems] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleItemSelect = (item) => {
    setSelectedItems(prev => 
      prev.includes(item) 
        ? prev.filter(i => i !== item)
        : [...prev, item]
    );
  };

  const handleFeedback = async (type, rating, reason) => {
    if (!user) return;

    const feedbackData = {
      type,
      rating,
      reason,
      selectedItems,
      timestamp: new Date()
    };

    setFeedback(feedbackData);
    onFeedback?.(feedbackData);
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceText = (confidence) => {
    if (confidence >= 0.8) return '매우 높음';
    if (confidence >= 0.6) return '높음';
    if (confidence >= 0.4) return '보통';
    return '낮음';
  };

  const handleViewOutfit = (outfitId) => {
    navigate(`/FeedDetail/${outfitId}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
            👥
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">커뮤니티 추천</h3>
            <p className="text-sm text-gray-500">실제 사용자들의 인기 코디 기반</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(recommendation.confidence)}`}>
            신뢰도: {getConfidenceText(recommendation.confidence)} ({Math.round(recommendation.confidence * 100)}%)
          </span>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            {showDetails ? '간단히' : '자세히'}
          </button>
        </div>
      </div>

      {/* 추천 아이템들 */}
      <div className="mb-4">
        <h4 className="text-md font-medium text-gray-700 mb-3">추천 아이템</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {recommendation.recommendedItems.map((item, index) => (
            <button
              key={index}
              onClick={() => handleItemSelect(item)}
              className={`p-3 rounded-lg border-2 transition-all ${
                selectedItems.includes(item)
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{item}</span>
                {selectedItems.includes(item) && (
                  <span className="text-blue-500">✓</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 추천 이유 */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <h5 className="text-sm font-medium text-gray-700 mb-1">추천 이유</h5>
        <p className="text-sm text-gray-600">{recommendation.reasoning}</p>
      </div>

      {/* 커뮤니티 통계 */}
      {recommendation.communityStats && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <h5 className="text-sm font-medium text-blue-800 mb-2">커뮤니티 데이터</h5>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-blue-600">{recommendation.communityStats.totalOutfits}</p>
              <p className="text-xs text-blue-600">분석된 코디</p>
            </div>
            <div>
              <p className="text-lg font-bold text-blue-600">{Math.round(recommendation.communityStats.avgLikes)}</p>
              <p className="text-xs text-blue-600">평균 좋아요</p>
            </div>
            <div>
              <p className="text-lg font-bold text-blue-600">{recommendation.communityStats.topUsers.length}</p>
              <p className="text-xs text-blue-600">인기 사용자</p>
            </div>
          </div>
        </div>
      )}

      {/* 원본 코디들 */}
      {recommendation.sourceOutfits && recommendation.sourceOutfits.length > 0 && (
        <div className="mb-4">
          <h4 className="text-md font-medium text-gray-700 mb-3">참고된 코디</h4>
          <div className="space-y-2">
            {recommendation.sourceOutfits.slice(0, 3).map((outfit, index) => (
              <div key={outfit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {outfit.imageUrls && outfit.imageUrls.length > 0 && (
                    <img 
                      src={outfit.imageUrls[0]} 
                      alt="코디" 
                      className="w-12 h-12 rounded object-cover"
                    />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {outfit.userName || '익명'}님의 코디
                    </p>
                    <p className="text-xs text-gray-500">
                      👍 {outfit.likeCount || 0}개 좋아요
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleViewOutfit(outfit.id)}
                  className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                >
                  보기
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 상세 정보 */}
      {showDetails && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h5 className="text-sm font-medium text-gray-700 mb-2">상세 분석</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <h6 className="font-medium text-gray-600 mb-1">추천 소스</h6>
              <ul className="space-y-1 text-gray-500">
                <li>• 인기 코디: {recommendation.sourceOutfits?.length || 0}개</li>
                <li>• 평균 좋아요: {Math.round(recommendation.communityStats?.avgLikes || 0)}개</li>
                <li>• 분석 기간: 최근 1주일</li>
              </ul>
            </div>
            <div>
              <h6 className="font-medium text-gray-600 mb-1">알고리즘</h6>
              <ul className="space-y-1 text-gray-500">
                <li>• 인기도 기반: 40%</li>
                <li>• 개인화: 30%</li>
                <li>• 트렌드: 30%</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 대안 추천 */}
      {recommendation.alternatives && recommendation.alternatives.length > 0 && (
        <div className="mb-4">
          <h4 className="text-md font-medium text-gray-700 mb-2">대안 옵션</h4>
          <div className="space-y-2">
            {recommendation.alternatives.map((alternative, index) => (
              <div key={index} className="p-2 bg-green-50 rounded border-l-4 border-green-400">
                <p className="text-sm font-medium text-green-800">{alternative.description}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {alternative.items.map((item, itemIndex) => (
                    <span key={itemIndex} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 피드백 섹션 */}
      {!feedback && (
        <div className="border-t pt-4">
          <h5 className="text-sm font-medium text-gray-700 mb-3">이 추천이 도움이 되었나요?</h5>
          <div className="flex gap-2">
            <button
              onClick={() => handleFeedback('positive', 5, 'perfect')}
              className="flex-1 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
            >
              👍 완벽해요
            </button>
            <button
              onClick={() => handleFeedback('positive', 4, 'good')}
              className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              👍 좋아요
            </button>
            <button
              onClick={() => handleFeedback('neutral', 3, 'okay')}
              className="flex-1 px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
            >
              😐 보통이에요
            </button>
            <button
              onClick={() => handleFeedback('negative', 2, 'not_my_style')}
              className="flex-1 px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm"
            >
              👎 별로예요
            </button>
          </div>
        </div>
      )}

      {/* 피드백 완료 */}
      {feedback && (
        <div className="border-t pt-4">
          <div className="flex items-center gap-2 text-green-600">
            <span>✓</span>
            <span className="text-sm">피드백이 전송되었습니다. 더 나은 추천을 위해 활용하겠습니다!</span>
          </div>
        </div>
      )}

      {/* 선택된 아이템 요약 */}
      {selectedItems.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h5 className="text-sm font-medium text-blue-800 mb-1">선택한 아이템</h5>
          <div className="flex flex-wrap gap-1">
            {selectedItems.map((item, index) => (
              <span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 커뮤니티 추천 생성 버튼 컴포넌트
export function CommunityRecommendationButton({ context, onRecommendationGenerated }) {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [recommendation, setRecommendation] = useState(null);

  const generateCommunityRecommendation = async () => {
    if (!context) return;

    setIsGenerating(true);
    try {
      // 커뮤니티 기반 추천 엔진 import
      const { default: communityRecommendationEngine } = await import('../utils/communityBasedRecommendationUtils');
      
      const conditions = {
        temp: context.weather.temp,
        weather: context.weather.icon,
        humidity: context.weather.humidity || 50,
        windSpeed: context.weather.windSpeed || 0,
        date: context.time || new Date(),
        styleTags: []
      };

      const communityRecommendation = await communityRecommendationEngine.getCommunityBasedRecommendation(
        conditions,
        user?.uid
      );
      
      setRecommendation(communityRecommendation);
      onRecommendationGenerated?.(communityRecommendation);
    } catch (error) {
      console.error('커뮤니티 추천 생성 오류:', error);
      alert('커뮤니티 추천 생성에 실패했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <button
        onClick={generateCommunityRecommendation}
        disabled={isGenerating}
        className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>커뮤니티 분석 중...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <span>👥</span>
            <span>커뮤니티 추천 받기</span>
          </div>
        )}
      </button>

      {recommendation && (
        <div className="mt-4">
          <CommunityRecommendationDisplay 
            recommendation={recommendation}
            onFeedback={(feedback) => {
              console.log('커뮤니티 추천 피드백:', feedback);
            }}
          />
        </div>
      )}
    </div>
  );
}

export default CommunityRecommendationDisplay;


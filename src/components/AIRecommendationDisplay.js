// AI 추천 결과 표시 컴포넌트

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import aiRecommendationEngine from '../utils/aiRecommendationEngine';

function AIRecommendationDisplay({ recommendation, onFeedback }) {
  const { user } = useAuth();
  const [showDetails, setShowDetails] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [feedback, setFeedback] = useState(null);

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

    // AI 엔진에 피드백 전송
    await aiRecommendationEngine.processFeedback(
      user.uid, 
      recommendation.id, 
      feedbackData
    );

    // 부모 컴포넌트에 피드백 전달
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

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
            🤖
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">AI 개인화 추천</h3>
            <p className="text-sm text-gray-500">모델 v{recommendation.modelVersion}</p>
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
          {recommendation.prediction.recommendedItems.map((item, index) => (
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
        <p className="text-sm text-gray-600">{recommendation.prediction.reasoning}</p>
      </div>

      {/* 대안 추천 */}
      {recommendation.prediction.alternatives && recommendation.prediction.alternatives.length > 0 && (
        <div className="mb-4">
          <h4 className="text-md font-medium text-gray-700 mb-2">대안 옵션</h4>
          <div className="space-y-2">
            {recommendation.prediction.alternatives.map((alternative, index) => (
              <div key={index} className="p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                <p className="text-sm font-medium text-blue-800">{alternative.description}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {alternative.items.map((item, itemIndex) => (
                    <span key={itemIndex} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 상세 정보 */}
      {showDetails && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h5 className="text-sm font-medium text-gray-700 mb-2">AI 분석 상세</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <h6 className="font-medium text-gray-600 mb-1">사용자 특성</h6>
              <ul className="space-y-1 text-gray-500">
                <li>지역: {recommendation.userFeatures.region}</li>
                <li>기록 수: {recommendation.userFeatures.totalRecords}개</li>
                <li>온도 민감도: {Math.round((recommendation.userFeatures.temperatureSensitivity || 0) * 100)}%</li>
              </ul>
            </div>
            <div>
              <h6 className="font-medium text-gray-600 mb-1">현재 상황</h6>
              <ul className="space-y-1 text-gray-500">
                <li>온도: {recommendation.context.temperature}°C</li>
                <li>날씨: {recommendation.context.weatherCondition}</li>
                <li>시간: {recommendation.context.timeOfDay}</li>
                <li>계절: {recommendation.context.season}</li>
              </ul>
            </div>
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
            <span className="text-sm">피드백이 전송되었습니다. AI가 더 나은 추천을 위해 학습하겠습니다!</span>
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

// AI 추천 생성 버튼 컴포넌트
export function AIRecommendationButton({ context, onRecommendationGenerated }) {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [recommendation, setRecommendation] = useState(null);

  const generateAIRecommendation = async () => {
    if (!user || !context) return;

    setIsGenerating(true);
    try {
      const aiRecommendation = await aiRecommendationEngine.generateRecommendation(
        user.uid,
        context
      );
      
      setRecommendation(aiRecommendation);
      onRecommendationGenerated?.(aiRecommendation);
    } catch (error) {
      console.error('AI 추천 생성 오류:', error);
      alert('AI 추천 생성에 실패했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <button
        onClick={generateAIRecommendation}
        disabled={isGenerating}
        className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>AI가 분석 중...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <span>🤖</span>
            <span>AI 개인화 추천 받기</span>
          </div>
        )}
      </button>

      {recommendation && (
        <div className="mt-4">
          <AIRecommendationDisplay 
            recommendation={recommendation}
            onFeedback={(feedback) => {
              console.log('AI 추천 피드백:', feedback);
            }}
          />
        </div>
      )}
    </div>
  );
}

export default AIRecommendationDisplay;


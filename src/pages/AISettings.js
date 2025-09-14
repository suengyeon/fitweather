// AI 추천 시스템 설정 페이지

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Bars3Icon } from '@heroicons/react/24/solid';
import Sidebar from '../components/Sidebar';
import { analyzeUserStylePreferences, analyzeUserTemperaturePreferences } from '../utils/aiDataCollectionUtils';
import { AIModelManager } from '../utils/aiApiUtils';

function AISettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userAnalysis, setUserAnalysis] = useState(null);
  const [modelMetrics, setModelMetrics] = useState(null);
  const [preferences, setPreferences] = useState({
    enablePersonalization: true,
    enableCommunityData: true,
    enableWeatherBased: true,
    enableStyleBased: true,
    enableTimeBased: true,
    confidenceThreshold: 0.6,
    maxRecommendations: 5
  });

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const [styleAnalysis, tempAnalysis, metrics] = await Promise.all([
        analyzeUserStylePreferences(user.uid),
        analyzeUserTemperaturePreferences(user.uid),
        AIModelManager.getPerformanceMetrics()
      ]);

      setUserAnalysis({ styleAnalysis, tempAnalysis });
      setModelMetrics(metrics.data);
    } catch (error) {
      console.error('사용자 데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const savePreferences = async () => {
    try {
      // 실제 구현에서는 Firestore에 사용자 설정 저장
      console.log('AI 설정 저장:', preferences);
      alert('설정이 저장되었습니다.');
    } catch (error) {
      console.error('설정 저장 오류:', error);
      alert('설정 저장에 실패했습니다.');
    }
  };

  const resetToDefaults = () => {
    setPreferences({
      enablePersonalization: true,
      enableCommunityData: true,
      enableWeatherBased: true,
      enableStyleBased: true,
      enableTimeBased: true,
      confidenceThreshold: 0.6,
      maxRecommendations: 5
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-100 flex flex-col relative">
      {/* 사이드바 */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* 상단 네비게이션 */}
      <div className="flex justify-between items-center px-4 py-3 bg-blue-100 shadow">
        <button 
          className="bg-blue-300 px-3 py-1 rounded-md hover:bg-blue-400"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Bars3Icon className="w-5 h-5" />
        </button>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate("/")} 
            className="text-sm font-medium hover:underline"
          >
            홈으로
          </button>
          <div className="bg-blue-200 px-2 py-1 rounded text-sm font-semibold">
            AI 설정
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">AI 추천 설정</h1>
            <p className="text-gray-600">개인화된 AI 추천을 위한 설정을 관리하세요</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 설정 패널 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 추천 옵션 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">추천 옵션</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">개인화 추천</h3>
                      <p className="text-sm text-gray-500">사용자의 과거 기록을 기반으로 한 개인화된 추천</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.enablePersonalization}
                        onChange={(e) => handlePreferenceChange('enablePersonalization', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">커뮤니티 데이터 활용</h3>
                      <p className="text-sm text-gray-500">다른 사용자들의 인기 패턴을 반영한 추천</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.enableCommunityData}
                        onChange={(e) => handlePreferenceChange('enableCommunityData', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">날씨 기반 추천</h3>
                      <p className="text-sm text-gray-500">현재 날씨 조건을 고려한 추천</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.enableWeatherBased}
                        onChange={(e) => handlePreferenceChange('enableWeatherBased', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">스타일 기반 추천</h3>
                      <p className="text-sm text-gray-500">사용자의 스타일 선호도를 반영한 추천</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.enableStyleBased}
                        onChange={(e) => handlePreferenceChange('enableStyleBased', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">시간 기반 추천</h3>
                      <p className="text-sm text-gray-500">시간대와 요일을 고려한 추천</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.enableTimeBased}
                        onChange={(e) => handlePreferenceChange('enableTimeBased', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* 고급 설정 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">고급 설정</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      신뢰도 임계값: {Math.round(preferences.confidenceThreshold * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0.3"
                      max="0.9"
                      step="0.1"
                      value={preferences.confidenceThreshold}
                      onChange={(e) => handlePreferenceChange('confidenceThreshold', parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      낮은 값: 더 많은 추천, 높은 값: 더 정확한 추천
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      최대 추천 아이템 수: {preferences.maxRecommendations}개
                    </label>
                    <input
                      type="range"
                      min="3"
                      max="10"
                      step="1"
                      value={preferences.maxRecommendations}
                      onChange={(e) => handlePreferenceChange('maxRecommendations', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="flex gap-4">
                <button
                  onClick={savePreferences}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  설정 저장
                </button>
                <button
                  onClick={resetToDefaults}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  기본값으로 재설정
                </button>
              </div>
            </div>

            {/* 사이드바 정보 */}
            <div className="space-y-6">
              {/* 사용자 분석 요약 */}
              {userAnalysis && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">내 분석 데이터</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">총 기록 수</span>
                      <span className="font-medium">{userAnalysis.styleAnalysis.totalRecords}개</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">온도 분석</span>
                      <span className="font-medium">{userAnalysis.tempAnalysis.totalRecords}개</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">선호 스타일</span>
                      <span className="font-medium">
                        {Object.keys(userAnalysis.styleAnalysis.styleTagFrequency).length}개
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* AI 모델 성능 */}
              {modelMetrics && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">AI 모델 성능</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">정확도</span>
                      <span className="font-medium text-green-600">
                        {Math.round(modelMetrics.accuracy * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">사용자 만족도</span>
                      <span className="font-medium text-blue-600">
                        {Math.round(modelMetrics.userSatisfaction * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">총 추천 수</span>
                      <span className="font-medium">
                        {modelMetrics.totalRecommendations.toLocaleString()}개
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 도움말 */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">💡 도움말</h3>
                <div className="text-sm text-blue-800 space-y-2">
                  <p>• 개인화 추천을 켜면 더 정확한 추천을 받을 수 있습니다</p>
                  <p>• 신뢰도 임계값이 높을수록 더 확실한 추천만 받게 됩니다</p>
                  <p>• 더 많은 기록을 남길수록 AI가 더 정확해집니다</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AISettings;


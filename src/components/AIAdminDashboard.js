// AI 추천 시스템 관리자 대시보드

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AIModelManager } from '../utils/aiApiUtils';
import { analyzeCommunityTrends, analyzeUserStylePreferences } from '../utils/aiDataCollectionUtils';

function AIAdminDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [modelUpdate, setModelUpdate] = useState(null);
  const [communityTrends, setCommunityTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [metricsData, updateData, trendsData] = await Promise.all([
        AIModelManager.getPerformanceMetrics(),
        AIModelManager.checkForUpdates(),
        analyzeCommunityTrends(500) // 최근 500개 기록 분석
      ]);

      setMetrics(metricsData.data);
      setModelUpdate(updateData.data);
      setCommunityTrends(trendsData);
    } catch (error) {
      console.error('대시보드 데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPercentage = (value) => {
    return `${Math.round(value * 100)}%`;
  };

  const formatNumber = (value) => {
    return value.toLocaleString();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI 추천 시스템 대시보드</h1>
        <p className="text-gray-600">AI 모델 성능 및 사용자 패턴 분석</p>
      </div>

      {/* 탭 네비게이션 */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: '개요', icon: '📊' },
            { id: 'performance', label: '성능', icon: '⚡' },
            { id: 'trends', label: '트렌드', icon: '📈' },
            { id: 'users', label: '사용자', icon: '👥' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 개요 탭 */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 핵심 메트릭 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">정확도</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatPercentage(metrics.accuracy)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-xl">🎯</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">사용자 만족도</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatPercentage(metrics.userSatisfaction)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-xl">😊</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">총 추천 수</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatNumber(metrics.totalRecommendations)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 text-xl">🤖</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">긍정 피드백</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatPercentage(metrics.positiveFeedback)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 text-xl">👍</span>
                </div>
              </div>
            </div>
          </div>

          {/* 모델 업데이트 상태 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">모델 상태</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">현재 버전</p>
                <p className="text-lg font-medium text-gray-900">{modelUpdate.currentVersion}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">최신 버전</p>
                <p className="text-lg font-medium text-gray-900">{modelUpdate.latestVersion}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">업데이트 상태</p>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  modelUpdate.hasUpdate 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {modelUpdate.hasUpdate ? '업데이트 가능' : '최신 버전'}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">마지막 업데이트</p>
                <p className="text-sm text-gray-900">
                  {new Date(modelUpdate.releaseDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            {modelUpdate.hasUpdate && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>업데이트 내용:</strong> {modelUpdate.updateDescription}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 성능 탭 */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 정확도 메트릭 */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">정확도 메트릭</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">정확도 (Accuracy)</span>
                  <span className="font-medium">{formatPercentage(metrics.accuracy)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${metrics.accuracy * 100}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">정밀도 (Precision)</span>
                  <span className="font-medium">{formatPercentage(metrics.precision)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${metrics.precision * 100}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">재현율 (Recall)</span>
                  <span className="font-medium">{formatPercentage(metrics.recall)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full" 
                    style={{ width: `${metrics.recall * 100}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">F1 점수</span>
                  <span className="font-medium">{formatPercentage(metrics.f1Score)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-orange-600 h-2 rounded-full" 
                    style={{ width: `${metrics.f1Score * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* 사용자 피드백 */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">사용자 피드백</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">전체 만족도</span>
                  <span className="font-medium">{formatPercentage(metrics.userSatisfaction)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${metrics.userSatisfaction * 100}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">긍정 피드백</span>
                  <span className="font-medium">{formatPercentage(metrics.positiveFeedback)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${metrics.positiveFeedback * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 트렌드 탭 */}
      {activeTab === 'trends' && communityTrends && (
        <div className="space-y-6">
          {/* 인기 스타일 태그 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">인기 스타일 태그</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(communityTrends.popularityMetrics)
                .sort(([,a], [,b]) => b.popularity - a.popularity)
                .slice(0, 8)
                .map(([tag, data]) => (
                  <div key={tag} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900">{tag}</p>
                    <p className="text-sm text-gray-600">사용 {data.total}회</p>
                    <p className="text-xs text-blue-600">인기도 {Math.round(data.popularity)}</p>
                  </div>
                ))}
            </div>
          </div>

          {/* 계절별 트렌드 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">계절별 트렌드</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(communityTrends.seasonalTrends).map(([season, trends]) => (
                <div key={season} className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">{season}</h4>
                  <div className="space-y-1">
                    {Object.entries(trends)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 3)
                      .map(([tag, count]) => (
                        <div key={tag} className="flex justify-between text-sm">
                          <span className="text-gray-600">{tag}</span>
                          <span className="font-medium">{count}회</span>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 사용자 탭 */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">사용자 분석</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 text-2xl">👥</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.totalRecommendations)}</p>
                <p className="text-sm text-gray-600">총 추천 요청</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-600 text-2xl">📈</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatPercentage(metrics.userSatisfaction)}</p>
                <p className="text-sm text-gray-600">사용자 만족도</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 text-2xl">🔄</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">24시간</p>
                <p className="text-sm text-gray-600">평균 응답 시간</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 새로고침 버튼 */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={loadDashboardData}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          데이터 새로고침
        </button>
      </div>
    </div>
  );
}

export default AIAdminDashboard;


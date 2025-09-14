// 룩북 탐색 페이지

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getPublicCalendars, 
  getFollowingCalendars, 
  getPopularCalendars 
} from '../utils/calendarSharingUtils';
import PublicCalendarViewer from '../components/PublicCalendarViewer';
import Sidebar from '../components/Sidebar';

function Lookbook() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('discover'); // 'discover' | 'following' | 'popular'
  const [calendars, setCalendars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCalendar, setSelectedCalendar] = useState(null);

  useEffect(() => {
    loadCalendars();
  }, [activeTab, user]);

  const loadCalendars = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      let calendarsData = [];
      
      switch (activeTab) {
        case 'discover':
          calendarsData = await getPublicCalendars();
          break;
        case 'following':
          calendarsData = await getFollowingCalendars(user.uid);
          break;
        case 'popular':
          calendarsData = await getPopularCalendars();
          break;
        default:
          calendarsData = [];
      }
      
      setCalendars(calendarsData);
    } catch (error) {
      console.error('캘린더 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCalendarClick = (calendar) => {
    setSelectedCalendar(calendar);
  };

  const handleCloseViewer = () => {
    setSelectedCalendar(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1">
        {/* 헤더 */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ☰
                </button>
                <h1 className="text-2xl font-bold text-gray-800">룩북 탐색</h1>
              </div>
              
              {/* 탭 메뉴 */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('discover')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'discover'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  탐색
                </button>
                <button
                  onClick={() => setActiveTab('following')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'following'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  팔로잉
                </button>
                <button
                  onClick={() => setActiveTab('popular')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'popular'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  인기
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="max-w-6xl mx-auto px-4 py-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="text-gray-500 mt-2">룩북을 불러오는 중...</p>
            </div>
          ) : calendars.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {calendars.map((calendar) => (
                <CalendarCard
                  key={calendar.id}
                  calendar={calendar}
                  onClick={() => handleCalendarClick(calendar)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📅</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {activeTab === 'discover' ? '공개된 룩북이 없습니다' :
                 activeTab === 'following' ? '팔로잉한 사용자의 룩북이 없습니다' :
                 '인기 룩북이 없습니다'}
              </h3>
              <p className="text-gray-500 mb-4">
                {activeTab === 'discover' ? '다른 사용자들이 룩북을 공개하면 여기에 표시됩니다.' :
                 activeTab === 'following' ? '다른 사용자를 팔로우하거나 룩북을 공개해보세요!' :
                 '좋아요가 많은 룩북이 여기에 표시됩니다.'}
              </p>
              {activeTab === 'following' && (
                <button
                  onClick={() => setActiveTab('discover')}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  다른 룩북 탐색하기
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 캘린더 뷰어 */}
      {selectedCalendar && (
        <PublicCalendarViewer
          targetUserId={selectedCalendar.userId}
          targetUser={selectedCalendar.user}
          onClose={handleCloseViewer}
        />
      )}
    </div>
  );
}

// 캘린더 카드 컴포넌트
function CalendarCard({ calendar, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
    >
      {/* 사용자 정보 */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
            {calendar.user?.nickname?.charAt(0) || calendar.user?.displayName?.charAt(0) || 'U'}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800">
              {calendar.user?.nickname || calendar.user?.displayName || '익명'}
            </h3>
            <p className="text-sm text-gray-500">
              {calendar.user?.region && `${calendar.user.region} 지역`}
            </p>
          </div>
        </div>
      </div>

      {/* 캘린더 미리보기 */}
      <div className="p-4">
        <div className="grid grid-cols-7 gap-1 mb-3">
          {['일', '월', '화', '수', '목', '금', '토'].map(day => (
            <div key={day} className="text-xs text-center text-gray-500 font-medium">
              {day}
            </div>
          ))}
          
          {/* 간단한 캘린더 그리드 (4주) */}
          {Array.from({ length: 28 }, (_, i) => (
            <div
              key={i}
              className="aspect-square bg-gray-100 rounded text-xs flex items-center justify-center"
            >
              {i < 7 ? i + 1 : i < 14 ? i - 6 : i < 21 ? i - 13 : i - 20}
            </div>
          ))}
        </div>

        {/* 통계 정보 */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span>❤️</span>
              <span>{calendar.likeCount || 0}</span>
            </span>
            <span className="flex items-center gap-1">
              <span>👁️</span>
              <span>{calendar.viewCount || 0}</span>
            </span>
            <span className="flex items-center gap-1">
              <span>💬</span>
              <span>{calendar.commentCount || 0}</span>
            </span>
          </div>
          <span className="text-xs">
            {calendar.shareLevel === 'public' ? '전체 공개' : '팔로워만'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default Lookbook;


import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext'; 
import { saveCalendarSharingSettings, getCalendarSharingSettings } from '../utils/calendarSharingUtils'; 

/**
 * CalendarSharingSettings 컴포넌트 - 사용자의 캘린더 공유 및 공개 설정 관리하는 모달 UI
 */
function CalendarSharingSettings({ onClose }) {
  const { user } = useAuth(); // 현재 로그인한 사용자 정보
  
  // --- 상태 관리 ---
  const [settings, setSettings] = useState({
    isPublic: false,      
    shareLevel: 'private', 
    allowComments: false,  
    allowLikes: true,      
    showPersonalInfo: false 
  });
  const [loading, setLoading] = useState(true); 
  const [saving, setSaving] = useState(false);  

  // --- 데이터 로딩(Mount 시 및 user 변경 시) ---
  useEffect(() => {
    // 사용자 정보 로드되면 기존 설정 불러오기
    loadSettings();
  }, [user]); // user 객체 변경될 때마다 재실행

  /**
   * Firestore에서 현재 사용자의 저장된 캘린더 공유 설정을 비동기적으로 불러옴
   */
  const loadSettings = async () => {
    if (!user) return; // 사용자 정보 없으면 종료
    
    setLoading(true);
    try {
      // 유틸리티 함수 이용해 설정 데이터 조회
      const currentSettings = await getCalendarSharingSettings(user.uid);
      setSettings(currentSettings); // 조회된 설정으로 상태 업데이트
    } catch (error) {
      console.error('설정 로드 오류:', error);
    } finally {
      setLoading(false); // 로딩 완료
    }
  };

  /**
   * 변경된 설정을 Firestore에 비동기적으로 저장
   */
  const handleSave = async () => {
    if (!user) return; // 사용자 정보 없으면 종료
    
    setSaving(true);
    
    try {
      // 유틸리티 함수 이용해 변경된 설정 저장
      await saveCalendarSharingSettings(user.uid, settings);
      // 저장 성공 알림 및 모달 닫기
      alert('캘린더 공유 설정이 저장되었습니다.'); 
      onClose?.(); 
    } catch (error) {
      console.error('설정 저장 오류:', error);
      alert('설정 저장에 실패했습니다.');
    } finally {
      setSaving(false); // 저장 상태 해제
    }
  };

  /**
   * 개별 설정 항목의 값이 변경될 때 상태 업데이트하는 범용 핸들러
   */
  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value // 특정 키 값만 변경
    }));
  };

  // --- 렌더링 : 로딩 중 상태 ---
  if (loading) {
    return (
      // 모달 배경 및 로딩 스피너 UI
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="text-gray-500 mt-2">설정을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  // --- 렌더링 : 설정 모달 UI ---
  return (
    // 모달 컨테이너
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md max-h-96 overflow-hidden">
        
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">캘린더 공유 설정</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        {/* 설정 내용(스크롤 가능한 영역) */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-80">
          
          {/* 1. 캘린더 공개 여부(토글 스위치) */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-800">캘린더 공개</h3>
              <p className="text-sm text-gray-500">다른 사용자가 내 캘린더를 볼 수 있게 합니다</p>
            </div>
            {/* 토글 스위치 UI */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.isPublic}
                onChange={(e) => handleSettingChange('isPublic', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* 2. 공개 범위(isPublic이 true일 때만 표시) */}
          {settings.isPublic && (
            <div>
              <h3 className="font-medium text-gray-800 mb-2">공개 범위</h3>
              <div className="space-y-2">
                {/* 라디오 버튼 : 전체 공개 */}
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="shareLevel"
                    value="public"
                    checked={settings.shareLevel === 'public'}
                    onChange={(e) => handleSettingChange('shareLevel', e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">전체 공개</span>
                </label>
                {/* 라디오 버튼 : 팔로워만 */}
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="shareLevel"
                    value="followers"
                    checked={settings.shareLevel === 'followers'}
                    onChange={(e) => handleSettingChange('shareLevel', e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">팔로워만</span>
                </label>
              </div>
            </div>
          )}

          {/* 3. 좋아요 허용(isPublic이 true일 때만 표시) */}
          {settings.isPublic && (
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-800">좋아요 허용</h3>
                <p className="text-sm text-gray-500">다른 사용자가 내 캘린더에 좋아요를 누를 수 있습니다</p>
              </div>
              {/* 좋아요 허용 토글 */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.allowLikes}
                  onChange={(e) => handleSettingChange('allowLikes', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          )}

          {/* 4. 댓글 허용(isPublic이 true일 때만 표시) */}
          {settings.isPublic && (
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-800">댓글 허용</h3>
                <p className="text-sm text-gray-500">다른 사용자가 내 캘린더에 댓글을 달 수 있습니다</p>
              </div>
              {/* 댓글 허용 토글 */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.allowComments}
                  onChange={(e) => handleSettingChange('allowComments', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          )}

          {/* 5. 개인정보 표시(isPubli이 true일 때만 표시) */}
          {settings.isPublic && (
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-800">개인정보 표시</h3>
                <p className="text-sm text-gray-500">닉네임, 지역 등 개인정보를 표시합니다</p>
              </div>
              {/* 개인정보 표시 토글 */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showPersonalInfo}
                  onChange={(e) => handleSettingChange('showPersonalInfo', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          )}
        </div>

        {/* 하단 버튼 영역 */}
        <div className="flex justify-end gap-2 p-4 border-t">
          {/* 취소 버튼 */}
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            취소
          </button>
          {/* 저장 버튼 (saving 중일 때 비활성화) */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CalendarSharingSettings;
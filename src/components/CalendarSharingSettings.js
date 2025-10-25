// 캘린더 공유 설정 컴포넌트

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { saveCalendarSharingSettings, getCalendarSharingSettings } from '../utils/calendarSharingUtils';

function CalendarSharingSettings({ onClose }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    isPublic: false,
    shareLevel: 'private',
    allowComments: false,
    allowLikes: true,
    showPersonalInfo: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const currentSettings = await getCalendarSharingSettings(user.uid);
      setSettings(currentSettings);
    } catch (error) {
      console.error('설정 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      await saveCalendarSharingSettings(user.uid, settings);
      alert('캘린더 공유 설정이 저장되었습니다.');
      onClose?.();
    } catch (error) {
      console.error('설정 저장 오류:', error);
      alert('설정 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading) {
    return (
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

  return (
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

        {/* 설정 내용 */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-80">
          {/* 공개 여부 */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-800">캘린더 공개</h3>
              <p className="text-sm text-gray-500">다른 사용자가 내 캘린더를 볼 수 있게 합니다</p>
            </div>
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

          {/* 공개 레벨 */}
          {settings.isPublic && (
            <div>
              <h3 className="font-medium text-gray-800 mb-2">공개 범위</h3>
              <div className="space-y-2">
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

          {/* 좋아요 허용 */}
          {settings.isPublic && (
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-800">좋아요 허용</h3>
                <p className="text-sm text-gray-500">다른 사용자가 내 캘린더에 좋아요를 누를 수 있습니다</p>
              </div>
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

          {/* 댓글 허용 */}
          {settings.isPublic && (
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-800">댓글 허용</h3>
                <p className="text-sm text-gray-500">다른 사용자가 내 캘린더에 댓글을 달 수 있습니다</p>
              </div>
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

          {/* 개인정보 표시 */}
          {settings.isPublic && (
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-800">개인정보 표시</h3>
                <p className="text-sm text-gray-500">닉네임, 지역 등 개인정보를 표시합니다</p>
              </div>
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

        {/* 하단 버튼 */}
        <div className="flex justify-end gap-2 p-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            취소
          </button>
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











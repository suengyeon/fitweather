// src/components/ApiSourceIndicator.js
// API 소스 표시 컴포넌트

import React from 'react';

/**
 * API 소스 표시 컴포넌트
 * @param {string} apiSource - API 소스 ('kma' | 'openweathermap')
 * @param {boolean} showLabel - 라벨 표시 여부
 */
export default function ApiSourceIndicator({ apiSource, showLabel = false }) {
  if (!apiSource) return null;

  const getApiInfo = (source) => {
    switch (source) {
      case 'kma':
        return {
          label: '기상청',
          emoji: '🇰🇷',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          description: '기상청 API'
        };
      case 'openweathermap':
        return {
          label: 'OpenWeather',
          emoji: '🌍',
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          description: 'OpenWeatherMap API'
        };
      default:
        return null;
    }
  };

  const apiInfo = getApiInfo(apiSource);
  if (!apiInfo) return null;

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${apiInfo.bgColor} ${apiInfo.color}`}>
      <span className="mr-1">{apiInfo.emoji}</span>
      {showLabel && (
        <span className="mr-1">{apiInfo.label}</span>
      )}
      <span title={apiInfo.description}>
        {apiSource === 'kma' ? 'KMA' : 'OWM'}
      </span>
    </div>
  );
}

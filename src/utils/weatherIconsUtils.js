// 날씨 아이콘 및 일러스트 관리 유틸리티

/**
 * 날씨 상태별 아이콘 매핑
 */
export const WEATHER_ICONS = {
  // 맑음
  sunny: {
    emoji: '☀️',
    icon: 'sunny',
    description: '맑음',
    illustrations: [
      { type: 'sun', size: 'large', position: 'center' },
      { type: 'cloud', size: 'small', position: 'top-right', opacity: 0.3 }
    ]
  },
  
  // 구름
  cloudy: {
    emoji: '☁️',
    icon: 'cloudy',
    description: '구름',
    illustrations: [
      { type: 'cloud', size: 'large', position: 'center' },
      { type: 'cloud', size: 'medium', position: 'top-left', opacity: 0.7 }
    ]
  },
  
  // 흐림
  overcast: {
    emoji: '☁️',
    icon: 'overcast',
    description: '흐림',
    illustrations: [
      { type: 'cloud', size: 'large', position: 'center', opacity: 0.8 },
      { type: 'cloud', size: 'medium', position: 'top-right', opacity: 0.6 },
      { type: 'cloud', size: 'small', position: 'bottom-left', opacity: 0.4 }
    ]
  },
  
  // 비
  rainy: {
    emoji: '🌧️',
    icon: 'rainy',
    description: '비',
    illustrations: [
      { type: 'cloud', size: 'large', position: 'center', opacity: 0.8 },
      { type: 'rain', size: 'medium', position: 'center', intensity: 'medium' }
    ]
  },
  
  // 소나기
  shower: {
    emoji: '🌦️',
    icon: 'shower',
    description: '소나기',
    illustrations: [
      { type: 'cloud', size: 'medium', position: 'center', opacity: 0.7 },
      { type: 'rain', size: 'small', position: 'center', intensity: 'light' },
      { type: 'sun', size: 'small', position: 'top-right', opacity: 0.5 }
    ]
  },
  
  // 천둥번개
  thunderstorm: {
    emoji: '⛈️',
    icon: 'thunderstorm',
    description: '천둥번개',
    illustrations: [
      { type: 'cloud', size: 'large', position: 'center', opacity: 0.9 },
      { type: 'lightning', size: 'medium', position: 'center' },
      { type: 'rain', size: 'large', position: 'center', intensity: 'heavy' }
    ]
  },
  
  // 눈
  snowy: {
    emoji: '❄️',
    icon: 'snowy',
    description: '눈',
    illustrations: [
      { type: 'cloud', size: 'large', position: 'center', opacity: 0.8 },
      { type: 'snow', size: 'medium', position: 'center', intensity: 'medium' }
    ]
  },
  
  // 안개
  foggy: {
    emoji: '🌫️',
    icon: 'foggy',
    description: '안개',
    illustrations: [
      { type: 'fog', size: 'large', position: 'center', opacity: 0.6 }
    ]
  },
  
  // 바람
  windy: {
    emoji: '💨',
    icon: 'windy',
    description: '바람',
    illustrations: [
      { type: 'wind', size: 'medium', position: 'center', direction: 'horizontal' },
      { type: 'cloud', size: 'small', position: 'top-left', opacity: 0.5 }
    ]
  }
};

/**
 * 날씨 상태를 아이콘으로 변환
 */
export function getWeatherIcon(weatherCode, temperature = 20) {
  // 날씨 코드 표준화
  const normalizedCode = normalizeWeatherCode(weatherCode);
  
  // 기본 아이콘 정보 가져오기
  const iconInfo = WEATHER_ICONS[normalizedCode] || WEATHER_ICONS.sunny;
  
  return {
    ...iconInfo,
    weatherCode: normalizedCode
  };
}

/**
 * 날씨 코드 정규화
 */
function normalizeWeatherCode(code) {
  if (!code) return 'sunny';
  
  const codeStr = code.toString().toLowerCase();
  
  // 다양한 날씨 코드를 표준 코드로 매핑
  if (codeStr.includes('sun') || codeStr.includes('clear')) return 'sunny';
  if (codeStr.includes('cloud')) return 'cloudy';
  if (codeStr.includes('overcast') || codeStr.includes('overcast')) return 'overcast';
  if (codeStr.includes('rain') || codeStr.includes('drizzle')) return 'rainy';
  if (codeStr.includes('shower')) return 'shower';
  if (codeStr.includes('thunder') || codeStr.includes('storm')) return 'thunderstorm';
  if (codeStr.includes('snow')) return 'snowy';
  if (codeStr.includes('fog') || codeStr.includes('mist')) return 'foggy';
  if (codeStr.includes('wind')) return 'windy';
  
  return 'sunny'; // 기본값
}
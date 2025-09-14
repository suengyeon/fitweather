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
    color: '#FFD700',
    gradient: 'from-yellow-400 to-orange-400',
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
    color: '#87CEEB',
    gradient: 'from-gray-300 to-gray-500',
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
    color: '#708090',
    gradient: 'from-gray-400 to-gray-600',
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
    color: '#4682B4',
    gradient: 'from-blue-400 to-blue-600',
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
    color: '#5F9EA0',
    gradient: 'from-blue-300 to-blue-500',
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
    color: '#2F4F4F',
    gradient: 'from-gray-600 to-gray-800',
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
    color: '#B0E0E6',
    gradient: 'from-blue-100 to-blue-300',
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
    color: '#D3D3D3',
    gradient: 'from-gray-200 to-gray-400',
    illustrations: [
      { type: 'fog', size: 'large', position: 'center', opacity: 0.6 }
    ]
  },
  
  // 바람
  windy: {
    emoji: '💨',
    icon: 'windy',
    description: '바람',
    color: '#E0E0E0',
    gradient: 'from-gray-200 to-gray-300',
    illustrations: [
      { type: 'wind', size: 'medium', position: 'center', direction: 'horizontal' },
      { type: 'cloud', size: 'small', position: 'top-left', opacity: 0.5 }
    ]
  }
};

/**
 * 온도에 따른 배경 그라디언트
 */
export const TEMPERATURE_GRADIENTS = {
  very_cold: 'from-blue-600 to-blue-800',    // -10°C 이하
  cold: 'from-blue-400 to-blue-600',         // -10°C ~ 0°C
  cool: 'from-blue-200 to-blue-400',         // 0°C ~ 10°C
  comfortable: 'from-green-300 to-green-500', // 10°C ~ 20°C
  warm: 'from-yellow-300 to-orange-400',     // 20°C ~ 25°C
  hot: 'from-orange-400 to-red-500'          // 25°C 이상
};

/**
 * 시간대별 색상 조정
 */
export const TIME_COLORS = {
  morning: { brightness: 1.2, saturation: 1.1 }, // 아침: 밝고 선명
  afternoon: { brightness: 1.0, saturation: 1.0 }, // 점심: 기본
  evening: { brightness: 0.8, saturation: 0.9 }   // 저녁: 어둡고 차분
};

/**
 * 날씨 상태를 아이콘으로 변환
 * @param {string} weatherCode - 날씨 코드
 * @param {number} temperature - 온도
 * @returns {Object} 날씨 아이콘 정보
 */
export function getWeatherIcon(weatherCode, temperature = 20) {
  // 날씨 코드를 표준화
  const normalizedCode = normalizeWeatherCode(weatherCode);
  
  // 기본 아이콘 정보 가져오기
  const iconInfo = WEATHER_ICONS[normalizedCode] || WEATHER_ICONS.sunny;
  
  // 온도에 따른 배경 그라디언트 추가
  const tempGradient = getTemperatureGradient(temperature);
  
  return {
    ...iconInfo,
    tempGradient,
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

/**
 * 온도에 따른 그라디언트 반환
 */
function getTemperatureGradient(temperature) {
  if (temperature <= -10) return TEMPERATURE_GRADIENTS.very_cold;
  if (temperature <= 0) return TEMPERATURE_GRADIENTS.cold;
  if (temperature <= 10) return TEMPERATURE_GRADIENTS.cool;
  if (temperature <= 20) return TEMPERATURE_GRADIENTS.comfortable;
  if (temperature <= 25) return TEMPERATURE_GRADIENTS.warm;
  return TEMPERATURE_GRADIENTS.hot;
}

/**
 * 시간대에 따른 색상 조정
 */
export function adjustColorsForTime(iconInfo, timePeriod) {
  const timeAdjustment = TIME_COLORS[timePeriod] || TIME_COLORS.afternoon;
  
  return {
    ...iconInfo,
    timeAdjusted: true,
    brightness: timeAdjustment.brightness,
    saturation: timeAdjustment.saturation
  };
}

/**
 * 날씨 상태에 따른 추천 색상 팔레트
 */
export const WEATHER_COLOR_PALETTES = {
  sunny: {
    primary: '#FFD700',
    secondary: '#FFA500',
    accent: '#FF6347',
    background: '#FFF8DC'
  },
  cloudy: {
    primary: '#87CEEB',
    secondary: '#B0C4DE',
    accent: '#4682B4',
    background: '#F0F8FF'
  },
  rainy: {
    primary: '#4682B4',
    secondary: '#5F9EA0',
    accent: '#2F4F4F',
    background: '#E6F3FF'
  },
  snowy: {
    primary: '#B0E0E6',
    secondary: '#E0FFFF',
    accent: '#87CEEB',
    background: '#F0FFFF'
  }
};

/**
 * 날씨별 스타일 팁
 */
export const WEATHER_STYLE_TIPS = {
  sunny: [
    '☀️ 선글라스를 챙기세요!',
    '🧴 자외선 차단제를 바르세요.',
    '👒 모자나 캡을 착용하세요.'
  ],
  cloudy: [
    '☁️ 레이어링을 활용하세요.',
    '🎒 얇은 겉옷을 준비하세요.',
    '👕 편안한 소재를 선택하세요.'
  ],
  rainy: [
    '☔ 우산을 챙기세요!',
    '👟 방수 신발을 신으세요.',
    '🧥 방수 재킷을 입으세요.'
  ],
  snowy: [
    '❄️ 보온에 신경 쓰세요.',
    '🧤 장갑과 목도리를 착용하세요.',
    '👢 미끄럼 방지 신발을 신으세요.'
  ],
  windy: [
    '💨 바람에 날리지 않는 옷을 입으세요.',
    '🧥 바람막이를 챙기세요.',
    '👕 무거운 소재의 옷을 선택하세요.'
  ]
};


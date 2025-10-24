// 절기 기반 추천 시스템

import { getSeasonInfo, getFeelingTemperature, CLOTHING_CATEGORIES } from './seasonUtils';

/**
 * 절기와 날씨 조건에 따른 옷 추천 규칙
 */
export const SEASONAL_RECOMMENDATIONS = {
  // 봄 (3-5월)
  spring: {
    early: { // 초봄 (3월)
      temperature: {
        cold: {
          outer: ['코트', '자켓', '가디건'],
          top: ['긴팔티', '니트', '셔츠'],
          bottom: ['청바지', '슬랙스', '긴바지'],
          shoes: ['부츠', '운동화', '로퍼'],
          acc: ['스카프', '장갑', '모자']
        },
        cool: {
          outer: ['자켓', '가디건', '후드티'],
          top: ['긴팔티', '셔츠', '니트'],
          bottom: ['청바지', '슬랙스'],
          shoes: ['운동화', '로퍼', '부츠'],
          acc: ['스카프', '모자']
        },
        comfortable: {
          outer: ['가디건', '얇은 자켓'],
          top: ['긴팔티', '셔츠'],
          bottom: ['청바지', '슬랙스'],
          shoes: ['운동화', '로퍼'],
          acc: ['스카프']
        }
      },
      weather: {
        sunny: { style: 'casual', mood: 'bright' },
        cloudy: { style: 'casual', mood: 'neutral' },
        rainy: { style: 'practical', mood: 'protective' }
      }
    },
    mid: { // 늦봄 (4-5월)
      temperature: {
        cool: {
          outer: ['가디건', '얇은 자켓', '후드티'],
          top: ['긴팔티', '셔츠', '반팔티'],
          bottom: ['청바지', '슬랙스', '반바지'],
          shoes: ['운동화', '로퍼', '샌들'],
          acc: ['스카프', '모자']
        },
        comfortable: {
          outer: ['가디건', '얇은 자켓'],
          top: ['긴팔티', '반팔티', '셔츠'],
          bottom: ['청바지', '슬랙스'],
          shoes: ['운동화', '로퍼'],
          acc: ['스카프']
        },
        warm: {
          outer: ['얇은 가디건'],
          top: ['반팔티', '긴팔티'],
          bottom: ['청바지', '반바지'],
          shoes: ['운동화', '샌들'],
          acc: ['모자']
        }
      },
      weather: {
        sunny: { style: 'casual', mood: 'bright' },
        cloudy: { style: 'casual', mood: 'neutral' },
        rainy: { style: 'practical', mood: 'protective' }
      }
    }
  },

  // 여름 (6-8월)
  summer: {
    early: { // 초여름 (6월)
      temperature: {
        comfortable: {
          outer: ['얇은 가디건'],
          top: ['반팔티', '긴팔티'],
          bottom: ['청바지', '반바지'],
          shoes: ['운동화', '샌들'],
          acc: ['모자', '선글라스']
        },
        warm: {
          outer: [],
          top: ['반팔티', '탱크톱'],
          bottom: ['반바지', '청바지'],
          shoes: ['샌들', '운동화'],
          acc: ['모자', '선글라스']
        },
        hot: {
          outer: [],
          top: ['반팔티', '탱크톱'],
          bottom: ['반바지', '짧은 치마'],
          shoes: ['샌들', '슬리퍼'],
          acc: ['모자', '선글라스']
        }
      },
      weather: {
        sunny: { style: 'casual', mood: 'bright' },
        cloudy: { style: 'casual', mood: 'neutral' },
        rainy: { style: 'practical', mood: 'protective' }
      }
    },
    mid: { // 한여름 (7-8월)
      temperature: {
        warm: {
          outer: [],
          top: ['반팔티', '탱크톱'],
          bottom: ['반바지', '청바지'],
          shoes: ['샌들', '운동화'],
          acc: ['모자', '선글라스']
        },
        hot: {
          outer: [],
          top: ['반팔티', '탱크톱'],
          bottom: ['반바지', '짧은 치마'],
          shoes: ['샌들', '슬리퍼'],
          acc: ['모자', '선글라스']
        }
      },
      weather: {
        sunny: { style: 'casual', mood: 'bright' },
        cloudy: { style: 'casual', mood: 'neutral' },
        rainy: { style: 'practical', mood: 'protective' }
      }
    }
  },

  // 가을 (9-11월)
  autumn: {
    early: { // 초가을 (9월)
      temperature: {
        comfortable: {
          outer: ['가디건', '얇은 자켓'],
          top: ['긴팔티', '반팔티', '셔츠'],
          bottom: ['청바지', '슬랙스'],
          shoes: ['운동화', '로퍼'],
          acc: ['스카프']
        },
        cool: {
          outer: ['자켓', '가디건', '후드티'],
          top: ['긴팔티', '셔츠', '니트'],
          bottom: ['청바지', '슬랙스'],
          shoes: ['운동화', '로퍼', '부츠'],
          acc: ['스카프', '모자']
        }
      },
      weather: {
        sunny: { style: 'casual', mood: 'warm' },
        cloudy: { style: 'casual', mood: 'neutral' },
        rainy: { style: 'practical', mood: 'protective' }
      }
    },
    mid: { // 늦가을 (10-11월)
      temperature: {
        cool: {
          outer: ['코트', '자켓', '가디건'],
          top: ['긴팔티', '니트', '셔츠'],
          bottom: ['청바지', '슬랙스', '긴바지'],
          shoes: ['부츠', '운동화', '로퍼'],
          acc: ['스카프', '장갑', '모자']
        },
        cold: {
          outer: ['코트', '자켓', '패딩'],
          top: ['긴팔티', '니트', '맨투맨'],
          bottom: ['청바지', '슬랙스', '긴바지'],
          shoes: ['부츠', '운동화'],
          acc: ['스카프', '장갑', '모자']
        }
      },
      weather: {
        sunny: { style: 'casual', mood: 'warm' },
        cloudy: { style: 'casual', mood: 'neutral' },
        rainy: { style: 'practical', mood: 'protective' }
      }
    }
  },

  // 겨울 (12-2월)
  winter: {
    early: { // 초겨울 (12월)
      temperature: {
        cold: {
          outer: ['코트', '패딩', '야상'],
          top: ['긴팔티', '니트', '맨투맨'],
          bottom: ['청바지', '슬랙스', '긴바지'],
          shoes: ['부츠', '워커'],
          acc: ['스카프', '장갑', '모자']
        },
        very_cold: {
          outer: ['패딩', '야상', '롱패딩'],
          top: ['긴팔티', '니트', '맨투맨'],
          bottom: ['청바지', '슬랙스', '긴바지'],
          shoes: ['부츠', '워커'],
          acc: ['스카프', '장갑', '모자', '목도리']
        }
      },
      weather: {
        sunny: { style: 'casual', mood: 'bright' },
        cloudy: { style: 'casual', mood: 'neutral' },
        rainy: { style: 'practical', mood: 'protective' },
        snowy: { style: 'practical', mood: 'protective' }
      }
    },
    mid: { // 한겨울 (1-2월)
      temperature: {
        cold: {
          outer: ['패딩', '야상', '롱패딩'],
          top: ['긴팔티', '니트', '맨투맨'],
          bottom: ['청바지', '슬랙스', '긴바지'],
          shoes: ['부츠', '워커'],
          acc: ['스카프', '장갑', '모자', '목도리']
        },
        very_cold: {
          outer: ['롱패딩', '패딩', '야상'],
          top: ['긴팔티', '니트', '맨투맨'],
          bottom: ['청바지', '슬랙스', '긴바지'],
          shoes: ['부츠', '워커'],
          acc: ['스카프', '장갑', '모자', '목도리']
        }
      },
      weather: {
        sunny: { style: 'casual', mood: 'bright' },
        cloudy: { style: 'casual', mood: 'neutral' },
        rainy: { style: 'practical', mood: 'protective' },
        snowy: { style: 'practical', mood: 'protective' }
      }
    }
  }
};

/**
 * 절기와 날씨 조건에 따른 옷 추천
 * @param {Object} conditions - 날씨 조건
 * @param {number} conditions.temp - 온도
 * @param {number} conditions.humidity - 습도
 * @param {number} conditions.windSpeed - 풍속
 * @param {string} conditions.weather - 날씨 상태 (sunny, cloudy, rainy, snowy)
 * @param {Date} conditions.date - 날짜
 * @param {Array} conditions.styleTags - 스타일 태그
 * @returns {Object} 추천 결과
 */
export function getOutfitRecommendation(conditions) {
  const { temp, humidity, windSpeed, weather, date, styleTags = [] } = conditions;
  
  // 절기 정보 가져오기
  const seasonInfo = getSeasonInfo(date);
  const feelingTemp = getFeelingTemperature(temp, humidity, windSpeed);
  
  // 추천 규칙 가져오기
  const seasonRules = SEASONAL_RECOMMENDATIONS[seasonInfo.season];
  if (!seasonRules) {
    return getDefaultRecommendation();
  }
  
  const periodRules = seasonRules[seasonInfo.period];
  if (!periodRules) {
    return getDefaultRecommendation();
  }
  
  // 체감온도에 따른 옷 추천
  const tempRecommendation = periodRules.temperature[feelingTemp.level];
  if (!tempRecommendation) {
    return getDefaultRecommendation();
  }
  
  // 날씨에 따른 스타일 조정
  const weatherInfo = periodRules.weather[weather] || periodRules.weather.sunny;
  
  // 스타일 태그에 따른 필터링
  let recommendedItems = { ...tempRecommendation };
  
  if (styleTags.length > 0) {
    recommendedItems = filterByStyleTags(recommendedItems, styleTags);
  }
  
  return {
    season: seasonInfo,
    feelingTemperature: feelingTemp,
    weather: weatherInfo,
    recommendedItems,
    confidence: calculateConfidence(conditions, seasonInfo, feelingTemp),
    tips: getStyleTips(seasonInfo, feelingTemp, weatherInfo)
  };
}

/**
 * 스타일 태그에 따른 옷 필터링
 */
function filterByStyleTags(items, styleTags) {
  const filtered = { ...items };
  
  styleTags.forEach(tag => {
    switch (tag) {
      case 'formal':
        // 포멀한 옷으로 필터링
        filtered.outer = filtered.outer.filter(item => 
          ['자켓', '블레이저', '코트'].includes(item)
        );
        filtered.top = filtered.top.filter(item => 
          ['셔츠', '블라우스'].includes(item)
        );
        filtered.bottom = filtered.bottom.filter(item => 
          ['슬랙스', '정장바지'].includes(item)
        );
        filtered.shoes = filtered.shoes.filter(item => 
          ['구두', '로퍼', '힐'].includes(item)
        );
        break;
        
      case 'sport':
        // 운동복으로 필터링
        filtered.outer = filtered.outer.filter(item => 
          ['후드티', '야상'].includes(item)
        );
        filtered.top = filtered.top.filter(item => 
          ['티셔츠', '탱크톱'].includes(item)
        );
        filtered.bottom = filtered.bottom.filter(item => 
          ['트레이닝복', '레깅스'].includes(item)
        );
        filtered.shoes = filtered.shoes.filter(item => 
          ['운동화', '스니커즈'].includes(item)
        );
        break;
        
      case 'date':
        // 데이트룩으로 필터링
        filtered.outer = filtered.outer.filter(item => 
          ['자켓', '가디건'].includes(item)
        );
        filtered.top = filtered.top.filter(item => 
          ['셔츠', '블라우스', '니트'].includes(item)
        );
        filtered.bottom = filtered.bottom.filter(item => 
          ['청바지', '슬랙스', '치마'].includes(item)
        );
        filtered.shoes = filtered.shoes.filter(item => 
          ['구두', '로퍼', '힐'].includes(item)
        );
        break;
    }
  });
  
  return filtered;
}

/**
 * 추천 신뢰도 계산
 */
function calculateConfidence(conditions, seasonInfo, feelingTemp) {
  let confidence = 0.7; // 기본 신뢰도
  
  // 절기 정보가 정확할수록 신뢰도 증가
  if (seasonInfo.season !== 'unknown') {
    confidence += 0.2;
  }
  
  // 체감온도가 명확할수록 신뢰도 증가
  if (feelingTemp.level !== 'comfortable') {
    confidence += 0.1;
  }
  
  return Math.min(confidence, 1.0);
}

/**
 * 스타일 팁 생성
 */
function getStyleTips(seasonInfo, feelingTemp, weatherInfo) {
  const tips = [];
  
  // 절기별 팁
  switch (seasonInfo.season) {
    case 'spring':
      tips.push('🌸 봄에는 레이어링을 활용해보세요!');
      break;
    case 'summer':
      tips.push('☀️ 여름에는 통풍이 좋은 소재를 선택하세요!');
      break;
    case 'autumn':
      tips.push('🍂 가을에는 따뜻한 색감의 옷을 입어보세요!');
      break;
    case 'winter':
      tips.push('❄️ 겨울에는 보온에 신경 쓰세요!');
      break;
  }
  
  // 체감온도별 팁
  if (feelingTemp.level === 'hot') {
    tips.push('🔥 더운 날씨에는 얇고 시원한 옷을 입으세요!');
  } else if (feelingTemp.level === 'cold') {
    tips.push('🥶 추운 날씨에는 여러 겹의 옷을 입어보세요!');
  }
  
  // 날씨별 팁
  if (weatherInfo.mood === 'protective') {
    tips.push('☔️ 비나 눈이 올 때는 방수 소재를 고려해보세요!');
  }
  
  return tips;
}

/**
 * 기본 추천 (규칙에 맞지 않는 경우)
 */
function getDefaultRecommendation() {
  return {
    season: { season: 'unknown', period: 'unknown', label: '알 수 없음', emoji: '❓' },
    feelingTemperature: { level: 'comfortable', label: '적당함', emoji: '😊', color: '#98FB98' },
    weather: { style: 'casual', mood: 'neutral' },
    recommendedItems: {
      outer: ['자켓', '가디건'],
      top: ['긴팔티', '셔츠'],
      bottom: ['청바지', '슬랙스'],
      shoes: ['운동화', '로퍼'],
      acc: ['모자']
    },
    confidence: 0.5,
    tips: ['💡 날씨에 맞는 옷을 선택해보세요!']
  };
}


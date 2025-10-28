
/**
 * API 소스 표시 컴포넌트
 * 사용된 날씨 API의 출처(기상청 또는 OpenWeatherMap 등)를 아이콘과 라벨로 표시
 * @param {Object} props - 컴포넌트 속성
 * @param {string} props.apiSource - API 소스('kma' | 'openweathermap' 등)
 * @param {boolean} [props.showLabel=false] - API 라벨(예:'기상청') 표시 여부
 * @returns {JSX.Element|null} API 소스 표시 요소 또는 apiSource가 유효하지 않으면 null
 */
export default function ApiSourceIndicator({ apiSource, showLabel = false }) {
  // apiSource 없으면 아무것도 렌더링하지 않음
  if (!apiSource) return null;

  /**
   * API 소스에 따른 정보(라벨, 이모지, 스타일) 반환하는 헬퍼 함수
   * @param {string} source - API 소스 코드
   * @returns {Object|null} API 정보 객체
   */
  const getApiInfo = (source) => {
    switch (source) {
      case 'kma':
        return {
          label: '기상청',
          emoji: '🇰🇷',
          color: 'text-blue-600',   // 텍스트 색상
          bgColor: 'bg-blue-100', // 배경 색상
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
        return null; // 정의되지 않은 소스는 처리하지 않음
    }
  };

  const apiInfo = getApiInfo(apiSource);
  // 유효한 API 정보가 없으면 null 반환
  if (!apiInfo) return null;

  // 컴포넌트 렌더링
  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${apiInfo.bgColor} ${apiInfo.color}`}>
      {/* 1. 이모지 아이콘 */}
      <span className="mr-1">{apiInfo.emoji}</span>
      
      {/* 2. 라벨(showLabel이 true일 때만 표시) */}
      {showLabel && (
        <span className="mr-1">{apiInfo.label}</span>
      )}
      
      {/* 3. 짧은 코드(KMA 또는 OWM) 및 툴팁 */}
      <span title={apiInfo.description}>
        {apiSource === 'kma' ? 'KMA' : 'OWM'}
      </span>
    </div>
  );
}
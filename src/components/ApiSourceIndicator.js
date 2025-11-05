/**
 * API 소스 표시 컴포넌트 - 사용된 날씨 API의 출처(기상청 or OpenWeatherMap 등)를 아이콘&라벨로 표시
 */
export default function ApiSourceIndicator({ apiSource, showLabel = false }) {
  // apiSource 없으면 아무것도 렌더링 X
  if (!apiSource) return null;

  /**
   * API 소스에 따른 정보(라벨, 이모지, 스타일) 반환하는 헬퍼 함수
   */
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
        return null; // 정의되지 않은 소스는 처리 X
    }
  };

  const apiInfo = getApiInfo(apiSource);
  // 유효한 API 정보 없으면 null 반환
  if (!apiInfo) return null;

  // 컴포넌트 렌더링
  return (
    // 스타일 적용(배경색, 텍스트 색상)
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${apiInfo.bgColor} ${apiInfo.color}`}>
      {/* 1. 이모지 아이콘 */}
      <span className="mr-1">{apiInfo.emoji}</span>
      
      {/* 2. 라벨(showLabel가 true일 때만 표시) */}
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
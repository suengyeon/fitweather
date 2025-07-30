export default function WeatherCard({ region, temp, rain, humidity, desc, icon, bgColor = "bg-gray-100", isHome = false, labelRight = false, isRecord = false, onIconClick = null }) {
    const iconText = icon === "rain" ? "☔️" : "☀️";
  
    return (
      <div className="flex flex-col items-center">
        {/* 날씨 아이콘 박스 */}
        <div 
          className={`w-60 h-60 ${bgColor} rounded mb-8 flex items-center justify-center text-6xl relative overflow-hidden ${onIconClick ? 'cursor-pointer hover:bg-gray-300 transition-colors' : ''}`}
          onClick={onIconClick}
        >
          <div 
            className="absolute text-8xl animate-bounce"
          >
            {iconText}
          </div>
        </div>

        {/* Record 페이지가 아닐 때만 온도/강수량/습도 표시 */}
        {!isRecord && (
          <>
            {labelRight ? (
              <div className="flex flex-col space-y-4 mb-8">
                <div className="flex items-center justify-center">
                  <span className="mr-3 text-xs text-gray-600">온도</span>
                  <div className="bg-blue-100 px-4 py-2 rounded text-center">
                    <span className="text-lg font-semibold">{temp}°C</span>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <span className="mr-3 text-xs text-gray-600">강수량</span>
                  <div className="bg-blue-100 px-4 py-2 rounded text-center">
                    <span className="text-lg font-semibold">{rain}mm</span>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <span className="mr-3 text-xs text-gray-600">습도</span>
                  <div className="bg-blue-100 px-4 py-2 rounded text-center">
                    <span className="text-lg font-semibold">{humidity ? `${humidity}%` : "기록없음"}</span>
                  </div>
                </div>
              </div>
            ) : isHome ? (
              // Home 페이지용 가로 정렬
              <div className="flex space-x-4 mb-8">
                <div className="bg-blue-100 px-4 py-2 rounded text-center">
                  <div className="text-xs text-gray-600 mb-1">온도</div>
                  <span className="text-lg font-semibold">{temp}°C</span>
                </div>
                <div className="bg-blue-100 px-4 py-2 rounded text-center">
                  <div className="text-xs text-gray-600 mb-1">강수량</div>
                  <span className="text-lg font-semibold">{rain}mm</span>
                </div>
                <div className="bg-blue-100 px-4 py-2 rounded text-center">
                  <div className="text-xs text-gray-600 mb-1">습도</div>
                  <span className="text-lg font-semibold">{humidity ? `${humidity}%` : "기록없음"}</span>
                </div>
              </div>
            ) : (
              // 다른 페이지용 세로 정렬
              <div className="flex flex-col space-y-4 mb-8">
                <div className="bg-blue-100 px-4 py-2 rounded text-center">
                  <span className="text-lg font-semibold">온도: {temp}°C</span>
                </div>
                <div className="bg-blue-100 px-4 py-2 rounded text-center">
                  <span className="text-lg font-semibold">강수량: {rain}mm</span>
                </div>
                <div className="bg-blue-100 px-4 py-2 rounded text-center">
                  <span className="text-lg font-semibold">습도: {humidity ? `${humidity}%` : "기록없음"}</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }
  
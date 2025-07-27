export default function WeatherCard({ region, temp, rain, desc, icon }) {
    const iconText = icon === "rain" ? "☔️" : "☀️";
  
    return (
      <div className="flex flex-col items-center">
        {/* 날씨 아이콘 박스 */}
        <div className="w-60 h-60 bg-white border border-gray-400 rounded mb-4 flex items-center justify-center text-6xl">
          {iconText}
        </div>
  
        {/*온도 / 강수량 박스*/}
         {/* <div className="flex space-x-12 mb-12">
          <div className="bg-blue-100 px-4 py-2 rounded text-center">
            <span className="text-lg font-semibold">{temp}°C</span>
          </div>
          <div className="bg-blue-100 px-4 py-2 rounded text-center">
            <span className="text-lg font-semibold">{rain}mm</span>
          </div>
        </div>  */}
      </div>
    );
  }
  
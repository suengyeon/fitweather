<<<<<<< HEAD
export default function WeatherCard({ region, temp, rain, desc, icon }) {
    const iconText = icon === "rain" ? "☔️" : "☀️";

    return (
        <div className="flex flex-col items-center">
            {/* 날씨 아이콘 박스 */}
            <div className="w-60 h-60 bg-white border border-gray-400 rounded mb-4 flex items-center justify-center text-6xl">
                {iconText}
            </div>
            {/* 온도 / 강수량 박스 */}
            <div className="flex space-x-12 mb-12">
                <div className="bg-blue-100 px-4 py-2 rounded text-center">
                    <span className="text-lg font-semibold">{temp}°C</span>
                </div>
                <div className="bg-blue-100 px-4 py-2 rounded text-center">
                    <span className="text-lg font-semibold">{rain}mm</span>
                </div>
            </div>
        </div>
    );
}
=======
// src/components/WeatherCard.js
import React from 'react';

const WeatherCard = ({ temp, rainProb, iconCode, region }) => (
  <div style={{ border: '1px solid #ccc', padding: '16px', textAlign: 'center' }}>
    <div>Region: {region}</div>
    <div>Temp: {temp}</div>
    <div>RainProb: {rainProb}</div>
    <div>IconCode: {iconCode}</div>
  </div>
);

export default WeatherCard;

>>>>>>> 68676bf (날씨 api 연동 및 Home 페이지 리팩터링 완료)

// src/hooks/useWeather.js
import { useEffect, useState } from "react";
import { weatherService } from "../api/weatherService";

export default function useWeather(region) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!region) return;

    const load = async () => {
      setLoading(true);
      try {
        console.log("📡 날씨 데이터 요청:", region);
        const weatherData = await weatherService.getWeather(region);
        console.log("🌤️ 날씨 데이터 수신:", weatherData);
        
        setWeather(weatherData);
      } catch (error) {
        console.error("❌ 날씨 데이터 로드 실패:", error);
        setWeather(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [region]);

  return { weather, loading };
}

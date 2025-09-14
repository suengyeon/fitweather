// src/hooks/useWeather.js
import { useEffect, useState } from "react";
import { fetchKmaForecast } from "../api/kmaWeather";
import { selectNextForecast } from "../utils/forecastUtils";

export default function useWeather(region) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!region) return;

    const load = async () => {
      setLoading(true);
      try {
        console.log("📡 fetch forecast for", region);
        const forecastItems = await fetchKmaForecast(region);
        console.log("🌤️ forecast result:", forecastItems);

        if (forecastItems) {
          const selected = selectNextForecast(forecastItems);
          console.log("✅ selected forecast:", selected);
          setWeather({
            temp: selected.temp,
            rain: selected.rainAmount,
            humidity: selected.humidity,
            sky: selected.sky,           // 하늘 상태 추가
            pty: selected.pty,           // 강수 형태 추가
            icon: selected.iconCode,     // SKY와 PTY 조합된 아이콘
          });
        } else {
          setWeather(null);
        }
      } catch (e) {
        console.error("useWeather error", e);
        setWeather(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [region]);

  return { weather, loading };
}

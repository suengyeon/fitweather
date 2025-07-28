// src/hooks/useWeather.js
import { useEffect, useState } from "react";
import { fetchKmaForecast } from "../api/kmaWeather";
import { selectNextForecast } from "../utils/forecastUtils";

export default function useWeather(region) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true); // eslint-disable-next-line no-unused-vars

  useEffect(() => {
    if (!region) return;

    const load = async () => {
      setLoading(true);
      try {
        const forecastItems = await fetchKmaForecast(region);

        if (forecastItems) {
          const selected = selectNextForecast(forecastItems);
          setWeather({
            temp: selected.temp,
            rain: selected.rainAmount,  // ✅ 이렇게 받아오도록!
            icon: selected.iconCode,
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

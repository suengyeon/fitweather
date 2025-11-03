import { useEffect, useState } from "react";
import { weatherService } from "../api/weatherService"; 

/**
 * useWeather 커스텀 훅 - 지정된 지역에 대한 실시간 날씨 데이터를 비동기적으로 불러와 상태 제공
 */
export default function useWeather(region) {
  const [weather, setWeather] = useState(null); 
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    // 1. 지역 값 없으면 요청하지 않고 종료
    if (!region) return;

    /**
     * 날씨 데이터 불러오는 비동기 함수
     */
    const load = async () => {
      setLoading(true); // 로딩 시작
      try {
        console.log("📡 날씨 데이터 요청:", region);
        // 2. 외부 weatherService 통해 날씨 데이터 조회(기상청 및 대체 API 로직 포함)
        const weatherData = await weatherService.getWeather(region);
        console.log("🌤️ 날씨 데이터 수신:", weatherData);
        
        setWeather(weatherData); // 데이터 수신 성공 시 상태 업데이트
      } catch (error) {
        console.error("❌ 날씨 데이터 로드 실패:", error);
        setWeather(null); // 실패 시 null로 설정
      } finally {
        setLoading(false); // 로딩 종료
      }
    };

    load(); // 데이터 로드 함수 실행
  }, [region]); // region 값이 변경될 때마다 Effect 재실행

  // 최종적으로 날씨 데이터&로딩 상태 반환
  return { weather, loading };
}
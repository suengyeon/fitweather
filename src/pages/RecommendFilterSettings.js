import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bars3Icon, HomeIcon } from "@heroicons/react/24/solid";
import MenuSidebar from "../components/MenuSidebar";
import useWeather from "../hooks/useWeather";

/**
 * RecommendFilterSettings 컴포넌트 - 온도, 강수량, 습도에 대한 추천 범위 필터를 설정하고 저장
 */
function RecommendFilterSettings() {
  const { user } = useAuth();
  // 필터 상태(Firestore에 저장될 형태)
  const [filters, setFilters] = useState({
    tempRange: { min: 0, max: 100 },
    rainRange: { min: 0, max: 100 },
    humidityRange: { min: 0, max: 100 }
  });
  // 오늘 날씨 정보 상태
  const [todayWeather, setTodayWeather] = useState(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(true);
  const [userRegion, setUserRegion] = useState(""); // 사용자 설정 지역
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // 사용자 프로필 및 기존 필터 설정 로드
  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setUserRegion(data.region);

        // Firestore에 저장된 필터 설정 로드
        if (data.filters) {
          setFilters(data.filters);
        }
      }
    };
    fetchProfile();
  }, [user]);

  // 오늘 날씨 가져오기 훅
  const { weather, loading: weatherLoading } = useWeather(userRegion);

  // 날씨 정보가 로드되면 상태 업데이트
  useEffect(() => {
    if (weather) {
      setTodayWeather(weather);
      setIsWeatherLoading(false);
    }
  }, [weather]);

  // ±값 설정 컴포넌트
  const RangeInput = ({ currentValue, onChange, label, unit, min = 0, max = 50, filterKey }) => {
    // UI에서 사용자가 설정하는 현재 값으로부터의 마이너스/플러스 범위
    const [minusRange, setMinusRange] = useState(5);
    const [plusRange, setPlusRange] = useState(5);

    // 기존 필터(filters) 값이 변경될 때, ±범위 UI 상태 업데이트
    useEffect(() => {
      if (currentValue !== null && currentValue !== undefined && filters[filterKey]) {
        // 기존 필터의 min/max 값과 현재 날씨 값의 차이를 계산
        const currentMinusRange = Math.abs(currentValue - filters[filterKey].min);
        const currentPlusRange = Math.abs(filters[filterKey].max - currentValue);

        // 차이값이 0보다 크면 그 값을 사용하고, 아니면 기본값 5 사용
        setMinusRange(currentMinusRange > 0 ? currentMinusRange : 5);
        setPlusRange(currentPlusRange > 0 ? currentPlusRange : 5);
      }
    }, [currentValue, filterKey, filters]);

    // 마이너스 범위 변경 핸들러
    const handleMinusChange = (newMinusRange) => {
      setMinusRange(newMinusRange);
      if (currentValue !== null && currentValue !== undefined) {
        // 실제 필터링 범위 계산 및 상위 컴포넌트로 전달
        const minValue = Math.max(0, currentValue - newMinusRange);
        const maxValue = Math.min(100, currentValue + plusRange);
        onChange({ min: minValue, max: maxValue });
      }
    };

    // 플러스 범위 변경 핸들러
    const handlePlusChange = (newPlusRange) => {
      setPlusRange(newPlusRange);
      if (currentValue !== null && currentValue !== undefined) {
        // 실제 필터링 범위 계산 및 상위 컴포넌트로 전달
        const minValue = Math.max(0, currentValue - minusRange);
        const maxValue = Math.min(100, currentValue + newPlusRange);
        onChange({ min: minValue, max: maxValue });
      }
    };

    return (
      <div className="flex justify-center">
        <div className="w-[270px] mb-6">
          <label className="block text-lg font-bold mb-4 text-center">{label}</label>
          <div className="bg-gray-100 p-2 rounded-lg mb-4">
            {/* 오늘 날씨 값 표시 */}
            <div className="text-center mb-2">
              <span className="text-lg font-semibold text-blue-600">{currentValue || 0}{unit}</span>
              <span className="text-sm text-gray-500 ml-2">(today)</span>
            </div>
          </div>

          <div className="space-y-4">
            {/* - 범위 설정 입력 필드 */}
            <div className="flex justify-center items-center gap-3">
              <label className="text-sm text-gray-600">-</label>
              <input
                type="number"
                min={0}
                max={max}
                value={minusRange}
                onChange={(e) => handleMinusChange(parseInt(e.target.value) || 0)}
                className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm text-center"
                placeholder="0"
              />
              <span className="text-sm font-medium text-gray-700">{unit}</span>
            </div>

            {/* + 범위 설정 입력 필드 */}
            <div className="flex justify-center items-center gap-3">
              <label className="text-sm text-gray-600">+</label>
              <input
                type="number"
                min={0}
                max={max}
                value={plusRange}
                onChange={(e) => handlePlusChange(parseInt(e.target.value) || 0)}
                className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm text-center"
                placeholder="0"
              />
              <span className="text-sm font-medium text-gray-700">{unit}</span>
            </div>
          </div>

          {/* 최종 필터링 범위 표시 */}
          <div className="mt-4 text-xs text-gray-500 bg-blue-50 p-3 rounded text-center">
            {currentValue !== null && currentValue !== undefined ?
              `필터링 범위 : ${Math.max(0, currentValue - minusRange)}${unit} ~ ${Math.min(100, currentValue + plusRange)}${unit}` :
              '날씨 정보를 불러오는 중...'
            }
          </div>
        </div>
      </div>
    );
  };

  // 필터 저장 함수
  const saveFilters = async () => {
    if (!user) return;

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        filters: filters
      });
      alert("필터 설정이 저장되었습니다!");
    } catch (error) {
      console.error("Error saving filters:", error);
      alert("필터 저장에 실패했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col relative">
      {/* 메뉴 사이드바 */}
      <MenuSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* 상단 네비게이션 */}
      <div className="flex justify-between items-center px-4 py-3 bg-blue-100 shadow">
        {/* 메뉴 버튼 */}
        <button
          className="bg-blue-300 px-3 py-1 rounded-md hover:bg-blue-400"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Bars3Icon className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-lg">추천 필터 설정</h2>
        {/* 홈 버튼 */}
        <button
          onClick={() => navigate("/")}
          className="bg-blue-300 px-3 py-1 rounded-md hover:bg-blue-400"
        >
          <HomeIcon className="w-5 h-5" />
        </button>
      </div>

      {/* 앱 타이틀 */}
      <div className="mt-10 flex justify-center">
        <h1 className="text-5xl font-lilita text-indigo-500">Fitweather</h1>
      </div>

      {/* 중앙 콘텐츠 */}
      <div className="flex flex-col items-center justify-start flex-1 px-4 mt-8">

        {/* 필터 설정 카드 */}
        <div className="bg-white rounded-lg px-8 py-8 w-full max-w-6xl mb-8">

          {isWeatherLoading ? (
            // 날씨 로딩 중일 때
            <div className="text-center py-8">
              <p className="text-gray-500">날씨 정보를 불러오는 중...</p>
            </div>
          ) : (
            // 날씨 정보 로드 완료 후 필터 입력
            <>
              <div className="flex flex-wrap justify-between gap-6">
                {/* 온도 필터 설정 */}
                <div className="w-full md:w-[30%]">
                  <RangeInput
                    currentValue={todayWeather?.temp ? parseInt(todayWeather.temp) : null}
                    onChange={(newRange) => setFilters(prev => ({
                      ...prev,
                      tempRange: newRange
                    }))}
                    label="온도"
                    unit="°C"
                    min={0}
                    max={20}
                    filterKey="tempRange"
                  />
                </div>
                {/* 강수량 필터 설정 */}
                <div className="w-full md:w-[30%]">
                  <RangeInput
                    currentValue={todayWeather?.rain ? parseInt(todayWeather.rain) : null}
                    onChange={(newRange) => setFilters(prev => ({
                      ...prev,
                      rainRange: newRange
                    }))}
                    label="강수량"
                    unit="mm"
                    min={0}
                    max={30}
                    filterKey="rainRange"
                  />
                </div>
                {/* 습도 필터 설정 */}
                <div className="w-full md:w-[30%]">
                  <RangeInput
                    currentValue={todayWeather?.humidity ? parseInt(todayWeather.humidity) : null}
                    onChange={(newRange) => setFilters(prev => ({
                      ...prev,
                      humidityRange: newRange
                    }))}
                    label="습도"
                    unit="%"
                    min={0}
                    max={30}
                    filterKey="humidityRange"
                  />
                </div>
              </div>
            </>
          )}
          
          {/* 하단 버튼 영역 */}
          <div className="flex justify-center gap-6 mt-6 mb-2">
            <button
              onClick={saveFilters}
              className="px-4 py-2 bg-blue-400 hover:bg-blue-500 text-white text-base rounded font-medium"
            >
              필터 저장
            </button>
            <button
              onClick={() => navigate("/recommend-view")}
              className="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white text-base rounded font-medium"
            >
              추천 보기
            </button>
          </div>
        </div>
      </div>
    </div >
  );
}

export default RecommendFilterSettings;
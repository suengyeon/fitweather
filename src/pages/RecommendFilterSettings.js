import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState, useRef } from "react";
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
  const RangeInput = ({ currentValue, onChange, label, unit, min = 0, max = 100, filterKey, filterValue }) => {
    // 1. 로컬 상태 정의 (입력 중인 값)
    const [localMinusRange, setLocalMinusRange] = useState(0);
    const [localPlusRange, setLocalPlusRange] = useState(0);

    const minusInputRef = useRef(null);
    const plusInputRef = useRef(null);

    // 2. 부모의 filterValue나 currentValue가 바뀔 때 로컬 상태를 동기화
    useEffect(() => {
        if (currentValue !== null && currentValue !== undefined && filterValue) {
            // 부모의 필터 값 (min, max)과 오늘 날씨 값 (currentValue)을 기반으로 범위 계산
            const newMinusRange = Math.max(0, Math.round(currentValue - filterValue.min));
            const newPlusRange = Math.max(0, Math.round(filterValue.max - currentValue));
            
            // 로컬 상태 업데이트
            setLocalMinusRange(newMinusRange);
            setLocalPlusRange(newPlusRange);
        }
    }, [currentValue, filterValue]);

    // 3. 최종 범위 계산 및 부모에 알리는 함수 (입력 완료 시에만 호출)
    const updateParentFilters = (newMinusRange, newPlusRange) => {
        if (currentValue !== null && currentValue !== undefined) {
            // min/max props를 활용하여 0 ~ 100 사이의 값으로 클램프
            const minValue = Math.max(min, currentValue - newMinusRange);
            const maxValue = Math.min(max, currentValue + newPlusRange);
            
            // 부모의 onChange 호출
            onChange({ min: minValue, max: maxValue });
        }
    };

    // 마이너스 범위 입력 핸들러 (타이핑 중 로컬 상태만 업데이트)
    const handleLocalMinusChange = (e) => {
        const newMinusRange = parseInt(e.target.value) || 0;
        setLocalMinusRange(newMinusRange);
        // 부모 상태는 업데이트하지 않음
    };

    // 플러스 범위 입력 핸들러 (타이핑 중 로컬 상태만 업데이트)
    const handleLocalPlusChange = (e) => {
        const newPlusRange = parseInt(e.target.value) || 0;
        setLocalPlusRange(newPlusRange);
        // 부모 상태는 업데이트하지 않음
    };

    // 입력 필드에서 포커스가 벗어날 때 (blur) 최종적으로 부모 상태 업데이트
    const handleMinusBlur = () => {
        updateParentFilters(localMinusRange, localPlusRange);
    };

    const handlePlusBlur = () => {
        updateParentFilters(localMinusRange, localPlusRange);
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
            <div className="flex justify-center items-center gap-3" style={{ minHeight: '2.5rem' }}>
              <label className="text-sm text-gray-600 w-4 text-center flex-shrink-0">-</label>
              <input
                ref={minusInputRef}
                type="number"
                min={0}
                max={max}
                step="1"
                value={localMinusRange} // **로컬 상태 사용**
                onChange={handleLocalMinusChange} // **로컬 핸들러 사용**
                onBlur={handleMinusBlur} // **포커스 잃을 때 최종 업데이트**
                onFocus={(e) => e.target.select()}
                onClick={(e) => e.target.select()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.target.blur();
                    handleMinusBlur();
                  }
                }}
                className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm text-center flex-shrink-0 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                style={{ fontVariantNumeric: 'tabular-nums' }}
                placeholder="0"
                autoComplete="off"
              />
              <span className="text-sm font-medium text-gray-700 w-8 text-left flex-shrink-0">{unit}</span>
            </div>

            {/* + 범위 설정 입력 필드 */}
            <div className="flex justify-center items-center gap-3" style={{ minHeight: '2.5rem' }}>
              <label className="text-sm text-gray-600 w-4 text-center flex-shrink-0">+</label>
              <input
                ref={plusInputRef}
                type="number"
                min={0}
                max={max}
                step="1"
                value={localPlusRange} // **로컬 상태 사용**
                onChange={handleLocalPlusChange} // **로컬 핸들러 사용**
                onBlur={handlePlusBlur} // **포커스 잃을 때 최종 업데이트**
                onFocus={(e) => e.target.select()}
                onClick={(e) => e.target.select()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.target.blur();
                    handlePlusBlur();
                  }
                }}
                className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm text-center flex-shrink-0 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                style={{ fontVariantNumeric: 'tabular-nums' }}
                placeholder="0"
                autoComplete="off"
              />
              <span className="text-sm font-medium text-gray-700 w-8 text-left flex-shrink-0">{unit}</span>
            </div>
          </div>

          {/* 최종 필터링 범위 표시 - 로컬 상태 기반 계산 */}
          <div className="mt-4 text-xs text-gray-500 bg-blue-50 p-3 rounded text-center min-h-[3rem] flex items-center justify-center" style={{ minHeight: '3rem', fontVariantNumeric: 'tabular-nums' }}>
            {currentValue !== null && currentValue !== undefined ?
              // 필터링 범위 표시 시에도 로컬 상태를 사용합니다.
              `필터링 범위 : ${Math.max(min, currentValue - localMinusRange)}${unit} ~ ${Math.min(max, currentValue + localPlusRange)}${unit}` :
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
          className="bg-blue-200 px-3 py-1 rounded-md hover:bg-blue-300"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Bars3Icon className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-lg">추천 필터 설정</h2>
        {/* 홈 버튼 */}
        <button
          onClick={() => navigate("/")}
          className="bg-blue-200 px-3 py-1 rounded-md hover:bg-blue-300"
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
                    currentValue={todayWeather?.temp !== null && todayWeather?.temp !== undefined ? parseInt(todayWeather.temp) : null}
                    onChange={(newRange) => setFilters(prev => ({
                      ...prev,
                      tempRange: newRange
                    }))}
                    label="온도"
                    unit="°C"
                    min={0}
                    max={100}
                    filterKey="tempRange"
                    filterValue={filters.tempRange}
                  />
                </div>
                {/* 강수량 필터 설정 */}
                <div className="w-full md:w-[30%]">
                  <RangeInput
                    currentValue={todayWeather?.rain !== null && todayWeather?.rain !== undefined ? parseInt(todayWeather.rain) : null}
                    onChange={(newRange) => setFilters(prev => ({
                      ...prev,
                      rainRange: newRange
                    }))}
                    label="강수량"
                    unit="mm"
                    min={0}
                    max={100}
                    filterKey="rainRange"
                    filterValue={filters.rainRange}
                  />
                </div>
                {/* 습도 필터 설정 */}
                <div className="w-full md:w-[30%]">
                  <RangeInput
                    currentValue={todayWeather?.humidity !== null && todayWeather?.humidity !== undefined ? parseInt(todayWeather.humidity) : null}
                    onChange={(newRange) => setFilters(prev => ({
                      ...prev,
                      humidityRange: newRange
                    }))}
                    label="습도"
                    unit="%"
                    min={0}
                    max={100}
                    filterKey="humidityRange"
                    filterValue={filters.humidityRange}
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
    </div>
  )
}

export default RecommendFilterSettings;
import React, { useEffect, useState, useRef, useCallback } from "react";
import FeedCard from "../components/FeedCard";
import { getAllRecords } from "../api/getAllRecords";
import { toggleLike } from "../api/toggleLike";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Bars3Icon, HomeIcon } from "@heroicons/react/24/solid";
import Sidebar from "../components/Sidebar";

function Recommend() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [outfits, setOutfits] = useState([]);
  const [filteredOutfits, setFilteredOutfits] = useState([]);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [excludeMyRecords, setExcludeMyRecords] = useState(false);
  const [onlyMyRecords, setOnlyMyRecords] = useState(false);
  
  // 필터 상태
  const [filters, setFilters] = useState(() => {
    // 세션스토리지에서 저장된 필터 상태 복원
    const savedFilters = sessionStorage.getItem('recommendFilters');
    if (savedFilters) {
      try {
        return JSON.parse(savedFilters);
      } catch (e) {
        console.error('Failed to parse saved filters:', e);
      }
    }
    
    // 기본 필터 상태
    return {
      region: "",
      tempRange: { min: 0, max: 100 },
      rainRange: { min: 0, max: 100 },
      humidityRange: { min: 0, max: 100 },
      feeling: "",
      weatherEmojis: []
    };
  });

  // 지역 목록
  const regionMap = {
    Baengnyeongdo: "백령도",
    Incheon: "인천",
    Seoul: "서울",
    Chuncheon: "춘천",
    Gangneung: "강릉",
    Ulleungdo: "울릉도/독도",
    Hongseong: "홍성",
    Suwon: "수원",
    Cheongju: "청주",
    Andong: "안동",
    Jeonju: "전주",
    Daejeon: "대전",
    Daegu: "대구",
    Pohang: "포항",
    Heuksando: "흑산도",
    Mokpo: "목포",
    Jeju: "제주",
    Ulsan: "울산",
    Yeosu: "여수",
    Changwon: "창원",
    Busan: "부산",
    Gwangju: "광주"
  };

  // 체감 이모지 목록
  const feelingOptions = [
    { value: "steam", label: "🥟 찐만두", emoji: "🥟" },
    { value: "hot", label: "🥵 더움", emoji: "🥵" },
    { value: "nice", label: "👍🏻 적당", emoji: "👍🏻" },
    { value: "cold", label: "💨 추움", emoji: "💨" },
    { value: "ice", label: "🥶 동태", emoji: "🥶" }
  ];

  // 날씨 이모지 목록
  const weatherEmojiOptions = ["☀️", "🌩️", "❄️", "🌧️", "💨", "☁️"];

  // 모든 기록 가져오기 (최근 30일)
  useEffect(() => {
    const fetchAllRecords = async () => {
      try {
        const records = await getAllRecords(30);
        console.log("Fetched records:", records.length);
        console.log("Sample record:", records[0]);
        
        // 부산 지역 기록 확인
        const busanRecords = records.filter(r => r.region === 'Busan');
        console.log("Busan records:", busanRecords.length);
        
        setOutfits(records);
        setFilteredOutfits(records);
      } catch (error) {
        console.error("Error fetching records:", error);
      }
    };

    fetchAllRecords();
  }, []);

  // 사용자 필터가 전달된 경우 적용
  useEffect(() => {
    if (location.state?.userFilters && location.state?.userRegion) {
      const userFilters = location.state.userFilters;
      const userRegion = location.state.userRegion;
      
      console.log("Applying user filters:", userFilters);
      console.log("User region:", userRegion);
      
      setFilters({
        region: userRegion,
        tempRange: userFilters.tempRange,
        rainRange: userFilters.rainRange,
        humidityRange: userFilters.humidityRange,
        feeling: "",
        weatherEmojis: []
      });
    } else if (location.state?.currentWeather) {
      // 홈에서 현재 날씨 정보로 이동한 경우
      const currentWeather = location.state.currentWeather;
      console.log("Applying current weather filters:", currentWeather);
      
      // 현재 날씨에 맞는 범위로 필터 설정
      const temp = parseInt(currentWeather.temp);
      const rain = parseInt(currentWeather.rain);
      const humidity = parseInt(currentWeather.humidity);
      
      setFilters({
        region: currentWeather.region,
        tempRange: { min: Math.max(0, temp - 5), max: Math.min(100, temp + 5) },
        rainRange: { min: Math.max(0, rain - 10), max: Math.min(100, rain + 10) },
        humidityRange: { min: Math.max(0, humidity - 10), max: Math.min(100, humidity + 10) },
        feeling: "",
        weatherEmojis: []
      });
    } else if (location.state?.fromDetail && location.state?.currentFilters) {
      // FeedDetail에서 돌아온 경우, 전달받은 필터 상태 복원
      console.log("Restoring filters from FeedDetail:", location.state.currentFilters);
      setFilters(location.state.currentFilters);
    }
  }, [location.state]);

    // 필터 적용 (디바운싱 적용)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      let filtered = [...outfits];

      console.log("Filtering with:", filters);
      console.log("Total records:", outfits.length);

      // 필터가 하나라도 설정되어 있는지 확인
      const hasFilters = filters.region || 
                        filters.tempRange.min !== 0 || 
                        filters.tempRange.max !== 100 || 
                        filters.rainRange.min !== 0 || 
                        filters.rainRange.max !== 100 || 
                        filters.humidityRange.min !== 0 || 
                        filters.humidityRange.max !== 100 || 
                        filters.feeling || 
                        filters.weatherEmojis.length > 0;

      // 필터 상태를 상태로 저장
      setHasActiveFilters(hasFilters);

      if (!hasFilters) {
        // 필터가 없으면 아무것도 표시하지 않음
        setFilteredOutfits([]);
        console.log("No filters, showing no records");
        return;
      }

      // 필터가 있으면 필터링
      filtered = filtered.filter(record => {
        // 나의 기록만 체크박스가 체크되어 있으면 나의 기록만 표시
        if (onlyMyRecords && record.uid !== user?.uid) {
          return false;
        }

        // 나의 기록 제외 체크박스가 체크되어 있으면 나의 기록 제외
        if (excludeMyRecords && record.uid === user?.uid) {
          return false;
        }

        // 지역 필터 (지역이 선택되면 반드시 일치해야 함)
        const regionMatch = !filters.region || record.region === filters.region;
        
        // 지역이 선택되었는데 일치하지 않으면 제외
        if (filters.region && !regionMatch) {
          return false;
        }
        
        // 온도 필터
        const temp = record.temp || record.weather?.temp;
        const tempMatch = temp !== null && temp !== undefined && 
                         temp >= filters.tempRange.min && temp <= filters.tempRange.max;
        
        // 강수량 필터
        const rain = record.rain || record.weather?.rain;
        const rainMatch = rain !== null && rain !== undefined && 
                         rain >= filters.rainRange.min && rain <= filters.rainRange.max;
        
        // 습도 필터
        const humidity = record.humidity || record.weather?.humidity;
        const humidityMatch = humidity !== null && humidity !== undefined && 
                             humidity >= filters.humidityRange.min && humidity <= filters.humidityRange.max;
        
        // 체감 필터
        const feelingMatch = !filters.feeling || record.feeling === filters.feeling;
        
        // 날씨 이모지 필터
        const recordEmojis = record.weatherEmojis || [];
        const emojiMatch = filters.weatherEmojis.length === 0 || 
                          filters.weatherEmojis.some(emoji => recordEmojis.includes(emoji));

        // 지역이 선택되지 않았으면 다른 조건들 중 하나라도 만족하면 포함
        if (!filters.region) {
          // 선택된 필터만 확인
          const conditions = [];
          
          // 온도 범위가 기본값이 아니면 온도 조건 확인
          if (filters.tempRange.min !== 0 || filters.tempRange.max !== 100) {
            conditions.push(tempMatch);
          }
          
          // 강수량 범위가 기본값이 아니면 강수량 조건 확인
          if (filters.rainRange.min !== 0 || filters.rainRange.max !== 100) {
            conditions.push(rainMatch);
          }
          
          // 습도 범위가 기본값이 아니면 습도 조건 확인
          if (filters.humidityRange.min !== 0 || filters.humidityRange.max !== 100) {
            conditions.push(humidityMatch);
          }
          
          // 체감이 선택되었으면 체감 조건 확인
          if (filters.feeling) {
            conditions.push(feelingMatch);
          }
          
          // 날씨 이모지가 선택되었으면 이모지 조건 확인
          if (filters.weatherEmojis.length > 0) {
            conditions.push(emojiMatch);
          }
          
          // 조건이 없으면 모든 기록 표시
          if (conditions.length === 0) {
            return true;
          }
          
          // 모든 조건을 만족해야 함
          return conditions.every(condition => condition);
        }
        
        // 지역이 선택되었으면 해당 지역이면서 다른 조건들도 만족해야 함
        if (!regionMatch) {
          return false;
        }
        
        // 선택된 필터만 확인
        const conditions = [];
        
        // 온도 범위가 기본값이 아니면 온도 조건 확인
        if (filters.tempRange.min !== 0 || filters.tempRange.max !== 100) {
          conditions.push(tempMatch);
        }
        
        // 강수량 범위가 기본값이 아니면 강수량 조건 확인
        if (filters.rainRange.min !== 0 || filters.rainRange.max !== 100) {
          conditions.push(rainMatch);
        }
        
        // 습도 범위가 기본값이 아니면 습도 조건 확인
        if (filters.humidityRange.min !== 0 || filters.humidityRange.max !== 100) {
          conditions.push(humidityMatch);
        }
        
        // 체감이 선택되었으면 체감 조건 확인
        if (filters.feeling) {
          conditions.push(feelingMatch);
        }
        
        // 날씨 이모지가 선택되었으면 이모지 조건 확인
        if (filters.weatherEmojis.length > 0) {
          conditions.push(emojiMatch);
        }
        
        // 조건이 없으면 지역만 일치하면 표시
        if (conditions.length === 0) {
          return true;
        }
        
        // 모든 조건을 만족해야 함
        return conditions.every(condition => condition);
      });

      // 하트순으로 정렬
      filtered.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
      
      console.log("Filtered results:", filtered.length);
      setFilteredOutfits(filtered);
    }, 50); // 50ms 디바운싱

    return () => clearTimeout(timeoutId);
  }, [outfits, filters, excludeMyRecords, onlyMyRecords, user]);

  // 필터 상태를 세션스토리지에 저장
  useEffect(() => {
    sessionStorage.setItem('recommendFilters', JSON.stringify(filters));
  }, [filters]);

  // 좋아요 토글 함수
  const handleToggleLike = async (recordId, liked) => {
    if (!user) return;
    await toggleLike(recordId, user.uid);
    setOutfits(prev =>
      prev.map(record =>
        record.id === recordId
          ? {
            ...record,
            likes: liked
              ? record.likes.filter(uid => uid !== user.uid)
              : [...record.likes, user.uid],
          }
          : record
      )
    );
  };

  // 필터 핸들러들
  const handleRegionChange = (region) => {
    setFilters(prev => ({ ...prev, region }));
  };

  const handleFeelingChange = (feeling) => {
    setFilters(prev => ({ ...prev, feeling }));
  };

  const handleWeatherEmojiToggle = (emoji) => {
    setFilters(prev => ({
      ...prev,
      weatherEmojis: prev.weatherEmojis.includes(emoji)
        ? prev.weatherEmojis.filter(e => e !== emoji)
        : [...prev.weatherEmojis, emoji]
    }));
  };

  const clearFilters = () => {
    setFilters({
      region: "",
      tempRange: { min: 0, max: 100 },
      rainRange: { min: 0, max: 100 },
      humidityRange: { min: 0, max: 100 },
      feeling: "",
      weatherEmojis: []
    });
  };

  // 온도 슬라이더 컴포넌트
  const TemperatureSlider = ({ min, max, onChange }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragType, setDragType] = useState(null); // 'min' or 'max'
    const sliderRef = useRef(null);

    const handleMouseDown = (e, type) => {
      setIsDragging(true);
      setDragType(type);
      e.preventDefault();
    };

    const handleSliderClick = (e) => {
      if (!sliderRef.current) return;
      
      const rect = sliderRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      const value = Math.round(percentage);
      
      // 클릭한 위치가 현재 범위의 중간점보다 왼쪽이면 최소값, 오른쪽이면 최대값 조정
      const midPoint = (min + max) / 2;
      if (value < midPoint) {
        // 최소값 조정
        const newMin = Math.min(value, max);
        onChange({ min: newMin, max });
        setIsDragging(true);
        setDragType('min');
      } else {
        // 최대값 조정
        const newMax = Math.max(value, min);
        onChange({ min, max: newMax });
        setIsDragging(true);
        setDragType('max');
      }
    };

    const handleMouseMove = useCallback((e) => {
      if (!isDragging || !sliderRef.current) return;

      requestAnimationFrame(() => {
        const rect = sliderRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
        const value = Math.round(percentage);

        if (dragType === 'min') {
          const newMin = Math.min(value, max);
          onChange({ min: newMin, max });
        } else if (dragType === 'max') {
          const newMax = Math.max(value, min);
          onChange({ min, max: newMax });
        }
      });
    }, [isDragging, dragType, min, max, onChange]);

    const handleMouseUp = useCallback(() => {
      setIsDragging(false);
      setDragType(null);
    }, []);

    useEffect(() => {
      if (isDragging) {
        document.addEventListener('mousemove', handleMouseMove, { passive: true });
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = 'none'; // 드래그 중 텍스트 선택 방지
        
        return () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
          document.body.style.userSelect = '';
        };
      }
    }, [isDragging, handleMouseMove, handleMouseUp]);

    const minPosition = min;
    const maxPosition = max;

    return (
      <div className="w-full">
        {/* 슬라이더 바 */}
        <div className="relative w-full h-12 mb-4">
          <div
            ref={sliderRef}
            className="absolute w-full h-3 bg-gray-200 rounded-full top-4 cursor-pointer"
            onClick={handleSliderClick}
          >
            {/* 선택된 범위 표시 */}
            <div
              className="absolute h-3 bg-blue-300 rounded-full transition-all duration-150 ease-out"
              style={{
                left: `${minPosition}%`,
                width: `${maxPosition - minPosition}%`
              }}
            />
            
            {/* 최소값 핸들 */}
            <div
              className={`absolute w-5 h-5 bg-blue-600 rounded-full cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-all duration-150 ease-out ${
                isDragging && dragType === 'min' ? 'scale-110 shadow-xl' : ''
              }`}
              style={{ 
                left: `${minPosition}%`, 
                top: '50%',
                transform: `translate(-50%, -50%) ${isDragging && dragType === 'min' ? 'scale(1.1)' : ''}`
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                handleMouseDown(e, 'min');
              }}
            />
            
            {/* 최대값 핸들 */}
            <div
              className={`absolute w-5 h-5 bg-blue-600 rounded-full cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-all duration-150 ease-out ${
                isDragging && dragType === 'max' ? 'scale-110 shadow-xl' : ''
              }`}
              style={{ 
                left: `${maxPosition}%`, 
                top: '50%',
                transform: `translate(-50%, -50%) ${isDragging && dragType === 'max' ? 'scale(1.1)' : ''}`
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                handleMouseDown(e, 'max');
              }}
            />
          </div>
        </div>
        
        {/* 온도 값 표시 */}
        <div className="flex justify-between text-sm text-gray-600 font-medium">
          <span className="bg-blue-100 px-2 py-1 rounded">{min}</span>
          <span className="bg-blue-100 px-2 py-1 rounded">{max}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col relative">
      {/* 사이드바 */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* 상단 네비게이션 */}
      <div className="flex justify-between items-center px-4 py-3 bg-blue-100 shadow">
        <button
          className="bg-blue-300 px-3 py-1 rounded-md hover:bg-blue-400"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Bars3Icon className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-lg">추천 코디</h2>
        <button
          onClick={() => navigate("/")}
          className="bg-blue-300 px-3 py-1 rounded-md hover:bg-blue-400"
        >
          <HomeIcon className="w-5 h-5" />
        </button>
      </div>

      {/* 뒤로가기 버튼 */}
      <div className="flex justify-start items-center px-4 py-3 bg-white shadow-sm">
        <button
          onClick={() => navigate("/recommend-view")}
          className="bg-gray-400 hover:bg-gray-600 text-white px-4 py-1.5 rounded-md text-sm flex items-center gap-2"
        >
          ← 뒤로가기
        </button>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 px-4 mt-10 flex flex-col md:flex-row gap-6 mb-10">
        {/* 왼쪽: 필터 패널 */}
        <div className="w-full md:w-1/4 bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">필터</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              초기화
            </button>
          </div>

          {/* 체크박스들 */}
          <div className="mb-6 space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="excludeMyRecords"
                checked={excludeMyRecords}
                onChange={(e) => {
                  setExcludeMyRecords(e.target.checked);
                  if (e.target.checked) setOnlyMyRecords(false);
                }}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="excludeMyRecords" className="ml-2 text-sm text-gray-700">
                나의 기록 제외
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="onlyMyRecords"
                checked={onlyMyRecords}
                onChange={(e) => {
                  setOnlyMyRecords(e.target.checked);
                  if (e.target.checked) setExcludeMyRecords(false);
                }}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="onlyMyRecords" className="ml-2 text-sm text-gray-700">
                나의 기록만
              </label>
            </div>
          </div>

          {/* 지역 필터 */}
          <div className="mb-6">
            <label className="block text-base font-semibold mb-2">지역</label>
            <select
              value={filters.region}
              onChange={(e) => handleRegionChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-center"
            >
              <option value="">전체 지역</option>
              {Object.entries(regionMap).map(([eng, kor]) => (
                <option key={eng} value={eng}>{kor}</option>
              ))}
            </select>
          </div>

          {/* 온도 범위 필터 */}
          <div className="mb-6">
            <label className="block text-base font-semibold mb-2">온도 범위 (°C)</label>
            <TemperatureSlider
              min={filters.tempRange.min}
              max={filters.tempRange.max}
              onChange={(newRange) => setFilters(prev => ({
                ...prev,
                tempRange: newRange
              }))}
            />
          </div>

          {/* 강수량 범위 필터 */}
          <div className="mb-6">
            <label className="block text-base font-semibold mb-2">강수량 범위 (mm)</label>
            <TemperatureSlider
              min={filters.rainRange.min}
              max={filters.rainRange.max}
              onChange={(newRange) => setFilters(prev => ({
                ...prev,
                rainRange: newRange
              }))}
            />
          </div>

          {/* 습도 범위 필터 */}
          <div className="mb-6">
            <label className="block text-base font-semibold mb-2">습도 범위 (%)</label>
            <TemperatureSlider
              min={filters.humidityRange.min}
              max={filters.humidityRange.max}
              onChange={(newRange) => setFilters(prev => ({
                ...prev,
                humidityRange: newRange
              }))}
            />
          </div>

          {/* 체감 필터 */}
          <div className="mb-6">
            <label className="block text-base font-semibold mb-3">체감</label>
            <select
              value={filters.feeling}
              onChange={(e) => handleFeelingChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-center"
            >
              <option value="">전체</option>
              {feelingOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* 날씨 이모지 필터 */}
          <div className="mb-6">
            <label className="block text-base font-semibold mb-3">날씨 이모지</label>
            <div className="grid grid-cols-3 gap-2">
              {weatherEmojiOptions.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleWeatherEmojiToggle(emoji)}
                  className={`p-3 text-lg rounded-md transition-colors ${
                    filters.weatherEmojis.includes(emoji)
                      ? "bg-blue-200 border-2 border-blue-400"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 오른쪽: 코디 목록 */}
        <div className="w-full md:w-3/4 bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2"> 총 {filteredOutfits.length}개의 코디</h3>
            <p className="text-sm text-gray-600">좋아요 순으로 정렬된 추천 코디입니다.</p>
          </div>

          {filteredOutfits.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-2">
                {hasActiveFilters ? "조건에 맞는 코디가 없습니다" : "필터를 설정해주세요"}
              </p>
              <p className="text-sm text-gray-400">
                {hasActiveFilters ? "필터를 조정해보세요" : "지역, 온도, 강수량, 습도, 체감, 날씨 이모지 중 하나를 선택해보세요"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredOutfits.map(outfit => (
                <FeedCard
                  key={outfit.id}
                  record={outfit}
                  currentUserUid={user?.uid}
                  onToggleLike={handleToggleLike}
                  currentFilters={filters}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Recommend; 
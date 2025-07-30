import React from "react";

export default function LikedDatePicker({ year, month, day, availableDates, onDateChange, loading }) {
  // 연도는 현재 연도부터 2020년까지 모든 연도 선택 가능
  const currentYear = new Date().getFullYear();
  const years = Array.from({length: currentYear - 2019}, (_, i) => currentYear - i);
  
  // 월은 1~12월 모든 월 선택 가능
  const months = Array.from({length: 12}, (_, i) => i + 1);
  
  // 일은 선택된 연도/월에 따라 해당 월의 마지막 날까지 선택 가능
  const getDaysInMonth = (year, month) => {
    return new Date(year, month, 0).getDate();
  };
  const days = (year && month) ? Array.from({length: getDaysInMonth(year, month)}, (_, i) => i + 1) : [];

  const handleYearChange = e => {
    onDateChange({ year: parseInt(e.target.value), month: null, day: null });
  };
  const handleMonthChange = e => {
    onDateChange({ year, month: parseInt(e.target.value), day: null });
  };
  const handleDayChange = e => {
    onDateChange({ year, month, day: parseInt(e.target.value) });
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      {loading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-10 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      ) : availableDates.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-2">아직 좋아요한 코디가 없습니다</p>
        </div>
      ) : (
        <div className="flex gap-2 justify-center">
          <select value={year || ''} onChange={handleYearChange} className="p-2 border rounded">
            <option value="">연도</option>
            {years.map(y => <option key={y} value={y}>{y}년</option>)}
          </select>
          <select value={month || ''} onChange={handleMonthChange} className="p-2 border rounded">
            <option value="">월</option>
            {months.map(m => <option key={m} value={m}>{m}월</option>)}
          </select>
          <select value={day || ''} onChange={handleDayChange} className="p-2 border rounded" disabled={!year || !month}>
            <option value="">일</option>
            {days.map(d => <option key={d} value={d}>{d}일</option>)}
          </select>
        </div>
      )}
    </div>
  );

} 
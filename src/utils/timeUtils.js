/**
 * 현재 시간을 대한민국(서울) 표준시로 변환한 Date 객체 반환
 */
const getSeoulDate = () => {
    const now = new Date();
    const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utcTime + 9 * 3600000);
  };
  
  /**
   * 기상청 API에 사용할 base_date 계산(YYYYMMDD) - 02:00 이전이면 전날 날짜 사용
   */
  export const getTodayYYYYMMDD = () => {
    const seoulDate = getSeoulDate();
    const hhmm = seoulDate
      .getHours().toString().padStart(2, "0") +
      seoulDate.getMinutes().toString().padStart(2, "0");
  
    if (hhmm < "0200") {
      seoulDate.setDate(seoulDate.getDate() - 1);
    }
  
    const y = seoulDate.getFullYear();
    const m = (seoulDate.getMonth() + 1).toString().padStart(2, "0");
    const d = seoulDate.getDate().toString().padStart(2, "0");
    return `${y}${m}${d}`;
  };
  
  /**
   * 기상청 API에 사용할 base_time 계산(HHMM)
   - 가장 최근 배포 시각: 02:00, 05:00, 08:00, 11:00, 14:00, 17:00, 20:00, 23:00
   */
  export const getBaseTime = () => {
    const seoulDate = getSeoulDate();
    const hhmm = seoulDate
      .getHours().toString().padStart(2, "0") +
      seoulDate.getMinutes().toString().padStart(2, "0");
  
    if (hhmm < "0200") return "2300";
    if (hhmm < "0500") return "0200";
    if (hhmm < "0800") return "0500";
    if (hhmm < "1100") return "0800";
    if (hhmm < "1400") return "1100";
    if (hhmm < "1700") return "1400";
    if (hhmm < "2000") return "1700";
    if (hhmm < "2300") return "2000";
    return "2300";
  };
  
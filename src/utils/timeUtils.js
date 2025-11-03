/**
 * 현재 시간을 대한민국(서울) 표준시로 변환한 Date 객체 반환
 */
const getSeoulDate = () => {
    const now = new Date();
    // UTC 시간(ms) = 현재 로컬 시간(ms) + 로컬 시간대 오프셋(분 -> ms)
    const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
    // 서울 표준시(UTC+9)로 변환하여 새로운 Date 객체 생성(9시간 -> ms)
    return new Date(utcTime + 9 * 3600000);
  };
  
  /**
   * 기상청 API에 사용할 base_date 계산(YYYYMMDD) - 02:00 이전이면 전날 날짜 사용
   */
  export const getTodayYYYYMMDD = () => {
    const seoulDate = getSeoulDate();
    // 현재 서울 시간 기준 HHMM 문자열 계산
    const hhmm = seoulDate
      .getHours().toString().padStart(2, "0") +
      seoulDate.getMinutes().toString().padStart(2, "0");
  
    // 배포 시각(02:00) 이전이면, 전날(base_date = 어제 날짜)의 23:00 예보를 요청해야 함
    if (hhmm < "0200") {
      seoulDate.setDate(seoulDate.getDate() - 1);
    }
  
    // YYYYMMDD 형식으로 포맷하여 반환
    const y = seoulDate.getFullYear();
    const m = (seoulDate.getMonth() + 1).toString().padStart(2, "0");
    const d = seoulDate.getDate().toString().padStart(2, "0");
    return `${y}${m}${d}`;
  };
  
  /**
   * 기상청 API에 사용할 base_time 계산(HHMM)
   * - 가장 최근 배포 시각: 02:00, 05:00, 08:00, 11:00, 14:00, 17:00, 20:00, 23:00
   */
  export const getBaseTime = () => {
    const seoulDate = getSeoulDate();
    // 현재 서울 시간 기준 HHMM 문자열 계산
    const hhmm = seoulDate
      .getHours().toString().padStart(2, "0") +
      seoulDate.getMinutes().toString().padStart(2, "0");
  
    // 현재 시각보다 앞서 배포된 가장 최근 시각을 찾음
    if (hhmm < "0200") return "2300"; // 00:00 ~ 01:59 -> 전날 23:00 예보 사용
    if (hhmm < "0500") return "0200";
    if (hhmm < "0800") return "0500";
    if (hhmm < "1100") return "0800";
    if (hhmm < "1400") return "1100";
    if (hhmm < "1700") return "1400";
    if (hhmm < "2000") return "1700";
    if (hhmm < "2300") return "2000";
    return "2300"; // 23:00 ~ 23:59 -> 당일 23:00 예보 사용
  };
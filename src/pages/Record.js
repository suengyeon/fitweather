// src/pages/Record.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import useUserProfile from "../hooks/useUserProfile";
import useWeather from "../hooks/useWeather";
import RecordForm from "../components/RecordForm";
import { uploadOutfitImage } from "../api/uploadOutfitImage";
import { saveOutfitRecord } from "../api/saveOutfitRecord";
import { toast } from "react-toastify";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export default function Record() {
  const navigate = useNavigate();
  const { profile, loading: profileLoading } = useUserProfile();
  const uid = auth.currentUser.uid;
  const region = profile?.region || "";

  // 날짜 기본값: 오늘 (YYYY-MM-DD)
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);

  // profile이 준비된 후에만 useWeather 호출
  const { weather, loading: weatherLoading } = useWeather(region);

  // 로딩/저장완료 상태
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  if (profileLoading) {
    return <div className="p-4 max-w-md mx-auto">사용자 정보를 불러오는 중...</div>;
  }

  /**
   * RecordForm에서 전달된 데이터와 자동 획득한 날씨 정보를
   * 통합하여 Firebase에 저장하고, 완료 메시지를 표시한 뒤 이동합니다.
   */
  const handleSave = async ({ files, feeling, weatherEmojis, feedback, outfit, isPublic }) => {
    console.log("handleSave - 전달된 파일 수:", files.length, files);
    setLoading(true);
    setSaved(false);
    try {
      // 온도/강수량 값 체크
      if (typeof weather?.temp === "undefined" || typeof weather?.rain === "undefined") {
        toast.error("날씨 정보가 아직 준비되지 않았습니다. 잠시 후 다시 시도해 주세요.");
        setLoading(false);
        return;
      }
      // 0) 이미 기록된 날짜인지 확인
      const q = query(
        collection(db, "outfits"),
        where("uid", "==", uid),
        where("date", "==", date)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        toast.error("이미 기록하셨습니다.");
        setLoading(false);
        return;
      }

      // 1) 다중 이미지 업로드
      const imageUrls = await Promise.all(
        files.map((file) => uploadOutfitImage(file, uid))
      );
      console.log("upload complete - URLs:", imageUrls);

      // 2) Firestore 저장 (온도, 강수량 포함)
      await saveOutfitRecord({
        uid,
        region,
        date,
        temp: weather.temp,
        rain: weather.rain,
        feeling,
        weatherEmojis,
        imageUrls,
        feedback,
        outfit,
        isPublic
      });

      // 저장 완료 표시
      toast.success("착장 기록이 저장되었습니다!", { autoClose: 1000 });

      // 딜레이 없이 즉시 페이지 이동
      navigate("/calendar");
    } catch (err) {
      console.error("저장 중 오류:", err);
      toast.error("저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-semibold mb-4">나의 기록</h1>
      {/* 저장 완료 메시지 */}
      {saved && (
        <div className="mb-4 p-2 bg-green-100 text-green-800 rounded">
          저장이 완료되었습니다!
        </div>
      )}
      {/* 온도/강수량 표시 */}
      <div className="mb-4 flex space-x-4">
        <div className="bg-blue-100 px-4 py-2 rounded text-center">
          <span className="text-lg font-semibold">{typeof weather?.temp !== "undefined" ? `${weather.temp}°C` : "온도 불러오는 중..."}</span>
        </div>
        <div className="bg-blue-100 px-4 py-2 rounded text-center">
          <span className="text-lg font-semibold">{typeof weather?.rain !== "undefined" ? `${weather.rain}mm` : "강수량 불러오는 중..."}</span>
        </div>
      </div>
      <RecordForm
        date={date}
        onDateChange={setDate}
        region={region}
        loading={loading}
        onSave={handleSave}
        disableSave={typeof weather?.temp === "undefined" || typeof weather?.rain === "undefined"}
      />
    </div>
  );
}

// src/components/RecordForm.js
import React, { useState } from "react";

export default function RecordForm({
  date,
  onDateChange,
  region,
  loading,
  onSave
}) {
  const [files, setFiles] = useState([]);
  const [feeling, setFeeling] = useState("");
  const [weatherEmojis, setWeatherEmojis] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [outfit, setOutfit] = useState({
    outer: [],
    top: [],
    bottom: [],
    shoes: [],
    acc: []
  });
  const [isPublic, setIsPublic] = useState(false);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ files, feeling, weatherEmojis, feedback, outfit, isPublic });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label>
        날짜:
        <input
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="border px-2 py-1 rounded"
        />
      </label>

      <label>
        지역: <span className="font-medium">{region}</span>
      </label>

      <label>
        사진 업로드:
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="block"
        />
      </label>

      {/* TODO: 체감/날씨 이모지, outfit 입력 UI 추가 */}

      <label className="flex items-center">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="mr-2"
        />
        지역피드에 업로드
      </label>

      <button
        type="submit"
        disabled={loading}
        className="w-full p-2 bg-blue-500 text-white rounded"
      >
        {loading ? "저장 중…" : "기록 확인"}
      </button>
    </form>
  );
}
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { auth } from "../firebase";

export default function AuthRouteGuard() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const isLoginPage = location.pathname === "/login";
      if (user && isLoginPage) {
        navigate("/home"); // 로그인 상태로 /login 들어오면 리디렉트
      }
      setLoading(false);
    });

    return () => unsubscribe(); // cleanup
  }, [, location, navigate]);

  if (loading) return <div className="text-center mt-10">로딩 중...</div>;
  
  return <Outlet />;
}

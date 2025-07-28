// src/components/RecordForm.js
import React, { useState } from "react";

export default function RecordForm({
  date,
  onDateChange,
  region,
  loading,
  onSave,
  disableSave // 추가
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
        disabled={loading || disableSave}
        className="w-full p-2 bg-blue-500 text-white rounded"
      >
        {loading ? "저장 중…" : "기록 확인"}
      </button>
    </form>
  );
}

/**
 * 기존 'basic' 스타일을 '베이직/놈코어'로 변경하는 임시 페이지
 */

import React, { useState } from "react";
import { updateAllBasicStyles } from "../utils/updateBasicStyle";

function UpdateBasicStyle() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [result, setResult] = useState(null);

  const handleUpdate = async () => {
    setIsUpdating(true);
    setResult(null);
    
    try {
      const count = await updateAllBasicStyles();
      setResult(`✅ ${count}개 기록이 성공적으로 업데이트되었습니다.`);
    } catch (error) {
      setResult(`❌ 업데이트 실패: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h1>베이직/놈코어 스타일 업데이트</h1>
      <p>기존에 'basic'으로 저장된 스타일을 '베이직/놈코어'로 변경합니다.</p>
      
      <button 
        onClick={handleUpdate}
        disabled={isUpdating}
        style={{
          padding: "10px 20px",
          backgroundColor: isUpdating ? "#ccc" : "#007bff",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: isUpdating ? "not-allowed" : "pointer"
        }}
      >
        {isUpdating ? "업데이트 중..." : "업데이트 실행"}
      </button>
      
      {result && (
        <div style={{
          marginTop: "20px",
          padding: "10px",
          backgroundColor: result.includes("✅") ? "#d4edda" : "#f8d7da",
          border: `1px solid ${result.includes("✅") ? "#c3e6cb" : "#f5c6cb"}`,
          borderRadius: "5px"
        }}>
          {result}
        </div>
      )}
    </div>
  );
}

export default UpdateBasicStyle;

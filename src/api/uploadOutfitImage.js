// src/api/uploadOutfitImage.js
// Firebase Storage 대신 Base64 인코딩 사용

// 이미지 압축 함수 (더 강력한 압축)
const compressImage = (file, maxWidth = 600, quality = 0.6) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // 원본 비율 유지하면서 크기 조정 (더 작게)
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      // 이미지 그리기
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // 압축된 Base64 반환 (품질 낮춤)
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      
      // 만약 여전히 크다면 더 강하게 압축
      if (compressedBase64.length > 400 * 1024) { // 400KB 초과시
        const strongerCompressed = canvas.toDataURL('image/jpeg', 0.4);
        resolve(strongerCompressed);
      } else {
        resolve(compressedBase64);
      }
    };
    
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

/**
 * 이미지를 압축 후 Base64로 인코딩하여 반환
 * Firebase Storage 유료 요금제 없이 무료로 이미지 저장
 *
 * @param {File} file
 * @param {string} uid
 * @returns {Promise<string>}
 */
export const uploadOutfitImage = async (file, uid) => {
  try {
    // 이미지 압축 후 Base64로 인코딩
    const compressedBase64 = await compressImage(file);

    // 압축 후 크기 체크 (Firestore 문서 크기 제한 고려)
    const maxSize = 500 * 1024; // 500KB
    if (compressedBase64.length > maxSize) {
      throw new Error(`압축 후에도 파일이 너무 큽니다. 더 작은 이미지를 선택해주세요. (압축 후: ${(compressedBase64.length / 1024).toFixed(2)}KB)`);
    }

    console.log(`📸 압축된 Base64 인코딩 완료: ${file.name} (${compressedBase64.length} chars)`);
    return compressedBase64;
  } catch (error) {
    console.error("📸 이미지 압축 실패:", error);
    throw new Error(`이미지 처리 실패: ${error.message}`);
  }
};

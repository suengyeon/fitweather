// Firebase Storage 대신 Base64 인코딩 사용(이미지를 문자열 형태로 저장)

/**
 * 이미지 파일 객체를 받아 지정된 최대 너비와 품질로 압축한 Base64 문자열로 반환(Promise 사용해 비동기적으로 처리)
 * @param {File} file - 압축할 이미지 File 객체(사용자가 선택한 파일)
 * @param {number} [maxWidth=600] - 이미지를 줄일 최대 너비 (픽셀)
 * @param {number} [quality=0.6] - JPEG 압축 품질(0.0 ~ 1.0, 높을수록 고품질)
 * @returns {Promise<string>} 압축된 JPEG 형식의 Base64 데이터 URL 문자열
 */
const compressImage = (file, maxWidth = 600, quality = 0.6) => {
  return new new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas'); // 이미지를 그릴 HTML 캔버스 요소 생성
    const ctx = canvas.getContext('2d');
    const img = new Image(); // 이미지 객체 생성

    // 이미지 로드되었을 때 실행될 로직
    img.onload = () => {
      // 1. 원본 비율 유지하면서 최대 너비(maxWidth)에 맞게 크기 계산
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      // 캔버스 크기 조정
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      // 2. 캔버스에 이미지 그리기(리사이징 적용)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // 3. 캔버스 내용을 JPEG 형식, 지정된 품질로 압축된 Base64 문자열로 변환
      let compressedBase64 = canvas.toDataURL('image/jpeg', quality);

      // 4. 추가 크기 체크 및 강한 압축 적용(Base64 문자열 길이 기준)
      if (compressedBase64.length > 400 * 1024) { 
        // 만약 Base64 문자열 길이가 400KB 초과 : 품질을 0.4로 더 낮춰 강하게 압축
        const strongerCompressed = canvas.toDataURL('image/jpeg', 0.4);
        resolve(strongerCompressed); // 강하게 압축된 Base64 반환
      } else {
        resolve(compressedBase64); // 일반 품질의 Base64 반환
      }
    };

    // 이미지 로드 실패 시 Promise 거부
    img.onerror = reject;
    // File 객체로부터 URL 생성하여 이미지 로드 시작
    img.src = URL.createObjectURL(file);
  });
};

/**
 * 착장 기록용 이미지 파일을 받아 압축 후 Base64 문자열로 반환
 * @param {File} file - 업로드할 이미지 File 객체
 * @param {string} uid - 사용자 UID(현재 함수에서는 사용되지 않지만 인터페이스에 포함)
 * @returns {Promise<string>} 압축된 이미지의 Base64 데이터 URL
 * @throws {Error} 이미지 압축 또는 크기 검사 실패 시
 */
export const uploadOutfitImage = async (file, uid) => {
  try {
    // 1. 이미지 압축 함수 호출 및 Base64 인코딩 결과 획득
    const compressedBase64 = await compressImage(file);

    // 2. 최종 압축 후 크기 체크(저장 한계 초과 방지)
    const maxSize = 500 * 1024; // 최대 허용 크기 500KB (Base64 문자열 길이 기준)
    if (compressedBase64.length > maxSize) {
      // 크기가 너무 크면 사용자에게 에러 throw
      throw new Error(`압축 후에도 파일이 너무 큽니다. 더 작은 이미지를 선택해주세요. (압축 후: ${(compressedBase64.length / 1024).toFixed(2)}KB)`);
    }

    // 3. 성공 로그 출력 및 Base64 문자열 반환
    console.log(`📸 압축된 Base64 인코딩 완료: ${file.name} (${compressedBase64.length} chars)`);
    return compressedBase64;
  } catch (error) {
    // 에러 발생 시 콘솔에 출력 후, 사용자 친화적인 메시지로 다시 throw
    console.error("📸 이미지 압축 실패:", error);
    throw new Error(`이미지 처리 실패: ${error.message}`);
  }
};
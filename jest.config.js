module.exports = {
  // Create React App의 기본 설정을 유지하면서 reporters 추가
  reporters: [
    "default", // 터미널에도 기본 출력
    [
      "jest-html-reporters",
      {
        publicPath: "./html-report", // 리포트가 저장될 폴더
        filename: "report.html", // 파일명
        openReport: true, // 테스트 끝나면 자동으로 브라우저 열기
        expand: true, // 모든 테스트 결과 표시
        pageTitle: "Fitweather Test Report", // 리포트 제목
      },
    ],
  ],
  // Create React App의 기본 testMatch 설정
  testMatch: [
    "**/__tests__/**/*.test.js",
    "**/?(*.)+(spec|test).js",
  ],
  // App.test.js 제외 (react-router-dom v7 ESM 이슈로 인해 직접 jest 실행 시 문제 발생)
  testPathIgnorePatterns: [
    "/node_modules/",
    "/src/App.test.js",
  ],
  // 모듈 디렉토리 설정 (Create React App과 동일)
  moduleDirectories: ["node_modules", "<rootDir>/src", "<rootDir>"],
  // 모듈 파일 확장자
  moduleFileExtensions: ["web.js", "js", "web.jsx", "jsx", "web.ts", "ts", "web.tsx", "tsx", "json", "web.node", "node"],
  // Babel 설정 (Create React App과 호환)
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest",
  },
  // 모듈 이름 매핑
  moduleNameMapper: {
    "^.+\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },
  // 테스트 환경
  testEnvironment: "jsdom",
  // setupFilesAfterEnv
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.js"],
  // 변환 무시 패턴
  transformIgnorePatterns: [
    "node_modules/(?!(react|react-dom|react-router-dom|@testing-library)/)",
  ],
};


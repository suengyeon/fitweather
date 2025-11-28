// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Firebase 모크는 각 테스트 파일에서 필요에 따라 설정
// 전역 모크는 의도치 않은 부작용을 일으킬 수 있으므로 제거

// 전역 테스트 설정
global.console = {
  ...console,
  // 테스트 중 불필요한 로그 숨기기 (선택사항)
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

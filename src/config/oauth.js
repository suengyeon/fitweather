// OAuth 설정
export const OAUTH_CONFIG = {
  KAKAO: {
    CLIENT_ID: '4c93403cc55aba8ddb8f5eb5aa338e29',
    REDIRECT_URI: window.location.origin + '/auth/kakao/callback'
  },
  NAVER: {
    CLIENT_ID: 'oTYR3GAlZNFMK2qoDlJM',
    CLIENT_SECRET: 'S357oxnt3n',
    REDIRECT_URI: window.location.origin + '/auth/naver/callback'
  }
}; 
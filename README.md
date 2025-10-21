# Fitweather - 날씨 기반 착장 기록 앱

날씨와 착장을 기록하고 공유하는 소셜 앱입니다.

## 주요 기능

### 🌤️ 날씨 기반 착장 기록
- 실시간 날씨 정보 조회
- 날씨에 맞는 착장 기록
- 과거 날씨 데이터와 착장 히스토리 분석

### 👥 소셜 기능
- 다른 사용자 구독/팔로우
- 착장 기록에 댓글 및 좋아요
- 지역별 피드 조회

### 🔔 알림 시스템
- **구독 알림**: 누군가 나를 구독할 때
- **댓글 알림**: 내 기록에 댓글이 달릴 때
- **답글 알림**: 내 댓글에 답글이 달릴 때
- **새 기록 알림**: 구독한 사용자가 새 기록을 올릴 때 ⭐ **NEW**

### 🎯 추천 시스템
- 날씨 기반 착장 추천
- 지역별/계절별/스타일별 추천
- 개인화된 추천 알고리즘

## 새로 추가된 기능: 구독자 새 기록 알림

구독한 사용자가 새로운 착장 기록을 올리면 실시간으로 알림을 받을 수 있습니다.

### 기능 상세
- **자동 알림**: 공개 설정된 기록만 알림 전송
- **실시간 전송**: 기록 저장 즉시 구독자들에게 알림
- **시각적 구분**: 알림 타입별 아이콘으로 구분
- **직접 이동**: 알림 클릭 시 해당 기록으로 바로 이동

### 알림 타입
- 🔵 구독 알림 (UserPlusIcon)
- 🟢 댓글/답글 알림 (ChatBubbleLeftIcon)  
- 🟣 새 기록 알림 (PhotoIcon) ⭐ **NEW**

## 기술 스택

- **Frontend**: React, Tailwind CSS
- **Backend**: Firebase (Firestore, Auth, Storage)
- **외부 API**: KMA (기상청) API, 카카오 OAuth
- **상태 관리**: React Context API

## 개발 환경 설정

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
<<<<<<< HEAD
>>>>>>> 19971e0 (Initialize project using Create React App)
=======
>>>>>>> a1bd49e63a675c7813d742e819ea0b438b777914

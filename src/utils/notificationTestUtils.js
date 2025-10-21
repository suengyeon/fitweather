/**
 * 알림 기능 테스트를 위한 유틸리티 함수들
 * 개발 및 디버깅 목적으로만 사용
 */

import { notifyFollowersAboutNewPost, getFollowers } from '../services/notificationService';
import { saveOutfitRecord } from '../api/saveOutfitRecord';

/**
 * 테스트용 착장 기록 생성 및 알림 전송
 * @param {string} userId - 테스트할 사용자 ID
 * @param {string} region - 지역명
 * @returns {Promise<Object>} 테스트 결과
 */
export async function testNewPostNotification(userId, region = 'Seoul') {
  try {
    console.log('🧪 새 기록 알림 테스트 시작...');
    
    // 1. 구독자 수 확인
    const followers = await getFollowers(userId);
    console.log(`📊 ${userId}의 구독자 수: ${followers.length}명`);
    
    // 2. 테스트용 착장 기록 생성
    const testRecord = {
      uid: userId,
      region: region,
      date: new Date().toISOString(),
      temp: 20,
      rain: 0,
      feeling: '😊',
      weatherEmojis: ['☀️'],
      imageUrls: [],
      feedback: '테스트용 기록입니다.',
      outfit: {
        outer: ['가디건'],
        top: ['티셔츠'],
        bottom: ['청바지'],
        shoes: ['운동화'],
        acc: []
      },
      styles: ['캐주얼'],
      season: '봄',
      isPublic: true // 공개 기록으로 설정하여 알림 전송
    };
    
    // 3. 기록 저장 및 알림 전송
    const recordId = await saveOutfitRecord(testRecord);
    console.log(`✅ 테스트 기록 저장 완료: ${recordId}`);
    
    return {
      success: true,
      recordId,
      followerCount: followers.length,
      message: `${followers.length}명의 구독자에게 알림이 전송되었습니다.`
    };
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 구독자 목록 조회 테스트
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Object>} 구독자 정보
 */
export async function testGetFollowers(userId) {
  try {
    console.log(`🧪 ${userId}의 구독자 조회 테스트...`);
    
    const followers = await getFollowers(userId);
    
    console.log(`✅ 구독자 조회 완료: ${followers.length}명`);
    console.log('구독자 목록:', followers);
    
    return {
      success: true,
      followers,
      count: followers.length
    };
    
  } catch (error) {
    console.error('❌ 구독자 조회 실패:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 알림 시스템 전체 테스트
 * @param {string} testUserId - 테스트할 사용자 ID
 * @returns {Promise<Object>} 전체 테스트 결과
 */
export async function runNotificationSystemTest(testUserId) {
  try {
    console.log('🚀 알림 시스템 전체 테스트 시작...');
    
    const results = {
      followerTest: null,
      notificationTest: null,
      overallSuccess: false
    };
    
    // 1. 구독자 조회 테스트
    results.followerTest = await testGetFollowers(testUserId);
    
    // 2. 새 기록 알림 테스트
    results.notificationTest = await testNewPostNotification(testUserId);
    
    // 3. 전체 성공 여부 판단
    results.overallSuccess = results.followerTest.success && results.notificationTest.success;
    
    console.log('📋 테스트 결과 요약:');
    console.log(`- 구독자 조회: ${results.followerTest.success ? '✅' : '❌'}`);
    console.log(`- 새 기록 알림: ${results.notificationTest.success ? '✅' : '❌'}`);
    console.log(`- 전체 결과: ${results.overallSuccess ? '✅' : '❌'}`);
    
    return results;
    
  } catch (error) {
    console.error('❌ 전체 테스트 실패:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 개발 환경에서만 전역으로 노출
if (process.env.NODE_ENV === 'development') {
  window.testNotificationSystem = {
    testNewPostNotification,
    testGetFollowers,
    runNotificationSystemTest
  };
  
  console.log('🧪 알림 시스템 테스트 함수가 전역으로 등록되었습니다.');
  console.log('사용법: window.testNotificationSystem.runNotificationSystemTest("사용자ID")');
}


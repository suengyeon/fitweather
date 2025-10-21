/**
 * 사용자 정보 조회 및 관리 헬퍼 함수들
 */

import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth } from '../firebase';

/**
 * 현재 로그인한 사용자 정보 조회
 */
export async function getCurrentUser() {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.log('❌ 로그인된 사용자가 없습니다.');
      return null;
    }

    // 사용자 문서에서 추가 정보 조회
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('👤 현재 사용자 정보:', {
        uid: user.uid,
        email: user.email,
        nickname: userData.nickname,
        name: userData.name
      });
      return {
        uid: user.uid,
        email: user.email,
        ...userData
      };
    } else {
      console.log('👤 현재 사용자 기본 정보:', {
        uid: user.uid,
        email: user.email
      });
      return {
        uid: user.uid,
        email: user.email
      };
    }
  } catch (error) {
    console.error('❌ 사용자 정보 조회 실패:', error);
    return null;
  }
}

/**
 * 모든 사용자 목록 조회 (테스트용)
 */
export async function getAllUsers() {
  try {
    console.log('👥 모든 사용자 목록 조회 중...');
    
    const q = query(collection(db, 'users'));
    const snapshot = await getDocs(q);
    
    const users = [];
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      users.push({
        id: doc.id,
        nickname: data.nickname || data.name || '닉네임 없음',
        email: data.email || '이메일 없음'
      });
    });
    
    console.log('👥 사용자 목록:', users);
    return users;
  } catch (error) {
    console.error('❌ 사용자 목록 조회 실패:', error);
    return [];
  }
}

/**
 * 특정 사용자 정보 조회
 */
export async function getUserById(userId) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('👤 사용자 정보:', {
        id: userId,
        nickname: userData.nickname,
        name: userData.name,
        email: userData.email
      });
      return {
        id: userId,
        ...userData
      };
    } else {
      console.log('❌ 사용자를 찾을 수 없습니다:', userId);
      return null;
    }
  } catch (error) {
    console.error('❌ 사용자 정보 조회 실패:', error);
    return null;
  }
}

/**
 * 구독 관계 설정 (테스트용)
 */
export async function createTestFollowRelationship(followerId, followingId) {
  try {
    console.log(`🔗 구독 관계 생성: ${followerId} → ${followingId}`);
    
    // 기존 구독 관계 확인
    const existingQuery = query(
      collection(db, 'follows'),
      where('followerId', '==', followerId),
      where('followingId', '==', followingId)
    );
    
    const existingSnapshot = await getDocs(existingQuery);
    if (!existingSnapshot.empty) {
      console.log('⚠️ 이미 구독 관계가 존재합니다.');
      return false;
    }
    
    // 구독 관계 생성
    const { addDoc, collection: firestoreCollection } = await import('firebase/firestore');
    await addDoc(firestoreCollection(db, 'follows'), {
      followerId: followerId,
      followingId: followingId,
      createdAt: new Date()
    });
    
    console.log('✅ 구독 관계 생성 완료');
    return true;
  } catch (error) {
    console.error('❌ 구독 관계 생성 실패:', error);
    return false;
  }
}

/**
 * 구독 관계 목록 조회
 */
export async function getAllFollowRelationships() {
  try {
    console.log('🔗 모든 구독 관계 조회 중...');
    
    const q = query(collection(db, 'follows'));
    const snapshot = await getDocs(q);
    
    const relationships = [];
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      relationships.push({
        id: doc.id,
        followerId: data.followerId,
        followingId: data.followingId,
        createdAt: data.createdAt
      });
    });
    
    console.log('🔗 구독 관계 목록:', relationships);
    return relationships;
  } catch (error) {
    console.error('❌ 구독 관계 조회 실패:', error);
    return [];
  }
}

// 개발 환경에서만 전역으로 노출
if (process.env.NODE_ENV === 'development') {
  window.userHelper = {
    getCurrentUser,
    getAllUsers,
    getUserById,
    createTestFollowRelationship,
    getAllFollowRelationships
  };
  
  console.log('👤 사용자 헬퍼 함수가 전역으로 등록되었습니다.');
  console.log('사용법:');
  console.log('- window.userHelper.getCurrentUser() - 현재 사용자 정보');
  console.log('- window.userHelper.getAllUsers() - 모든 사용자 목록');
  console.log('- window.userHelper.createTestFollowRelationship("구독자ID", "작성자ID") - 구독 관계 생성');
}


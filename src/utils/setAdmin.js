import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase'; // 초기화된 Firestore 인스턴스

/**
 * 관리자 계정 설정 함수 - 주어진 이메일을 가진 사용자에게 관리자 권한 부여
 * @param {string} email - 관리자 권한 부여할 사용자 이메일
 * @returns {Promise<boolean>} 성공 여부(true/false)
 */
export async function setAdminUser(email) {
  try {
    // 1. 사용자 이메일로 사용자 문서 찾기
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email)); // 이메일 필터 쿼리
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('해당 이메일의 사용자를 찾을 수 없습니다:', email);
      return false;
    }
    
    // 2. 첫 번째 사용자 문서 가져오기(이메일은 고유하다고 가정)
    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id; // 문서 ID = 사용자 UID
    
    // 3. 사용자 문서에 관리자 권한 설정 및 시각 기록
    await updateDoc(doc(db, 'users', userId), {
      role: 'admin',     // 역할 필드 'admin'으로 설정
      isAdmin: true,     // 이전 호환성 위해 'isAdmin' 필드도 true로 설정
      adminSetAt: new Date() // 관리자 권한 설정 시각
    });
    
    console.log('관리자 권한이 설정되었습니다:', email);
    return true;
  } catch (error) {
    console.error('관리자 설정 실패:', error);
    return false;
  }
}

/**
 * 관리자 권한 확인 함수 - 주어진 이메일 가진 사용자가 관리자 권한 가지고 있는지 확인
 * @param {string} email - 권한 확인할 사용자의 이메일
 * @returns {Promise<boolean>} 관리자 권한 있으면 true, 아니면 false
 */
export async function checkAdminUser(email) {
  try {
    // 1. 사용자 이메일로 사용자 문서 찾기
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return false; // 사용자를 찾을 수 없음
    }
    
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    
    // 2. 'role'=='admin'이거나 'isAdmin'==true인지 확인하여 권한 반환
    return userData.role === 'admin' || userData.isAdmin === true;
  } catch (error) {
    console.error('관리자 권한 확인 실패:', error);
    return false;
  }
}

/**
 * 관리자 권한 제거 함수 - 주어진 이메일 가진 사용자의 관리자 권한 회수
 * @param {string} email - 관리자 권한 제거할 사용자 이메일
 * @returns {Promise<boolean>} 성공 여부(true/false)
 */
export async function removeAdminUser(email) {
  try {
    // 1. 사용자 이메일로 사용자 문서 찾기
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('해당 이메일의 사용자를 찾을 수 없습니다:', email);
      return false;
    }
    
    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id;
    
    // 2. 사용자 문서에서 관리자 권한 제거 및 시각 기록
    await updateDoc(doc(db, 'users', userId), {
      role: 'user',        // 역할을 일반 사용자('user')로 변경
      isAdmin: false,      // 'isAdmin' 필드를 false로 변경
      adminRemovedAt: new Date() // 관리자 권한 제거 시각
    });
    
    console.log('관리자 권한이 제거되었습니다:', email);
    return true;
  } catch (error) {
    console.error('관리자 권한 제거 실패:', error);
    return false;
  }
}
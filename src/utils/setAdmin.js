import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../firebase'; // 초기화된 Firestore 인스턴스

/**
 * 관리자 계정 설정 함수 - 주어진 이메일을 가진 사용자에게 관리자 권한 부여
 */
export async function setAdminUser(email) {
  try {
    // 1. 사용자 이메일로 사용자 문서 찾기(query : email 필터)
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email)); 
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('해당 이메일의 사용자를 찾을 수 없습니다:', email);
      return false;
    }
    
    // 2. 사용자 문서 ID(UID) 추출
    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id; 
    
    // 3. 사용자 문서에 관리자 권한 설정 및 시각 기록
    await updateDoc(doc(db, 'users', userId), {
      role: 'admin',     // 역할 필드 'admin'으로 설정
      isAdmin: true,     // 'isAdmin' 필드도 true로 설정
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
 */
export async function checkAdminUser(email) {
  try {
    // 1. 사용자 이메일로 사용자 문서 찾기(query : email 필터)
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return false; // 사용자를 찾을 수 없음
    }
    
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    
    // 2. 'role'이 'admin' 또는 'isAdmin'이 true인지 확인
    return userData.role === 'admin' || userData.isAdmin === true;
  } catch (error) {
    console.error('관리자 권한 확인 실패:', error);
    return false;
  }
}

/**
 * 관리자 권한 제거 함수 - 주어진 이메일 가진 사용자의 관리자 권한 회수
 */
export async function removeAdminUser(email) {
  try {
    // 1. 사용자 이메일로 사용자 문서 찾기(query : email 필터)
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

/**
 * 성별 정보가 없는 모든 사용자 문서에 기본 성별('male')을 설정
 */
export async function setDefaultGenderMaleForAllUsers() {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);

    if (snapshot.empty) {
      console.log('사용자 문서가 없습니다.');
      return 0;
    }

    const batch = writeBatch(db);
    let updatedCount = 0;

    snapshot.forEach((userDoc) => {
      const data = userDoc.data();
      // gender 필드가 없거나 falsy(null/undefined/빈 문자열)인 경우에만 기본값 설정
      if (!data.gender) {
        batch.update(userDoc.ref, { gender: 'male' });
        updatedCount += 1;
      }
    });

    if (updatedCount === 0) {
      console.log('업데이트할 사용자(성별 미설정)가 없습니다.');
      return 0;
    }

    await batch.commit();
    console.log(`성별 기본값(남)으로 업데이트된 사용자 수: ${updatedCount}`);
    return updatedCount;
  } catch (error) {
    console.error('성별 기본값 일괄 설정 실패:', error);
    throw error;
  }
}
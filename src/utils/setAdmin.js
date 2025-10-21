import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

// 관리자 계정 설정 함수
export async function setAdminUser(email) {
  try {
    // 사용자 이메일로 사용자 문서 찾기
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('해당 이메일의 사용자를 찾을 수 없습니다:', email);
      return false;
    }
    
    // 첫 번째 사용자 문서 가져오기
    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id;
    
    // 관리자 권한 설정
    await updateDoc(doc(db, 'users', userId), {
      role: 'admin',
      isAdmin: true,
      adminSetAt: new Date()
    });
    
    console.log('관리자 권한이 설정되었습니다:', email);
    return true;
  } catch (error) {
    console.error('관리자 설정 실패:', error);
    return false;
  }
}

// 관리자 권한 확인 함수
export async function checkAdminUser(email) {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return false;
    }
    
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    
    return userData.role === 'admin' || userData.isAdmin === true;
  } catch (error) {
    console.error('관리자 권한 확인 실패:', error);
    return false;
  }
}

// 관리자 권한 제거 함수
export async function removeAdminUser(email) {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('해당 이메일의 사용자를 찾을 수 없습니다:', email);
      return false;
    }
    
    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id;
    
    await updateDoc(doc(db, 'users', userId), {
      role: 'user',
      isAdmin: false,
      adminRemovedAt: new Date()
    });
    
    console.log('관리자 권한이 제거되었습니다:', email);
    return true;
  } catch (error) {
    console.error('관리자 권한 제거 실패:', error);
    return false;
  }
}

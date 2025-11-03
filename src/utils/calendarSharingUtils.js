import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  orderBy, 
  limit,
  getDoc,
  setDoc,
  increment 
} from 'firebase/firestore';

/**
 * 캘린더 공유 설정 관련 함수들
 */
// 캘린더 공유 설정 저장/업데이트 
export async function saveCalendarSharingSettings(userId, settings) {
  try {
    const settingsData = {
      userId,
      isPublic: settings.isPublic || false, 
      shareLevel: settings.shareLevel || 'private', 
      allowComments: settings.allowComments || false, 
      allowLikes: settings.allowLikes || true, 
      showPersonalInfo: settings.showPersonalInfo || false, 
      createdAt: new Date(),
      updatedAt: new Date() 
    };

    // 사용자 ID를 문서 ID로 사용해 'calendarSharingSettings' 컬렉션에 저장
    const docRef = doc(db, 'calendarSharingSettings', userId);
    await setDoc(docRef, settingsData);
    
    return { id: docRef.id, ...settingsData };
  } catch (error) {
    console.error('캘린더 공유 설정 저장 오류:', error);
    throw error;
  }
}

// 캘린더 공유 설정 조회
export async function getCalendarSharingSettings(userId) {
  try {
    const docRef = doc(db, 'calendarSharingSettings', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      // 문서 없으면 기본 설정 반환
      return {
        userId,
        isPublic: false,
        shareLevel: 'private',
        allowComments: false,
        allowLikes: true,
        showPersonalInfo: false
      };
    }
  } catch (error) {
    console.error('캘린더 공유 설정 조회 오류:', error);
    throw error;
  }
}

/**
 * 공개 캘린더 목록 조회 관련 함수들
 */
// 전체 공개 상태의 캘린더 목록 조회
export async function getPublicCalendars(limitCount = 20) {
  try {
    const q = query(
      collection(db, 'calendarSharingSettings'),
      where('isPublic', '==', true),         
      where('shareLevel', '==', 'public'),  
      orderBy('updatedAt', 'desc'),         
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const calendars = [];
    
    for (const doc of querySnapshot.docs) {
      const settingsData = doc.data();
      
      // 사용자 정보(닉네임 등) 조회해 병합
      const userDoc = await getDoc(doc(db, 'users', settingsData.userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        calendars.push({
          id: doc.id,
          ...settingsData,
          user: userData // 작성자 정보 추가
        });
      }
    }

    return calendars;
  } catch (error) {
    console.error('공개 캘린더 조회 오류:', error);
    throw error;
  }
}

// 팔로잉한 사용자들의 캘린더 조회
export async function getFollowingCalendars(userId, limitCount = 20) {
  try {
    // 1. 현재 사용자가 팔로잉하는 사용자 ID 목록 조회
    const followingQuery = query(
      collection(db, 'follows'),
      where('followerId', '==', userId)
    );
    
    const followingSnapshot = await getDocs(followingQuery);
    const followingIds = followingSnapshot.docs.map(doc => doc.data().followingId);
    
    if (followingIds.length === 0) {
      return [];
    }

    // 2. 팔로잉한 사용자들의 캘린더 설정 조회 및 필터링
    const calendars = [];
    for (const followingId of followingIds) {
      const settingsDoc = await getDoc(doc(db, 'calendarSharingSettings', followingId));
      if (settingsDoc.exists()) {
        const settingsData = settingsDoc.data();
        // 공개 상태이고, 'followers' 또는 'public' 레벨로 공유되었는지 확인
        if (settingsData.isPublic && (settingsData.shareLevel === 'followers' || settingsData.shareLevel === 'public')) {
          // 3. 사용자 정보 조회 및 결과에 추가
          const userDoc = await getDoc(doc(db, 'users', followingId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            calendars.push({
              id: settingsDoc.id,
              ...settingsData,
              user: userData
            });
          }
        }
      }
    }
    // 업데이트 시각 기준 내림차순 정렬 후 반환 (Firestore 복합 쿼리 대신 클라이언트 정렬 사용)
    return calendars.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  } catch (error) {
    console.error('팔로잉 캘린더 조회 오류:', error);
    throw error;
  }
}

/**
 * 캘린더 데이터 조회 관련 함수들
 */
// 특정 사용자의 공개 기록 조회(캘린더 뷰어용 : 월별)
export async function getUserPublicRecords(userId, year, month, limitCount = 50) {
  try {
    // 월의 시작일&종료일 계산(날짜 범위 생성)
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); 
    
    const q = query(
      collection(db, 'records'),
      where('userId', '==', userId), 
      where('isPublic', '==', true),
      // 날짜 범위 필터 (YYYY-MM-DD 문자열 비교)
      where('date', '>=', startDate.toISOString().split('T')[0]),
      where('date', '<=', endDate.toISOString().split('T')[0]),
      orderBy('date', 'desc'), 
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const records = [];
    
    querySnapshot.forEach((doc) => {
      records.push({ id: doc.id, ...doc.data() });
    });

    return records;
  } catch (error) {
    console.error('사용자 공개 기록 조회 오류:', error);
    throw error;
  }
}

// 특정 날짜의 공개 기록 조회(날짜 피드용)
export async function getPublicRecordsByDate(date, limitCount = 20) {
  try {
    const q = query(
      collection(db, 'records'),
      where('date', '==', date), 
      where('isPublic', '==', true), 
      orderBy('createdAt', 'desc'), 
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const records = [];
    
    for (const doc of querySnapshot.docs) {
      const recordData = doc.data();
      
      // 사용자 정보 조회 및 병합
      const userDoc = await getDoc(doc(db, 'users', recordData.userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        records.push({
          id: doc.id,
          ...recordData,
          author: userData // 작성자 정보 추가
        });
      }
    }

    return records;
  } catch (error) {
    console.error('날짜별 공개 기록 조회 오류:', error);
    throw error;
  }
}

/**
 * 캘린더 상호작용(좋아요) 관련 함수들
 */

// 캘린더 좋아요 누르기
export async function likeCalendar(userId, targetUserId) {
  try {
    const likeData = {
      userId,
      targetUserId,
      createdAt: new Date()
    };

    // 'calendarLikes' 컬렉션에 좋아요 문서 추가
    const docRef = await addDoc(collection(db, 'calendarLikes'), likeData);
    
    // 캘린더 설정 문서의 좋아요 수(likeCount) 1 증가
    await updateDoc(doc(db, 'calendarSharingSettings', targetUserId), {
      likeCount: increment(1)
    });

    return { id: docRef.id, ...likeData };
  } catch (error) {
    console.error('캘린더 좋아요 오류:', error);
    throw error;
  }
}

// 캘린더 좋아요 취소
export async function unlikeCalendar(userId, targetUserId) {
  try {
    // 1. 좋아요 관계 문서 조회(userId와 targetUserId가 모두 일치하는 문서)
    const q = query(
      collection(db, 'calendarLikes'),
      where('userId', '==', userId),
      where('targetUserId', '==', targetUserId)
    );

    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // 2. 좋아요 문서 삭제
      const likeDoc = querySnapshot.docs[0];
      await deleteDoc(doc(db, 'calendarLikes', likeDoc.id));

      // 3. 캘린더 설정 문서 좋아요 수 1 감소
      await updateDoc(doc(db, 'calendarSharingSettings', targetUserId), {
        likeCount: increment(-1)
      });
    }

    return true;
  } catch (error) {
    console.error('캘린더 좋아요 취소 오류:', error);
    throw error;
  }
}

// 캘린더 좋아요 상태 확인
export async function checkCalendarLikeStatus(userId, targetUserId) {
  try {
    // 좋아요 관계 문서 조회
    const q = query(
      collection(db, 'calendarLikes'),
      where('userId', '==', userId),
      where('targetUserId', '==', targetUserId)
    );

    const querySnapshot = await getDocs(q);
    // 문서가 존재하면 true(좋아요 상태)
    return !querySnapshot.empty;
  } catch (error) {
    console.error('캘린더 좋아요 상태 확인 오류:', error);
    return false;
  }
}

/**
 * 캘린더 댓글 관련 함수들
 */
// 캘린더 댓글 추가
export async function addCalendarComment(userId, targetUserId, content) {
  try {
    const commentData = {
      userId,
      targetUserId,
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false // 댓글 삭제 상태 플래그
    };

    // 'calendarComments' 컬렉션에 댓글 문서 추가
    const docRef = await addDoc(collection(db, 'calendarComments'), commentData);
    
    // 캘린더 설정 문서의 댓글 수(commentCount) 1 증가
    await updateDoc(doc(db, 'calendarSharingSettings', targetUserId), {
      commentCount: increment(1)
    });

    return { id: docRef.id, ...commentData };
  } catch (error) {
    console.error('캘린더 댓글 추가 오류:', error);
    throw error;
  }
}

// 캘린더 댓글 조회
export async function getCalendarComments(targetUserId, limitCount = 20) {
  try {
    const q = query(
      collection(db, 'calendarComments'),
      where('targetUserId', '==', targetUserId), 
      where('isDeleted', '==', false),          
      orderBy('createdAt', 'desc'),              
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const comments = [];
    
    for (const doc of querySnapshot.docs) {
      const commentData = doc.data();
      
      // 댓글 작성자 정보 조회 및 병합(users 컬렉션)
      const userDoc = await getDoc(doc(db, 'users', commentData.userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        comments.push({
          id: doc.id,
          ...commentData,
          author: userData // 작성자 정보 추가
        });
      }
    }

    return comments;
  } catch (error) {
    console.error('캘린더 댓글 조회 오류:', error);
    throw error;
  }
}

/**
 * 캘린더 통계 관련 함수들
 */
// 캘린더 조회 통계 업데이트(조회수 1 증가)
export async function updateCalendarViewStats(targetUserId) {
  try {
    // 'calendarSharingSettings' 문서의 viewCount 1 증가 및 lastViewedAt 업데이트
    await updateDoc(doc(db, 'calendarSharingSettings', targetUserId), {
      viewCount: increment(1), // 조회수 1 증가
      lastViewedAt: new Date()
    });
    return true;
  } catch (error) {
    console.error('캘린더 조회 통계 업데이트 오류:', error);
    return false;
  }
}

// 인기 캘린더 조회(좋아요 수, 조회수 기준 내림차순 정렬)
export async function getPopularCalendars(limitCount = 20) {
  try {
    const q = query(
      collection(db, 'calendarSharingSettings'),
      where('isPublic', '==', true),
      where('shareLevel', '==', 'public'),
      orderBy('likeCount', 'desc'), // 1순위 정렬 : 좋아요 수
      orderBy('viewCount', 'desc'), // 2순위 정렬 : 조회수
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const calendars = [];
    
    for (const doc of querySnapshot.docs) {
      const settingsData = doc.data();
      
      // 사용자 정보 조회 및 병합
      const userDoc = await getDoc(doc(db, 'users', settingsData.userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        calendars.push({
          id: doc.id,
          ...settingsData,
          user: userData
        });
      }
    }

    return calendars;
  } catch (error) {
    console.error('인기 캘린더 조회 오류:', error);
    throw error;
  }
}
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
      shareLevel: settings.shareLevel || 'private', // 'private', 'followers', 'public'
      allowComments: settings.allowComments || false,
      allowLikes: settings.allowLikes || true,
      showPersonalInfo: settings.showPersonalInfo || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

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
      // 기본 설정 반환
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
 * 공개 캘린더 조회 관련 함수들
 */

// 공개 캘린더 목록 조회
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
      
      // 사용자 정보 조회
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
    console.error('공개 캘린더 조회 오류:', error);
    throw error;
  }
}

// 팔로잉한 사용자들의 캘린더 조회
export async function getFollowingCalendars(userId, limitCount = 20) {
  try {
    // 팔로잉 목록 조회
    const followingQuery = query(
      collection(db, 'follows'),
      where('followerId', '==', userId)
    );
    
    const followingSnapshot = await getDocs(followingQuery);
    const followingIds = followingSnapshot.docs.map(doc => doc.data().followingId);
    
    if (followingIds.length === 0) {
      return [];
    }

    // 팔로잉한 사용자들의 캘린더 설정 조회
    const calendars = [];
    for (const followingId of followingIds) {
      const settingsDoc = await getDoc(doc(db, 'calendarSharingSettings', followingId));
      if (settingsDoc.exists()) {
        const settingsData = settingsDoc.data();
        if (settingsData.isPublic && (settingsData.shareLevel === 'followers' || settingsData.shareLevel === 'public')) {
          // 사용자 정보 조회
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

    return calendars.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  } catch (error) {
    console.error('팔로잉 캘린더 조회 오류:', error);
    throw error;
  }
}

/**
 * 캘린더 데이터 조회 관련 함수들
 */

// 특정 사용자의 공개 기록 조회 (캘린더용)
export async function getUserPublicRecords(userId, year, month, limitCount = 50) {
  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const q = query(
      collection(db, 'records'),
      where('userId', '==', userId),
      where('isPublic', '==', true),
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

// 특정 날짜의 공개 기록 조회
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
      
      // 사용자 정보 조회
      const userDoc = await getDoc(doc(db, 'users', recordData.userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        records.push({
          id: doc.id,
          ...recordData,
          author: userData
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
 * 캘린더 상호작용 관련 함수들
 */

// 캘린더 좋아요
export async function likeCalendar(userId, targetUserId) {
  try {
    const likeData = {
      userId,
      targetUserId,
      createdAt: new Date()
    };

    const docRef = await addDoc(collection(db, 'calendarLikes'), likeData);
    
    // 캘린더 좋아요 수 증가
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
    // 좋아요 관계 찾기
    const q = query(
      collection(db, 'calendarLikes'),
      where('userId', '==', userId),
      where('targetUserId', '==', targetUserId)
    );

    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const likeDoc = querySnapshot.docs[0];
      await deleteDoc(doc(db, 'calendarLikes', likeDoc.id));

      // 캘린더 좋아요 수 감소
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
    const q = query(
      collection(db, 'calendarLikes'),
      where('userId', '==', userId),
      where('targetUserId', '==', targetUserId)
    );

    const querySnapshot = await getDocs(q);
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
      isDeleted: false
    };

    const docRef = await addDoc(collection(db, 'calendarComments'), commentData);
    
    // 캘린더 댓글 수 증가
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
      
      // 댓글 작성자 정보 조회
      const userDoc = await getDoc(doc(db, 'users', commentData.userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        comments.push({
          id: doc.id,
          ...commentData,
          author: userData
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

// 캘린더 조회 통계 업데이트
export async function updateCalendarViewStats(targetUserId) {
  try {
    await updateDoc(doc(db, 'calendarSharingSettings', targetUserId), {
      viewCount: increment(1),
      lastViewedAt: new Date()
    });
    return true;
  } catch (error) {
    console.error('캘린더 조회 통계 업데이트 오류:', error);
    return false;
  }
}

// 인기 캘린더 조회 (좋아요/조회수 기준)
export async function getPopularCalendars(limitCount = 20) {
  try {
    const q = query(
      collection(db, 'calendarSharingSettings'),
      where('isPublic', '==', true),
      where('shareLevel', '==', 'public'),
      orderBy('likeCount', 'desc'),
      orderBy('viewCount', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const calendars = [];
    
    for (const doc of querySnapshot.docs) {
      const settingsData = doc.data();
      
      // 사용자 정보 조회
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

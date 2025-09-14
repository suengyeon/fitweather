// 커뮤니티 기능 유틸리티

import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, limit, increment } from 'firebase/firestore';

/**
 * 댓글 관련 함수들
 */

// 댓글 추가
export async function addComment(postId, userId, content, parentCommentId = null) {
  try {
    const commentData = {
      postId,
      userId,
      content,
      parentCommentId, // null이면 최상위 댓글, 값이 있으면 답글
      createdAt: new Date(),
      updatedAt: new Date(),
      likes: 0,
      isDeleted: false
    };

    const docRef = await addDoc(collection(db, 'comments'), commentData);
    
    // 게시물의 댓글 수 증가
    await updateDoc(doc(db, 'outfitRecords', postId), {
      commentCount: increment(1)
    });

    return { id: docRef.id, ...commentData };
  } catch (error) {
    console.error('댓글 추가 오류:', error);
    throw error;
  }
}

// 댓글 조회 (게시물별)
export async function getCommentsByPostId(postId, limitCount = 50) {
  try {
    const q = query(
      collection(db, 'comments'),
      where('postId', '==', postId),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'asc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const comments = [];
    
    querySnapshot.forEach((doc) => {
      comments.push({ id: doc.id, ...doc.data() });
    });

    return comments;
  } catch (error) {
    console.error('댓글 조회 오류:', error);
    throw error;
  }
}

// 댓글 삭제 (소프트 삭제)
export async function deleteComment(commentId, postId) {
  try {
    await updateDoc(doc(db, 'comments', commentId), {
      isDeleted: true,
      updatedAt: new Date()
    });

    // 게시물의 댓글 수 감소
    await updateDoc(doc(db, 'outfitRecords', postId), {
      commentCount: increment(-1)
    });

    return true;
  } catch (error) {
    console.error('댓글 삭제 오류:', error);
    throw error;
  }
}

// 댓글 좋아요
export async function likeComment(commentId) {
  try {
    await updateDoc(doc(db, 'comments', commentId), {
      likes: increment(1)
    });
    return true;
  } catch (error) {
    console.error('댓글 좋아요 오류:', error);
    throw error;
  }
}

/**
 * 팔로우 관련 함수들
 */

// 팔로우
export async function followUser(followerId, followingId) {
  try {
    const followData = {
      followerId,
      followingId,
      createdAt: new Date()
    };

    const docRef = await addDoc(collection(db, 'follows'), followData);
    
    // 팔로워 수 증가
    await updateDoc(doc(db, 'users', followingId), {
      followerCount: increment(1)
    });

    // 팔로잉 수 증가
    await updateDoc(doc(db, 'users', followerId), {
      followingCount: increment(1)
    });

    return { id: docRef.id, ...followData };
  } catch (error) {
    console.error('팔로우 오류:', error);
    throw error;
  }
}

// 언팔로우
export async function unfollowUser(followerId, followingId) {
  try {
    // 팔로우 관계 찾기
    const q = query(
      collection(db, 'follows'),
      where('followerId', '==', followerId),
      where('followingId', '==', followingId)
    );

    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const followDoc = querySnapshot.docs[0];
      await deleteDoc(doc(db, 'follows', followDoc.id));

      // 팔로워 수 감소
      await updateDoc(doc(db, 'users', followingId), {
        followerCount: increment(-1)
      });

      // 팔로잉 수 감소
      await updateDoc(doc(db, 'users', followerId), {
        followingCount: increment(-1)
      });
    }

    return true;
  } catch (error) {
    console.error('언팔로우 오류:', error);
    throw error;
  }
}

// 팔로우 상태 확인
export async function checkFollowStatus(followerId, followingId) {
  try {
    const q = query(
      collection(db, 'follows'),
      where('followerId', '==', followerId),
      where('followingId', '==', followingId)
    );

    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('팔로우 상태 확인 오류:', error);
    return false;
  }
}

// 팔로워 목록 조회
export async function getFollowers(userId, limitCount = 20) {
  try {
    const q = query(
      collection(db, 'follows'),
      where('followingId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const followers = [];
    
    for (const doc of querySnapshot.docs) {
      const followData = doc.data();
      // 사용자 정보 조회
      const userDoc = await getDocs(query(
        collection(db, 'users'),
        where('uid', '==', followData.followerId)
      ));
      
      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data();
        followers.push({
          id: doc.id,
          ...followData,
          user: userData
        });
      }
    }

    return followers;
  } catch (error) {
    console.error('팔로워 조회 오류:', error);
    throw error;
  }
}

// 팔로잉 목록 조회
export async function getFollowing(userId, limitCount = 20) {
  try {
    const q = query(
      collection(db, 'follows'),
      where('followerId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const following = [];
    
    for (const doc of querySnapshot.docs) {
      const followData = doc.data();
      // 사용자 정보 조회
      const userDoc = await getDocs(query(
        collection(db, 'users'),
        where('uid', '==', followData.followingId)
      ));
      
      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data();
        following.push({
          id: doc.id,
          ...followData,
          user: userData
        });
      }
    }

    return following;
  } catch (error) {
    console.error('팔로잉 조회 오류:', error);
    throw error;
  }
}

/**
 * 태그 관련 함수들
 */

// 인기 태그 조회
export async function getPopularTags(limitCount = 20) {
  try {
    const q = query(
      collection(db, 'outfitRecords'),
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc'),
      limit(100) // 최근 100개 게시물에서 태그 추출
    );

    const querySnapshot = await getDocs(q);
    const tagCounts = {};
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.styleTags && Array.isArray(data.styleTags)) {
        data.styleTags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    // 태그를 사용 빈도순으로 정렬
    const popularTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limitCount)
      .map(([tag, count]) => ({ tag, count }));

    return popularTags;
  } catch (error) {
    console.error('인기 태그 조회 오류:', error);
    throw error;
  }
}

// 태그로 게시물 검색
export async function getPostsByTag(tag, limitCount = 20) {
  try {
    const q = query(
      collection(db, 'outfitRecords'),
      where('styleTags', 'array-contains', tag),
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const posts = [];
    
    querySnapshot.forEach((doc) => {
      posts.push({ id: doc.id, ...doc.data() });
    });

    return posts;
  } catch (error) {
    console.error('태그 검색 오류:', error);
    throw error;
  }
}

/**
 * 피드 관련 함수들
 */

// 팔로잉 피드 조회
export async function getFollowingFeed(userId, limitCount = 20) {
  try {
    // 팔로잉 목록 조회
    const following = await getFollowing(userId, 100);
    const followingIds = following.map(f => f.followingId);
    
    if (followingIds.length === 0) {
      return [];
    }

    // 팔로잉한 사용자들의 게시물 조회
    const q = query(
      collection(db, 'outfitRecords'),
      where('userId', 'in', followingIds),
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const posts = [];
    
    for (const doc of querySnapshot.docs) {
      const postData = doc.data();
      
      // 작성자 정보 조회
      const userDoc = await getDocs(query(
        collection(db, 'users'),
        where('uid', '==', postData.userId)
      ));
      
      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data();
        posts.push({
          id: doc.id,
          ...postData,
          author: userData
        });
      }
    }

    return posts;
  } catch (error) {
    console.error('팔로잉 피드 조회 오류:', error);
    throw error;
  }
}

// 인기 게시물 조회
export async function getPopularPosts(limitCount = 20) {
  try {
    const q = query(
      collection(db, 'outfitRecords'),
      where('isPublic', '==', true),
      orderBy('likeCount', 'desc'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const posts = [];
    
    for (const doc of querySnapshot.docs) {
      const postData = doc.data();
      
      // 작성자 정보 조회
      const userDoc = await getDocs(query(
        collection(db, 'users'),
        where('uid', '==', postData.userId)
      ));
      
      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data();
        posts.push({
          id: doc.id,
          ...postData,
          author: userData
        });
      }
    }

    return posts;
  } catch (error) {
    console.error('인기 게시물 조회 오류:', error);
    throw error;
  }
}

/**
 * 알림 관련 함수들
 */

// 알림 추가
export async function addNotification(userId, type, message, relatedId = null) {
  try {
    const notificationData = {
      userId,
      type, // 'like', 'comment', 'follow', 'mention'
      message,
      relatedId, // 관련 게시물/댓글 ID
      isRead: false,
      createdAt: new Date()
    };

    const docRef = await addDoc(collection(db, 'notifications'), notificationData);
    return { id: docRef.id, ...notificationData };
  } catch (error) {
    console.error('알림 추가 오류:', error);
    throw error;
  }
}

// 알림 조회
export async function getNotifications(userId, limitCount = 20) {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const notifications = [];
    
    querySnapshot.forEach((doc) => {
      notifications.push({ id: doc.id, ...doc.data() });
    });

    return notifications;
  } catch (error) {
    console.error('알림 조회 오류:', error);
    throw error;
  }
}

// 알림 읽음 처리
export async function markNotificationAsRead(notificationId) {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      isRead: true
    });
    return true;
  } catch (error) {
    console.error('알림 읽음 처리 오류:', error);
    throw error;
  }
}


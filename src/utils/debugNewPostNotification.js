import { db } from '../firebase';
import { collection, getDocs, query, where, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth } from '../firebase';
import { notifyFollowersAboutNewPost } from '../services/notificationService';

/**
 * 새 기록 알림 디버깅 유틸리티
 */
export const debugNewPostNotification = {
  
  /**
   * 현재 구독 관계 확인
   */
  async checkFollowRelationships() {
    console.log('🔍 구독 관계 확인 중...');
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('❌ 로그인된 사용자가 없습니다.');
        return;
      }
      
      console.log(`👤 현재 사용자: ${currentUser.uid}`);
      
      // 1. 내가 구독한 사용자들
      const followingQuery = query(
        collection(db, 'follows'),
        where('followerId', '==', currentUser.uid)
      );
      
      const followingSnapshot = await getDocs(followingQuery);
      const followingList = [];
      
      for (const docSnapshot of followingSnapshot.docs) {
        const followData = docSnapshot.data();
        const userDoc = await getDoc(doc(db, 'users', followData.followingId));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          followingList.push({
            id: followData.followingId,
            nickname: userData.nickname || '닉네임 없음',
            followId: docSnapshot.id
          });
        }
      }
      
      console.log(`📋 내가 구독한 사용자 (${followingList.length}명):`);
      followingList.forEach((user, index) => {
        console.log(`${index + 1}. ${user.nickname} (${user.id})`);
      });
      
      // 2. 나를 구독한 사용자들
      const followersQuery = query(
        collection(db, 'follows'),
        where('followingId', '==', currentUser.uid)
      );
      
      const followersSnapshot = await getDocs(followersQuery);
      const followersList = [];
      
      for (const docSnapshot of followersSnapshot.docs) {
        const followData = docSnapshot.data();
        const userDoc = await getDoc(doc(db, 'users', followData.followerId));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          followersList.push({
            id: followData.followerId,
            nickname: userData.nickname || '닉네임 없음',
            followId: docSnapshot.id
          });
        }
      }
      
      console.log(`\n📋 나를 구독한 사용자 (${followersList.length}명):`);
      followersList.forEach((user, index) => {
        console.log(`${index + 1}. ${user.nickname} (${user.id})`);
      });
      
      return { following: followingList, followers: followersList };
      
    } catch (error) {
      console.error('❌ 구독 관계 확인 실패:', error);
      throw error;
    }
  },

  /**
   * 새 기록 생성 테스트
   */
  async createTestPost() {
    console.log('📝 테스트 기록 생성 중...');
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('❌ 로그인된 사용자가 없습니다.');
        return;
      }
      
      // 테스트 기록 데이터
      const testRecord = {
        uid: currentUser.uid,
        region: "Seoul",
        date: new Date().toISOString(),
        temperature: 25,
        weather: "맑음",
        outfit: {
          top: "반팔티",
          bottom: "반바지",
          shoes: "운동화",
          accessories: "선글라스"
        },
        isPublic: true, // 공개 기록으로 설정
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      console.log('📝 테스트 기록 데이터:', testRecord);
      
      // 기록 저장
      const docRef = await addDoc(collection(db, 'outfits'), testRecord);
      console.log(`✅ 테스트 기록 생성 완료: ${docRef.id}`);
      
      return docRef.id;
      
    } catch (error) {
      console.error('❌ 테스트 기록 생성 실패:', error);
      throw error;
    }
  },

  /**
   * 알림 전송 테스트
   */
  async testNotificationSending(postId) {
    console.log('📢 알림 전송 테스트 중...');
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('❌ 로그인된 사용자가 없습니다.');
        return;
      }
      
      console.log(`👤 기록 작성자: ${currentUser.uid}`);
      console.log(`📝 기록 ID: ${postId}`);
      
      // 알림 전송
      const notificationCount = await notifyFollowersAboutNewPost(currentUser.uid, postId);
      
      console.log(`✅ ${notificationCount}명에게 알림 전송 완료`);
      
      return notificationCount;
      
    } catch (error) {
      console.error('❌ 알림 전송 테스트 실패:', error);
      throw error;
    }
  },

  /**
   * 알림 수신 확인
   */
  async checkReceivedNotifications() {
    console.log('📱 수신된 알림 확인 중...');
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('❌ 로그인된 사용자가 없습니다.');
        return;
      }
      
      // 내가 받은 알림들 조회
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('recipient', '==', currentUser.uid)
      );
      
      const notificationsSnapshot = await getDocs(notificationsQuery);
      const notifications = [];
      
      notificationsSnapshot.forEach(doc => {
        const data = doc.data();
        notifications.push({
          id: doc.id,
          type: data.type,
          sender: data.sender,
          message: data.message,
          createdAt: data.createdAt,
          isRead: data.isRead
        });
      });
      
      // 최신순으로 정렬
      notifications.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          const aTime = a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const bTime = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return bTime - aTime;
        }
        return 0;
      });
      
      console.log(`📱 수신된 알림 (${notifications.length}개):`);
      notifications.forEach((noti, index) => {
        const senderName = noti.sender?.nickname || '알 수 없음';
        const time = noti.createdAt ? 
          (noti.createdAt.toDate ? noti.createdAt.toDate().toLocaleString() : new Date(noti.createdAt).toLocaleString()) 
          : '시간 없음';
        console.log(`${index + 1}. [${noti.type}] ${senderName} - ${time}`);
      });
      
      // 새 기록 알림만 필터링
      const newPostNotifications = notifications.filter(noti => noti.type === 'new_post_from_following');
      console.log(`\n📝 새 기록 알림 (${newPostNotifications.length}개):`);
      newPostNotifications.forEach((noti, index) => {
        const senderName = noti.sender?.nickname || '알 수 없음';
        const time = noti.createdAt ? 
          (noti.createdAt.toDate ? noti.createdAt.toDate().toLocaleString() : new Date(noti.createdAt).toLocaleString()) 
          : '시간 없음';
        console.log(`${index + 1}. ${senderName} - ${time}`);
      });
      
      return notifications;
      
    } catch (error) {
      console.error('❌ 알림 확인 실패:', error);
      throw error;
    }
  },

  /**
   * 전체 새 기록 알림 플로우 테스트
   */
  async testFullNewPostNotificationFlow() {
    console.log('🧪 새 기록 알림 전체 플로우 테스트 시작...');
    console.log('=====================================');
    
    try {
      // 1. 구독 관계 확인
      console.log('1️⃣ 구독 관계 확인...');
      const relationships = await this.checkFollowRelationships();
      
      if (relationships.following.length === 0) {
        console.log('⚠️ 구독한 사용자가 없습니다. 구독을 먼저 설정하세요.');
        return;
      }
      
      // 2. 테스트 기록 생성
      console.log('\n2️⃣ 테스트 기록 생성...');
      const postId = await this.createTestPost();
      
      // 3. 알림 전송 테스트
      console.log('\n3️⃣ 알림 전송 테스트...');
      const notificationCount = await this.testNotificationSending(postId);
      
      // 4. 알림 수신 확인
      console.log('\n4️⃣ 알림 수신 확인...');
      await this.checkReceivedNotifications();
      
      console.log('\n🎉 새 기록 알림 플로우 테스트 완료!');
      console.log('=====================================');
      
      return {
        postId,
        notificationCount,
        relationships
      };
      
    } catch (error) {
      console.error('❌ 새 기록 알림 플로우 테스트 실패:', error);
      throw error;
    }
  },

  /**
   * 특정 사용자의 모든 기록 확인 (공개/비공개 포함)
   */
  async checkUserAllPosts(userId) {
    console.log(`📝 사용자 ${userId}의 모든 기록 확인 중...`);
    
    try {
      const { db } = await import('../firebase');
      const { collection, getDocs, query, where, doc, getDoc } = await import('firebase/firestore');
      
      // 사용자 정보 확인
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        console.error(`❌ 사용자 ${userId}를 찾을 수 없습니다.`);
        return;
      }
      
      const userData = userDoc.data();
      console.log(`👤 사용자: ${userData.nickname || '닉네임 없음'} (${userId})`);
      
      // 해당 사용자의 모든 기록 조회
      const postsQuery = query(
        collection(db, 'outfits'),
        where('uid', '==', userId)
      );
      
      const postsSnapshot = await getDocs(postsQuery);
      const posts = [];
      
      postsSnapshot.forEach(doc => {
        const data = doc.data();
        posts.push({
          id: doc.id,
          date: data.date,
          temperature: data.temperature,
          weather: data.weather,
          isPublic: data.isPublic,
          createdAt: data.createdAt
        });
      });
      
      // 최신순으로 정렬
      posts.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          const aTime = a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const bTime = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return bTime - aTime;
        }
        return 0;
      });
      
      console.log(`📝 총 ${posts.length}개의 기록:`);
      
      if (posts.length === 0) {
        console.log('  📭 기록이 없습니다.');
        return;
      }
      
      posts.forEach((post, index) => {
        const time = post.createdAt ? 
          (post.createdAt.toDate ? post.createdAt.toDate().toLocaleString() : new Date(post.createdAt).toLocaleString()) 
          : '시간 없음';
        const visibility = post.isPublic ? '🌐 공개' : '🔒 비공개';
        console.log(`  ${index + 1}. ${visibility} - ${post.weather} ${post.temperature}°C (${time})`);
      });
      
      // 공개/비공개 통계
      const publicPosts = posts.filter(post => post.isPublic);
      const privatePosts = posts.filter(post => !post.isPublic);
      
      console.log(`\n📊 통계:`);
      console.log(`  🌐 공개 기록: ${publicPosts.length}개`);
      console.log(`  🔒 비공개 기록: ${privatePosts.length}개`);
      
      if (publicPosts.length === 0) {
        console.log(`\n⚠️ 공개 기록이 없어서 구독자들에게 알림이 가지 않습니다!`);
        console.log(`💡 공개 기록을 올려야 구독자들이 알림을 받을 수 있습니다.`);
      }
      
      return posts;
      
    } catch (error) {
      console.error('❌ 사용자 기록 확인 실패:', error);
      throw error;
    }
  },

  /**
   * 구독한 사용자의 최근 기록 확인
   */
  async checkFollowingUsersRecentPosts() {
    console.log('📝 구독한 사용자들의 최근 기록 확인 중...');
    
    try {
      const relationships = await this.checkFollowRelationships();
      
      if (relationships.following.length === 0) {
        console.log('⚠️ 구독한 사용자가 없습니다.');
        return;
      }
      
      for (const user of relationships.following) {
        console.log(`\n👤 ${user.nickname}의 최근 기록:`);
        
        // 해당 사용자의 최근 기록 조회
        const postsQuery = query(
          collection(db, 'outfits'),
          where('uid', '==', user.id),
          where('isPublic', '==', true)
        );
        
        const postsSnapshot = await getDocs(postsQuery);
        const posts = [];
        
        postsSnapshot.forEach(doc => {
          const data = doc.data();
          posts.push({
            id: doc.id,
            date: data.date,
            temperature: data.temperature,
            weather: data.weather,
            createdAt: data.createdAt
          });
        });
        
        // 최신순으로 정렬
        posts.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return b.createdAt.toDate() - a.createdAt.toDate();
          }
          return 0;
        });
        
        if (posts.length === 0) {
          console.log('  📭 공개 기록이 없습니다.');
        } else {
          console.log(`  📝 총 ${posts.length}개의 공개 기록:`);
          posts.slice(0, 3).forEach((post, index) => {
            const time = post.createdAt ? post.createdAt.toDate().toLocaleString() : '시간 없음';
            console.log(`    ${index + 1}. ${post.weather} ${post.temperature}°C - ${time}`);
          });
        }
      }
      
    } catch (error) {
      console.error('❌ 구독한 사용자 기록 확인 실패:', error);
      throw error;
    }
  }
};

// 개발 환경에서 전역으로 사용할 수 있도록 설정
if (process.env.NODE_ENV === 'development') {
  window.debugNewPostNotification = debugNewPostNotification;
}

import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, orderBy } from "firebase/firestore";
import { db } from "../firebase";

/**
 * 사용자의 모든 알림 조회
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Array>} 알림 목록
 */
export async function fetchUserNotifications(userId) {
  try {
    console.log("📢 알림 조회 API 호출:", userId);
    
    const q = query(
      collection(db, "notifications"),
      where("recipient", "==", userId)
    );
    
    const querySnapshot = await getDocs(q);
    const notifications = [];
    
    querySnapshot.forEach((doc) => {
      notifications.push({
        id: doc.id,
        ...doc.data(),
        read: doc.data().isRead || false
      });
    });
    
    // 클라이언트 사이드에서 최신순 정렬
    notifications.sort((a, b) => {
      let dateA, dateB;
      
      // Firestore Timestamp 객체 처리
      if (a.createdAt?.toDate) {
        dateA = a.createdAt.toDate();
      } else {
        dateA = new Date(a.createdAt);
      }
      
      if (b.createdAt?.toDate) {
        dateB = b.createdAt.toDate();
      } else {
        dateB = new Date(b.createdAt);
      }
      
      // 유효한 날짜인지 확인
      if (isNaN(dateA.getTime())) dateA = new Date(0);
      if (isNaN(dateB.getTime())) dateB = new Date(0);
      
      return dateB - dateA; // 최신순
    });
    
    console.log("✅ 알림 조회 성공:", notifications.length, "개");
    return notifications;
  } catch (error) {
    console.error("❌ 알림 조회 실패:", error);
    return [];
  }
}

/**
 * 읽지 않은 알림 개수 조회
 * @param {string} userId - 사용자 ID
 * @returns {Promise<number>} 읽지 않은 알림 개수
 */
export async function fetchUnreadNotificationCount(userId) {
  try {
    console.log("📢 읽지 않은 알림 개수 조회 API 호출:", userId);
    
    // 모든 알림을 가져와서 클라이언트에서 필터링
    const q = query(
      collection(db, "notifications"),
      where("recipient", "==", userId)
    );
    
    const querySnapshot = await getDocs(q);
    let count = 0;
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (!data.isRead) {
        count++;
      }
    });
    
    console.log("✅ 읽지 않은 알림 개수:", count);
    return count;
  } catch (error) {
    console.error("❌ 읽지 않은 알림 개수 조회 실패:", error);
    return 0;
  }
}

/**
 * 모든 읽지 않은 알림을 읽음 처리
 * @param {string} userId - 사용자 ID
 * @returns {Promise<number>} 읽음 처리된 알림 개수
 */
export async function markAllNotificationsAsReadAPI(userId) {
  try {
    console.log("📢 모든 알림 읽음 처리 API 호출:", userId);
    
    const q = query(
      collection(db, "notifications"),
      where("recipient", "==", userId)
    );
    
    const querySnapshot = await getDocs(q);
    const updatePromises = [];
    let count = 0;
    
    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      if (!data.isRead) {
        updatePromises.push(
          updateDoc(doc(db, "notifications", docSnapshot.id), {
            isRead: true,
            read: true // UI에서 사용하는 필드도 함께 업데이트
          })
        );
        count++;
      }
    });
    
    await Promise.all(updatePromises);
    
    console.log("✅ 모든 알림 읽음 처리 완료:", count);
    return count;
  } catch (error) {
    console.error("❌ 모든 알림 읽음 처리 실패:", error);
    throw error;
  }
}

/**
 * 특정 알림을 읽음 처리
 * @param {string} notificationId - 알림 ID
 * @param {string} userId - 사용자 ID
 * @returns {Promise<boolean>} 처리 성공 여부
 */
export async function markNotificationAsReadAPI(notificationId, userId) {
  try {
    console.log("📢 개별 알림 읽음 처리 API 호출:", { notificationId, userId });
    
    await updateDoc(doc(db, "notifications", notificationId), {
      isRead: true,
      read: true // UI에서 사용하는 필드도 함께 업데이트
    });
    
    console.log("✅ 개별 알림 읽음 처리 완료");
    return true;
  } catch (error) {
    console.error("❌ 개별 알림 읽음 처리 실패:", error);
    throw error;
  }
}

/**
 * 선택된 알림들 삭제
 * @param {string[]} notificationIds - 삭제할 알림 ID 목록
 * @param {string} userId - 사용자 ID
 * @returns {Promise<number>} 삭제된 알림 개수
 */
export async function deleteSelectedNotificationsAPI(notificationIds, userId) {
  try {
    console.log("🗑️ 선택된 알림 삭제 API 호출:", { notificationIds, userId });
    
    const deletePromises = notificationIds.map(id => 
      deleteDoc(doc(db, "notifications", id))
    );
    
    await Promise.all(deletePromises);
    const count = notificationIds.length;
    
    console.log("✅ 선택된 알림 삭제 완료:", count);
    return count;
  } catch (error) {
    console.error("❌ 선택된 알림 삭제 실패:", error);
    throw error;
  }
}

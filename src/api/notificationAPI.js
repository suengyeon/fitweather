import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, orderBy } from "firebase/firestore";
import { db } from "../firebase";

/**
 * 사용자의 모든 알림 조회
 */
export async function fetchUserNotifications(userId) {
  try {
    console.log("📢 알림 조회 API 호출:", userId);
    
    // 알림 컬렉션에서 해당 사용자를 수신자로 하는 문서 쿼리
    const q = query(
      collection(db, "notifications"),
      where("recipient", "==", userId)
    );
    
    const querySnapshot = await getDocs(q);
    const notifications = [];
    
    // 스냅샷에서 데이터 추출 및 read 필드 추가
    querySnapshot.forEach((doc) => {
      notifications.push({
        id: doc.id,
        ...doc.data(),
        read: doc.data().isRead || false // UI 호환성을 위해 read 필드 추가
      });
    });
    
    // 클라이언트 사이드에서 createdAt 기준 최신순 정렬
    notifications.sort((a, b) => {
      let dateA, dateB;
      
      // Firestore Timestamp 또는 일반 Date 객체 처리
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
      
      // 유효하지 않은 날짜에 대한 안전장치
      if (isNaN(dateA.getTime())) dateA = new Date(0);
      if (isNaN(dateB.getTime())) dateB = new Date(0);
      
      return dateB - dateA; // 내림차순(최신순) 정렬
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
 */
export async function fetchUnreadNotificationCount(userId) {
  try {
    console.log("📢 읽지 않은 알림 개수 조회 API 호출:", userId);
    
    // 사용자 수신 알림 쿼리
    const q = query(
      collection(db, "notifications"),
      where("recipient", "==", userId)
    );
    
    const querySnapshot = await getDocs(q);
    let count = 0;
    
    // 클라이언트에서 isRead가 false인 알림 개수 카운트
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
 */
export async function markAllNotificationsAsReadAPI(userId) {
  try {
    console.log("📢 모든 알림 읽음 처리 API 호출:", userId);
    
    // 사용자 수신 알림 쿼리
    const q = query(
      collection(db, "notifications"),
      where("recipient", "==", userId)
    );
    
    const querySnapshot = await getDocs(q);
    const updatePromises = [];
    let count = 0;
    
    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      // 읽지 않은 알림만 업데이트 Promise 배열에 추가
      if (!data.isRead) {
        updatePromises.push(
          updateDoc(doc(db, "notifications", docSnapshot.id), {
            isRead: true,
            read: true // UI 호환성을 위해 read 필드 함께 업데이트
          })
        );
        count++;
      }
    });
    
    // 모든 업데이트 Promise를 병렬로 실행
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
 */
export async function markNotificationAsReadAPI(notificationId, userId) {
  try {
    console.log("📢 개별 알림 읽음 처리 API 호출:", { notificationId, userId });
    
    // 특정 알림 문서의 isRead 및 read 필드를 true로 업데이트
    await updateDoc(doc(db, "notifications", notificationId), {
      isRead: true,
      read: true // UI 호환성을 위해 read 필드 함께 업데이트
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
 */
export async function deleteSelectedNotificationsAPI(notificationIds, userId) {
  try {
    console.log("🗑️ 선택된 알림 삭제 API 호출:", { notificationIds, userId });
    
    // 각 알림 ID에 대한 deleteDoc Promise 배열 생성
    const deletePromises = notificationIds.map(id => 
      deleteDoc(doc(db, "notifications", id))
    );
    
    // 모든 삭제 Promise를 병렬로 실행
    await Promise.all(deletePromises);
    const count = notificationIds.length;
    
    console.log("✅ 선택된 알림 삭제 완료:", count);
    return count;
  } catch (error) {
    console.error("❌ 선택된 알림 삭제 실패:", error);
    throw error;
  }
}
import { collection, addDoc, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// 신고 제출
export async function submitReport(reporterId, targetUserId, targetId, targetType, reason) {
  try {
    // 중복 신고 체크
    const existingReportQuery = query(
      collection(db, 'reports'),
      where('reporterId', '==', reporterId),
      where('targetId', '==', targetId),
      where('targetType', '==', targetType)
    );
    
    const existingReports = await getDocs(existingReportQuery);
    if (!existingReports.empty) {
      throw new Error('이미 신고한 게시물/댓글입니다.');
    }

    // 신고 데이터 저장
    const reportData = {
      reporterId,
      targetUserId,
      targetId,
      targetType, // 'post' 또는 'comment'
      reason,
      date: new Date(),
      status: 'pending' // pending, reviewed, resolved
    };

    const docRef = await addDoc(collection(db, 'reports'), reportData);
    return docRef.id;
  } catch (error) {
    console.error('신고 제출 실패:', error);
    throw error;
  }
}

// 신고 목록 조회 (관리자용)
export async function getReports() {
  try {
    const reportsQuery = query(collection(db, 'reports'));
    const reportsSnapshot = await getDocs(reportsQuery);
    
    const reports = [];
    reportsSnapshot.forEach((doc) => {
      reports.push({ id: doc.id, ...doc.data() });
    });

    // 댓글 신고의 경우 실제 게시물 ID 찾기
    for (let report of reports) {
      if (report.targetType === 'comment') {
        try {
          // 댓글 문서에서 게시물 ID 찾기
          const commentsRef = doc(db, 'comments', report.targetUserId);
          const commentsSnap = await getDoc(commentsRef);
          if (commentsSnap.exists()) {
            report.recordId = report.targetUserId; // 댓글이 속한 게시물 ID
          }
        } catch (error) {
          console.error('댓글 게시물 ID 찾기 실패:', error);
        }
      }
    }

    // 신고 횟수별로 정렬 (많은 순)
    const reportCounts = {};
    reports.forEach(report => {
      const key = `${report.targetUserId}_${report.targetType}`;
      reportCounts[key] = (reportCounts[key] || 0) + 1;
    });

    return reports.map(report => ({
      ...report,
      reportCount: reportCounts[`${report.targetUserId}_${report.targetType}`] || 1
    })).sort((a, b) => b.reportCount - a.reportCount);
  } catch (error) {
    console.error('신고 목록 조회 실패:', error);
    throw error;
  }
}

// 사용자 차단
export async function banUser(userId) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      status: 'banned',
      bannedAt: new Date()
    });
    return true;
  } catch (error) {
    console.error('사용자 차단 실패:', error);
    throw error;
  }
}

// 사용자 차단 해제
export async function unbanUser(userId) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      status: 'active',
      bannedAt: null
    });
    return true;
  } catch (error) {
    console.error('사용자 차단 해제 실패:', error);
    throw error;
  }
}

// 댓글 삭제
export async function deleteComment(commentId, recordId) {
  try {
    const commentsRef = doc(db, 'comments', recordId);
    const commentsSnap = await getDoc(commentsRef);
    
    if (commentsSnap.exists()) {
      const commentsData = commentsSnap.data();
      const updatedComments = commentsData.comments.filter(comment => comment.id !== commentId);
      
      await updateDoc(commentsRef, {
        comments: updatedComments,
        lastUpdated: new Date()
      });
    }
    return true;
  } catch (error) {
    console.error('댓글 삭제 실패:', error);
    throw error;
  }
}

// 사용자 목록 조회 (관리자용)
export async function getAllUsers() {
  try {
    const usersQuery = query(collection(db, 'users'));
    const usersSnapshot = await getDocs(usersQuery);
    
    const users = [];
    usersSnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });

    // 신고 횟수 계산
    const reports = await getReports();
    const userReportCounts = {};
    
    reports.forEach(report => {
      const userId = report.targetUserId;
      userReportCounts[userId] = (userReportCounts[userId] || 0) + 1;
    });

    return users.map(user => ({
      ...user,
      reportCount: userReportCounts[user.id] || 0
    }));
  } catch (error) {
    console.error('사용자 목록 조회 실패:', error);
    throw error;
  }
}

// 관리자 권한 확인
export async function isAdmin(userId) {
  try {
    console.log('관리자 권한 확인 중...', userId);
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      console.log('사용자 데이터:', userData);
      const isAdminUser = userData.role === 'admin' || userData.isAdmin === true;
      console.log('관리자 여부:', isAdminUser);
      return isAdminUser;
    }
    console.log('사용자 문서가 존재하지 않음');
    return false;
  } catch (error) {
    console.error('관리자 권한 확인 실패:', error);
    return false;
  }
}

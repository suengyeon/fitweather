import { collection, addDoc, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase'; 

/**
 * 사용자 신고 제출 후 Firestore에 저장(중복 신고 방지 로직 포함)
 */
export async function submitReport(reporterId, targetUserId, targetId, targetType, reason) {
  try {
    // 1. 중복 신고 체크 쿼리 : 동일한 신고자가 동일 대상을 신고했는지 확인
    const existingReportQuery = query(
      collection(db, 'reports'),
      where('reporterId', '==', reporterId),
      where('targetId', '==', targetId),
      where('targetType', '==', targetType)
    );

    const existingReports = await getDocs(existingReportQuery);
    if (!existingReports.empty) {
      // 중복 신고 발견 시 에러 발생
      throw new Error('이미 신고한 게시물/댓글입니다.');
    }

    // 2. 신고 데이터 준비 및 'reports' 컬렉션에 새 문서 저장
    const reportData = {
      reporterId,
      targetUserId,
      targetId,
      targetType, 
      reason,
      date: new Date(), 
      status: 'pending', // 초기 상태는 '대기 중'
      targetContentStatus: 'active' // 신고 접수 시점에는 '활성' 상태로 가정
    };

    const docRef = await addDoc(collection(db, 'reports'), reportData);
    return docRef.id; // 새로 생성된 문서 ID 반환
  } catch (error) {
    console.error('신고 제출 실패:', error);
    throw error;
  }
}

/**
 * 모든 신고 목록 조회, 각 신고 대상(게시물/댓글)의 상태(삭제 여부 등) 확인 후 반환
 */
export async function getReports() {
  try {
    // 1. 모든 신고 문서 조회
    const reportsQuery = query(collection(db, 'reports'));
    const reportsSnapshot = await getDocs(reportsQuery);

    const reports = [];
    reportsSnapshot.forEach((doc) => {
      reports.push({ id: doc.id, ...doc.data() });
    });

    // 2. 댓글 신고 처리 : 해당 댓글의 존재 여부 확인
    for (let report of reports) {
      if (report.targetType === 'comment') {
        try {
          // 'comments' 컬렉션에서 댓글 문서 조회 시도
          const commentsRef = doc(db, 'comments', report.targetId);
          const commentsSnap = await getDoc(commentsRef);

          if (commentsSnap.exists()) {
            report.recordId = report.targetId; // 댓글 문서 ID가 게시물 ID를 겸하는 경우
          } else {
            // 댓글 문서 존재하지 않음(삭제됨)
            report.recordId = report.targetId; 
            report.isDeleted = true; // 삭제된 댓글 표시
          }
        } catch (error) {
          console.error('댓글 게시물 ID 찾기 실패:', error);
          report.recordId = report.targetId;
          report.hasError = true; 
        }
      }
    }

    // 3. 게시물 신고 처리 : 해당 게시물의 존재 여부 확인('records' 또는 'outfits' 컬렉션)
    for (let report of reports) {
      if (report.targetType === 'post') {
        try {
          let recordSnap;
          // 'records' 컬렉션에서 조회 시도
          let recordRef = doc(db, 'records', report.targetId);
          recordSnap = await getDoc(recordRef);

          if (!recordSnap.exists()) {
            // 'records'에 없으면 'outfits' 컬렉션에서 조회 시도
            recordRef = doc(db, 'outfits', report.targetId);
            recordSnap = await getDoc(recordRef);
          }

          if (recordSnap.exists()) {
            report.recordId = report.targetId;
          } else {
            // 두 컬렉션 모두 X(삭제된 게시물)
            report.recordId = report.targetId;
            report.isDeleted = true; // 삭제된 게시물 표시
          }
        } catch (error) {
          console.error('게시물 삭제 상태 확인 실패:', error);
          report.recordId = report.targetId;
          report.hasError = true; 
        }
      }
    }

    // 4. 신고 횟수 집계 : targetUserId와 targetType을 기준으로 카운트
    const reportCounts = {};
    reports.forEach(report => {
      const key = `${report.targetUserId}_${report.targetType}`;
      reportCounts[key] = (reportCounts[key] || 0) + 1;
    });

    // 5. 신고 횟수 필드 추가 후, 횟수가 많은 순서대로 내림차순 정렬하여 반환
    return reports.map(report => ({
      ...report,
      reportCount: reportCounts[`${report.targetUserId}_${report.targetType}`] || 1
    })).sort((a, b) => b.reportCount - a.reportCount);
  } catch (error) {
    console.error('신고 목록 조회 실패:', error);
    throw error;
  }
}

/**
 * 특정 사용자의 상태를 'banned'로 변경하여 차단
 */
export async function banUser(userId) {
  try {
    const userRef = doc(db, 'users', userId); // 'users' 컬렉션의 사용자 문서 참조
    await updateDoc(userRef, {
      status: 'banned', // 상태를 'banned'로 변경
      bannedAt: new Date() // 차단 시각 기록
    });
    return true;
  } catch (error) {
    console.error('사용자 차단 실패:', error);
    throw error;
  }
}

/**
 * 특정 사용자의 상태를 'active'로 변경하여 차단 해제
 */
export async function unbanUser(userId) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      status: 'active', // 상태를 'active'로 변경
      bannedAt: null // 차단 시각 기록 초기화
    });
    return true;
  } catch (error) {
    console.error('사용자 차단 해제 실패:', error);
    throw error;
  }
}

/**
 * 특정 게시물에 포함된 특정 댓글 삭제(댓글이 게시물 문서 내 배열 형태로 저장되어 있다고 가정하고 구현)
 */
export async function deleteComment(commentId, recordId) {
  try {
    // 댓글 배열이 저장된 문서('comments' 컬렉션) 참조
    const commentsRef = doc(db, 'comments', recordId);
    const commentsSnap = await getDoc(commentsRef);

    if (commentsSnap.exists()) {
      const commentsData = commentsSnap.data();
      // 댓글 배열에서 해당 commentId를 가진 댓글 필터링(삭제)
      const updatedComments = commentsData.comments.filter(comment => comment.id !== commentId);

      // 댓글 배열과 최종 업데이트 시각 업데이트
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

/**
 * 모든 사용자 목록 조회 후, 각 사용자의 신고 횟수를 계산하여 포함한 목록 반환
 */
export async function getAllUsers() {
  try {
    // 1. 모든 사용자 문서 조회
    const usersQuery = query(collection(db, 'users'));
    const usersSnapshot = await getDocs(usersQuery);

    const users = [];
    usersSnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });

    // 2. 신고 횟수 계산을 위해 모든 신고 목록 가져옴
    const reports = await getReports();
    const userReportCounts = {};

    // 3. 신고 목록 순회하며 대상 사용자(targetUserId)별 신고 횟수 합산
    reports.forEach(report => {
      const userId = report.targetUserId;
      userReportCounts[userId] = (userReportCounts[userId] || 0) + 1;
    });

    // 4. 사용자 목록에 신고 횟수(reportCount) 필드 추가해 반환
    return users.map(user => ({
      ...user,
      reportCount: userReportCounts[user.id] || 0 // 해당 사용자에 대한 신고 횟수
    }));
  } catch (error) {
    console.error('사용자 목록 조회 실패:', error);
    throw error;
  }
}

/**
 * 특정 사용자의 관리자 권한 여부 확인
 */
export async function isAdmin(userId) {
  try {
    console.log('관리자 권한 확인 중...', userId);
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      // 'role'이 'admin'이거나 'isAdmin'이 true인 경우 관리자로 판단
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
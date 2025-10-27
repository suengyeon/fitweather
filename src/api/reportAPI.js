import { collection, addDoc, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase'; 

/**
 * 사용자 신고 제출 후 Firestore에 저장 (중복 신고 방지 로직 포함)
 * @param {string} reporterId 신고자 ID
 * @param {string} targetUserId 신고 대상 (게시물/댓글 작성자) ID
 * @param {string} targetId 신고 대상 (게시물/댓글) 문서 ID
 * @param {('post'|'comment')} targetType 신고 대상 타입 ('post' 또는 'comment')
 * @param {string} reason 신고 사유
 * @returns {Promise<string>} 새로 생성된 신고 문서의 ID
 * @throws {Error} 이미 신고한 경우 또는 제출 실패 시
 */
export async function submitReport(reporterId, targetUserId, targetId, targetType, reason) {
  try {
    // 1. 중복 신고 체크 쿼리 : 동일한 신고자가 동일한 대상(ID와 타입)을 신고했는지 확인
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

    // 2. 신고 데이터 준비
    const reportData = {
      reporterId,
      targetUserId,
      targetId,
      targetType, 
      reason,
      date: new Date(), 
      status: 'pending'
    };

    // 3. 'reports' 컬렉션에 새 신고 문서 저장
    const docRef = await addDoc(collection(db, 'reports'), reportData);
    return docRef.id; // 새로 생성된 문서 ID 반환
  } catch (error) {
    console.error('신고 제출 실패:', error);
    throw error;
  }
}

/**
 * 모든 신고 목록 조회, 각 신고 대상(게시물/댓글)의 상태(삭제 여부 등) 확인 후 반환
 * @returns {Promise<Array<Object>>} 신고 목록 (정렬 및 추가 필드가 포함됨)
 * @throws {Error} 신고 목록 조회 실패 시
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

    // 2. 댓글 신고 : 해당 댓글이 속한 게시물(혹은 댓글 자체) 상태 확인
    for (let report of reports) {
      if (report.targetType === 'comment') {
        try {
          // 'comments' 컬렉션에서 댓글 문서 조회 시도
          const commentsRef = doc(db, 'comments', report.targetId);
          const commentsSnap = await getDoc(commentsRef);

          if (commentsSnap.exists()) {
            // 댓글 문서 존재 : 댓글 문서 ID = 게시물 ID
            report.recordId = report.targetId;
            console.log('댓글 신고 - 게시물 ID 설정:', {
              commentId: report.targetId,
              postId: report.recordId,
              commentExists: true
            });
          } else {
            // 댓글 문서 존재 X : 삭제 가능성 높음
            console.warn('댓글 문서가 존재하지 않습니다 (삭제됨):', report.targetId);
            report.recordId = report.targetId; // 삭제되었어도 ID 유지
            report.isDeleted = true; // 삭제된 댓글 표시
            console.log('삭제된 댓글 신고 처리:', {
              commentId: report.targetId,
              postId: report.recordId,
              isDeleted: true
            });
          }
        } catch (error) {
          console.error('댓글 게시물 ID 찾기 실패:', error);
          report.recordId = report.targetId;
          report.hasError = true; // 에러 상태 표시
        }
      }
    }

    // 3. 게시물 신고 : 해당 게시물 삭제 상태 확인
    for (let report of reports) {
      if (report.targetType === 'post') {
        try {
          let recordSnap;
          // 'records' 컬렉션에서 게시물 문서 조회 시도
          let recordRef = doc(db, 'records', report.targetId);
          recordSnap = await getDoc(recordRef);

          if (recordSnap.exists()) {
            report.recordId = report.targetId;
             console.log('게시물 신고 - records 컬렉션에서 발견:', report.targetId);
          } else {
            // 'records'에 없으면, 'outfits' 컬렉션에서 다시 조회 시도
            recordRef = doc(db, 'outfits', report.targetId);
            recordSnap = await getDoc(recordRef);

            if (recordSnap.exists()) {
              report.recordId = report.targetId;
              console.log('게시물 신고 - outfits 컬렉션에서 발견:', report.targetId);
            } else {
              // 두 컬렉션 모두 X - 삭제된 게시물로 판단
              console.warn('게시물이 존재하지 않습니다 (삭제됨):', report.targetId);
              report.recordId = report.targetId;
              report.isDeleted = true; // 삭제된 게시물 표시
               console.log('삭제된 게시물 신고 처리:', {
                postId: report.targetId,
                isDeleted: true
              });
            }
          }
        } catch (error) {
          console.error('게시물 삭제 상태 확인 실패:', error);
          report.recordId = report.targetId;
          report.hasError = true; // 에러 상태 표시
        }
      }
    }

    // 4. 신고 횟수별로 정렬(많은 순)
    const reportCounts = {};
    reports.forEach(report => {
      // 신고 대상 사용자 ID와 대상 타입(post/comment)을 기준으로 카운트
      const key = `${report.targetUserId}_${report.targetType}`;
      reportCounts[key] = (reportCounts[key] || 0) + 1;
    });

    // 5. 신고 횟수 필드 추가 후, 신고 횟수가 많은 순서대로 정렬하여 반환
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
 * @param {string} userId 차단할 사용자 ID
 * @returns {Promise<boolean>} 성공 여부 (true)
 * @throws {Error} 사용자 차단 실패 시
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
 * @param {string} userId 차단 해제할 사용자 ID
 * @returns {Promise<boolean>} 성공 여부 (true)
 * @throws {Error} 사용자 차단 해제 실패 시
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
 * 특정 게시물에 포함된 특정 댓글 삭제(댓글이 게시물 문서 내 배열 형태로 저장되어 있다고 가정하고 구현됨)
 * @param {string} commentId 삭제할 댓글의 고유 ID
 * @param {string} recordId 댓글이 포함된 게시물(또는 댓글 그룹)의 문서 ID
 * @returns {Promise<boolean>} 성공 여부 (true)
 * @throws {Error} 댓글 삭제 실패 시
 */
export async function deleteComment(commentId, recordId) {
  try {
    // 댓글이 배열로 저장된 문서 (ID는 recordId) 참조
    const commentsRef = doc(db, 'comments', recordId);
    const commentsSnap = await getDoc(commentsRef);

    if (commentsSnap.exists()) {
      const commentsData = commentsSnap.data();
      // comments 배열에서 해당 commentId를 가진 댓글만 필터링하여 제외(삭제)
      const updatedComments = commentsData.comments.filter(comment => comment.id !== commentId);

      // 댓글 배열을 업데이트 후 최종 업데이트 시각 기록
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
 * 모든 사용자 목록 조회 후, 각 사용자의 신고 횟수를 계산하여 포함한 목록을 반환
 * @returns {Promise<Array<Object>>} 신고 횟수가 포함된 사용자 목록 배열
 * @throws {Error} 사용자 목록 조회 실패 시
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

    // 2. 신고 횟수 계산 위해 모든 신고 목록 가져옴
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
 * @param {string} userId 확인할 사용자 ID
 * @returns {Promise<boolean>} 관리자 권한이 있으면 true, 아니면 false
 * @throws {Error} 권한 확인 실패 시
 */
export async function isAdmin(userId) {
  try {
    console.log('관리자 권한 확인 중...', userId);
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      console.log('사용자 데이터:', userData);
      // 'role' = 'admin' or 'isAdmin' = true인 경우 관리자로 판단
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
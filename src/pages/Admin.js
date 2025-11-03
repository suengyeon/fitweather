import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { HomeIcon, ArrowLeftIcon, BellIcon } from '@heroicons/react/24/outline';
import { getReports, getAllUsers, banUser, unbanUser, deleteComment } from '../api/reportAPI'; 
import { deleteAnyRecord } from '../api/deleteOutfitRecord'; 
import { doc, getDoc } from 'firebase/firestore'; 
import { db } from '../firebase'; 

/**
 * 관리자 페이지 컴포넌트 - 신고 기록 및 회원 정보 관리
 */
function Admin() {
    const { user, loading } = useAuth(); 
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('reports'); 
    const [reports, setReports] = useState([]); 
    const [users, setUsers] = useState([]); 
    const [dataLoading, setDataLoading] = useState(true); 
    const [isAdminUser, setIsAdminUser] = useState(false); 

    // 관리자 로그인 상태 확인 및 세션 관리
    useEffect(() => {
        const checkAdminLogin = () => {
            const adminLoggedIn = sessionStorage.getItem('adminLoggedIn');
            const adminLoginTime = sessionStorage.getItem('adminLoginTime');
            
            // 세션에 로그인 기록이 없거나 만료된 경우 admin-login 페이지로 리디렉션
            if (!adminLoggedIn || adminLoggedIn !== 'true') {
                navigate('/admin-login');
                return;
            }

            if (adminLoginTime) {
                const loginTime = new Date(adminLoginTime);
                const now = new Date();
                const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
                
                if (hoursDiff > 24) { // 24시간 초과 시 세션 만료
                    sessionStorage.removeItem('adminLoggedIn');
                    sessionStorage.removeItem('adminLoginTime');
                    navigate('/admin-login');
                    return;
                }
            }
            setIsAdminUser(true); // 관리자 세션 유효 확인
        };

        checkAdminLogin();
    }, [navigate]);

    // 데이터 로드(관리자 로그인 확인 후 실행)
    useEffect(() => {
        if (!isAdminUser) return;

        const loadData = async () => {
            setDataLoading(true);
            try {
                // 신고 목록과 사용자 목록을 병렬로 조회
                const [reportsData, usersData] = await Promise.all([
                    getReports(),
                    getAllUsers()
                ]);
                setReports(reportsData);
                setUsers(usersData);
            } catch (error) {
                console.error('데이터 로드 실패:', error);
            } finally {
                setDataLoading(false);
            }
        };

        loadData();
    }, [isAdminUser]);

    // 사용자 차단 핸들러
    const handleBanUser = async (userId) => {
        if (!window.confirm('정말로 이 사용자를 차단하시겠습니까?')) return;

        try {
            await banUser(userId);
            alert('사용자가 차단되었습니다.');
            // 데이터 새로고침
            const [reportsData, usersData] = await Promise.all([ getReports(), getAllUsers() ]);
            setReports(reportsData);
            setUsers(usersData);
        } catch (error) {
            console.error('사용자 차단 실패:', error);
            alert('사용자 차단에 실패했습니다.');
        }
    };

    // 사용자 차단 해제 핸들러
    const handleUnbanUser = async (userId) => {
        if (!window.confirm('정말로 이 사용자의 차단을 해제하시겠습니까?')) return;

        try {
            await unbanUser(userId);
            alert('사용자 차단이 해제되었습니다.');
            // 데이터 새로고침
            const [reportsData, usersData] = await Promise.all([ getReports(), getAllUsers() ]);
            setReports(reportsData);
            setUsers(usersData);
        } catch (error) {
            console.error('사용자 차단 해제 실패:', error);
            alert('사용자 차단 해제에 실패했습니다.');
        }
    };

    // 댓글 삭제 핸들러
    const handleDeleteComment = async (commentId, recordId) => {
        if (!window.confirm('정말로 이 댓글을 삭제하시겠습니까?')) return;

        try {
            // deleteComment API 호출
            await deleteComment(commentId, recordId);
            alert('댓글이 삭제되었습니다.');
            // 신고 목록만 새로고침
            const reportsData = await getReports();
            setReports(reportsData);
        } catch (error) {
            console.error('댓글 삭제 실패:', error);
            alert('댓글 삭제에 실패했습니다.');
        }
    };

    // 기록 삭제 핸들러 (게시물 삭제)
    const handleDeleteRecord = async (recordId) => {
        if (!window.confirm('정말로 이 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

        try {
            let recordData = null;
            // records 컬렉션에서 데이터 조회 시도 (Base64 이미지 URL을 가져오기 위해)
            try {
                const recordRef = doc(db, "records", recordId);
                const recordSnap = await getDoc(recordRef);
                if (recordSnap.exists()) {
                    recordData = recordSnap.data();
                }
            } catch (error) {
                console.error("records 컬렉션에서 데이터 조회 실패:", error);
            }
            // deleteAnyRecord 호출 (outfits, records 컬렉션 모두 시도)
            await deleteAnyRecord(recordId, recordData?.imageUrls || []);
            alert('기록이 삭제되었습니다.');
            
            // 신고 목록 새로고침
            const reportsData = await getReports();
            setReports(reportsData);
        } catch (error) {
            console.error('기록 삭제 실패:', error);
            alert('기록 삭제에 실패했습니다.');
        }
    };

    // 관리자 로그아웃
    const handleAdminLogout = () => {
        sessionStorage.removeItem('adminLoggedIn');
        sessionStorage.removeItem('adminLoginTime');
        navigate('/admin-login'); // 로그인 페이지로 리디렉션
    };

    // 신고 3회 이상인 사용자 수 계산 (알림 뱃지용)
    const highReportUsers = users.filter(user => user.reportCount >= 3).length;

    if (loading || !isAdminUser || dataLoading) {
        return (
            <div className="p-6 text-center mt-20">
                {loading && "사용자 인증을 확인하는 중..."}
                {!isAdminUser && !loading && "권한을 확인하는 중..."}
                {isAdminUser && dataLoading && "데이터를 불러오는 중..."}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            {/* 상단 네비게이션 */}
            <div className="flex justify-between items-center px-4 py-3 bg-blue-100 shadow">
                <button
                    onClick={() => navigate(-1)}
                    className="bg-blue-200 px-3 py-1 rounded-md hover:bg-blue-300"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <h2 className="font-bold text-lg">관리자 페이지</h2>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate("/")}
                        className="bg-blue-200 px-3 py-1 rounded-md hover:bg-blue-300"
                        title="홈으로"
                    >
                        <HomeIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleAdminLogout}
                        className="bg-red-200 px-3 py-1 rounded-md hover:bg-red-300 text-sm text-red-700"
                        title="관리자 로그아웃"
                    >
                        로그아웃
                    </button>
                    {/* 위험 알림 뱃지 (신고 3회 이상 사용자 수) */}
                    {highReportUsers > 0 && (
                        <div className="relative">
                            <BellIcon className="w-6 h-6 text-red-500" />
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {highReportUsers}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* 탭 네비게이션 */}
            <div className="flex bg-white shadow-sm">
                <button
                    onClick={() => setActiveTab('reports')}
                    className={`px-6 py-3 font-medium ${
                        activeTab === 'reports'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-800'
                    }`}
                >
                    신고기록
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    className={`px-6 py-3 font-medium ${
                        activeTab === 'users'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-800'
                    }`}
                >
                    회원정보
                </button>
            </div>

            {/* 콘텐츠 */}
            <div className="flex-1 p-6">
                {/* 신고 기록 탭 */}
                {activeTab === 'reports' && (
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-4">신고 목록</h3>
                            {reports.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">신고된 내용이 없습니다.</p>
                            ) : (
                                <div className="space-y-4">
                                    {reports.map((report) => (
                                        <div
                                            key={report.id}
                                            className={`p-4 border rounded-lg ${
                                                report.reportCount >= 3
                                                    ? 'border-red-300 bg-red-50' // 3회 이상 신고 시 강조
                                                    : 'border-gray-200'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-sm font-medium">
                                                            신고 대상: {report.targetUserId}
                                                        </span>
                                                        <span className={`text-xs px-2 py-1 rounded ${
                                                            report.isDeleted 
                                                                ? 'bg-red-100 text-red-600' // 삭제된 게시물/댓글 표시
                                                                : report.hasError
                                                                ? 'bg-yellow-100 text-yellow-600'
                                                                : 'bg-gray-100'
                                                        }`}>
                                                            {report.targetType === 'post' ? '게시물' : '댓글'}
                                                            {report.isDeleted && ' (삭제됨)'}
                                                            {report.hasError && ' (오류)'}
                                                        </span>
                                                        {/* 신고 횟수 뱃지 */}
                                                        {report.reportCount >= 3 && (
                                                            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                                                                신고 {report.reportCount}회
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-600 mb-2">
                                                        신고자: {report.reporterId}
                                                    </p>
                                                    <p className="text-sm text-gray-800 mb-2">
                                                        사유: {report.reason}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mb-2">
                                                        {/* Firestore Timestamp를 로컬 시간 문자열로 변환 */}
                                                        {new Date(report.date.seconds * 1000).toLocaleString('ko-KR')}
                                                    </p>
                                                    {/* 게시물/댓글이 포함된 게시물 보기 링크 */}
                                                    <button
                                                        onClick={async () => {
                                                            if (report.isDeleted || report.hasError) {
                                                                alert('대상이 삭제되었거나 정보를 불러올 수 없습니다.');
                                                                return;
                                                            }
                                                            // 게시물 상세 페이지로 이동
                                                            const url = `/feed-detail/${report.recordId || report.targetId}`;
                                                            navigate(url);
                                                        }}
                                                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                                    >
                                                        {report.targetType === 'post' ? '📄 게시물 보기' : '💬 댓글이 포함된 게시물 보기'}
                                                    </button>
                                                </div>
                                                <div className="flex gap-2 ml-4">
                                                    {/* 댓글 삭제 버튼 */}
                                                    {report.targetType === 'comment' && !report.isDeleted && (
                                                        <button
                                                            onClick={() => handleDeleteComment(report.targetId, report.targetUserId)}
                                                            className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                                                        >
                                                            댓글 삭제
                                                        </button>
                                                    )}
                                                    {/* 기록 삭제 버튼 */}
                                                    {report.targetType === 'post' && !report.isDeleted && (
                                                        <button
                                                            onClick={() => handleDeleteRecord(report.targetId)}
                                                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                                                        >
                                                            기록 삭제
                                                        </button>
                                                    )}
                                                    {(report.isDeleted || report.hasError) && (
                                                        <span className="px-3 py-1 bg-gray-300 text-gray-600 text-sm rounded cursor-not-allowed">
                                                            {report.isDeleted ? '이미 삭제됨' : '삭제 불가'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-4">회원 목록</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-3 px-4">닉네임</th>
                                            <th className="text-left py-3 px-4">아이디</th>
                                            <th className="text-left py-3 px-4">상태</th>
                                            <th className="text-left py-3 px-4">신고 횟수</th>
                                            <th className="text-left py-3 px-4">조치</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((user) => (
                                            <tr key={user.id} className="border-b">
                                                <td className="py-3 px-4">{user.nickname || '미설정'}</td>
                                                <td className="py-3 px-4">{user.id}</td>
                                                <td className="py-3 px-4">
                                                    <span
                                                        className={`px-2 py-1 rounded text-xs ${
                                                            user.status === 'banned'
                                                                ? 'bg-red-100 text-red-600'
                                                                : 'bg-green-100 text-green-600'
                                                        }`}
                                                    >
                                                        {user.status === 'banned' ? '차단됨' : '활성'}
                                                    </span> {/* 🚨 이 부분이 닫히지 않아 에러 발생 🚨 */}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span
                                                        className={`px-2 py-1 rounded text-xs ${
                                                            user.reportCount >= 3
                                                                ? 'bg-red-100 text-red-600'
                                                                : 'bg-gray-100 text-gray-600'
                                                        }`}
                                                    >
                                                        {user.reportCount}회
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    {user.status === 'banned' ? (
                                                        <button
                                                            onClick={() => handleUnbanUser(user.id)}
                                                            className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                                                        >
                                                            차단 해제
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleBanUser(user.id)}
                                                            className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                                                        >
                                                            강제 탈퇴
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Admin;
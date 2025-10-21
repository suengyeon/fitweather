import React from "react";
import { XMarkIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

function CommentSection({
    comments,
    newComment,
    setNewComment,
    onCommentSubmit,
    onCommentDelete,
    onReply,
    onClose,
    onRefresh,
    isRefreshing,
    replyToCommentId,
    replyContent,
    setReplyContent,
    onReplySubmit,
    onCancelReply,
    onReportComment,
    user,
    author
}) {
    // 댓글 하나를 렌더링하는 재귀 함수
    const renderComment = (comment, level = 0) => {
        const isIndented = level >= 1;
        return (
            <div key={comment.id} className={`${isIndented ? 'mt-2' : 'mb-4'}`}>
                <div className="bg-white rounded-lg p-3 border w-full">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <div className="font-semibold text-sm text-gray-800 flex items-center gap-2">
                                <span>{isIndented ? `ㄴ ${comment.author}` : comment.author}</span>
                                {(comment.authorUid === author?.uid) && (
                                    <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-md font-medium">
                                        작성자
                                    </span>
                                )}
                            </div>
                            <div className="text-xs text-gray-500">{comment.timestamp}</div>
                        </div>

                        <div className="flex gap-2">
                            <button onClick={() => onReply(comment.id)} className="text-xs  hover:text-blue-600 border-r border-gray-500 pr-2">
                                답글💬
                            </button>
                            {(comment.authorUid === user?.uid || author?.uid === user?.uid) && (
                                <button onClick={() => onCommentDelete(comment.id)} className="text-xs hover:text-red-600">
                                    삭제🗑️
                                </button>
                            )}
                            {user && comment.authorUid !== user?.uid && onReportComment && (
                                <button 
                                    onClick={() => onReportComment(comment.id, comment.authorUid)}
                                    className="text-xs hover:text-red-600"
                                    title="신고하기"
                                >
                                    신고🚨
                                </button>
                            )}
                        </div>
                    </div>

                    <p className="text-sm text-gray-700 mb-2">{comment.content}</p>
                </div>

                {replyToCommentId === comment.id && (
                    <div className="mt-2 bg-gray-50 rounded-lg p-3 border">
                        <form onSubmit={onReplySubmit} className="space-y-2">
                            <textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="답글 작성"
                                className="w-full h-16 px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                maxLength={1000}
                            />
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">{replyContent.length}/1000</span>
                                <div className="flex gap-2">
                                    <button type="button" onClick={onCancelReply} className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800">
                                        취소
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!replyContent.trim()}
                                        className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                    >
                                        답글 등록
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                {Array.isArray(comment.replies) && comment.replies.length > 0 && (
                    <div className={`mt-2 ${level === 0 ? 'ml-6' : ''}`}>
                        {comment.replies.map((r) => renderComment(r, 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col rounded-lg overflow-hidden">
            {/* 헤더 */}
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
                <h3 className="text-lg font-semibold">댓글</h3>
                <div className="flex gap-2">
                    <button
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        title="댓글 새로고침"
                    >
                        <ArrowPathIcon className={`w-5 h-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded">
                        <XMarkIcon className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
            </div>

            {/* 댓글 목록 */}
            <div className="flex-1 overflow-y-auto p-4">
                {comments.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">아직 댓글이 없습니다.</p>
                ) : (
                    comments.map((comment) => renderComment(comment, 0))
                )}
            </div>

            {/* 댓글 입력 폼 */}
            <div className="border-t bg-gray-50 p-4">
                <form onSubmit={onCommentSubmit} className="space-y-3">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="댓글 작성"
                        className="w-full h-20 px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength={1000}
                    />
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">{newComment.length}/1000</span>
                        <button
                            type="submit"
                            disabled={!newComment.trim()}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                        >
                            등록
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CommentSection;
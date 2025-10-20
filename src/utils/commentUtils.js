/**
댓글 목록에서 특정 ID를 가진 댓글/답글에 새 답글을 재귀적으로 추가
 */
export function addReplyRecursively(nodes, targetId, newReply) {
    if (!Array.isArray(nodes)) return nodes;
    return nodes.map((node) => {
        if (node.id === targetId) {
            // 대상 ID를 찾으면 replies 배열에 새 답글 추가
            const nextReplies = Array.isArray(node.replies) ? [...node.replies, newReply] : [newReply];
            return { ...node, replies: nextReplies };
        }
        // 자식 댓글(답글)이 있으면 재귀 호출
        if (Array.isArray(node.replies) && node.replies.length > 0) {
            return { ...node, replies: addReplyRecursively(node.replies, targetId, newReply) };
        }
        return node;
    });
}

/**
 댓글 목록에서 특정 ID를 가진 댓글/답글을 삭제하되,
 해당 노드의 자식 답글이 있다면 자식 답글은 유지
 */
export function deleteNodeKeepChildren(nodes, targetId) {
    if (!Array.isArray(nodes)) return { list: nodes, changed: false };

    let changed = false;
    const result = [];

    for (const node of nodes) {
        if (node.id === targetId) {
            // 삭제 대상일 경우, 자식 답글이 있으면 결과 리스트에 자식들을 추가
            if (Array.isArray(node.replies) && node.replies.length > 0) {
                result.push(...node.replies);
            }
            changed = true;
            continue;
        }

        let nextNode = node;
        // 자식 답글에서 삭제가 발생했는지 확인
        if (Array.isArray(node.replies) && node.replies.length > 0) {
            const { list: childList, changed: childChanged } = deleteNodeKeepChildren(node.replies, targetId);
            if (childChanged) {
                changed = true;
                nextNode = { ...node, replies: childList };
            }
        }
        result.push(nextNode);
    }

    return { list: result, changed };
}

/**
 댓글 트리 구조에서 특정 ID를 가진 댓글/답글의 작성자 UID 찾음
 */
export function findCommentAuthor(comments, commentId) {
    for (const comment of comments) {
        if (comment.id === commentId) return comment.authorUid;
        if (comment.replies && comment.replies.length > 0) {
            // 답글 목록에서 재귀적으로 검색
            const found = findCommentAuthor(comment.replies, commentId);
            if (found) return found;
        }
    }
    return null;
}
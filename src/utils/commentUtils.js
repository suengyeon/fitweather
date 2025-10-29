/**
 * 댓글 목록에서 특정 ID를 가진 댓글/답글에 새 답글을 재귀적으로 추가
 * @param {Array<Object>} nodes - 현재 탐색 중인 댓글/답글 배열
 * @param {string} targetId - 새 답글을 추가할 대상 댓글/답글의 ID
 * @param {Object} newReply - 추가할 새 답글 객체
 * @returns {Array<Object>} 새 답글이 추가된 댓글 배열
 */
export function addReplyRecursively(nodes, targetId, newReply) {
    if (!Array.isArray(nodes)) return nodes;
    
    return nodes.map((node) => {
        if (node.id === targetId) {
            // 1. 대상 ID 찾으면 replies 배열에 새 답글 추가
            const nextReplies = Array.isArray(node.replies) ? [...node.replies, newReply] : [newReply];
            return { ...node, replies: nextReplies }; // 변경된 노드 반환
        }
        
        // 2. 자식 댓글(답글)이 있으면 재귀 호출하여 깊이 탐색
        if (Array.isArray(node.replies) && node.replies.length > 0) {
            // 자식 목록 변경 : 변경된 자식 목록을 가진 새 노드 객체 생성
            return { ...node, replies: addReplyRecursively(node.replies, targetId, newReply) };
        }
        
        return node; // 변경 사항 없으면 원본 노드 반환
    });
}

/**
 * 댓글 목록에서 특정 ID를 가진 댓글/답글을 삭제, 해당 노드의 자식 답글 있으면 그 자식 답글들은 유지해 부모 노드의 위치에 병합
 * @param {Array<Object>} nodes - 현재 탐색 중인 댓글/답글 배열
 * @param {string} targetId - 삭제할 대상 댓글/답글의 ID
 * @returns {{list: Array<Object>, changed: boolean}} 변경된 목록&변경 발생 여부
 */
export function deleteNodeKeepChildren(nodes, targetId) {
    if (!Array.isArray(nodes)) return { list: nodes, changed: false };

    let changed = false; // 목록에 변경 있었는지 플래그
    const result = []; // 새로운 목록

    for (const node of nodes) {
        if (node.id === targetId) {
            // 1. 삭제 대상일 경우
            // 자식 답글 있다면 자식 답글들을 결과 리스트에 병합(유지)
            if (Array.isArray(node.replies) && node.replies.length > 0) {
                result.push(...node.replies);
            }
            changed = true; // 변경 발생
            continue; // 현재 노드는 삭제(result에 추가 X)
        }

        let nextNode = node;
        
        // 2. 자식 댓글(답글)이 있다면 재귀 호출
        if (Array.isArray(node.replies) && node.replies.length > 0) {
            const { list: childList, changed: childChanged } = deleteNodeKeepChildren(node.replies, targetId);
            
            // 자식 목록에서 변경이 발생했다면
            if (childChanged) {
                changed = true; // 상위 레벨에도 변경 있었음 표시
                nextNode = { ...node, replies: childList }; // 변경된 자식 목록을 가진 새 노드 생성
            }
        }
        result.push(nextNode); // 변경되었든 아니든 현재 노드를 결과에 추가
    }
    return { list: result, changed };
}

/**
 * 댓글 트리 구조에서 특정 ID 가진 댓글/답글의 작성자 UID 찾음
 * @param {Array<Object>} comments - 최상위 댓글 배열
 * @param {string} commentId - 찾을 대상 댓글/답글의 ID
 * @returns {string|null} 작성자 UID (authorUid), 찾지 못하면 null
 */
export function findCommentAuthor(comments, commentId) {
    for (const comment of comments) {
        // 1. 현재 노드의 ID가 일치
        if (comment.id === commentId) return comment.authorUid;
        
        // 2. 답글 목록 있으면 재귀적으로 검색
        if (comment.replies && comment.replies.length > 0) {
            const found = findCommentAuthor(comment.replies, commentId);
            if (found) return found; // 자식 노드에서 찾았으면 즉시 반환
        }
    }
    return null; // 모든 노드 탐색했지만 찾지 못한 경우
}
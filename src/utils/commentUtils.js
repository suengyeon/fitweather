/**
 * 댓글 목록에서 특정 ID를 가진 댓글/답글에 새 답글을 재귀적으로 추가
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
            // 자식 목록에서 변경된 내용을 반영
            return { ...node, replies: addReplyRecursively(node.replies, targetId, newReply) };
        }
        return node; // 변경 사항 없으면 원본 노드 반환
    });
}

/**
 * 댓글 목록에서 특정 ID를 가진 댓글/답글을 삭제, 해당 노드의 자식 답글들은 유지해 부모 노드의 위치에 병합
 */
export function deleteNodeKeepChildren(nodes, targetId) {
    if (!Array.isArray(nodes)) return { list: nodes, changed: false };

    let changed = false; // 목록 변경 플래그
    const result = []; // 새로운 목록

    for (const node of nodes) {
        if (node.id === targetId) {
            // 1. 삭제 대상일 경우 : 자식 답글이 있다면 자식 답글들을 결과 리스트에 병합(노드 유지)
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
                changed = true; 
                nextNode = { ...node, replies: childList }; // 변경된 자식 목록을 가진 새 노드 생성
            }
        }
        result.push(nextNode); // 변경되었든 아니든 현재 노드를 결과에 추가
    }
    return { list: result, changed };
}

/**
 * 댓글 트리 구조에서 특정 ID 가진 댓글/답글의 작성자 UID 찾음(대댓글 알림 발송용)
 */
export function findCommentAuthor(comments, commentId) {
    for (const comment of comments) {
        // 1. 현재 노드의 ID가 일치하면 작성자 UID 반환
        if (comment.id === commentId) return comment.authorUid;
        
        // 2. 답글 목록 있으면 재귀적으로 검색
        if (comment.replies && comment.replies.length > 0) {
            const found = findCommentAuthor(comment.replies, commentId);
            if (found) return found; // 자식 노드에서 찾았으면 즉시 반환
        }
    }
    return null; // 찾지 못한 경우
}
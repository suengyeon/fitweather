export function buildTitle(n) {
  switch (n.kind) {
    case "follow":
      return `${n.actorName ?? "누군가"}님이 구독을 시작했어요.`;
    case "comment_on_my_post":
      return "내 기록에 댓글이 달렸어요.";
    case "reply_to_my_comment":
      return "내 댓글에 답글이 달렸어요.";
    default:
      return "새 알림이 있어요.";
  }
}

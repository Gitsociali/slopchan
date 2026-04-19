import { Comment } from '@bitsocialnet/bitsocial-react-hooks';
import { getCommentCommunityAddress } from './comment-utils';
import { isPendingApprovalAwaiting } from './pending-approval-moderation';
import { getThreadTopNavigationState } from './thread-scroll-utils';

type ModQueueCommentLike = {
  approved?: boolean;
  author?: Comment['author'];
  cid?: string;
  commentModeration?: Comment['commentModeration'];
  communityAddress?: string;
  content?: Comment['content'];
  deleted?: Comment['deleted'];
  link?: Comment['link'];
  linkHeight?: Comment['linkHeight'];
  linkWidth?: Comment['linkWidth'];
  number?: Comment['number'];
  parentCid?: Comment['parentCid'];
  pendingApproval?: boolean;
  postCid?: Comment['postCid'];
  reason?: Comment['reason'];
  removed?: boolean;
  replyCount?: Comment['replyCount'];
  threadCid?: Comment['threadCid'];
  thumbnailUrl?: Comment['thumbnailUrl'];
  timestamp?: Comment['timestamp'];
  title?: Comment['title'];
};

export type QueuedCommentRouteState = {
  scrollThreadContainerCid?: string;
  queuedComment?: {
    approved?: Comment['approved'];
    author?: Comment['author'];
    cid?: Comment['cid'];
    commentModeration?: Comment['commentModeration'];
    communityAddress?: string;
    content?: Comment['content'];
    deleted?: Comment['deleted'];
    link?: Comment['link'];
    linkHeight?: Comment['linkHeight'];
    linkWidth?: Comment['linkWidth'];
    number?: Comment['number'];
    parentCid?: Comment['parentCid'];
    pendingApproval?: Comment['pendingApproval'];
    postCid?: Comment['postCid'];
    reason?: Comment['reason'];
    removed?: Comment['removed'];
    replyCount?: Comment['replyCount'];
    threadCid?: Comment['threadCid'];
    thumbnailUrl?: Comment['thumbnailUrl'];
    timestamp?: Comment['timestamp'];
    title?: Comment['title'];
  };
};

export const getModQueueCommentRoute = (boardPath: string | undefined, commentCid: string | undefined): string | undefined =>
  boardPath && commentCid ? `/${boardPath}/thread/${commentCid}` : undefined;

export const getQueuedCommentRouteState = (comment: ModQueueCommentLike | undefined): QueuedCommentRouteState | undefined => {
  if (!comment?.cid) {
    return undefined;
  }

  return {
    ...(comment.parentCid ? {} : getThreadTopNavigationState(comment.cid)),
    queuedComment: {
      approved: comment.approved,
      author: comment.author,
      cid: comment.cid,
      commentModeration: comment.commentModeration,
      communityAddress: getCommentCommunityAddress(comment),
      content: comment.content,
      deleted: comment.deleted,
      link: comment.link,
      linkHeight: comment.linkHeight,
      linkWidth: comment.linkWidth,
      number: comment.number,
      parentCid: comment.parentCid,
      pendingApproval: comment.pendingApproval,
      postCid: comment.postCid,
      reason: comment.reason,
      removed: comment.removed,
      replyCount: comment.replyCount,
      threadCid: comment.threadCid,
      thumbnailUrl: comment.thumbnailUrl,
      timestamp: comment.timestamp,
      title: comment.title,
    },
  };
};

export const filterVisibleModQueueFeed = <T extends ModQueueCommentLike>(feed: T[], selectedBoardFilter: string | null): T[] =>
  feed.filter((comment) => {
    if (!isPendingApprovalAwaiting(comment)) {
      return false;
    }

    if (!selectedBoardFilter) {
      return true;
    }

    return getCommentCommunityAddress(comment) === selectedBoardFilter;
  });

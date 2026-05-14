import type { Comment } from '@bitsocial/bitsocial-react-hooks';
import { getCommentCommunityAddress } from './comment-utils';

export type PostMenuProps = {
  cid?: string;
  postCid?: string;
  parentCid?: string;
  communityAddress?: string;
  authorAddress?: string;
  link?: string;
  linkWidth?: number;
  linkHeight?: number;
  thumbnailUrl?: string;
  deleted?: boolean;
  removed?: boolean;
  comment?: Comment;
};

export const selectPostMenuProps = (post?: Comment): PostMenuProps => {
  const communityAddress = getCommentCommunityAddress(post);

  return {
    cid: post?.cid,
    postCid: post?.postCid,
    parentCid: post?.parentCid,
    communityAddress,
    authorAddress: post?.author?.address,
    link: post?.link,
    linkWidth: post?.linkWidth,
    linkHeight: post?.linkHeight,
    thumbnailUrl: post?.thumbnailUrl,
    deleted: post?.deleted,
    removed: post?.removed,
    comment: post,
  };
};

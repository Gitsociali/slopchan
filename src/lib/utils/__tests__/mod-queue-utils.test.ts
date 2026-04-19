import { describe, expect, it } from 'vitest';
import { filterVisibleModQueueFeed, getModQueueCommentRoute, getQueuedCommentRouteState } from '../mod-queue-utils';

describe('mod queue utils', () => {
  it('keeps only comments still awaiting approval', () => {
    const feed = [
      { cid: 'pending', communityAddress: 'tech.eth', pendingApproval: true },
      { cid: 'approved', approved: true, communityAddress: 'tech.eth', pendingApproval: true },
      { cid: 'rejected', approved: false, communityAddress: 'tech.eth', pendingApproval: true },
      { cid: 'removed', communityAddress: 'tech.eth', pendingApproval: true, removed: true },
      { cid: 'published', communityAddress: 'tech.eth', pendingApproval: false },
    ];

    expect(filterVisibleModQueueFeed(feed, null)).toEqual([{ cid: 'pending', communityAddress: 'tech.eth', pendingApproval: true }]);
  });

  it('applies the selected board filter after removing non-pending items', () => {
    const feed = [
      { cid: 'tech-pending', communityAddress: 'tech.eth', pendingApproval: true },
      { cid: 'g-pending', communityAddress: 'g.eth', pendingApproval: true },
      { cid: 'tech-approved', approved: true, communityAddress: 'tech.eth', pendingApproval: true },
    ];

    expect(filterVisibleModQueueFeed(feed, 'tech.eth')).toEqual([{ cid: 'tech-pending', communityAddress: 'tech.eth', pendingApproval: true }]);
  });

  it('builds excerpt routes from the comment permalink cid', () => {
    expect(getModQueueCommentRoute('g', 'reply-cid')).toBe('/g/thread/reply-cid');
    expect(getModQueueCommentRoute('g', undefined)).toBeUndefined();
    expect(getModQueueCommentRoute(undefined, 'reply-cid')).toBeUndefined();
  });

  it('serializes queued comment route state for reply links', () => {
    expect(
      getQueuedCommentRouteState({
        cid: 'reply-cid',
        communityAddress: 'g.eth',
        content: 'pending reply body',
        parentCid: 'thread-cid',
        pendingApproval: true,
        postCid: 'thread-cid',
      }),
    ).toEqual({
      queuedComment: {
        approved: undefined,
        author: undefined,
        cid: 'reply-cid',
        commentModeration: undefined,
        communityAddress: 'g.eth',
        content: 'pending reply body',
        deleted: undefined,
        link: undefined,
        linkHeight: undefined,
        linkWidth: undefined,
        number: undefined,
        parentCid: 'thread-cid',
        pendingApproval: true,
        postCid: 'thread-cid',
        reason: undefined,
        removed: undefined,
        replyCount: undefined,
        threadCid: undefined,
        thumbnailUrl: undefined,
        timestamp: undefined,
        title: undefined,
      },
    });
  });
});

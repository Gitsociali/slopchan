import { Comment } from '@bitsocial/bitsocial-react-hooks';

export function getThreadPostCountsByAuthor(post: Comment | undefined, replies: Comment[] = []): Map<string, number> {
  const counts = new Map<string, number>();
  const seenCids = new Set<string>();

  for (const comment of [post, ...replies]) {
    const cid = comment?.cid;
    const shortAddress = comment?.author?.shortAddress;
    if (!cid || !shortAddress || seenCids.has(cid)) continue;

    seenCids.add(cid);
    counts.set(shortAddress, (counts.get(shortAddress) ?? 0) + 1);
  }

  return counts;
}

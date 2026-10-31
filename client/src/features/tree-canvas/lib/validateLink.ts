import type { Relationship } from '@shared/schema';
import { wouldCreateParentCycle } from '@shared/graph';

type Rel = Pick<Relationship, 'fromMemberId' | 'toMemberId' | 'type'>;

export type LinkType = 'parent-child' | 'spouse' | 'guardian';

export type LinkValidation = { ok: true } | { ok: false; reason: string };

/** `from` is the parent/guardian for directional types; spouse links are symmetric. */
export function validateLink(
  existing: ReadonlyArray<Rel>,
  from: number,
  to: number,
  type: LinkType,
): LinkValidation {
  if (from === to) return { ok: false, reason: 'A person cannot be linked to themselves' };

  const duplicate = existing.some(
    (r) =>
      r.type === type &&
      ((r.fromMemberId === from && r.toMemberId === to) ||
        (type === 'spouse' && r.fromMemberId === to && r.toMemberId === from)),
  );
  if (duplicate) return { ok: false, reason: 'These people are already linked this way' };

  if (type === 'parent-child' && wouldCreateParentCycle(existing, from, to)) {
    return { ok: false, reason: 'That would make someone their own ancestor' };
  }
  return { ok: true };
}

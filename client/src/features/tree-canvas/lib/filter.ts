import type { FamilyMember, FamilyTreeData } from '@shared/schema';

export interface TreeFilters {
  query: string;
  living: 'all' | 'living' | 'deceased';
  gender: 'all' | NonNullable<FamilyMember['gender']>;
}

export const EMPTY_FILTERS: TreeFilters = { query: '', living: 'all', gender: 'all' };

export const filtersActive = (f: TreeFilters) => f.query.trim() !== '' || f.living !== 'all' || f.gender !== 'all';

const fullName = (m: FamilyMember) => [m.firstName, m.middleName, m.lastName].filter(Boolean).join(' ').toLowerCase();

export function matchesFilters(m: FamilyMember, f: TreeFilters): boolean {
  if (f.living === 'living' && m.isLiving === false) return false;
  if (f.living === 'deceased' && m.isLiving !== false) return false;
  if (f.gender !== 'all' && m.gender !== f.gender) return false;
  const q = f.query.trim().toLowerCase();
  return q === '' || fullName(m).includes(q);
}

/** Ids to keep emphasised, or null when no filter is active (nothing dimmed). */
export function highlightFromFilters(members: ReadonlyArray<FamilyMember>, f: TreeFilters): Set<number> | null {
  if (!filtersActive(f)) return null;
  return new Set(members.filter((m) => matchesFilters(m, f)).map((m) => m.id));
}

export function treeStats(tree: Pick<FamilyTreeData, 'members' | 'relationships'>) {
  const parents = new Map<number, number[]>();
  for (const r of tree.relationships) {
    if (r.type !== 'parent-child') continue;
    parents.set(r.toMemberId, [...(parents.get(r.toMemberId) ?? []), r.fromMemberId]);
  }
  const depth = new Map<number, number>();
  const visiting = new Set<number>();
  const depthOf = (id: number): number => {
    const known = depth.get(id);
    if (known !== undefined) return known;
    if (visiting.has(id)) return 0;
    visiting.add(id);
    const d = Math.max(-1, ...(parents.get(id) ?? []).map(depthOf)) + 1;
    visiting.delete(id);
    depth.set(id, d);
    return d;
  };
  const generations = tree.members.length ? Math.max(...tree.members.map((m) => depthOf(m.id))) + 1 : 0;
  const couples = tree.relationships.filter((r) => r.type === 'spouse').length;
  return { members: tree.members.length, generations, couples };
}

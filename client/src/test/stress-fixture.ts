import type { FamilyMember, FamilyTreeData, Relationship } from '@shared/schema';

/** Deterministic synthetic tree: couples with 1-3 children per generation, for perf checks. */
export function makeStressTree(size: number): FamilyTreeData {
  const members: FamilyMember[] = [];
  const relationships: Relationship[] = [];
  let relId = 1;
  const add = (): FamilyMember => {
    const id = members.length + 1;
    const m = { id, firstName: `Person${id}`, middleName: null, lastName: `Fam${id % 17}`, gender: id % 2 ? 'male' : 'female', isLiving: id % 5 !== 0, x: 0, y: 0 } as FamilyMember;
    members.push(m);
    return m;
  };
  const link = (from: number, to: number, type: string) =>
    relationships.push({ id: relId++, fromMemberId: from, toMemberId: to, type, status: 'active', subType: null } as Relationship);

  let frontier = [add()];
  while (members.length < size) {
    const next: FamilyMember[] = [];
    for (const person of frontier) {
      if (members.length >= size) break;
      const partner = add();
      link(person.id, partner.id, 'spouse');
      const kids = 1 + (person.id % 3);
      for (let k = 0; k < kids && members.length < size; k++) {
        const child = add();
        link(person.id, child.id, 'parent-child');
        link(partner.id, child.id, 'parent-child');
        next.push(child);
      }
    }
    frontier = next.length ? next : [add()];
  }
  return { members, relationships, events: [] } as FamilyTreeData;
}

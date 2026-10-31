import type { Relationship } from '@shared/schema';

export interface EdgeStyle {
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
}

type RelStyleInput = Pick<Relationship, 'type'> & Partial<Pick<Relationship, 'subType' | 'status'>>;

/** Colors/dashes carried over from the previous canvas so relationships keep their meaning. */
export function edgeStyle(rel: RelStyleInput): EdgeStyle {
  switch (rel.type) {
    case 'spouse': {
      const active = !rel.status || rel.status === 'active';
      return {
        stroke: active ? '#EF4444' : '#94A3B8',
        strokeWidth: 3,
        strokeDasharray: rel.status === 'divorced' ? '5,5' : undefined,
      };
    }
    case 'parent-child': {
      const stroke =
        rel.subType === 'biological' ? '#3B82F6'
        : rel.subType === 'adopted' ? '#10B981'
        : rel.subType === 'foster' ? '#8B5CF6'
        : '#94A3B8';
      return {
        stroke,
        strokeWidth: 2,
        strokeDasharray: rel.subType === 'foster' ? '5,5' : undefined,
      };
    }
    case 'adopted':
      return { stroke: '#10B981', strokeWidth: 2 };
    case 'guardian':
      return { stroke: '#8B5CF6', strokeWidth: 2, strokeDasharray: '5,5' };
    default:
      return { stroke: '#94A3B8', strokeWidth: 2 };
  }
}

/** Label for non-default states only (FR: edge labels hidden for plain active links). */
export function edgeLabel(rel: RelStyleInput & Partial<Pick<Relationship, 'startDate'>>, zoom: number): string | undefined {
  if (zoom < 0.4) return undefined;
  if (rel.status && rel.status !== 'active') {
    return rel.status.charAt(0).toUpperCase() + rel.status.slice(1);
  }
  if (rel.type === 'spouse' && zoom > 1 && rel.startDate) {
    return String(new Date(rel.startDate).getUTCFullYear());
  }
  if (rel.type === 'guardian') return 'Guardian';
  if (rel.type === 'parent-child' && rel.subType && rel.subType !== 'biological') {
    return rel.subType.charAt(0).toUpperCase() + rel.subType.slice(1);
  }
  return undefined;
}

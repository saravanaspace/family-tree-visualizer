import type { FamilyMember, Relationship, FamilyEvent } from "@shared/schema";

const now = new Date();
// The database layer hands the app Date objects for date columns even though drizzle types them as strings.
const d = (value: string) => new Date(value) as unknown as string;

function member(id: number, firstName: string, lastName: string, gender: string, birth: string, x: number, y: number, extra: Partial<FamilyMember> = {}): FamilyMember {
  return {
    id, firstName, middleName: null, lastName, gender, birthDate: d(birth), birthPlace: null,
    deathDate: null, deathPlace: null, occupation: null, biography: null, photoUrl: null,
    isLiving: true, email: null, x, y, createdAt: now, updatedAt: now, ...extra,
  };
}

function rel(id: number, fromMemberId: number, toMemberId: number, type: string, extra: Partial<Relationship> = {}): Relationship {
  return {
    id, fromMemberId, toMemberId, type, subType: type === "parent-child" ? "biological" : null,
    startDate: null, endDate: null, status: "active", notes: null, createdAt: now, updatedAt: now, ...extra,
  };
}

function event(id: number, type: string, date: string, description: string, memberIds: number[], place: string | null = null): FamilyEvent {
  return { id, type, date: d(date), place, description, memberIds, createdAt: now, updatedAt: now };
}

// Returns fresh objects on every call so a reset never shares state with earlier edits.
export function buildSampleDataset() {
  const members: FamilyMember[] = [
    member(1, "Eleanor", "Johnson", "female", "1918-01-20", 100, 50, {
      birthPlace: "Dublin, Ireland", deathDate: d("2005-03-08"), deathPlace: "New York, NY",
      isLiving: false, biography: "Robert's mother; emigrated in 1938",
    }),
    member(2, "Robert", "Johnson", "male", "1940-05-15", 300, 50, {
      birthPlace: "New York, NY", occupation: "Retired Engineer", biography: "Founded Johnson Engineering in 1965",
    }),
    member(3, "Mary", "Johnson", "female", "1942-08-22", 500, 50, {
      birthPlace: "New York, NY", occupation: "Retired Teacher", biography: "Taught mathematics for 35 years",
    }),
    member(4, "James", "Johnson", "male", "1965-03-10", 200, 200, { birthPlace: "Boston, MA", occupation: "Software Engineer" }),
    member(5, "Sarah", "Johnson", "female", "1967-11-02", 400, 200, { middleName: "Wilson", birthPlace: "Chicago, IL", occupation: "Architect" }),
    member(6, "Michael", "Johnson", "male", "1970-07-15", 600, 200, { birthPlace: "Boston, MA", occupation: "Cardiologist" }),
    member(7, "Emily", "Johnson", "female", "1990-04-12", 150, 350, { birthPlace: "Seattle, WA" }),
    member(8, "William", "Johnson", "male", "1992-09-30", 350, 350, { birthPlace: "Seattle, WA", occupation: "Artist" }),
  ];

  const relationships: Relationship[] = [
    rel(1, 2, 3, "spouse", { startDate: d("1964-06-15") }),
    rel(2, 4, 5, "spouse", { startDate: d("1989-08-20") }),
    rel(3, 1, 2, "parent-child"),
    rel(4, 2, 4, "parent-child"),
    rel(5, 3, 4, "parent-child"),
    rel(6, 2, 6, "parent-child"),
    rel(7, 3, 6, "parent-child"),
    rel(8, 4, 7, "parent-child"),
    rel(9, 5, 7, "parent-child"),
    rel(10, 4, 8, "parent-child"),
    rel(11, 5, 8, "parent-child"),
  ];

  const events: FamilyEvent[] = [
    event(1, "marriage", "1964-06-15", "Wedding of Robert and Mary Johnson", [2, 3], "New York, NY"),
    event(2, "marriage", "1989-08-20", "Wedding of James and Sarah Johnson", [4, 5], "Chicago, IL"),
    event(3, "birth", "1990-04-12", "Birth of Emily Johnson", [7, 4, 5], "Seattle, WA"),
    event(4, "birth", "1992-09-30", "Birth of William Johnson", [8, 4, 5], "Seattle, WA"),
    event(5, "graduation", "2012-05-15", "Emily Johnson graduates with honors"  , [7]),
    event(6, "other", "2015-06-20", "William Johnson's first major art exhibition", [8]),
  ];

  return { members, relationships, events };
}

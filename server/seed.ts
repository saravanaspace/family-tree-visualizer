import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { familyMembers, relationships } from '@shared/schema';
import { config } from 'dotenv';

// Load environment variables
config();

async function seed() {
  const queryClient = postgres(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/familytree');
  const db = drizzle(queryClient);

  try {
    // Insert grandparents generation
    const [grandpa] = await db.insert(familyMembers).values({
      name: 'Robert Johnson',
      birthDate: '1940-05-15',
      location: 'New York, NY',
      type: 'father',
      x: 300,
      y: 50
    }).returning();

    const [grandma] = await db.insert(familyMembers).values({
      name: 'Mary Johnson',
      birthDate: '1942-08-22',
      location: 'New York, NY',
      type: 'mother',
      x: 500,
      y: 50
    }).returning();

    // Insert parents generation
    const [father] = await db.insert(familyMembers).values({
      name: 'James Johnson',
      birthDate: '1965-03-10',
      location: 'Boston, MA',
      type: 'father',
      x: 200,
      y: 200
    }).returning();

    const [mother] = await db.insert(familyMembers).values({
      name: 'Sarah Wilson',
      birthDate: '1968-11-28',
      location: 'Chicago, IL',
      type: 'mother',
      x: 400,
      y: 200
    }).returning();

    const [uncle] = await db.insert(familyMembers).values({
      name: 'Michael Johnson',
      birthDate: '1970-07-15',
      location: 'Los Angeles, CA',
      type: 'father',
      x: 600,
      y: 200
    }).returning();

    // Insert children generation
    const [child1] = await db.insert(familyMembers).values({
      name: 'Emily Johnson',
      birthDate: '1990-04-12',
      location: 'Boston, MA',
      type: 'child',
      x: 150,
      y: 350
    }).returning();

    const [child2] = await db.insert(familyMembers).values({
      name: 'William Johnson',
      birthDate: '1992-09-30',
      location: 'Boston, MA',
      type: 'child',
      x: 350,
      y: 350
    }).returning();

    // Create relationships
    // Grandparents marriage
    await db.insert(relationships).values({
      fromMemberId: grandpa.id,
      toMemberId: grandma.id,
      type: 'spouse'
    });

    // Parents marriage
    await db.insert(relationships).values({
      fromMemberId: father.id,
      toMemberId: mother.id,
      type: 'spouse'
    });

    // Parent-child relationships (grandparents -> father)
    await db.insert(relationships).values({
      fromMemberId: grandpa.id,
      toMemberId: father.id,
      type: 'parent'
    });
    await db.insert(relationships).values({
      fromMemberId: grandma.id,
      toMemberId: father.id,
      type: 'parent'
    });

    // Parent-child relationships (grandparents -> uncle)
    await db.insert(relationships).values({
      fromMemberId: grandpa.id,
      toMemberId: uncle.id,
      type: 'parent'
    });
    await db.insert(relationships).values({
      fromMemberId: grandma.id,
      toMemberId: uncle.id,
      type: 'parent'
    });

    // Parent-child relationships (parents -> children)
    await db.insert(relationships).values({
      fromMemberId: father.id,
      toMemberId: child1.id,
      type: 'parent'
    });
    await db.insert(relationships).values({
      fromMemberId: mother.id,
      toMemberId: child1.id,
      type: 'parent'
    });
    await db.insert(relationships).values({
      fromMemberId: father.id,
      toMemberId: child2.id,
      type: 'parent'
    });
    await db.insert(relationships).values({
      fromMemberId: mother.id,
      toMemberId: child2.id,
      type: 'parent'
    });

    console.log('Seed data inserted successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await queryClient.end();
  }
}

// Run the seed function
seed();
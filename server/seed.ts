import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { familyMembers, relationships, familyEvents } from '@shared/schema';
import { config } from 'dotenv';

// Load environment variables
config();

async function seed() {
  console.log('Starting database seeding...');
  const queryClient = postgres(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/familytree');
  const db = drizzle(queryClient);

  try {
    console.log('Inserting family members...');
    // Insert grandparents generation
    const [grandpa] = await db.insert(familyMembers).values({
      firstName: 'Robert',
      lastName: 'Johnson',
      gender: 'male',
      birthDate: '1940-05-15',
      birthPlace: 'New York, NY',
      occupation: 'Retired Engineer',
      biography: 'Founded Johnson Engineering in 1965',
      isLiving: true,
      x: 300,
      y: 50
    }).returning();

    const [grandma] = await db.insert(familyMembers).values({
      firstName: 'Mary',
      lastName: 'Johnson',
      gender: 'female',
      birthDate: '1942-08-22',
      birthPlace: 'New York, NY',
      occupation: 'Retired Teacher',
      biography: 'Taught mathematics for 35 years',
      isLiving: true,
      x: 500,
      y: 50
    }).returning();

    // Insert parents generation
    const [father] = await db.insert(familyMembers).values({
      firstName: 'James',
      lastName: 'Johnson',
      gender: 'male',
      birthDate: '1965-03-10',
      birthPlace: 'Boston, MA',
      occupation: 'Software Engineer',
      biography: 'Following his father\'s footsteps in engineering',
      isLiving: true,
      x: 200,
      y: 200
    }).returning();

    const [mother] = await db.insert(familyMembers).values({
      firstName: 'Sarah',
      middleName: 'Elizabeth',
      lastName: 'Wilson',
      gender: 'female',
      birthDate: '1968-11-28',
      birthPlace: 'Chicago, IL',
      occupation: 'Architect',
      biography: 'Award-winning architect with focus on sustainable design',
      isLiving: true,
      x: 400,
      y: 200
    }).returning();

    const [uncle] = await db.insert(familyMembers).values({
      firstName: 'Michael',
      lastName: 'Johnson',
      gender: 'male',
      birthDate: '1970-07-15',
      birthPlace: 'Los Angeles, CA',
      occupation: 'Doctor',
      biography: 'Leading cardiologist at LA General Hospital',
      isLiving: true,
      x: 600,
      y: 200
    }).returning();

    // Insert children generation
    const [child1] = await db.insert(familyMembers).values({
      firstName: 'Emily',
      lastName: 'Johnson',
      gender: 'female',
      birthDate: '1990-04-12',
      birthPlace: 'Boston, MA',
      occupation: 'Graduate Student',
      biography: 'Studying Computer Science at MIT',
      isLiving: true,
      x: 150,
      y: 350
    }).returning();

    const [child2] = await db.insert(familyMembers).values({
      firstName: 'William',
      lastName: 'Johnson',
      gender: 'male',
      birthDate: '1992-09-30',
      birthPlace: 'Boston, MA',
      occupation: 'Artist',
      biography: 'Contemporary artist with exhibitions in major galleries',
      isLiving: true,
      x: 350,
      y: 350
    }).returning();
    console.log('✅ Family members inserted');

    console.log('Creating relationships...');
    // Create relationships
    // Grandparents marriage
    await db.insert(relationships).values({
      fromMemberId: grandpa.id,
      toMemberId: grandma.id,
      type: 'spouse',
      startDate: '1964-06-15',
      status: 'active'
    });

    // Parents marriage
    await db.insert(relationships).values({
      fromMemberId: father.id,
      toMemberId: mother.id,
      type: 'spouse',
      startDate: '1989-08-20',
      status: 'active'
    });

    // Parent-child relationships (grandparents -> father)
    await db.insert(relationships).values({
      fromMemberId: grandpa.id,
      toMemberId: father.id,
      type: 'parent-child',
      subType: 'biological'
    });
    await db.insert(relationships).values({
      fromMemberId: grandma.id,
      toMemberId: father.id,
      type: 'parent-child',
      subType: 'biological'
    });

    // Parent-child relationships (grandparents -> uncle)
    await db.insert(relationships).values({
      fromMemberId: grandpa.id,
      toMemberId: uncle.id,
      type: 'parent-child',
      subType: 'biological'
    });
    await db.insert(relationships).values({
      fromMemberId: grandma.id,
      toMemberId: uncle.id,
      type: 'parent-child',
      subType: 'biological'
    });

    // Parent-child relationships (parents -> children)
    await db.insert(relationships).values({
      fromMemberId: father.id,
      toMemberId: child1.id,
      type: 'parent-child',
      subType: 'biological'
    });
    await db.insert(relationships).values({
      fromMemberId: mother.id,
      toMemberId: child1.id,
      type: 'parent-child',
      subType: 'biological'
    });
    await db.insert(relationships).values({
      fromMemberId: father.id,
      toMemberId: child2.id,
      type: 'parent-child',
      subType: 'biological'
    });
    await db.insert(relationships).values({
      fromMemberId: mother.id,
      toMemberId: child2.id,
      type: 'parent-child',
      subType: 'biological'
    });

    console.log('✅ Relationships created');

    console.log('Creating family events...');
    // Create family events
    // Marriages
    await db.insert(familyEvents).values({
      type: 'marriage',
      date: '1964-06-15',
      place: 'St. Patrick\'s Cathedral, New York',
      description: 'Wedding of Robert and Mary Johnson',
      memberIds: [grandpa.id, grandma.id]
    });

    await db.insert(familyEvents).values({
      type: 'marriage',
      date: '1989-08-20',
      place: 'Boston Harbor Hotel',
      description: 'Wedding of James Johnson and Sarah Wilson',
      memberIds: [father.id, mother.id]
    });

    // Births
    await db.insert(familyEvents).values({
      type: 'birth',
      date: '1965-03-10',
      place: 'Massachusetts General Hospital',
      description: 'Birth of James Johnson',
      memberIds: [father.id, grandpa.id, grandma.id]
    });

    await db.insert(familyEvents).values({
      type: 'birth',
      date: '1970-07-15',
      place: 'Cedars-Sinai Medical Center',
      description: 'Birth of Michael Johnson',
      memberIds: [uncle.id, grandpa.id, grandma.id]
    });

    await db.insert(familyEvents).values({
      type: 'birth',
      date: '1990-04-12',
      place: 'Massachusetts General Hospital',
      description: 'Birth of Emily Johnson',
      memberIds: [child1.id, father.id, mother.id]
    });

    await db.insert(familyEvents).values({
      type: 'birth',
      date: '1992-09-30',
      place: 'Massachusetts General Hospital',
      description: 'Birth of William Johnson',
      memberIds: [child2.id, father.id, mother.id]
    });

    // Other significant events
    await db.insert(familyEvents).values({
      type: 'graduation',
      date: '2012-05-15',
      place: 'Harvard University',
      description: 'Emily Johnson graduates with honors in Computer Science',
      memberIds: [child1.id]
    });

    await db.insert(familyEvents).values({
      type: 'other',
      date: '2015-06-20',
      place: 'Museum of Modern Art, New York',
      description: 'William Johnson\'s first major art exhibition',
      memberIds: [child2.id]
    });

    console.log('✅ Family events created');
    console.log('✅ All seed data inserted successfully!');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  } finally {
    await queryClient.end();
  }
}

// Run the seed function
seed().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
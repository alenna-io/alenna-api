import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// Helper to calculate PACE codes based on level
// ALL categories use the same numbering: L1=1001-1012, L2=1013-1024, etc.
function generatePaceCodes(levelNumber: number): string[] {
  const startCode = 1000 + (levelNumber - 1) * 12 + 1;
  return Array.from({ length: 12 }, (_, i) => String(startCode + i));
}

export async function seedPaceCatalog() {
  console.log('🎯 Seeding PACE Catalog...');

  // 1. Create Categories
  console.log('📚 Creating Categories...');
  const categoriesData = [
    { name: 'Bible Reading', displayOrder: 1 },
    { name: 'Electives', displayOrder: 2 },
    { name: 'English', displayOrder: 3 },
    { name: 'Math', displayOrder: 4 },
    { name: 'Science', displayOrder: 5 },
    { name: 'Social Studies', displayOrder: 6 },
    { name: 'Word Building', displayOrder: 7 },
    { name: 'Spanish', displayOrder: 8 },
  ];

  const categories: Record<string, any> = {};
  for (const cat of categoriesData) {
    categories[cat.name] = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: {
        id: randomUUID(),
        name: cat.name,
        displayOrder: cat.displayOrder,
      },
    });
  }
  console.log('✅ Created categories:', Object.keys(categories).join(', '));

  // 2. Create Levels
  console.log('📊 Creating Levels...');
  const levels: Record<string, any> = {};
  
  // Create L1-L12
  for (let i = 1; i <= 12; i++) {
    const levelId = `L${i}`;
    levels[levelId] = await prisma.level.upsert({
      where: { id: levelId },
      update: {},
      create: {
        id: levelId,
        number: i,
        name: `Level ${i}`,
      },
    });
  }
  
  // Create special "Electives" level
  levels['Electives'] = await prisma.level.upsert({
    where: { id: 'Electives' },
    update: {},
    create: {
      id: 'Electives',
      number: null,
      name: 'Electives',
    },
  });
  
  console.log('✅ Created 12 levels + Electives level');

  // 3. Create SubSubjects and PACEs
  console.log('📖 Creating SubSubjects and PACEs...');
  
  let totalSubSubjects = 0;
  let totalPaces = 0;

  // Helper function to create subsubject with paces
  async function createSubSubjectWithPaces(
    categoryName: string,
    subSubjectName: string,
    levelId: string,
    difficulty: number,
    paceCodes: string[],
    paceNamePrefix?: string // Optional: Use for PACE display name (defaults to categoryName)
  ) {
    const subSubject = await prisma.subSubject.upsert({
      where: {
        categoryId_name: {
          categoryId: categories[categoryName].id,
          name: subSubjectName,
        },
      },
      update: {},
      create: {
        id: randomUUID(),
        name: subSubjectName,
        categoryId: categories[categoryName].id,
        levelId: levelId,
        difficulty: difficulty,
      },
    });
    totalSubSubjects++;

    // Upsert PACEs for this subsubject
    const displayName = paceNamePrefix || categoryName;
    for (const code of paceCodes) {
      await prisma.paceCatalog.upsert({
        where: {
          subSubjectId_code: {
            subSubjectId: subSubject.id,
            code: code,
          },
        },
        update: {},
        create: {
          id: randomUUID(),
          code: code,
          name: `${displayName} ${code}`,
          subSubjectId: subSubject.id,
        },
      });
      totalPaces++;
    }

    return subSubject;
  }

  // BIBLE READING
  console.log('  📖 Bible Reading...');
  for (let level = 1; level <= 6; level++) {
    await createSubSubjectWithPaces(
      'Bible Reading',
      `Bible Reading L${level}`,
      `L${level}`,
      2,
      generatePaceCodes(level)
    );
  }

  // ELECTIVES
  console.log('  🎓 Electives...');
  
  // Biblical Studies Life of Christ (L12: 1133-1144)
  await createSubSubjectWithPaces(
    'Electives',
    'Biblical Studies Life of Christ',
    'L12',
    2,
    generatePaceCodes(12)
  );

  // Biblical Studies New Testament Survey (L9: 1097-1108)
  await createSubSubjectWithPaces(
    'Electives',
    'Biblical Studies New Testament Survey',
    'L9',
    2,
    generatePaceCodes(9)
  );

  // Biblical Studies Old Testament Survey (L10: 1109-1120)
  await createSubSubjectWithPaces(
    'Electives',
    'Biblical Studies Old Testament Survey',
    'L10',
    2,
    generatePaceCodes(10)
  );

  // Business Math (No level: 001-012)
  await createSubSubjectWithPaces(
    'Electives',
    'Business Math',
    'Electives',
    2,
    Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(3, '0'))
  );

  // General Business (No level: 097-108)
  await createSubSubjectWithPaces(
    'Electives',
    'General Business',
    'Electives',
    2,
    Array.from({ length: 12 }, (_, i) => String(97 + i).padStart(3, '0'))
  );

  // ENGLISH
  console.log('  📝 English...');
  
  // English L1-L8
  for (let level = 1; level <= 8; level++) {
    await createSubSubjectWithPaces(
      'English',
      `English L${level}`,
      `L${level}`,
      3,
      generatePaceCodes(level)
    );
  }
  
  // English I (L9)
  await createSubSubjectWithPaces(
    'English',
    'English I',
    'L9',
    3,
    generatePaceCodes(9)
  );
  
  // English II (L10)
  await createSubSubjectWithPaces(
    'English',
    'English II',
    'L10',
    3,
    generatePaceCodes(10)
  );
  
  // English III (L11)
  await createSubSubjectWithPaces(
    'English',
    'English III',
    'L11',
    3,
    generatePaceCodes(11)
  );
  
  // English IV (L12)
  await createSubSubjectWithPaces(
    'English',
    'English IV',
    'L12',
    3,
    generatePaceCodes(12)
  );

  // MATH
  console.log('  🔢 Math...');
  
  // Math L1-L8
  for (let level = 1; level <= 8; level++) {
    await createSubSubjectWithPaces(
      'Math',
      `Math L${level}`,
      `L${level}`,
      4,
      generatePaceCodes(level)
    );
  }
  
  // Algebra I (L9)
  await createSubSubjectWithPaces(
    'Math',
    'Algebra I',
    'L9',
    4,
    generatePaceCodes(9)
  );
  
  // Geometry (L10)
  await createSubSubjectWithPaces(
    'Math',
    'Geometry',
    'L10',
    4,
    generatePaceCodes(10)
  );
  
  // Algebra II (L11)
  await createSubSubjectWithPaces(
    'Math',
    'Algebra II',
    'L11',
    4,
    generatePaceCodes(11)
  );
  
  // Trigonometry (L12)
  await createSubSubjectWithPaces(
    'Math',
    'Trigonometry',
    'L12',
    4,
    generatePaceCodes(12)
  );

  // SCIENCE
  console.log('  🔬 Science...');
  
  // Science L1-L8
  for (let level = 1; level <= 8; level++) {
    await createSubSubjectWithPaces(
      'Science',
      `Science L${level}`,
      `L${level}`,
      4,
      generatePaceCodes(level)
    );
  }
  
  // Biology (L9)
  await createSubSubjectWithPaces(
    'Science',
    'Biology',
    'L9',
    4,
    generatePaceCodes(9)
  );
  
  // Physical Science (L10)
  await createSubSubjectWithPaces(
    'Science',
    'Physical Science',
    'L10',
    4,
    generatePaceCodes(10)
  );
  
  // Chemistry (L11)
  await createSubSubjectWithPaces(
    'Science',
    'Chemistry',
    'L11',
    4,
    generatePaceCodes(11)
  );
  
  // Physics (L12)
  await createSubSubjectWithPaces(
    'Science',
    'Physics',
    'L12',
    4,
    generatePaceCodes(12)
  );

  // SOCIAL STUDIES
  console.log('  🌍 Social Studies...');
  
  // Social Studies L1-L8
  for (let level = 1; level <= 8; level++) {
    await createSubSubjectWithPaces(
      'Social Studies',
      `Social Studies L${level}`,
      `L${level}`,
      2,
      generatePaceCodes(level)
    );
  }
  
  // World Geography (L9)
  await createSubSubjectWithPaces(
    'Social Studies',
    'World Geography',
    'L9',
    2,
    generatePaceCodes(9)
  );
  
  // World History (L10)
  await createSubSubjectWithPaces(
    'Social Studies',
    'World History',
    'L10',
    2,
    generatePaceCodes(10)
  );
  
  // American History (L11)
  await createSubSubjectWithPaces(
    'Social Studies',
    'American History',
    'L11',
    2,
    generatePaceCodes(11)
  );
  
  // U.S. Civics (L12: 1133-1138 - 6 PACEs)
  await createSubSubjectWithPaces(
    'Social Studies',
    'U.S. Civics',
    'L12',
    2,
    Array.from({ length: 6 }, (_, i) => String(1133 + i))
  );
  
  // Economics (L12: 1139-1144 - 6 PACEs)
  await createSubSubjectWithPaces(
    'Social Studies',
    'Economics',
    'L12',
    2,
    Array.from({ length: 6 }, (_, i) => String(1139 + i))
  );

  // WORD BUILDING
  console.log('  📚 Word Building...');
  
  // Word Building L1-L8
  for (let level = 1; level <= 8; level++) {
    await createSubSubjectWithPaces(
      'Word Building',
      `Word Building L${level}`,
      `L${level}`,
      2,
      generatePaceCodes(level)
    );
  }
  
  // Etymology (L9)
  await createSubSubjectWithPaces(
    'Word Building',
    'Etymology',
    'L9',
    2,
    generatePaceCodes(9)
  );

  // SPANISH
  console.log('  🇪🇸 Spanish...');
  
  // Español L1
  await createSubSubjectWithPaces(
    'Spanish',
    'Español L1',
    'L1',
    3,
    generatePaceCodes(1)
  );
  
  // Español y Ortografía L2-L8
  for (let level = 2; level <= 8; level++) {
    await createSubSubjectWithPaces(
      'Spanish',
      `Español y Ortografía L${level}`,
      `L${level}`,
      3,
      generatePaceCodes(level)
    );
  }

  console.log(`✅ Created ${totalSubSubjects} SubSubjects with ${totalPaces} PACEs`);
  console.log('🎯 PACE Catalog seeding completed!');
}


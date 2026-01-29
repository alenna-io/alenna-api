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

  // 3. Create Subjects and PACEs
  console.log('📖 Creating Subjects and PACEs...');

  let totalSubjects = 0;
  let totalPaces = 0;

  // Helper function to create subject with paces
  async function createSubSubjectWithPaces(
    categoryName: string,
    subjectName: string,
    levelId: string,
    difficulty: number,
    paceCodes: string[],
    orderIndex: number,
    paceNamePrefix?: string // Optional: Use for PACE display name (defaults to categoryName),
  ): Promise<number> {
    const subject = await prisma.subject.upsert({
      where: {
        categoryId_name: {
          categoryId: categories[categoryName].id,
          name: subjectName,
        },
      },
      update: {},
      create: {
        id: randomUUID(),
        name: subjectName,
        categoryId: categories[categoryName].id,
        levelId: levelId,
        difficulty: difficulty,
      },
    });
    totalSubjects++;

    console.log("Creating subject: ", subject.name, " with category: ", categories[categoryName].name, " id: ", categories[categoryName].id);

    // Upsert PACEs for this subsubject
    // For electives, use sub-subject name; otherwise use paceNamePrefix or categoryName
    const displayName = categoryName === 'Electives'
      ? subjectName
      : (paceNamePrefix || categoryName);
    for (const code of paceCodes) {
      await prisma.paceCatalog.upsert({
        where: {
          subjectId_code: {
            subjectId: subject.id,
            code: code,
          },
        },
        update: {
          // Update name if it's an elective to ensure consistency
          name: categoryName === 'Electives' ? `${subjectName} ${code}` : undefined,
        },
        create: {
          id: randomUUID(),
          code: code,
          name: `${displayName} ${code}`,
          subjectId: subject.id,
          categoryId: categories[categoryName].id,
          orderIndex: orderIndex,
        },
      });
      totalPaces++;
      orderIndex++;
    }

    return orderIndex;
  }

  // BIBLE READING
  console.log('  📖 Bible Reading...');
  let bibleReadingOrderIndex: number = 1;
  for (let level = 1; level <= 6; level++) {
    bibleReadingOrderIndex = await createSubSubjectWithPaces(
      'Bible Reading',
      `Bible Reading L${level}`,
      `L${level}`,
      2,
      generatePaceCodes(level),
      bibleReadingOrderIndex,
      "Bible Reading"
    );
  }

  // ELECTIVES
  console.log('  🎓 Electives...');

  // Biblical Studies Life of Christ (L12: 1133-1144)
  let biblicalStudiesLifeOfChristOrderIndex: number = 133;
  await createSubSubjectWithPaces(
    'Electives',
    'Biblical Studies Life of Christ',
    'L12',
    2,
    generatePaceCodes(12),
    biblicalStudiesLifeOfChristOrderIndex,
    "Biblical Studies Life of Christ"
  );

  // Biblical Studies New Testament Survey (L9: 1097-1108)
  let biblicalStudiesNewTestamentSurveyOrderIndex: number = 97;
  await createSubSubjectWithPaces(
    'Electives',
    'Biblical Studies New Testament Survey',
    'L9',
    2,
    generatePaceCodes(9),
    biblicalStudiesNewTestamentSurveyOrderIndex,
    "Biblical Studies New Testament Survey"
  );

  // Biblical Studies Old Testament Survey (L10: 1109-1120)
  let biblicalStudiesOldTestamentSurveyOrderIndex: number = 109;
  await createSubSubjectWithPaces(
    'Electives',
    'Biblical Studies Old Testament Survey',
    'L10',
    2,
    generatePaceCodes(10),
    biblicalStudiesOldTestamentSurveyOrderIndex,
    "Biblical Studies Old Testament Survey"
  );

  // Business Math (No level: 001-012)
  let businessMathOrderIndex: number = 1;
  await createSubSubjectWithPaces(
    'Electives',
    'Business Math',
    'Electives',
    2,
    Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(3, '0')),
    businessMathOrderIndex,
    "Business Math"
  );

  // General Business (L9: 1097-1108)
  let generalBusinessOrderIndex: number = 97;
  await createSubSubjectWithPaces(
    'Electives',
    'General Business',
    'L9',
    2,
    generatePaceCodes(9),
    generalBusinessOrderIndex,
    "General Business"
  );

  // ENGLISH
  console.log('  📝 English...');

  // English L1-L8
  let englishOrderIndex: number = 1;
  for (let level = 1; level <= 8; level++) {
    englishOrderIndex = await createSubSubjectWithPaces(
      'English',
      `English L${level}`,
      `L${level}`,
      3,
      generatePaceCodes(level),
      englishOrderIndex,
      "English"
    );
  }

  // English I (L9)
  let englishIOrderIndex: number = 97;
  await createSubSubjectWithPaces(
    'English',
    'English I',
    'L9',
    3,
    generatePaceCodes(9),
    englishIOrderIndex,
    "English I"
  );

  // English II (L10)
  let englishIIOrderIndex: number = 109;
  await createSubSubjectWithPaces(
    'English',
    'English II',
    'L10',
    3,
    generatePaceCodes(10),
    englishIIOrderIndex,
    "English II"
  );

  // English III (L11)
  let englishIIIOrderIndex: number = 121;
  await createSubSubjectWithPaces(
    'English',
    'English III',
    'L11',
    3,
    generatePaceCodes(11),
    englishIIIOrderIndex,
    "English III"
  );

  // English IV (L12)
  let englishIVOrderIndex: number = 133;
  await createSubSubjectWithPaces(
    'English',
    'English IV',
    'L12',
    3,
    generatePaceCodes(12),
    englishIVOrderIndex,
    "English IV"
  );

  // MATH
  console.log('  🔢 Math...');

  // Math L1-L8
  let mathOrderIndex: number = 1;
  for (let level = 1; level <= 8; level++) {
    console.log(`   Creating Math L${level}...`);
    console.log("Order Index: ", mathOrderIndex);
    mathOrderIndex = await createSubSubjectWithPaces(
      'Math',
      `Math L${level}`,
      `L${level}`,
      4,
      generatePaceCodes(level),
      mathOrderIndex,
      "Math"
    );
  }

  // Algebra I (L9)
  let algebraIOrderIndex: number = 97;
  await createSubSubjectWithPaces(
    'Math',
    'Algebra I',
    'L9',
    4,
    generatePaceCodes(9),
    algebraIOrderIndex,
    "Algebra I"
  );

  // Geometry (L10)
  let geometryOrderIndex: number = 109;
  await createSubSubjectWithPaces(
    'Math',
    'Geometry',
    'L10',
    4,
    generatePaceCodes(10),
    geometryOrderIndex,
    "Geometry"
  );

  // Algebra II (L11)
  let algebraIIOrderIndex: number = 121;
  await createSubSubjectWithPaces(
    'Math',
    'Algebra II',
    'L11',
    4,
    generatePaceCodes(11),
    algebraIIOrderIndex,
    "Algebra II"
  );

  // Trigonometry (L12)
  let trigonometryOrderIndex: number = 133;
  await createSubSubjectWithPaces(
    'Math',
    'Trigonometry',
    'L12',
    4,
    generatePaceCodes(12),
    trigonometryOrderIndex,
    "Trigonometry"
  );

  // SCIENCE
  console.log('  🔬 Science...');

  // Science L1-L8
  let scienceOrderIndex: number = 1;
  for (let level = 1; level <= 8; level++) {
    scienceOrderIndex = await createSubSubjectWithPaces(
      'Science',
      `Science L${level}`,
      `L${level}`,
      4,
      generatePaceCodes(level),
      scienceOrderIndex,
      "Science"
    );
  }

  // Biology (L9)
  let biologyOrderIndex: number = 97;
  await createSubSubjectWithPaces(
    'Science',
    'Biology',
    'L9',
    4,
    generatePaceCodes(9),
    biologyOrderIndex,
    "Biology"
  );

  // Physical Science (L10)
  let physicalScienceOrderIndex: number = 109;
  await createSubSubjectWithPaces(
    'Science',
    'Physical Science',
    'L10',
    4,
    generatePaceCodes(10),
    physicalScienceOrderIndex,
    "Physical Science"
  );

  // Chemistry (L11)
  let chemistryOrderIndex: number = 121;
  await createSubSubjectWithPaces(
    'Science',
    'Chemistry',
    'L11',
    4,
    generatePaceCodes(11),
    chemistryOrderIndex,
    "Chemistry"
  );

  // Physics (L12)
  let physicsOrderIndex: number = 133;
  await createSubSubjectWithPaces(
    'Science',
    'Physics',
    'L12',
    4,
    generatePaceCodes(12),
    physicsOrderIndex,
    "Physics"
  );

  // SOCIAL STUDIES
  console.log('  🌍 Social Studies...');

  // Social Studies L1-L8
  let socialStudiesOrderIndex: number = 1;
  for (let level = 1; level <= 8; level++) {
    socialStudiesOrderIndex = await createSubSubjectWithPaces(
      'Social Studies',
      `Social Studies L${level}`,
      `L${level}`,
      2,
      generatePaceCodes(level),
      socialStudiesOrderIndex,
      "Social Studies"
    );
  }

  // World Geography (L9)
  let worldGeographyOrderIndex: number = 97;
  await createSubSubjectWithPaces(
    'Social Studies',
    'World Geography',
    'L9',
    2,
    generatePaceCodes(9),
    worldGeographyOrderIndex,
    "World Geography"
  );

  // World History (L10)
  let worldHistoryOrderIndex: number = 109;
  await createSubSubjectWithPaces(
    'Social Studies',
    'World History',
    'L10',
    2,
    generatePaceCodes(10),
    worldHistoryOrderIndex,
    "World History"
  );

  // American History (L11)
  let americanHistoryOrderIndex: number = 121;
  await createSubSubjectWithPaces(
    'Social Studies',
    'American History',
    'L11',
    2,
    generatePaceCodes(11),
    americanHistoryOrderIndex,
    "American History"
  );

  // U.S. Civics (L12: 1133-1138 - 6 PACEs)
  let usCivicsOrderIndex: number = 133;
  await createSubSubjectWithPaces(
    'Social Studies',
    'U.S. Civics',
    'L12',
    2,
    Array.from({ length: 6 }, (_, i) => String(1133 + i)),
    usCivicsOrderIndex,
    "U.S. Civics"
  );

  // Economics (L12: 1139-1144 - 6 PACEs)
  let economicsOrderIndex: number = 139;
  await createSubSubjectWithPaces(
    'Social Studies',
    'Economics',
    'L12',
    2,
    Array.from({ length: 6 }, (_, i) => String(1139 + i)),
    economicsOrderIndex,
    "Economics"
  );

  // WORD BUILDING
  console.log('  📚 Word Building...');

  // Word Building L1-L8
  let wordBuildingOrderIndex: number = 1;
  for (let level = 1; level <= 8; level++) {
    wordBuildingOrderIndex = await createSubSubjectWithPaces(
      'Word Building',
      `Word Building L${level}`,
      `L${level}`,
      2,
      generatePaceCodes(level),
      wordBuildingOrderIndex,
      "Word Building"
    );
  }

  // Etymology (L9)
  let etymologyOrderIndex: number = 97;
  await createSubSubjectWithPaces(
    'Word Building',
    'Etymology',
    'L9',
    2,
    generatePaceCodes(9),
    etymologyOrderIndex,
    "Etymology"
  );

  // SPANISH
  console.log('  🇪🇸 Spanish...');

  // Español L1
  let españolL1OrderIndex: number = 1;
  await createSubSubjectWithPaces(
    'Spanish',
    'Español L1',
    'L1',
    3,
    generatePaceCodes(1),
    españolL1OrderIndex,
    "Español"
  );

  // Español y Ortografía L2-L8
  let españolYOrtografíaOrderIndex: number = 13;
  for (let level = 2; level <= 8; level++) {
    españolYOrtografíaOrderIndex = await createSubSubjectWithPaces(
      'Spanish',
      `Español y Ortografía L${level}`,
      `L${level}`,
      3,
      generatePaceCodes(level),
      españolYOrtografíaOrderIndex,
      "Español y Ortografía"
    );
  }

  console.log(`✅ Created ${totalSubjects} Subjects with ${totalPaces} PACEs`);
  console.log('🎯 PACE Catalog seeding completed!');
}


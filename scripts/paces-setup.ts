import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

interface SubjectPaceConfig {
  categoryName: string;
  subjectName: string;
  levelId: string;
  difficulty: number;
  paceCodes: string[];
  orderIndex: number;
  paceNamePrefix?: string;
}

export interface PacesSetupConfig {
  subjects: SubjectPaceConfig[];
}

async function getOrCreateCategory(categoryName: string, displayOrder: number) {
  const category = await prisma.category.upsert({
    where: { name: categoryName },
    update: {},
    create: {
      id: randomUUID(),
      name: categoryName,
      displayOrder,
    },
  });
  return category;
}

async function getOrCreateLevel(levelId: string, levelNumber: number | null = null) {
  if (levelId === 'Electives') {
    const level = await prisma.level.upsert({
      where: { id: 'Electives' },
      update: {},
      create: {
        id: 'Electives',
        number: null,
        name: 'Electives',
      },
    });
    return level;
  }

  const match = levelId.match(/^L(\d+)$/);
  if (!match) {
    throw new Error(`Invalid levelId format: ${levelId}. Expected format: L1-L12 or 'Electives'`);
  }

  const num = levelNumber || parseInt(match[1], 10);
  const level = await prisma.level.upsert({
    where: { id: levelId },
    update: {},
    create: {
      id: levelId,
      number: num,
      name: `Level ${num}`,
    },
  });
  return level;
}

async function createSubjectWithPaces(config: SubjectPaceConfig) {
  const category = await getOrCreateCategory(config.categoryName, 99);

  const subject = await prisma.subject.upsert({
    where: {
      categoryId_name: {
        categoryId: category.id,
        name: config.subjectName,
      },
    },
    update: {},
    create: {
      id: randomUUID(),
      name: config.subjectName,
      categoryId: category.id,
      levelId: config.levelId,
      difficulty: config.difficulty,
    },
  });

  const displayName = config.categoryName === 'Electives'
    ? config.subjectName
    : (config.paceNamePrefix || config.categoryName);

  let currentOrderIndex = config.orderIndex;
  const createdPaces = [];

  for (const code of config.paceCodes) {
    const pace = await prisma.paceCatalog.upsert({
      where: {
        subjectId_code: {
          subjectId: subject.id,
          code: code,
        },
      },
      update: {
        name: config.categoryName === 'Electives' ? `${config.subjectName} ${code}` : undefined,
        orderIndex: currentOrderIndex,
      },
      create: {
        id: randomUUID(),
        code: code,
        name: `${displayName} ${code}`,
        subjectId: subject.id,
        categoryId: category.id,
        orderIndex: currentOrderIndex,
      },
    });
    createdPaces.push(pace);
    currentOrderIndex++;
  }

  return { subject, paces: createdPaces };
}

export async function createPaces(config: PacesSetupConfig) {
  console.log('📚 Creating subjects and PACEs...\n');

  const results = [];
  for (const subjectConfig of config.subjects) {
    await getOrCreateLevel(subjectConfig.levelId);
    const result = await createSubjectWithPaces(subjectConfig);
    results.push(result);
    console.log(`  ✅ Created subject: ${result.subject.name}`);
    console.log(`     Created ${result.paces.length} PACEs with codes: ${subjectConfig.paceCodes.join(', ')}`);
  }

  console.log('');
  console.log(`✅ Created ${results.length} subject(s) with ${results.reduce((sum, r) => sum + r.paces.length, 0)} PACE(s)`);
  console.log('');

  return results;
}

export async function disconnect() {
  await prisma.$disconnect();
}

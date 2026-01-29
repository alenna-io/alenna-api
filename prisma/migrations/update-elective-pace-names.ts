import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Migration script to update elective pace names
 * Changes pace names from "Elective {code}" to "{SubSubjectName} {code}"
 * Example: "Elective 1097" -> "General Business 1097"
 */
async function updateElectivePaceNames() {
  console.log('🔄 Updating elective pace names...');

  // Get all electives category
  const electivesCategory = await prisma.category.findUnique({
    where: { name: 'Electives' },
  });

  if (!electivesCategory) {
    console.log('❌ Electives category not found. Skipping migration.');
    return;
  }

  // Get all sub-subjects in the Electives category
  const electiveSubSubjects = await prisma.subSubject.findMany({
    where: {
      categoryId: electivesCategory.id,
    },
    include: {
      paces: true,
    },
  });

  let updatedCount = 0;

  for (const subSubject of electiveSubSubjects) {
    for (const pace of subSubject.paces) {
      // Check if pace name needs updating (starts with "Elective" or "Electives")
      const currentName = pace.name;
      const expectedName = `${subSubject.name} ${pace.code}`;

      if (currentName !== expectedName && (currentName.startsWith('Elective') || currentName.startsWith('Electives'))) {
        await prisma.paceCatalog.update({
          where: { id: pace.id },
          data: { name: expectedName },
        });
        updatedCount++;
        console.log(`  ✓ Updated: "${currentName}" -> "${expectedName}"`);
      }
    }
  }

  console.log(`✅ Updated ${updatedCount} elective pace names`);
}

// Run migration
updateElectivePaceNames()
  .catch((error) => {
    console.error('❌ Error updating elective pace names:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


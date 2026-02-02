import dotenv from 'dotenv';
import prisma from '../src/core/infrastructure/database/prisma.client';

dotenv.config();

async function syncProjectionSubjects(projectionId: string): Promise<number> {
  // Get all unique subjects from projectionPaces
  const projectionPaces = await prisma.projectionPace.findMany({
    where: {
      projectionId,
      deletedAt: null,
    },
    include: {
      paceCatalog: {
        select: {
          subjectId: true,
        },
      },
    },
    distinct: ['paceCatalogId'],
  });

  const uniqueSubjectIds = new Set<string>();
  projectionPaces.forEach(pace => {
    if (pace.paceCatalog?.subjectId) {
      uniqueSubjectIds.add(pace.paceCatalog.subjectId);
    }
  });

  if (uniqueSubjectIds.size === 0) {
    return 0;
  }

  // Get existing ProjectionSubjects for this projection
  const existingProjectionSubjects = await prisma.projectionSubject.findMany({
    where: {
      projectionId,
      deletedAt: null,
    },
    select: {
      subjectId: true,
    },
  });

  const existingSubjectIds = new Set(existingProjectionSubjects.map(ps => ps.subjectId));

  // Find subjects that need to be added
  const subjectsToAdd = Array.from(uniqueSubjectIds).filter(subjectId => !existingSubjectIds.has(subjectId));

  if (subjectsToAdd.length === 0) {
    return 0;
  }

  // Create ProjectionSubject records for missing subjects
  await prisma.projectionSubject.createMany({
    data: subjectsToAdd.map(subjectId => ({
      projectionId,
      subjectId,
    })),
    skipDuplicates: true,
  });

  return subjectsToAdd.length;
}

async function main() {
  try {
    console.log('📋 Backfilling ProjectionSubjects from existing ProjectionPaces...\n');

    // Get all projections
    const projections = await prisma.projection.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    console.log(`Found ${projections.length} projection(s) to process...\n`);

    let totalAdded = 0;
    let processed = 0;

    for (let i = 0; i < projections.length; i++) {
      const projection = projections[i];
      console.log(`[${i + 1}/${projections.length}] Processing projection ${projection.id}...`);

      try {
        const added = await syncProjectionSubjects(projection.id);
        if (added > 0) {
          console.log(`  ✅ Added ${added} subject(s)`);
          totalAdded += added;
        } else {
          console.log(`  ✓ Already synced`);
        }
        processed++;
      } catch (error) {
        console.error(`  ❌ Failed: ${error instanceof Error ? error.message : error}`);
      }
    }

    console.log(`\n✅ Done! Processed ${processed}/${projections.length} projections, added ${totalAdded} ProjectionSubject record(s).`);
  } catch (error) {
    console.error('❌ Backfill failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

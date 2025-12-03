import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function backfillProjectionCategories() {
  console.log('🔄 Backfilling projection categories for existing projections...');
  console.log('');

  try {
    // Get all projections
    const projections = await prisma.projection.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        projectionPaces: {
          where: {
            deletedAt: null,
          },
          include: {
            paceCatalog: {
              include: {
                subSubject: {
                  include: {
                    category: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    console.log(`   Found ${projections.length} projections to process`);

    let totalCategoriesAdded = 0;

    for (const projection of projections) {
      // Get unique categories from projection paces
      const categoryIds = new Set<string>();
      
      for (const pace of projection.projectionPaces) {
        const categoryId = pace.paceCatalog.subSubject.category.id;
        categoryIds.add(categoryId);
      }

      // Check which categories are already tracked
      const existingCategories = await prisma.projectionCategory.findMany({
        where: {
          projectionId: projection.id,
        },
        select: {
          categoryId: true,
        },
      });

      const existingCategoryIds = new Set(existingCategories.map(ec => ec.categoryId));
      
      // Add missing categories
      const categoriesToAdd = Array.from(categoryIds).filter(
        categoryId => !existingCategoryIds.has(categoryId)
      );

      if (categoriesToAdd.length > 0) {
        await prisma.projectionCategory.createMany({
          data: categoriesToAdd.map(categoryId => ({
            id: randomUUID(),
            projectionId: projection.id,
            categoryId,
          })),
          skipDuplicates: true,
        });

        totalCategoriesAdded += categoriesToAdd.length;
        console.log(`   ✓ Projection ${projection.id}: Added ${categoriesToAdd.length} categories`);
      } else {
        console.log(`   - Projection ${projection.id}: Already has all categories`);
      }
    }

    console.log('');
    console.log(`✅ Backfill completed! Added ${totalCategoriesAdded} category entries across ${projections.length} projections.`);
  } catch (error) {
    console.error('');
    console.error('❌ Error backfilling projection categories:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

backfillProjectionCategories()
  .catch((e) => {
    console.error('❌ Backfill failed:', e);
    process.exit(1);
  });


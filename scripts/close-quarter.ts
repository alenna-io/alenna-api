/// <reference types="node" />
import prisma from '../src/core/frameworks/database/prisma.client';
import { RedistributeUnfinishedPacesUseCase } from '../src/core/app/use-cases/projections/RedistributeUnfinishedPacesUseCase';

async function closeQuarter(quarterId: string, schoolId: string, userId?: string) {
  try {
    console.log(`Closing quarter ${quarterId} for school ${schoolId}...`);

    // 1. Verify quarter exists
    const quarter = await prisma.quarter.findFirst({
      where: {
        id: quarterId,
        deletedAt: null,
      },
      include: {
        schoolYear: true,
      },
    });

    if (!quarter) {
      throw new Error('Quarter not found');
    }

    if (quarter.schoolYear.schoolId !== schoolId) {
      throw new Error('Quarter does not belong to the specified school');
    }

    if (quarter.isClosed) {
      console.log('Quarter is already closed');
      return;
    }

    // 2. Close the quarter (bypassing grace period check)
    const now = new Date();
    const closedQuarter = await prisma.quarter.update({
      where: { id: quarterId },
      data: {
        isClosed: true,
        closedAt: now,
        closedBy: userId || null,
      },
      include: {
        quarterHolidays: true,
        schoolWeeks: true,
      },
    });

    console.log(`Quarter ${quarter.name} closed successfully at ${now.toISOString()}`);

    // 3. Redistribute unfinished paces
    console.log('Redistributing unfinished paces...');
    const redistributeUseCase = new RedistributeUnfinishedPacesUseCase();
    try {
      await redistributeUseCase.execute(quarterId, schoolId);
      console.log('Unfinished paces redistributed successfully');
    } catch (error) {
      console.error('Error redistributing unfinished paces:', error);
      console.log('Quarter was closed but redistribution failed. You may need to run redistribution manually.');
    }

    console.log('Done!');
  } catch (error) {
    console.error('Error closing quarter:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Get arguments from command line
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: ts-node scripts/close-quarter.ts <quarterId> <schoolId> [userId]');
  console.error('Example: ts-node scripts/close-quarter.ts quarter-123 school-456 user-789');
  process.exit(1);
}

const [quarterId, schoolId, userId] = args;

closeQuarter(quarterId, schoolId, userId)
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });


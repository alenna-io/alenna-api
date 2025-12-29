/// <reference types="node" />
import prisma from '../src/core/frameworks/database/prisma.client';

async function findQuarter(schoolYearName: string, quarterName: string, schoolId?: string) {
  try {
    const where: any = {
      schoolYear: {
        name: schoolYearName,
        deletedAt: null,
      },
      name: quarterName,
      deletedAt: null,
    };

    if (schoolId) {
      where.schoolYear.schoolId = schoolId;
    }

    const quarter = await prisma.quarter.findFirst({
      where,
      include: {
        schoolYear: {
          include: {
            school: true,
          },
        },
      },
    });

    if (!quarter) {
      console.error('Quarter not found');
      console.log(`Looking for: School Year "${schoolYearName}", Quarter "${quarterName}"${schoolId ? `, School "${schoolId}"` : ''}`);
      return;
    }

    console.log('\n=== Quarter Found ===');
    console.log(`Quarter ID: ${quarter.id}`);
    console.log(`Quarter Name: ${quarter.name} (${quarter.displayName})`);
    console.log(`School Year: ${quarter.schoolYear.name}`);
    console.log(`School ID: ${quarter.schoolYear.schoolId}`);
    console.log(`School Name: ${quarter.schoolYear.school?.name || 'N/A'}`);
    console.log(`Start Date: ${quarter.startDate.toISOString()}`);
    console.log(`End Date: ${quarter.endDate.toISOString()}`);
    console.log(`Is Closed: ${quarter.isClosed}`);
    if (quarter.isClosed) {
      console.log(`Closed At: ${quarter.closedAt?.toISOString() || 'N/A'}`);
      console.log(`Closed By: ${quarter.closedBy || 'N/A'}`);
    }
    console.log('\nTo close this quarter, run:');
    console.log(`pnpm tsx scripts/close-quarter.ts ${quarter.id} ${quarter.schoolYear.schoolId}`);
    console.log('\nOr with a user ID:');
    console.log(`pnpm tsx scripts/close-quarter.ts ${quarter.id} ${quarter.schoolYear.schoolId} <userId>`);
  } catch (error) {
    console.error('Error finding quarter:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Get arguments from command line
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: pnpm tsx scripts/find-quarter.ts <schoolYearName> <quarterName> [schoolId]');
  console.error('Example: pnpm tsx scripts/find-quarter.ts "2024-2025" "Q1"');
  console.error('Example: pnpm tsx scripts/find-quarter.ts "2024-2025" "Q1" "school-123"');
  process.exit(1);
}

const [schoolYearName, quarterName, schoolId] = args;

findQuarter(schoolYearName, quarterName, schoolId)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });


import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Ussage
# Create everything from scratch
pnpm school:create --config scripts/school-setup.config.json

# Add to existing school
pnpm school:create --school-id <school-id> --config scripts/school-setup.config.json
 */

const prisma = new PrismaClient();

interface SchoolConfig {
  id?: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

interface AdminUserConfig {
  id?: string;
  clerkId?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
}

interface SchoolYearConfig {
  id?: string;
  name: string;
  startDate: string;
  endDate: string;
}

interface WeekConfig {
  weekNumber: number;
  startDate: string;
  endDate: string;
}

interface HolidayConfig {
  startDate: string;
  endDate: string;
  label?: string;
}

interface QuarterConfig {
  name: string;
  startDate: string;
  endDate: string;
  order: number;
  weeksCount: number;
  weeks: WeekConfig[];
  holidays?: HolidayConfig[];
}

export interface SetupConfig {
  school?: SchoolConfig;
  adminUser: AdminUserConfig;
  schoolYear: SchoolYearConfig;
  quarters: QuarterConfig[];
}

export async function createOrGetSchool(config: SchoolConfig) {
  if (!config.id) {
    const school = await prisma.school.create({
      data: {
        name: config.name,
        address: config.address,
        phone: config.phone,
        email: config.email,
      },
    });
    console.log('✅ Created school:', school.name);
    return school;
  }

  const school = await prisma.school.upsert({
    where: { id: config.id },
    update: {
      name: config.name,
      address: config.address,
      phone: config.phone,
      email: config.email,
    },
    create: {
      id: config.id,
      name: config.name,
      address: config.address,
      phone: config.phone,
      email: config.email,
    },
  });
  console.log('✅ Created/updated school:', school.name);
  return school;
}

export async function ensureSchoolAdminRole() {
  const role = await prisma.role.upsert({
    where: { name: 'SCHOOL_ADMIN' },
    update: {},
    create: {
      name: 'SCHOOL_ADMIN',
      description: 'School administrator with full access',
    },
  });
  return role;
}

export async function createAdminUser(schoolId: string, config: AdminUserConfig) {
  console.log('\n👤 Creating admin user...');

  if (config.id) {
    await prisma.user.deleteMany({
      where: { id: config.id },
    });
    await prisma.user.deleteMany({
      where: { email: config.email },
    });
  }

  const adminUser = await prisma.user.upsert({
    where: { email: config.email },
    update: {
      clerkId: config.clerkId,
      firstName: config.firstName,
      lastName: config.lastName,
      phone: config.phone,
      streetAddress: config.streetAddress,
      city: config.city,
      state: config.state,
      country: config.country,
      zipCode: config.zipCode,
      schoolId,
    },
    create: {
      id: config.id || randomUUID(),
      clerkId: config.clerkId,
      email: config.email,
      firstName: config.firstName,
      lastName: config.lastName,
      phone: config.phone,
      streetAddress: config.streetAddress,
      city: config.city,
      state: config.state,
      country: config.country,
      zipCode: config.zipCode,
      schoolId,
      createdPassword: false,
    },
  });

  console.log('✅ Created/updated admin user:', adminUser.email);
  console.log('   User ID:', adminUser.id);

  const schoolAdminRole = await ensureSchoolAdminRole();

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: schoolAdminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: schoolAdminRole.id,
    },
  });

  console.log('✅ Assigned SCHOOL_ADMIN role to admin user');
  return adminUser;
}

export async function createSchoolYear(schoolId: string, config: SchoolYearConfig) {
  console.log(`\n📅 Creating School Year (${config.name})...`);

  const schoolYear = await prisma.schoolYear.upsert({
    where: {
      id: config.id || `school-year-${config.name}`,
    },
    update: {
      name: config.name,
      startDate: new Date(config.startDate),
      endDate: new Date(config.endDate),
    },
    create: {
      id: config.id || `school-year-${config.name}`,
      schoolId,
      name: config.name,
      startDate: new Date(config.startDate),
      endDate: new Date(config.endDate),
    },
  });

  console.log('✅ Created/updated school year:', schoolYear.name);
  return schoolYear;
}

export async function createQuarters(schoolYearId: string, config: QuarterConfig[]) {
  console.log('\n📅 Creating Quarters...');

  const quarters: Awaited<ReturnType<typeof prisma.quarter.upsert>>[] = [];
  for (const quarterData of config) {
    const quarter = await prisma.quarter.upsert({
      where: {
        schoolYearId_name: {
          schoolYearId,
          name: quarterData.name,
        },
      },
      update: {
        startDate: new Date(quarterData.startDate),
        endDate: new Date(quarterData.endDate),
        order: quarterData.order,
        weeksCount: quarterData.weeksCount,
      },
      create: {
        id: randomUUID(),
        schoolYearId,
        name: quarterData.name,
        startDate: new Date(quarterData.startDate),
        endDate: new Date(quarterData.endDate),
        order: quarterData.order,
        weeksCount: quarterData.weeksCount,
      },
    });
    quarters.push(quarter);
    console.log(`  ✅ Created/updated quarter: ${quarter.name}`);

    for (const weekData of quarterData.weeks) {
      await prisma.schoolWeek.upsert({
        where: {
          quarterId_weekNumber: {
            quarterId: quarter.id,
            weekNumber: weekData.weekNumber,
          },
        },
        update: {
          startDate: new Date(weekData.startDate),
          endDate: new Date(weekData.endDate),
        },
        create: {
          id: randomUUID(),
          quarterId: quarter.id,
          weekNumber: weekData.weekNumber,
          startDate: new Date(weekData.startDate),
          endDate: new Date(weekData.endDate),
        },
      });
    }
    console.log(`    ✅ Created/updated ${quarterData.weeksCount} school weeks for ${quarter.name}`);

    if (quarterData.holidays && quarterData.holidays.length > 0) {
      for (const holidayData of quarterData.holidays) {
        const existingHoliday = await prisma.quarterHoliday.findFirst({
          where: {
            schoolYearId,
            quarterId: quarter.id,
            startDate: new Date(holidayData.startDate),
          },
        });

        if (existingHoliday) {
          await prisma.quarterHoliday.update({
            where: { id: existingHoliday.id },
            data: {
              endDate: new Date(holidayData.endDate),
              label: holidayData.label,
            },
          });
        } else {
          await prisma.quarterHoliday.create({
            data: {
              id: randomUUID(),
              schoolYearId,
              quarterId: quarter.id,
              startDate: new Date(holidayData.startDate),
              endDate: new Date(holidayData.endDate),
              label: holidayData.label,
            },
          });
        }
      }
      console.log(`    ✅ Created/updated ${quarterData.holidays.length} holiday(s) for ${quarter.name}`);
    }
  }

  console.log(`✅ Created/updated ${quarters.length} quarters with school weeks`);
  return quarters;
}

export async function createSchoolSetup(schoolId: string | undefined, config: SetupConfig) {
  console.log('🌱 Setting up school...\n');

  let school;
  if (schoolId) {
    school = await prisma.school.findUnique({
      where: { id: schoolId },
    });
    if (!school) {
      throw new Error(`School with ID ${schoolId} not found`);
    }
    console.log('✅ Found existing school:', school.name);
  } else if (config.school) {
    school = await createOrGetSchool(config.school);
  } else {
    throw new Error('Either schoolId or school config must be provided');
  }

  await ensureSchoolAdminRole();

  const adminUser = await createAdminUser(school.id, config.adminUser);

  const schoolYear = await createSchoolYear(school.id, config.schoolYear);

  const quarters = await createQuarters(schoolYear.id, config.quarters);

  console.log('');
  console.log('✅ School setup completed!');
  console.log('');
  console.log('📝 School ID:', school.id);
  console.log('   School Year ID:', schoolYear.id);
  console.log('   Admin User ID:', adminUser.id);
  console.log('');

  return {
    school,
    adminUser,
    schoolYear,
    quarters,
  };
}

export async function disconnect() {
  await prisma.$disconnect();
}

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { seedPaceCatalog } from './seed-pace-catalog';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // First, seed the PACE catalog (Categories, Levels, Subjects, PACEs)
  await seedPaceCatalog();
  console.log('');

  // Create demo school
  const school = await prisma.school.upsert({
    where: { id: 'demo-school' },
    update: {},
    create: {
      id: 'demo-school',
      name: 'Demo Academy',
      address: '123 Education Street, Learning City',
      phone: '+1 (555) 123-4567',
      email: 'admin@demoacademy.edu',
    },
  });

  console.log('✅ Created school:', school.name);

  // Create Roles
  console.log('\n🔐 Creating roles...');
  const schoolAdminRole = await prisma.role.upsert({
    where: { name: 'SCHOOL_ADMIN' },
    update: {},
    create: {
      name: 'SCHOOL_ADMIN',
      description: 'School administrator with full access',
    },
  });
  console.log('✅ Created role: SCHOOL_ADMIN');

  const studentRole = await prisma.role.upsert({
    where: { name: 'STUDENT' },
    update: {},
    create: {
      name: 'STUDENT',
      description: 'Student user with limited access',
    },
  });
  console.log('✅ Created role: STUDENT');

  // Create Admin User
  console.log('\n👤 Creating admin user...');
  const clerkUserId = 'user_33skKBEkI8wMg70KnEwHwrjVP93';

  // Delete existing user if it exists with wrong ID
  await prisma.user.deleteMany({
    where: { email: 'demo.admin@alenna.io' },
  });

  const adminUser = await prisma.user.create({
    data: {
      id: "2b108fa4-0c11-43e1-9162-471024f19bdf", // Use a fixed ID instead of clerkUserId
      clerkId: clerkUserId,
      email: 'demo.admin@alenna.io',
      firstName: 'Admin',
      lastName: 'User',
      phone: '+1 (555) 000-0000',
      streetAddress: '123 Admin Street',
      city: 'Admin City',
      state: 'AC',
      country: 'USA',
      zipCode: '00000',
      schoolId: school.id,
      createdPassword: false,
    },
  });
  console.log('✅ Created admin user:', adminUser.email);
  console.log('   User ID:', adminUser.id);

  // Assign SCHOOL_ADMIN role to admin user
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

  // Create School Year
  console.log('\n📅 Creating School Year (2025-2026)...');
  const schoolYear = await prisma.schoolYear.upsert({
    where: {
      id: 'school-year-2025-2026',
    },
    update: {},
    create: {
      id: 'school-year-2025-2026',
      schoolId: school.id,
      name: '2025-2026',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-07-11'),
    },
  });

  console.log('✅ Created school year:', schoolYear.name);

  // Create Quarters
  console.log('\n📅 Creating Quarters...');
  const quartersData = [
    {
      name: 'Q1',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2025-11-07'),
      order: 1,
      weeksCount: 9,
      weeks: [
        { weekNumber: 1, startDate: '2025-09-01', endDate: '2025-09-12' },
        { weekNumber: 2, startDate: '2025-09-15', endDate: '2025-09-19' },
        { weekNumber: 3, startDate: '2025-09-22', endDate: '2025-09-26' },
        { weekNumber: 4, startDate: '2025-09-29', endDate: '2025-10-03' },
        { weekNumber: 5, startDate: '2025-10-06', endDate: '2025-10-10' },
        { weekNumber: 6, startDate: '2025-10-13', endDate: '2025-10-17' },
        { weekNumber: 7, startDate: '2025-10-20', endDate: '2025-10-24' },
        { weekNumber: 8, startDate: '2025-10-27', endDate: '2025-10-31' },
        { weekNumber: 9, startDate: '2025-11-03', endDate: '2025-11-07' },
      ],
    },
    {
      name: 'Q2',
      startDate: new Date('2025-11-10'),
      endDate: new Date('2026-02-06'),
      order: 2,
      weeksCount: 9,
      weeks: [
        { weekNumber: 1, startDate: '2025-11-10', endDate: '2025-11-21' },
        { weekNumber: 2, startDate: '2025-11-24', endDate: '2025-11-28' },
        { weekNumber: 3, startDate: '2025-12-01', endDate: '2025-12-05' },
        { weekNumber: 4, startDate: '2025-12-08', endDate: '2025-12-12' },
        { weekNumber: 5, startDate: '2025-12-15', endDate: '2025-12-18' },
        { weekNumber: 6, startDate: '2026-01-12', endDate: '2026-01-16' },
        { weekNumber: 7, startDate: '2026-01-19', endDate: '2026-01-23' },
        { weekNumber: 8, startDate: '2026-01-26', endDate: '2026-01-30' },
        { weekNumber: 9, startDate: '2026-02-02', endDate: '2026-02-06' },
      ],
      holidays: [
        { startDate: '2025-12-19', endDate: '2026-01-10', label: 'Winter Break' },
      ],
    },
    {
      name: 'Q3',
      startDate: new Date('2026-02-09'),
      endDate: new Date('2026-04-28'),
      order: 3,
      weeksCount: 9,
      weeks: [
        { weekNumber: 1, startDate: '2026-02-09', endDate: '2026-02-13' },
        { weekNumber: 2, startDate: '2026-02-16', endDate: '2026-02-20' },
        { weekNumber: 3, startDate: '2026-02-23', endDate: '2026-02-27' },
        { weekNumber: 4, startDate: '2026-03-02', endDate: '2026-03-06' },
        { weekNumber: 5, startDate: '2026-03-09', endDate: '2026-03-13' },
        { weekNumber: 6, startDate: '2026-03-16', endDate: '2026-03-20' },
        { weekNumber: 7, startDate: '2026-03-23', endDate: '2026-03-27' },
        { weekNumber: 8, startDate: '2026-04-13', endDate: '2026-04-18' },
        { weekNumber: 9, startDate: '2026-04-20', endDate: '2026-04-28' },
      ],
      holidays: [
        { startDate: '2026-03-30', endDate: '2026-04-10', label: 'Spring Break' },
      ],
    },
    {
      name: 'Q4',
      startDate: new Date('2026-04-29'),
      endDate: new Date('2026-07-11'),
      order: 4,
      weeksCount: 9,
      weeks: [
        { weekNumber: 1, startDate: '2026-04-29', endDate: '2026-05-08' },
        { weekNumber: 2, startDate: '2026-05-11', endDate: '2026-05-15' },
        { weekNumber: 3, startDate: '2026-05-18', endDate: '2026-05-22' },
        { weekNumber: 4, startDate: '2026-05-25', endDate: '2026-05-29' },
        { weekNumber: 5, startDate: '2026-06-01', endDate: '2026-06-05' },
        { weekNumber: 6, startDate: '2026-06-08', endDate: '2026-06-12' },
        { weekNumber: 7, startDate: '2026-06-15', endDate: '2026-06-19' },
        { weekNumber: 8, startDate: '2026-06-22', endDate: '2026-06-27' },
        { weekNumber: 9, startDate: '2026-06-29', endDate: '2026-07-10' },
      ],
    },
  ];

  const quarters = [];
  for (const quarterData of quartersData) {
    const quarter = await prisma.quarter.upsert({
      where: {
        schoolYearId_name: {
          schoolYearId: schoolYear.id,
          name: quarterData.name,
        },
      },
      update: {},
      create: {
        id: randomUUID(),
        schoolYearId: schoolYear.id,
        name: quarterData.name,
        startDate: quarterData.startDate,
        endDate: quarterData.endDate,
        order: quarterData.order,
        weeksCount: quarterData.weeksCount,
      },
    });
    quarters.push(quarter);
    console.log(`  ✅ Created quarter: ${quarter.name}`);

    // Create School Weeks for this quarter with exact dates
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
    console.log(`    ✅ Created ${quarterData.weeksCount} school weeks for ${quarter.name}`);

    // Create holidays for this quarter if they exist
    if (quarterData.holidays) {
      for (const holidayData of quarterData.holidays) {
        const existingHoliday = await prisma.quarterHoliday.findFirst({
          where: {
            schoolYearId: schoolYear.id,
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
              schoolYearId: schoolYear.id,
              quarterId: quarter.id,
              startDate: new Date(holidayData.startDate),
              endDate: new Date(holidayData.endDate),
              label: holidayData.label,
            },
          });
        }
      }
      console.log(`    ✅ Created ${quarterData.holidays.length} holiday(s) for ${quarter.name}`);
    }
  }

  console.log(`✅ Created ${quarters.length} quarters with school weeks`);

  // Create demo students (users as students)
  console.log('\n👥 Creating students...');

  const studentsData = [
    {
      firstName: 'María',
      lastName: 'González López',
      email: 'maria.gonzalez@demo.alenna.io',
      phone: '+52 555 123 4567',
      streetAddress: 'Calle Principal 123',
      city: 'Ciudad de México',
      state: 'CDMX',
      country: 'Mexico',
      zipCode: '06000',
    },
    {
      firstName: 'José Antonio',
      lastName: 'Rodríguez',
      email: 'jose.rodriguez@demo.alenna.io',
      phone: '+52 555 987 6543',
      streetAddress: 'Av. Libertad 456',
      city: 'Guadalajara',
      state: 'Jalisco',
      country: 'Mexico',
      zipCode: '44100',
    },
    {
      firstName: 'Sofía',
      lastName: 'Hernández Martínez',
      email: 'sofia.hernandez@demo.alenna.io',
      phone: '+52 555 456 7890',
      streetAddress: 'Calle Reforma 789',
      city: 'Monterrey',
      state: 'Nuevo León',
      country: 'Mexico',
      zipCode: '64000',
    },
    {
      firstName: 'Diego Fernando',
      lastName: 'Silva',
      email: 'diego.silva@demo.alenna.io',
      phone: '+52 555 321 0987',
      streetAddress: 'Blvd. Universidad 321',
      city: 'Puebla',
      state: 'Puebla',
      country: 'Mexico',
      zipCode: '72000',
    },
    {
      firstName: 'Camila',
      lastName: 'Jiménez Flores',
      email: 'camila.jimenez@demo.alenna.io',
      phone: '+52 555 234 5678',
      streetAddress: 'Calle Morelos 234',
      city: 'Mérida',
      state: 'Yucatán',
      country: 'Mexico',
      zipCode: '97000',
    },
  ];

  for (const studentData of studentsData) {
    const studentId = randomUUID();

    // Create User account for student
    const studentUser = await prisma.user.upsert({
      where: { email: studentData.email },
      update: {},
      create: {
        id: randomUUID(),
        clerkId: `student_${studentId}_clerk`,
        email: studentData.email,
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        phone: studentData.phone,
        streetAddress: studentData.streetAddress,
        city: studentData.city,
        state: studentData.state,
        country: studentData.country,
        zipCode: studentData.zipCode,
        schoolId: school.id,
        createdPassword: false,
      },
    });

    // Create Student record
    await prisma.student.upsert({
      where: { userId: studentUser.id },
      update: {},
      create: {
        id: studentId,
        userId: studentUser.id,
        schoolId: school.id,
      },
    });

    // Assign STUDENT role
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: studentUser.id,
          roleId: studentRole.id,
        },
      },
      update: {},
      create: {
        userId: studentUser.id,
        roleId: studentRole.id,
      },
    });

    console.log(`  ✅ Created student: ${studentUser.firstName} ${studentUser.lastName}`);
  }

  console.log('');
  console.log('✅ Seeding completed!');
  console.log('');
  console.log('📝 Demo school ID:', school.id);
  console.log('   School Year ID:', schoolYear.id);
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  })

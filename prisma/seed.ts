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
      endDate: new Date('2025-11-09'),
      order: 1,
      weeksCount: 9,
    },
    {
      name: 'Q2',
      startDate: new Date('2025-11-10'),
      endDate: new Date('2026-02-08'),
      order: 2,
      weeksCount: 9,
    },
    {
      name: 'Q3',
      startDate: new Date('2026-02-09'),
      endDate: new Date('2026-04-28'),
      order: 3,
      weeksCount: 9,
    },
    {
      name: 'Q4',
      startDate: new Date('2026-04-29'),
      endDate: new Date('2026-07-11'),
      order: 4,
      weeksCount: 9,
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

    // Create School Weeks for this quarter
    // Generate weeks starting from the quarter start date, aligned to Monday-Sunday
    let currentDate = new Date(quarterData.startDate);

    // Find the first Monday on or before the start date
    const startDay = currentDate.getDay();
    const daysToMonday = startDay === 0 ? 6 : startDay - 1;
    currentDate.setDate(currentDate.getDate() - daysToMonday);

    for (let weekNum = 1; weekNum <= quarterData.weeksCount; weekNum++) {
      const weekStart = new Date(currentDate);
      const weekEnd = new Date(currentDate);
      weekEnd.setDate(weekEnd.getDate() + 6); // Sunday

      // Ensure week doesn't exceed quarter boundaries
      if (weekStart < quarterData.startDate) {
        weekStart.setTime(quarterData.startDate.getTime());
      }
      if (weekEnd > quarterData.endDate) {
        weekEnd.setTime(quarterData.endDate.getTime());
      }

      await prisma.schoolWeek.upsert({
        where: {
          quarterId_weekNumber: {
            quarterId: quarter.id,
            weekNumber: weekNum,
          },
        },
        update: {},
        create: {
          id: randomUUID(),
          quarterId: quarter.id,
          weekNumber: weekNum,
          startDate: weekStart,
          endDate: weekEnd,
        },
      });

      // Move to next Monday
      currentDate.setDate(currentDate.getDate() + 7);
    }
    console.log(`    ✅ Created ${quarterData.weeksCount} school weeks for ${quarter.name}`);
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

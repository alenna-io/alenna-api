import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo school
  const school = await prisma.school.upsert({
    where: { id: 'demo-school' },
    update: {},
    create: {
      id: 'demo-school',
      name: 'Demo Grace Christian Academy',
      address: '123 Education Street, Learning City',
      phone: '+1 (555) 123-4567',
      email: 'admin@demoacademy.edu',
    },
  });

  console.log('✅ Created school:', school.name);

  // Create demo user (admin/teacher)
  const user = await prisma.user.upsert({
    where: { clerkId: 'user_33skKBEkI8wMg70KnEwHwrjVP93' },
    update: {},
    create: {
      clerkId: 'user_33skKBEkI8wMg70KnEwHwrjVP93',
      email: 'sergio@alenna.io',
      firstName: 'Demo',
      lastName: 'User',
      role: 'ADMIN',
      schoolId: school.id,
    },
  });

  console.log('✅ Created user:', user.email);
  console.log('   Clerk ID:', user.clerkId);
  console.log('   ⚠️  Replace this with your actual Clerk user ID!');

  // Create demo students
  const students = [
    {
      firstName: 'María',
      lastName: 'González López',
      age: 15,
      birthDate: new Date('2009-03-15'),
      certificationType: 'INEA',
      graduationDate: new Date('2025-06-15'),
      contactPhone: '+52 555 123 4567',
      isLeveled: true,
      expectedLevel: 'Secundaria',
      address: 'Calle Principal 123, Colonia Centro, Ciudad de México',
      schoolId: school.id,
    },
    {
      firstName: 'José Antonio',
      lastName: 'Rodríguez',
      age: 14,
      birthDate: new Date('2010-07-22'),
      certificationType: 'Grace Christian',
      graduationDate: new Date('2025-06-15'),
      contactPhone: '+52 555 987 6543',
      isLeveled: false,
      address: 'Av. Libertad 456, Colonia Norte, Guadalajara',
      schoolId: school.id,
    },
    {
      firstName: 'Sofía',
      lastName: 'Hernández Martínez',
      age: 16,
      birthDate: new Date('2008-11-08'),
      certificationType: 'Home Life',
      graduationDate: new Date('2025-06-15'),
      contactPhone: '+52 555 456 7890',
      isLeveled: true,
      expectedLevel: 'Preparatoria',
      address: 'Calle Reforma 789, Colonia Sur, Monterrey',
      schoolId: school.id,
    },
  ];

  for (const studentData of students) {
    const student = await prisma.student.upsert({
      where: { 
        id: `demo-${studentData.firstName.toLowerCase()}-${studentData.lastName.toLowerCase().replace(/\s+/g, '-')}` 
      },
      update: {},
      create: {
        id: `demo-${studentData.firstName.toLowerCase()}-${studentData.lastName.toLowerCase().replace(/\s+/g, '-')}`,
        ...studentData,
      },
    });
    console.log('✅ Created student:', student.firstName, student.lastName);
  }

  // Create demo parents
  const maria = await prisma.student.findFirst({
    where: { firstName: 'María', schoolId: school.id },
  });

  if (maria) {
    await prisma.parent.createMany({
      data: [
        { name: 'Carlos González', studentId: maria.id },
        { name: 'Ana López', studentId: maria.id },
      ],
      skipDuplicates: true,
    });
    console.log('✅ Created parents for María');
  }

  console.log('✅ Seeding completed!');
  console.log('');
  console.log('📝 Demo school ID:', school.id);
  console.log('   Use this ID when syncing users from Clerk');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


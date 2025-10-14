import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

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

  // Clear existing students first (cascade deletes projections, paces, daily goals, parents)
  await prisma.student.deleteMany({ where: { schoolId: school.id } });

  // Clear existing certification types
  await prisma.certificationType.deleteMany({ where: { schoolId: school.id } });

  // Create certification types for the school
  const certificationTypesData = [
    { name: 'INEA', description: 'Instituto Nacional para la Educación de los Adultos' },
    { name: 'Grace Christian', description: 'Grace Christian School Program' },
    { name: 'Home Life', description: 'Home Life Academy Program' },
    { name: 'Lighthouse', description: 'Lighthouse Christian Academy' },
    { name: 'Otro', description: 'Other certification programs' },
  ];

  const certificationTypes = await Promise.all(
    certificationTypesData.map(async (certType) =>
      prisma.certificationType.create({
        data: {
          id: randomUUID(),
          name: certType.name,
          description: certType.description,
          schoolId: school.id,
          isActive: true,
        },
      })
    )
  );

  console.log('✅ Created certification types:', certificationTypes.map(c => c.name).join(', '));

  // Helper to find certification type by name
  const getCertTypeId = (name: string) => {
    const certType = certificationTypes.find(c => c.name === name);
    if (!certType) throw new Error(`Certification type ${name} not found`);
    return certType.id;
  };

  // Create demo students
  const studentsData = [
    {
      firstName: 'María',
      lastName: 'González López',
      age: 15,
      birthDate: new Date('2009-03-15'),
      certificationTypeName: 'INEA',
      graduationDate: new Date('2025-06-15'),
      contactPhone: '+52 555 123 4567',
      isLeveled: true,
      expectedLevel: 'Secundaria',
      address: 'Calle Principal 123, Colonia Centro, Ciudad de México',
      parents: ['Carlos González', 'Ana López'],
    },
    {
      firstName: 'José Antonio',
      lastName: 'Rodríguez',
      age: 14,
      birthDate: new Date('2010-07-22'),
      certificationTypeName: 'Grace Christian',
      graduationDate: new Date('2025-06-15'),
      contactPhone: '+52 555 987 6543',
      isLeveled: false,
      address: 'Av. Libertad 456, Colonia Norte, Guadalajara',
      parents: ['María Rodríguez'],
    },
    {
      firstName: 'Sofía',
      lastName: 'Hernández Martínez',
      age: 16,
      birthDate: new Date('2008-11-08'),
      certificationTypeName: 'Home Life',
      graduationDate: new Date('2025-06-15'),
      contactPhone: '+52 555 456 7890',
      isLeveled: true,
      expectedLevel: 'Preparatoria',
      address: 'Calle Reforma 789, Colonia Sur, Monterrey',
      parents: ['Roberto Hernández', 'Carmen Martínez'],
    },
    {
      firstName: 'Diego Fernando',
      lastName: 'Silva',
      age: 13,
      birthDate: new Date('2011-01-30'),
      certificationTypeName: 'Lighthouse',
      graduationDate: new Date('2026-06-15'),
      contactPhone: '+52 555 321 0987',
      isLeveled: true,
      expectedLevel: 'Primaria',
      address: 'Blvd. Universidad 321, Colonia Este, Puebla',
      parents: ['Patricia Silva'],
    },
    {
      firstName: 'Camila',
      lastName: 'Jiménez Flores',
      age: 16,
      birthDate: new Date('2008-02-14'),
      certificationTypeName: 'Grace Christian',
      graduationDate: new Date('2025-06-15'),
      contactPhone: '+52 555 234 5678',
      isLeveled: true,
      expectedLevel: 'Preparatoria',
      address: 'Calle Morelos 234, Colonia Sur, Mérida',
      parents: ['Sandra Jiménez', 'Roberto Flores'],
    },
  ];

  for (const studentData of studentsData) {
    const { certificationTypeName, parents, ...restData } = studentData;
    const studentId = randomUUID();
    
    const student = await prisma.student.create({
      data: {
        id: studentId,
        ...restData,
        certificationTypeId: getCertTypeId(certificationTypeName),
        schoolId: school.id,
      },
    });
    
    console.log('✅ Created student:', student.firstName, student.lastName);

    // Add parents
    if (parents && parents.length > 0) {
      await prisma.parent.createMany({
        data: parents.map(name => ({
          id: randomUUID(),
          name,
          studentId: student.id,
        })),
      });
      console.log(`   ✅ Added ${parents.length} parent(s)`);
    }

    // Create a projection for this student (2024-2025 school year)
    const projection = await prisma.projection.create({
      data: {
        id: randomUUID(),
        studentId: student.id,
        schoolYear: '2024-2025',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2025-06-30'),
        isActive: true,
        notes: 'Initial projection for 2024-2025 school year',
      },
    });
    console.log(`   ✅ Created projection: ${projection.schoolYear}`);
  }

  console.log('✅ Seeding completed!');
  console.log('');
  console.log('📝 Demo school ID:', school.id);
  console.log('   Use this ID when syncing users from Clerk');
  console.log('');
  console.log('📊 Database Summary:');
  console.log(`   - ${certificationTypes.length} certification types`);
  console.log(`   - ${studentsData.length} students`);
  console.log(`   - ${studentsData.length} projections`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

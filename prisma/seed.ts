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
    {
      firstName: 'Diego Fernando',
      lastName: 'Silva',
      age: 13,
      birthDate: new Date('2011-01-30'),
      certificationType: 'Lighthouse',
      graduationDate: new Date('2026-06-15'),
      contactPhone: '+52 555 321 0987',
      isLeveled: true,
      expectedLevel: 'Primaria',
      address: 'Blvd. Universidad 321, Colonia Este, Puebla',
      schoolId: school.id,
    },
    {
      firstName: 'Valentina',
      lastName: 'Cruz Morales',
      age: 15,
      birthDate: new Date('2009-05-14'),
      certificationType: 'Otro',
      graduationDate: new Date('2025-06-15'),
      contactPhone: '+52 555 654 3210',
      isLeveled: false,
      address: 'Calle Independencia 654, Colonia Oeste, Tijuana',
      schoolId: school.id,
    },
    {
      firstName: 'Andrés',
      lastName: 'Ramírez Torres',
      age: 14,
      birthDate: new Date('2010-09-20'),
      certificationType: 'INEA',
      graduationDate: new Date('2025-06-15'),
      contactPhone: '+52 555 789 0123',
      isLeveled: true,
      expectedLevel: 'Secundaria',
      address: 'Av. Juárez 890, Colonia Centro, Querétaro',
      schoolId: school.id,
    },
    {
      firstName: 'Camila',
      lastName: 'Jiménez Flores',
      age: 16,
      birthDate: new Date('2008-02-14'),
      certificationType: 'Grace Christian',
      graduationDate: new Date('2025-06-15'),
      contactPhone: '+52 555 234 5678',
      isLeveled: true,
      expectedLevel: 'Preparatoria',
      address: 'Calle Morelos 234, Colonia Sur, Mérida',
      schoolId: school.id,
    },
    {
      firstName: 'Mateo',
      lastName: 'García Mendoza',
      age: 13,
      birthDate: new Date('2011-06-18'),
      certificationType: 'Lighthouse',
      graduationDate: new Date('2026-06-15'),
      contactPhone: '+52 555 345 6789',
      isLeveled: false,
      address: 'Blvd. Insurgentes 345, Colonia Norte, León',
      schoolId: school.id,
    },
    {
      firstName: 'Isabella',
      lastName: 'Vargas Sánchez',
      age: 15,
      birthDate: new Date('2009-11-25'),
      certificationType: 'Home Life',
      graduationDate: new Date('2025-06-15'),
      contactPhone: '+52 555 456 7890',
      isLeveled: true,
      expectedLevel: 'Secundaria',
      address: 'Calle Hidalgo 456, Colonia Centro, Toluca',
      schoolId: school.id,
    },
    {
      firstName: 'Santiago',
      lastName: 'Ortiz Ruiz',
      age: 14,
      birthDate: new Date('2010-04-30'),
      certificationType: 'INEA',
      graduationDate: new Date('2025-06-15'),
      contactPhone: '+52 555 567 8901',
      isLeveled: false,
      address: 'Av. Constitución 567, Colonia Este, Aguascalientes',
      schoolId: school.id,
    },
    {
      firstName: 'Lucía',
      lastName: 'Morales Castro',
      age: 16,
      birthDate: new Date('2008-08-12'),
      certificationType: 'Grace Christian',
      graduationDate: new Date('2025-06-15'),
      contactPhone: '+52 555 678 9012',
      isLeveled: true,
      expectedLevel: 'Preparatoria',
      address: 'Calle Zaragoza 678, Colonia Oeste, Chihuahua',
      schoolId: school.id,
    },
    {
      firstName: 'Sebastián',
      lastName: 'López Reyes',
      age: 13,
      birthDate: new Date('2011-12-05'),
      certificationType: 'Otro',
      graduationDate: new Date('2026-06-15'),
      contactPhone: '+52 555 789 0123',
      isLeveled: true,
      expectedLevel: 'Primaria',
      address: 'Av. Revolución 789, Colonia Sur, Culiacán',
      schoolId: school.id,
    },
    {
      firstName: 'Emilia',
      lastName: 'Fernández Guzmán',
      age: 15,
      birthDate: new Date('2009-03-22'),
      certificationType: 'Lighthouse',
      graduationDate: new Date('2025-06-15'),
      contactPhone: '+52 555 890 1234',
      isLeveled: false,
      address: 'Calle Madero 890, Colonia Centro, Morelia',
      schoolId: school.id,
    },
    {
      firstName: 'Nicolás',
      lastName: 'Pérez Navarro',
      age: 14,
      birthDate: new Date('2010-10-08'),
      certificationType: 'Home Life',
      graduationDate: new Date('2025-06-15'),
      contactPhone: '+52 555 901 2345',
      isLeveled: true,
      expectedLevel: 'Secundaria',
      address: 'Blvd. López Mateos 901, Colonia Norte, Hermosillo',
      schoolId: school.id,
    },
    {
      firstName: 'Valeria',
      lastName: 'Romero Delgado',
      age: 16,
      birthDate: new Date('2008-05-17'),
      certificationType: 'INEA',
      graduationDate: new Date('2025-06-15'),
      contactPhone: '+52 555 012 3456',
      isLeveled: true,
      expectedLevel: 'Preparatoria',
      address: 'Calle Allende 012, Colonia Este, Saltillo',
      schoolId: school.id,
    },
  ];

  // Clear existing students and parents for clean seed
  await prisma.parent.deleteMany({ where: { student: { schoolId: school.id } } });
  await prisma.student.deleteMany({ where: { schoolId: school.id } });

  for (const studentData of students) {
    const studentId = randomUUID();
    const student = await prisma.student.create({
      data: {
        id: studentId,
        ...studentData,
      },
    });
    console.log('✅ Created student:', student.firstName, student.lastName);

    // Add parents for specific students
    if (student.firstName === 'María' && student.lastName === 'González López') {
      await prisma.parent.createMany({
        data: [
          { id: randomUUID(), name: 'Carlos González', studentId: student.id },
          { id: randomUUID(), name: 'Ana López', studentId: student.id },
        ],
      });
      console.log('   ✅ Added parents for María');
    } else if (student.firstName === 'Sofía' && student.lastName === 'Hernández Martínez') {
      await prisma.parent.createMany({
        data: [
          { id: randomUUID(), name: 'Roberto Hernández', studentId: student.id },
          { id: randomUUID(), name: 'Carmen Martínez', studentId: student.id },
        ],
      });
      console.log('   ✅ Added parents for Sofía');
    } else if (student.firstName === 'Camila' && student.lastName === 'Jiménez Flores') {
      await prisma.parent.createMany({
        data: [
          { id: randomUUID(), name: 'Sandra Jiménez', studentId: student.id },
          { id: randomUUID(), name: 'Roberto Flores', studentId: student.id },
        ],
      });
      console.log('   ✅ Added parents for Camila');
    }
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


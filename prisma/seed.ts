import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { seedPaceCatalog } from './seed-pace-catalog';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // First, seed the PACE catalog (Categories, Levels, SubSubjects, PACEs)
  await seedPaceCatalog();
  console.log('');

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
      currentLevel: 'L8',
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
      currentLevel: 'L7',
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
      currentLevel: 'L10',
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
      currentLevel: 'L5',
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
      currentLevel: 'L11',
      address: 'Calle Morelos 234, Colonia Sur, Mérida',
      parents: ['Sandra Jiménez', 'Roberto Flores'],
    },
  ];

  for (const studentData of studentsData) {
    const { certificationTypeName, parents, currentLevel, ...restData } = studentData;
    const studentId = randomUUID();
    
    const student = await prisma.student.create({
      data: {
        id: studentId,
        ...restData,
        currentLevel: (currentLevel as string | undefined),
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

    // Add sample ProjectionPaces for María (L8 student)
    if (student.firstName === 'María' && student.lastName === 'González López') {
      console.log('   🎯 Adding sample projection PACEs for María (L8)...');
      
      let projectionPacesCreated = 0;

      // Get L8 subsubjects for each category
      const getSubSubjectPaces = async (categoryName: string) => {
        const subSubject = await prisma.subSubject.findFirst({
          where: {
            levelId: 'L8',
            category: { name: categoryName },
          },
          include: {
            paces: {
              orderBy: { code: 'asc' },
            },
          },
        });
        return subSubject?.paces || [];
      };

      const mathPaces = await getSubSubjectPaces('Math');
      const englishPaces = await getSubSubjectPaces('English');
      const sciencePaces = await getSubSubjectPaces('Science');
      const socialStudiesPaces = await getSubSubjectPaces('Social Studies');
      const wordBuildingPaces = await getSubSubjectPaces('Word Building');
      const spanishPaces = await getSubSubjectPaces('Spanish');

      // Pattern: Week 1,4,7 = Math+English | Week 2,5,8 = Science+Social | Week 3,6,9 = Word+Spanish
      // Each quarter progresses sequentially (Q1 uses 1085-1087, Q2 uses 1088-1090, etc.)
      const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
      const pacesPerQuarter = 3; // 3 PACEs per subject per quarter (weeks 1,4,7 or 2,5,8 or 3,6,9)
      
      for (let quarterIndex = 0; quarterIndex < quarters.length; quarterIndex++) {
        const quarter = quarters[quarterIndex];
        
        // Calculate which PACEs to use (sequential progression)
        const startPaceIndex = quarterIndex * pacesPerQuarter; // Q1=0, Q2=3, Q3=6, Q4=9
        
        const quarterSchedule = [
          // Week 1: Math, English
          { week: 1, subjects: [
            { paces: mathPaces, paceIndex: startPaceIndex },
            { paces: englishPaces, paceIndex: startPaceIndex }
          ]},
          // Week 2: Science, Social Studies
          { week: 2, subjects: [
            { paces: sciencePaces, paceIndex: startPaceIndex },
            { paces: socialStudiesPaces, paceIndex: startPaceIndex }
          ]},
          // Week 3: Word Building, Spanish
          { week: 3, subjects: [
            { paces: wordBuildingPaces, paceIndex: startPaceIndex },
            { paces: spanishPaces, paceIndex: startPaceIndex }
          ]},
          // Week 4: Math, English
          { week: 4, subjects: [
            { paces: mathPaces, paceIndex: startPaceIndex + 1 },
            { paces: englishPaces, paceIndex: startPaceIndex + 1 }
          ]},
          // Week 5: Science, Social Studies
          { week: 5, subjects: [
            { paces: sciencePaces, paceIndex: startPaceIndex + 1 },
            { paces: socialStudiesPaces, paceIndex: startPaceIndex + 1 }
          ]},
          // Week 6: Word Building, Spanish
          { week: 6, subjects: [
            { paces: wordBuildingPaces, paceIndex: startPaceIndex + 1 },
            { paces: spanishPaces, paceIndex: startPaceIndex + 1 }
          ]},
          // Week 7: Math, English
          { week: 7, subjects: [
            { paces: mathPaces, paceIndex: startPaceIndex + 2 },
            { paces: englishPaces, paceIndex: startPaceIndex + 2 }
          ]},
          // Week 8: Science, Social Studies
          { week: 8, subjects: [
            { paces: sciencePaces, paceIndex: startPaceIndex + 2 },
            { paces: socialStudiesPaces, paceIndex: startPaceIndex + 2 }
          ]},
          // Week 9: Word Building, Spanish
          { week: 9, subjects: [
            { paces: wordBuildingPaces, paceIndex: startPaceIndex + 2 },
            { paces: spanishPaces, paceIndex: startPaceIndex + 2 }
          ]},
        ];

        for (const schedule of quarterSchedule) {
          for (const subjectData of schedule.subjects) {
            const pace = subjectData.paces[subjectData.paceIndex];
            if (!pace) continue;

            // Only add grades for Q1 (completed quarter)
            const isCompleted = quarter === 'Q1';
            const grade = isCompleted ? Math.floor(Math.random() * 21) + 80 : null;

            const projectionPace = await prisma.projectionPace.create({
              data: {
                id: randomUUID(),
                projectionId: projection.id,
                paceCatalogId: pace.id,
                quarter,
                week: schedule.week,
                grade,
                isCompleted,
                isFailed: false,
                comments: isCompleted ? 'Completed successfully' : undefined,
              },
            });

            // Add grade history for completed PACEs in Q1
            if (isCompleted) {
              // 30% chance of retake
              if (Math.random() > 0.7) {
                await prisma.gradeHistory.create({
                  data: {
                    id: randomUUID(),
                    projectionPaceId: projectionPace.id,
                    grade: Math.floor(Math.random() * 15) + 65,
                    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    note: 'Primera vez - necesita repasar',
                  },
                });
              }

              await prisma.gradeHistory.create({
                data: {
                  id: randomUUID(),
                  projectionPaceId: projectionPace.id,
                  grade: grade!,
                  date: new Date(),
                  note: grade! >= 90 ? 'Excelente trabajo' : undefined,
                },
              });
            }

            projectionPacesCreated++;
          }
        }
      }

      console.log(`   ✅ Created ${projectionPacesCreated} projection PACEs across all 4 quarters`);
    }
  }

  console.log('');
  console.log('✅ Seeding completed!');
  console.log('');
  console.log('📝 Demo school ID:', school.id);
  console.log('   Use this ID when syncing users from Clerk');
  console.log('');
  console.log('📊 Database Summary:');
  console.log(`   - 8 categories`);
  console.log(`   - 13 levels (L1-L12 + Electives)`);
  console.log(`   - ${certificationTypes.length} certification types`);
  console.log(`   - ${studentsData.length} students with current levels`);
  console.log(`   - ${studentsData.length} projections`);
  console.log(`   - Sample ProjectionPaces created for María`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

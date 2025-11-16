import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { seedPaceCatalog } from './seed-pace-catalog';
import { seedRBAC } from './seed-rbac';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // First, seed the PACE catalog (Categories, Levels, SubSubjects, PACEs)
  await seedPaceCatalog();
  console.log('');

  // Second, seed RBAC system (Modules, Permissions, Role Permissions)
  await seedRBAC();
  console.log('');

  const grantModuleToRoles = async (
    moduleId: string,
    schoolId: string,
    roles: Array<{ id: string; name: string }>,
  ) => {
    for (const role of roles) {
      await prisma.roleModuleSchool.upsert({
        where: {
          roleId_schoolId_moduleId: {
            roleId: role.id,
            schoolId,
            moduleId,
          },
        },
        update: {},
        create: {
          id: randomUUID(),
          roleId: role.id,
          schoolId,
          moduleId,
        },
      });
    }
  };

  const superadminRole = await prisma.role.findFirst({
    where: { name: 'SUPERADMIN', schoolId: null },
  });

  const schoolAdminRole = await prisma.role.findFirst({
    where: { name: 'SCHOOL_ADMIN', schoolId: null },
  });

  const teacherRole = await prisma.role.findFirst({
    where: { name: 'TEACHER', schoolId: null },
  });

  const parentRole = await prisma.role.findFirst({
    where: { name: 'PARENT', schoolId: null },
  });

  const studentRole = await prisma.role.findFirst({
    where: { name: 'STUDENT', schoolId: null },
  });

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

  // Create demo admin user
  const adminUser = await prisma.user.upsert({
    where: { clerkId: 'user_33skKBEkI8wMg70KnEwHwrjVP93' },
    update: {},
    create: {
      clerkId: 'user_33skKBEkI8wMg70KnEwHwrjVP93',
      email: 'demo.admin@alenna.io',
      firstName: 'Demo',
      lastName: 'School Admin',
      schoolId: school.id,
    },
  });

  // Assign SCHOOL_ADMIN role
  if (schoolAdminRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: adminUser.id,
          roleId: schoolAdminRole.id,
        },
      },
      update: {},
      create: {
        id: randomUUID(),
        userId: adminUser.id,
        roleId: schoolAdminRole.id,
      },
    });
  }

  console.log('✅ Created SCHOOL ADMIN user:', adminUser.email);
  console.log('   Clerk ID:', adminUser.clerkId);
  console.log('   ⚠️  Replace this with your actual Clerk user ID!');

  // Create Alenna school for superadmin (global access)
  const alennaSchool = await prisma.school.upsert({
    where: {
      id: 'school_alenna_global'
    },
    update: {},
    create: {
      id: 'school_alenna_global',
      name: 'Alenna',
      address: 'Global System Administration',
      email: 'admin@alenna.io',
      phone: null,
    },
  });

  // Create superadmin user (global access)
  // Note: You need to update the clerkId with your actual Clerk ID
  const superadminUser = await prisma.user.upsert({
    where: { email: 'superadmin@alenna.io' },
    update: {
      clerkId: 'user_34R06gsf80RwrjEhG9aTYAsfIC6', // Actual Clerk ID
    },
    create: {
      clerkId: 'user_34R06gsf80RwrjEhG9aTYAsfIC6', // Actual Clerk ID
      email: 'superadmin@alenna.io',
      firstName: 'Super',
      lastName: 'Admin',
      schoolId: alennaSchool.id, // Superadmin belongs to Alenna school
    },
  });

  // Use the global SUPERADMIN role (created in RBAC seed)
  if (!superadminRole) {
    throw new Error('SUPERADMIN role not found. Make sure RBAC seed runs first.');
  }
  
  if (superadminRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: superadminUser.id,
          roleId: superadminRole.id,
        },
      },
      update: {},
      create: {
        id: randomUUID(),
        userId: superadminUser.id,
        roleId: superadminRole.id,
      },
    });
  }

  console.log('✅ Created SUPERADMIN user:', superadminUser.email);
  console.log('   Clerk ID:', superadminUser.clerkId);
  console.log('   ⚠️  Replace this with your actual Clerk user ID!');

  // Create School Year with Quarters
  console.log('\n📅 Creating School Year (2025-2026)...');
  const schoolYear = await prisma.schoolYear.upsert({
    where: {
      id: 'school-year-2025-2026', // Use a fixed ID instead of compound key
    },
    update: {},
    create: {
      id: 'school-year-2025-2026',
      schoolId: school.id,
      name: '2025-2026',
      startDate: new Date('2025-09-01'), // First Monday of August
      endDate: new Date('2026-07-11'), // Last Friday of May
      isActive: true,
    },
  });

  // Create 4 Quarters with start/end dates
  const quartersData = [
    {
      name: 'Q1',
      displayName: 'Bloque 1',
      startDate: new Date('2025-09-01'), // 9 weeks: Aug 5 - Oct 4
      endDate: new Date('2025-11-09'),
      order: 1,
    },
    {
      name: 'Q2',
      displayName: 'Bloque 2',
      startDate: new Date('2025-11-10'), // 9 weeks: Oct 14 - Dec 13 (skip Oct 7-11 fall break)
      endDate: new Date('2026-02-08'),
      order: 2,
    },
    {
      name: 'Q3',
      displayName: 'Bloque 3',
      startDate: new Date('2026-02-09'), // 9 weeks: Jan 6 - Mar 7 (skip Dec 16-Jan 3 winter break)
      endDate: new Date('2026-04-28'),
      order: 3,
    },
    {
      name: 'Q4',
      displayName: 'Bloque 4',
      startDate: new Date('2026-04-29'), // 9 weeks: Mar 17 - May 16 (skip Mar 10-14 spring break)
      endDate: new Date('2026-07-11'),
      order: 4,
    },
  ];

  for (const quarterData of quartersData) {
    await prisma.quarter.upsert({
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
        displayName: quarterData.displayName,
        startDate: quarterData.startDate,
        endDate: quarterData.endDate,
        order: quarterData.order,
        weeksCount: 9,
      },
    });
  }

  console.log('✅ Created school year: 2025-2026 with 4 quarters (36 weeks total)');

  // Create a second inactive school year for testing
  console.log('\n📅 Creating School Year (2024-2025)...');
  const schoolYear2023 = await prisma.schoolYear.upsert({
    where: {
      id: 'school-year-2024-2025', // Use a fixed ID instead of compound key
    },
    update: {},
    create: {
      id: 'school-year-2024-2025',
      schoolId: school.id,
      name: '2024-2025',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2025-07-11'),
      isActive: false, // This one is inactive
    },
  });

  // Create quarters for 2024-2025
  const quartersData2024 = [
    {
      name: 'Q1',
      displayName: 'Bloque 1',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2024-11-09'),
      order: 1,
    },
    {
      name: 'Q2',
      displayName: 'Bloque 2',
      startDate: new Date('2024-11-10'),
      endDate: new Date('2025-02-07'),
      order: 2,
    },
    {
      name: 'Q3',
      displayName: 'Bloque 3',
      startDate: new Date('2025-02-08'),
      endDate: new Date('2025-04-27'),
      order: 3,
    },
    {
      name: 'Q4',
      displayName: 'Bloque 4',
      startDate: new Date('2025-04-28'),
      endDate: new Date('2025-07-10'),
      order: 4,
    },
  ];

  for (const quarterData of quartersData2024) {
    await prisma.quarter.upsert({
      where: {
        schoolYearId_order: {
          schoolYearId: schoolYear2023.id,
          order: quarterData.order,
        },
      },
      update: {},
      create: {
        id: randomUUID(),
        schoolYearId: schoolYear2023.id,
        name: quarterData.name,
        displayName: quarterData.displayName,
        startDate: quarterData.startDate,
        endDate: quarterData.endDate,
        order: quarterData.order,
        weeksCount: 9,
      },
    });
  }

  console.log('✅ Created school year: 2024-2025 with 4 quarters (inactive)');

  // Enable modules for school
  const studentsModule = await prisma.module.findUnique({ where: { key: 'students' } });
  const configModule = await prisma.module.findUnique({ where: { key: 'configuration' } });
  const usersModule = await prisma.module.findUnique({ where: { key: 'users' } });
  
  if (studentsModule) {
    await prisma.schoolModule.upsert({
      where: {
        schoolId_moduleId: {
          schoolId: school.id,
          moduleId: studentsModule.id,
        },
      },
      update: {},
      create: {
        id: randomUUID(),
        schoolId: school.id,
        moduleId: studentsModule.id,
        isActive: true,
      },
    });
    console.log('✅ Enabled Students module for school');

    const rolesToGrant = [schoolAdminRole, teacherRole, parentRole, studentRole].filter(
      (role): role is { id: string; name: string } => Boolean(role),
    );

    await grantModuleToRoles(studentsModule.id, school.id, rolesToGrant);
    console.log('✅ Granted Students module to school roles');
  }

  if (configModule) {
    await prisma.schoolModule.upsert({
      where: {
        schoolId_moduleId: {
          schoolId: school.id,
          moduleId: configModule.id,
        },
      },
      update: {},
      create: {
        id: randomUUID(),
        schoolId: school.id,
        moduleId: configModule.id,
        isActive: true,
      },
    });
    console.log('✅ Enabled Configuration module for school');

    const rolesToGrant = [schoolAdminRole, teacherRole].filter(
      (role): role is { id: string; name: string } => Boolean(role),
    );

    await grantModuleToRoles(configModule.id, school.id, rolesToGrant);
    console.log('✅ Granted Configuration module to school roles');
  }

  if (usersModule) {
    await prisma.schoolModule.upsert({
      where: {
        schoolId_moduleId: {
          schoolId: school.id,
          moduleId: usersModule.id,
        },
      },
      update: {},
      create: {
        id: randomUUID(),
        schoolId: school.id,
        moduleId: usersModule.id,
        isActive: true,
      },
    });
    console.log('✅ Enabled Users module for demo school');

    const rolesToGrant = [schoolAdminRole].filter(
      (role): role is { id: string; name: string } => Boolean(role),
    );

    await grantModuleToRoles(usersModule.id, school.id, rolesToGrant);
    console.log('✅ Granted Users module to school admins');
  }

  // Enable Users module for Alenna school and assign to superadmin
  if (usersModule) {
    await prisma.schoolModule.upsert({
      where: {
        schoolId_moduleId: {
          schoolId: alennaSchool.id,
          moduleId: usersModule.id,
        },
      },
      update: {},
      create: {
        id: randomUUID(),
        schoolId: alennaSchool.id,
        moduleId: usersModule.id,
        isActive: true,
      },
    });
    console.log('✅ Enabled Users module for Alenna school');

    if (superadminRole) {
      await grantModuleToRoles(usersModule.id, alennaSchool.id, [superadminRole]);
    }
    console.log('✅ Granted Users module to Alenna superadmins');
  }

  // Enable Schools module for Alenna school and assign to superadmin
  const schoolsModule = await prisma.module.findUnique({ where: { key: 'schools' } });
  if (schoolsModule) {
    await prisma.schoolModule.upsert({
      where: {
        schoolId_moduleId: {
          schoolId: alennaSchool.id,
          moduleId: schoolsModule.id,
        },
      },
      update: {},
      create: {
        id: randomUUID(),
        schoolId: alennaSchool.id,
        moduleId: schoolsModule.id,
        isActive: true,
      },
    });
    console.log('✅ Enabled Schools module for Alenna school');

    if (superadminRole) {
      await grantModuleToRoles(schoolsModule.id, alennaSchool.id, [superadminRole]);
    }
    console.log('✅ Granted Schools module to Alenna superadmins');
  }

  // Superadmins don't get Configuración module as it's per-school
  // They manage schools through the Users module instead

  // Create demo users for each role
  console.log('\n👥 Creating demo users for each role...');

  // 1. Demo Teacher
  if (teacherRole && studentsModule) {
    const teacherUser = await prisma.user.upsert({
      where: { email: 'demo.teacher@alenna.io' },
      update: {},
      create: {
        id: randomUUID(),
        clerkId: 'user_34OK5lMOuaKKAOiNLuSeAkIN6Vo',
        email: 'demo.teacher@alenna.io',
        firstName: 'Demo',
        lastName: 'Teacher',
        schoolId: school.id,
      },
    });

    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: teacherUser.id,
          roleId: teacherRole.id,
        },
      },
      update: {},
      create: {
        id: randomUUID(),
        userId: teacherUser.id,
        roleId: teacherRole.id,
      },
    });

    console.log('✅ Created TEACHER user:', teacherUser.email);
  }

  // 2. Demo Parent (will be linked to first student created)
  let demoParentUser: any = null;
  if (parentRole && studentsModule) {
    demoParentUser = await prisma.user.upsert({
      where: { email: 'demo.parent@alenna.io' },
      update: {},
      create: {
        id: randomUUID(),
        clerkId: 'user_34OKCyGRvnekmyY7ffTpLmYc57I',
        email: 'demo.parent@alenna.io',
        firstName: 'Demo',
        lastName: 'Parent',
        schoolId: school.id,
      },
    });

    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: demoParentUser.id,
          roleId: parentRole.id,
        },
      },
      update: {},
      create: {
        id: randomUUID(),
        userId: demoParentUser.id,
        roleId: parentRole.id,
      },
    });

    console.log('✅ Created PARENT user:', demoParentUser.email);
  }

  // 3. Demo Student (separate from regular students - explicit demo account)
  let demoStudentUser: any = null;
  if (studentRole) {
    demoStudentUser = await prisma.user.upsert({
      where: { email: 'demo.student@alenna.io' },
      update: {},
      create: {
        id: randomUUID(),
        clerkId: 'user_34OK8zFtHjyc4m4tbS6ecWtOcBF',
        email: 'demo.student@alenna.io',
        firstName: 'Demo',
        lastName: 'Student',
        schoolId: school.id,
      },
    });

    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: demoStudentUser.id,
          roleId: studentRole.id,
        },
      },
      update: {},
      create: {
        id: randomUUID(),
        userId: demoStudentUser.id,
        roleId: studentRole.id,
      },
    });

    // Students typically don't have module access yet (no permissions)
    // Can be granted later when student features are added

    console.log('✅ Created STUDENT user:', demoStudentUser.email);
  }

  // Clear existing students first (cascade deletes projections, paces, daily goals)
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

  // Create student profile for demo student user (login account)
  if (studentRole && demoStudentUser) {
    const demoStudentId = randomUUID();
    await prisma.student.create({
      data: {
        id: demoStudentId,
        userId: demoStudentUser.id,
        birthDate: new Date('2010-01-01'),
        graduationDate: new Date('2025-06-15'),
        contactPhone: '+52 555 000 0000',
        isLeveled: false,
        expectedLevel: null,
        currentLevel: null,
        address: 'Perfil demo del estudiante',
        certificationTypeId: getCertTypeId('Grace Christian'),
        schoolId: school.id,
      },
    });

    console.log('✅ Linked demo student user to student profile');
  }

  // Create demo students
  const studentsData = [
    {
      firstName: 'María',
      lastName: 'González López',
      birthDate: new Date('2009-03-15'),
      certificationTypeName: 'INEA',
      graduationDate: new Date('2025-06-15'),
      contactPhone: '+52 555 123 4567',
      isLeveled: true,
      expectedLevel: 'Secundaria',
      currentLevel: 'L8',
      address: 'Calle Principal 123, Colonia Centro, Ciudad de México',
    },
    {
      firstName: 'José Antonio',
      lastName: 'Rodríguez',
      birthDate: new Date('2010-07-22'),
      certificationTypeName: 'Grace Christian',
      graduationDate: new Date('2025-06-15'),
      contactPhone: '+52 555 987 6543',
      isLeveled: false,
      currentLevel: 'L7',
      address: 'Av. Libertad 456, Colonia Norte, Guadalajara',
    },
    {
      firstName: 'Sofía',
      lastName: 'Hernández Martínez',
      birthDate: new Date('2008-11-08'),
      certificationTypeName: 'Home Life',
      graduationDate: new Date('2025-06-15'),
      contactPhone: '+52 555 456 7890',
      isLeveled: true,
      expectedLevel: 'Preparatoria',
      currentLevel: 'L10',
      address: 'Calle Reforma 789, Colonia Sur, Monterrey',
    },
    {
      firstName: 'Diego Fernando',
      lastName: 'Silva',
      birthDate: new Date('2011-01-30'),
      certificationTypeName: 'Lighthouse',
      graduationDate: new Date('2026-06-15'),
      contactPhone: '+52 555 321 0987',
      isLeveled: true,
      expectedLevel: 'Primaria',
      currentLevel: 'L5',
      address: 'Blvd. Universidad 321, Colonia Este, Puebla',
    },
    {
      firstName: 'Camila',
      lastName: 'Jiménez Flores',
      birthDate: new Date('2008-02-14'),
      certificationTypeName: 'Grace Christian',
      graduationDate: new Date('2025-06-15'),
      contactPhone: '+52 555 234 5678',
      isLeveled: true,
      expectedLevel: 'Preparatoria',
      currentLevel: 'L11',
      address: 'Calle Morelos 234, Colonia Sur, Mérida',
    },
  ];

  // studentRole and parentRole already declared above

  for (const studentData of studentsData) {
    const { certificationTypeName, currentLevel, ...restData } = studentData;
    const studentId = randomUUID();
    
    // Create User account for student (email must be unique)
    const studentUser = await prisma.user.create({
      data: {
        id: randomUUID(),
        clerkId: `student_${studentId}_clerk`, // Placeholder - will be set when student logs in
        email: `student.${studentId.substring(0, 8)}@demo.alenna.io`, // Unique email using student ID
        firstName: restData.firstName,
        lastName: restData.lastName,
        schoolId: school.id,
      },
    });

    // Assign STUDENT role
    if (studentRole) {
      await prisma.userRole.create({
        data: {
          id: randomUUID(),
          userId: studentUser.id,
          roleId: studentRole.id,
        },
      });
    }

    // Create Student record
    const student = await prisma.student.create({
      data: {
        id: studentId,
        userId: studentUser.id,
        birthDate: restData.birthDate,
        graduationDate: restData.graduationDate,
        contactPhone: restData.contactPhone,
        isLeveled: restData.isLeveled,
        expectedLevel: restData.expectedLevel,
        currentLevel: (currentLevel as string | undefined),
        address: restData.address,
        certificationTypeId: getCertTypeId(certificationTypeName),
        schoolId: school.id,
      },
    });
    
    console.log('✅ Created student:', studentUser.firstName, studentUser.lastName);

    // Link Demo Parent to first student (María)
    if (restData.firstName === 'María' && demoParentUser) {
      await prisma.userStudent.create({
        data: {
          id: randomUUID(),
          userId: demoParentUser.id,
          studentId: student.id,
          relationship: 'Parent',
        },
      });
      console.log('   ✅ Linked Demo Parent to student');
    }

    // Create additional parent users for María
    const parentData = [
      { firstName: 'Carlos', lastName: 'González', relationship: 'Father' },
      { firstName: 'Ana', lastName: 'López', relationship: 'Mother' },
    ];

    if (restData.firstName === 'María' && parentRole) {
      for (const parent of parentData) {
        const parentUserId = randomUUID();
        const parentUser = await prisma.user.create({
          data: {
            id: parentUserId,
            clerkId: `parent_${parentUserId}_clerk`,
            email: `parent.${parentUserId.substring(0, 8)}@demo.alenna.io`, // Unique email
            firstName: parent.firstName,
            lastName: parent.lastName,
            schoolId: school.id,
          },
        });

        // Assign PARENT role
        await prisma.userRole.create({
          data: {
            id: randomUUID(),
            userId: parentUser.id,
            roleId: parentRole.id,
          },
        });

        // Link parent to student
        await prisma.userStudent.create({
          data: {
            id: randomUUID(),
            userId: parentUser.id,
            studentId: student.id,
            relationship: parent.relationship,
          },
        });
      }
      console.log(`   ✅ Created ${parentData.length} parent users and linked to student`);
    }

    // Create a projection for this student (2025-2026 school year)
    const projection = await prisma.projection.create({
      data: {
        id: randomUUID(),
        studentId: student.id,
        schoolYear: '2025-2026',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2025-06-30'),
        isActive: true,
        notes: 'Initial projection for 2025-2026 school year',
      },
    });
    console.log(`   ✅ Created projection: ${projection.schoolYear}`);

    // Add sample ProjectionPaces for María (L8 student)
    if (restData.firstName === 'María' && restData.lastName === 'González López') {
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

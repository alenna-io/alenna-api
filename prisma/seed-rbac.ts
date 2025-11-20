import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

export async function seedRBAC() {
  console.log('🔐 Seeding roles & modules...');

  // 0. Create System Roles
  console.log('👥 Creating system roles...');

  const rolesData = [
    { name: 'SUPERADMIN', displayName: 'Super Administrator', description: 'Full system access across all schools and users', isSystem: true },
    { name: 'SCHOOL_ADMIN', displayName: 'School Administrator', description: 'Manages a single school', isSystem: true },
    { name: 'TEACHER', displayName: 'Teacher', description: 'Manages assigned students and academic planning', isSystem: true },
    { name: 'PARENT', displayName: 'Parent/Guardian', description: 'Views their children’s information', isSystem: true },
    { name: 'STUDENT', displayName: 'Student', description: 'Views their own information', isSystem: true },
  ];

  for (const roleData of rolesData) {
    const existingRole = await prisma.role.findFirst({
      where: {
        name: roleData.name,
        schoolId: null,
      },
    });

    if (existingRole) {
      await prisma.role.update({
        where: { id: existingRole.id },
        data: {
          displayName: roleData.displayName,
          description: roleData.description,
          isSystem: roleData.isSystem,
        },
      });
    } else {
      await prisma.role.create({
        data: {
          id: randomUUID(),
          name: roleData.name,
          displayName: roleData.displayName,
          description: roleData.description,
          isSystem: roleData.isSystem,
          schoolId: null,
        },
      });
    }
  }

  console.log('✅ Roles ready');

  // 1. Create Modules
  console.log('📦 Creating modules...');

  const modulesData = [
    { key: 'students', name: 'Students', description: 'Manage students, projections and PACEs', displayOrder: 1 },
    { key: 'users', name: 'Users', description: 'Manage system users', displayOrder: 2 },
    { key: 'schools', name: 'Schools', description: 'Manage schools and global administration', displayOrder: 3 },
    { key: 'configuration', name: 'Configuration', description: 'Academic and school configuration', displayOrder: 4 },
  ];

  for (const moduleData of modulesData) {
    await prisma.module.upsert({
      where: { key: moduleData.key },
      update: {
        name: moduleData.name,
        description: moduleData.description,
        displayOrder: moduleData.displayOrder,
        isActive: true,
      },
      create: {
        id: randomUUID(),
        key: moduleData.key,
        name: moduleData.name,
        description: moduleData.description,
        displayOrder: moduleData.displayOrder,
        isActive: true,
      },
    });
  }

  console.log('✅ Modules ready');
}


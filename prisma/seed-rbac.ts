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
    { key: 'projections', name: 'Projections', description: 'Create and manage student academic projections', displayOrder: 1 },
    { key: 'monthlyAssignments', name: 'Monthly Assignments', description: 'Create assignments and link to projections', displayOrder: 2 },
    { key: 'reportCards', name: 'Report Cards', description: 'Generate and view student report cards', displayOrder: 3 },
    { key: 'students', name: 'Students', description: 'Manage student personal and academic information', displayOrder: 4 },
    { key: 'teachers', name: 'Teachers', description: 'Manage teachers and their assignments', displayOrder: 5 },
    { key: 'groups', name: 'Groups', description: 'Manage teacher-student assignments per school year', displayOrder: 6 },
    { key: 'paces', name: 'Lectures', description: 'View and browse lectures catalog (read-only)', displayOrder: 7 },
    { key: 'school_admin', name: 'School Admin', description: 'School settings (info, years, certification types)', displayOrder: 8 },
    { key: 'schools', name: 'Schools', description: 'Manage schools and global administration', displayOrder: 9 },
    { key: 'users', name: 'Users', description: 'Manage system users', displayOrder: 10 },
    { key: 'billing', name: 'Billing', description: 'Manage monthly tuition billing', displayOrder: 11 },
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

// Allow running this file directly
if (require.main === module) {
  seedRBAC()
    .then(() => {
      console.log('✅ RBAC seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error seeding RBAC:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}

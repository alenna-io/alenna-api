import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

export async function seedRBAC() {
  console.log('🔐 Seeding RBAC & Module System...');

  // 0. Create System Roles
  console.log('👥 Creating System Roles...');
  
  const rolesData = [
    { name: 'ADMIN', displayName: 'Administrator', description: 'Full system access and configuration', isSystem: true },
    { name: 'TEACHER', displayName: 'Teacher', description: 'Can manage students and academic content', isSystem: true },
    { name: 'PARENT', displayName: 'Parent/Guardian', description: 'Can view their children\'s information', isSystem: true },
    { name: 'STUDENT', displayName: 'Student', description: 'Limited access to own information', isSystem: true },
  ];

  const roles: Record<string, any> = {};
  for (const roleData of rolesData) {
    // Check if system role already exists
    let role = await prisma.role.findFirst({
      where: {
        schoolId: null,
        name: roleData.name,
      },
    });

    // Create if doesn't exist
    if (!role) {
      role = await prisma.role.create({
        data: {
          id: randomUUID(),
          name: roleData.name,
          displayName: roleData.displayName,
          description: roleData.description,
          isSystem: roleData.isSystem,
          schoolId: null, // Global system role
        },
      });
    }
    
    roles[roleData.name] = role;
  }
  console.log('✅ Created roles:', Object.keys(roles).join(', '));

  // 1. Create Modules
  console.log('📦 Creating Modules...');
  
  const modulesData = [
    { name: 'Estudiantes', description: 'Gestión de estudiantes y proyecciones', displayOrder: 1 },
    { name: 'Usuarios', description: 'Gestión de usuarios del sistema', displayOrder: 2 },
    { name: 'Configuración', description: 'Configuración del sistema', displayOrder: 3 },
  ];

  const modules: Record<string, any> = {};
  for (const modData of modulesData) {
    modules[modData.name] = await prisma.module.upsert({
      where: { name: modData.name },
      update: {},
      create: {
        id: randomUUID(),
        name: modData.name,
        description: modData.description,
        displayOrder: modData.displayOrder,
        isActive: true,
      },
    });
  }
  console.log('✅ Created modules:', Object.keys(modules).join(', '));

  // 2. Create Permissions
  console.log('🔑 Creating Permissions...');
  
  const permissionsData = [
    // Students Module Permissions
    { name: 'students.read', description: 'View all students in the school', module: 'Students' },
    { name: 'students.readOwn', description: 'View only linked students (for parents)', module: 'Students' },
    { name: 'students.create', description: 'Create new student records', module: 'Students' },
    { name: 'students.update', description: 'Update existing student information', module: 'Students' },
    { name: 'students.delete', description: 'Delete student records', module: 'Students' },
    
    // Projections Permissions
    { name: 'projections.read', description: 'View all student projections', module: 'Students' },
    { name: 'projections.readOwn', description: 'View only linked students\' projections (for parents)', module: 'Students' },
    { name: 'projections.create', description: 'Create new academic projections', module: 'Students' },
    { name: 'projections.update', description: 'Update projection details', module: 'Students' },
    { name: 'projections.delete', description: 'Delete projections', module: 'Students' },
    
    // Projection Paces Permissions
    { name: 'paces.read', description: 'View PACEs in projections', module: 'Students' },
    { name: 'paces.create', description: 'Add PACEs to student projections', module: 'Students' },
    { name: 'paces.update', description: 'Update PACE grades and completion status', module: 'Students' },
    { name: 'paces.delete', description: 'Remove PACEs from projections', module: 'Students' },
    { name: 'paces.move', description: 'Move PACEs between weeks/quarters', module: 'Students' },
    
    // Users Module Permissions
    { name: 'users.read', description: 'View system users', module: 'Users' },
    { name: 'users.create', description: 'Create new user accounts', module: 'Users' },
    { name: 'users.update', description: 'Update user information and roles', module: 'Users' },
    { name: 'users.delete', description: 'Delete user accounts', module: 'Users' },
    
    // Configuration Module Permissions
    
    // School Info Submodule (Read-only for all, managed by Alenna)
    { name: 'schoolInfo.read', description: 'View school information and settings', module: 'Configuration' },
    { name: 'schoolInfo.update', description: 'Update school information (Alenna only)', module: 'Configuration' },
    
    // School Year Submodule
    { name: 'schoolYear.read', description: 'View school year configurations', module: 'Configuration' },
    { name: 'schoolYear.create', description: 'Create new school year configurations', module: 'Configuration' },
    { name: 'schoolYear.update', description: 'Update school year configurations', module: 'Configuration' },
    { name: 'schoolYear.delete', description: 'Delete school year configurations', module: 'Configuration' },
    
    // Billing Submodule
    { name: 'billing.read', description: 'View billing and payment information', module: 'Configuration' },
    { name: 'billing.update', description: 'Update billing and payment settings', module: 'Configuration' },
  ];

  const permissions: Record<string, any> = {};
  for (const permData of permissionsData) {
    permissions[permData.name] = await prisma.permission.upsert({
      where: { name: permData.name },
      update: {},
      create: {
        id: randomUUID(),
        name: permData.name,
        description: permData.description,
        moduleId: modules[permData.module].id,
      },
    });
  }
  console.log(`✅ Created ${Object.keys(permissions).length} permissions`);

  // 3. Assign Permissions to Roles
  console.log('🔗 Assigning permissions to roles...');
  
  const rolePermissionsData: Array<{ roleName: string; permissions: string[] }> = [
    {
      roleName: 'ADMIN',
      permissions: Object.keys(permissions), // All permissions
    },
    {
      roleName: 'TEACHER',
      permissions: [
        // Students module - full access
        'students.read',
        'students.create',
        'students.update',
        'students.delete',
        // Projections - full access
        'projections.read',
        'projections.create',
        'projections.update',
        'projections.delete',
        // Paces - full access
        'paces.read',
        'paces.create',
        'paces.update',
        'paces.delete',
        'paces.move',
        // Configuration - read-only access
        'schoolInfo.read',
        'schoolYear.read',
      ],
    },
    {
      roleName: 'PARENT',
      permissions: [
        'students.readOwn', // Can only see their children
        'projections.readOwn', // Can only see their children's projections
        'paces.read', // Can view PACEs in projections
      ],
    },
    {
      roleName: 'STUDENT',
      permissions: [], // No permissions for now
    },
  ];

  let rolePermissionsCreated = 0;
  for (const roleData of rolePermissionsData) {
    for (const permName of roleData.permissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: roles[roleData.roleName].id,
            permissionId: permissions[permName].id,
          },
        },
        update: {},
        create: {
          id: randomUUID(),
          roleId: roles[roleData.roleName].id,
          permissionId: permissions[permName].id,
        },
      });
      rolePermissionsCreated++;
    }
  }
  console.log(`✅ Created ${rolePermissionsCreated} role-permission assignments`);
  console.log('   ADMIN: All permissions');
  console.log('   TEACHER: Students + Projections + Paces');
  console.log('   PARENT: Read-only access to their children');
  console.log('   STUDENT: No permissions');

  console.log('🔐 RBAC & Module seeding completed!');
}


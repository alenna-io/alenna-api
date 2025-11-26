import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log('🗑️  Cleaning database...');
  console.log('');
  
  // Delete in order to respect foreign key constraints
  // We delete user-created data but keep system/catalog data
  
  console.log('   Deleting user data...');
  
  // Delete relationships first
  await prisma.teacherStudent.deleteMany({});
  console.log('   ✓ Deleted teacher-student relationships');
  
  await prisma.userStudent.deleteMany({});
  console.log('   ✓ Deleted user-student relationships');
  
  await prisma.userRole.deleteMany({});
  console.log('   ✓ Deleted user-role assignments');
  
  await prisma.roleModuleSchool.deleteMany({});
  console.log('   ✓ Deleted role-module-school assignments');
  
  await prisma.schoolModule.deleteMany({});
  console.log('   ✓ Deleted school-module configurations');
  
  // Delete academic data
  await prisma.dailyGoal.deleteMany({});
  console.log('   ✓ Deleted daily goals');
  
  await prisma.projectionPace.deleteMany({});
  console.log('   ✓ Deleted projection paces');
  
  await prisma.projection.deleteMany({});
  console.log('   ✓ Deleted projections');
  
  await prisma.projectionTemplate.deleteMany({});
  console.log('   ✓ Deleted projection templates');
  
  // Delete students and related data
  await prisma.student.deleteMany({});
  console.log('   ✓ Deleted students');
  
  await prisma.certificationType.deleteMany({});
  console.log('   ✓ Deleted certification types');
  
  // Delete users
  await prisma.user.deleteMany({});
  console.log('   ✓ Deleted users');
  
  // Delete school-specific data
  await prisma.schoolYear.deleteMany({});
  console.log('   ✓ Deleted school years');
  
  await prisma.monthlyAssignmentGradeHistory.deleteMany({});
  console.log('   ✓ Deleted monthly assignment grade history');
  
  await prisma.monthlyAssignment.deleteMany({});
  console.log('   ✓ Deleted monthly assignments');
  
  await prisma.schoolMonthlyAssignmentTemplate.deleteMany({});
  console.log('   ✓ Deleted school monthly assignment templates');
  
  await prisma.school.deleteMany({});
  console.log('   ✓ Deleted schools');
  
  console.log('');
  console.log('✅ Database cleaned successfully!');
  console.log('');
  console.log('📝 Note: System data preserved:');
  console.log('   - Roles (SUPERADMIN, SCHOOL_ADMIN, TEACHER, PARENT, STUDENT)');
  console.log('   - Modules and permissions');
  console.log('   - PACE catalog (Categories, Levels, SubSubjects, PACEs)');
  console.log('');
}

async function main() {
  try {
    // Step 1: Clean database
    await cleanDatabase();
    
    // Step 2: Run seed (imported from seed.ts)
    // We need to dynamically import to avoid circular dependencies
    console.log('🌱 Running seed script...');
    console.log('');
    
    // Re-import seed logic by requiring it
    const seedModule = await import('./seed');
    // The seed.ts file exports a main function that we can call
    // But since it doesn't export, we'll just run the same logic
    
    // Actually, let's just call the seed script directly
    // We'll use eval or require to execute it
    // Better approach: read and execute the seed file
    
    // Seed will be run by the package.json script
    console.log('✅ Clean completed! Run pnpm prisma:seed to seed the database.');
    
  } catch (error: any) {
    console.error('');
    console.error('❌ Error cleaning database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Clean failed:', e);
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


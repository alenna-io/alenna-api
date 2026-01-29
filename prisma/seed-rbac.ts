import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedRBAC() {
  console.log('🔐 RBAC seeding skipped - Role and Module models removed in MVP');
  console.log('   (This function is kept for compatibility but does nothing)');
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

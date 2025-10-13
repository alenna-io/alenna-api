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

  // Note: Users will be created via Clerk authentication
  // Students will be created via the API

  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


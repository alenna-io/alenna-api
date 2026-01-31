import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

interface StudentConfig {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
}

export interface StudentsSetupConfig {
  students: StudentConfig[];
}

export async function ensureStudentRole() {
  const role = await prisma.role.upsert({
    where: { name: 'STUDENT' },
    update: {},
    create: {
      name: 'STUDENT',
      description: 'Student user with limited access',
    },
  });
  return role;
}

export async function createStudent(schoolId: string, config: StudentConfig) {
  const userId = randomUUID();
  const studentId = randomUUID();

  const studentUser = await prisma.user.upsert({
    where: { email: config.email },
    update: {
      firstName: config.firstName || null,
      lastName: config.lastName || null,
      phone: config.phone || null,
      streetAddress: config.streetAddress || null,
      city: config.city || null,
      state: config.state || null,
      country: config.country || null,
      zipCode: config.zipCode || null,
      schoolId,
    },
    create: {
      id: userId,
      clerkId: null,
      email: config.email,
      firstName: config.firstName || null,
      lastName: config.lastName || null,
      phone: config.phone || null,
      streetAddress: config.streetAddress || null,
      city: config.city || null,
      state: config.state || null,
      country: config.country || null,
      zipCode: config.zipCode || null,
      schoolId,
      createdPassword: false,
    },
  });

  await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {
      schoolId,
    },
    create: {
      id: studentId,
      userId: studentUser.id,
      schoolId,
    },
  });

  const studentRole = await ensureStudentRole();

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: studentUser.id,
        roleId: studentRole.id,
      },
    },
    update: {},
    create: {
      userId: studentUser.id,
      roleId: studentRole.id,
    },
  });

  return { user: studentUser, studentId };
}

export async function createStudents(schoolId: string, config: StudentsSetupConfig) {
  console.log('👥 Creating students...\n');

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
  });

  if (!school) {
    throw new Error(`School with ID ${schoolId} not found`);
  }

  console.log(`✅ Found school: ${school.name}\n`);

  await ensureStudentRole();

  const results: Awaited<ReturnType<typeof createStudent>>[] = [];
  for (const studentData of config.students) {
    const result = await createStudent(schoolId, studentData);
    results.push(result);
    console.log(`  ✅ Created student: ${result.user.firstName || ''} ${result.user.lastName || ''} (${result.user.email})`);
  }

  console.log('');
  console.log(`✅ Created ${results.length} student(s)`);
  console.log('');

  return results;
}

export async function disconnect() {
  await prisma.$disconnect();
}

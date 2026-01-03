// This script creates Billing Config and Scholarshi entry objects for all students in the database
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createScholarshipsBillingConfigAllStudents() {
  const students = await prisma.student.findMany(
    {
      include: {
        billingConfig: true,
        scholarship: true,
      }
    }
  );

  console.log(`Creating scholarships and billing config for ${students.length} students`);

  for (const student of students) {
    if (!student.billingConfig) {
      console.log(`Creating billing config for student ${student.id}`);
      await prisma.studentBillingConfig.create({
        data: {
          studentId: student.id,
          requiresTaxableInvoice: false,
        },
      });
    }
    if (!student.scholarship) {
      console.log(`Creating scholarship for student ${student.id}`);
      await prisma.studentScholarship.create({
        data: {
          studentId: student.id,
          scholarshipType: 'percentage',
          scholarshipValue: 0,
        },
      })
    }
  }

  console.log('Scholarships and billing config created successfully');
}

createScholarshipsBillingConfigAllStudents()
  .catch((error) => {
    console.error('Error creating scholarships and billing config for all students:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
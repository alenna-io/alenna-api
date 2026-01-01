/**
 * Production Billing Setup Script
 * 
 * This script sets up the billing system for production without polluting existing data.
 * It will:
 * 1. Create the billing module in the RBAC system
 * 2. Create a default tuition type ($2200 MXN) for each active school
 * 3. Create tuition configuration for each active school
 * 4. Create billing records for all active students for the current month
 * 
 * Usage:
 *   npx tsx prisma/setup-billing.ts
 * 
 * Or add to package.json:
 *   "prisma:setup-billing": "tsx prisma/setup-billing.ts"
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { BillingRecord } from '../src/core/domain/entities/BillingRecord';

const prisma = new PrismaClient();

async function main() {
  console.log('💰 Setting up Billing System for Production...\n');

  // 0. Create Billing Module if it doesn't exist
  console.log('📦 Creating billing module...');
  const billingModule = await prisma.module.upsert({
    where: { key: 'billing' },
    update: {
      name: 'Billing',
      description: 'Manage monthly tuition billing',
      displayOrder: 11,
      isActive: true,
    },
    create: {
      id: randomUUID(),
      key: 'billing',
      name: 'Billing',
      description: 'Manage monthly tuition billing',
      displayOrder: 11,
      isActive: true,
    },
  });
  console.log('✅ Billing module ready\n');

  // Get all active schools
  const activeSchools = await prisma.school.findMany({
    where: {
      isActive: true,
      deletedAt: null,
    },
  });

  if (activeSchools.length === 0) {
    console.log('❌ No active schools found. Exiting...');
    return;
  }

  console.log(`📚 Found ${activeSchools.length} active school(s)\n`);

  for (const school of activeSchools) {
    console.log(`\n🏫 Processing school: ${school.name} (${school.id})`);

    // 1. Create Tuition Config if it doesn't exist
    console.log('  📝 Creating/updating tuition configuration...');
    const tuitionConfig = await prisma.tuitionConfig.upsert({
      where: { schoolId: school.id },
      update: {},
      create: {
        id: randomUUID(),
        schoolId: school.id,
        dueDay: 5, // Due on the 5th of each month
      },
    });
    console.log('  ✅ Tuition configuration ready');

    // 2. Create default tuition type ($2200 in MX currency) if it doesn't exist
    console.log('  💵 Creating/updating default tuition type...');
    const defaultTuitionType = await prisma.tuitionType.upsert({
      where: {
        schoolId_name: {
          schoolId: school.id,
          name: 'Default',
        },
      },
      update: {
        baseAmount: 2200,
        currency: 'MXN',
        lateFeeType: 'percentage',
        lateFeeValue: 5.0, // 5% late fee
        displayOrder: 0,
      },
      create: {
        id: randomUUID(),
        schoolId: school.id,
        name: 'Default',
        baseAmount: 2200,
        currency: 'MXN',
        lateFeeType: 'percentage',
        lateFeeValue: 5.0,
        displayOrder: 0,
      },
    });
    console.log(`  ✅ Default tuition type created: ${defaultTuitionType.name} - $${defaultTuitionType.baseAmount} ${defaultTuitionType.currency}`);

    // 3. Get active school year
    const activeSchoolYear = await prisma.schoolYear.findFirst({
      where: {
        schoolId: school.id,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!activeSchoolYear) {
      console.log(`  ⚠️  No active school year found for ${school.name}. Skipping billing records creation.`);
      continue;
    }

    // 4. Get all active students
    const activeStudents = await prisma.student.findMany({
      where: {
        schoolId: school.id,
        deletedAt: null,
      },
    });

    if (activeStudents.length === 0) {
      console.log(`  ⚠️  No active students found for ${school.name}. Skipping billing records creation.`);
      continue;
    }

    console.log(`  👥 Found ${activeStudents.length} active student(s)`);

    // 5. Create billing records for current month
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // January = 1
    const currentYear = now.getFullYear();
    const dueDate = new Date(currentYear, currentMonth - 1, tuitionConfig.dueDay);

    console.log(`  📅 Creating billing records for ${currentMonth}/${currentYear}...`);

    let recordsCreated = 0;
    let recordsSkipped = 0;

    for (const student of activeStudents) {
      // Check if billing record already exists for this month/year
      const existingRecord = await prisma.billingRecord.findFirst({
        where: {
          studentId: student.id,
          billingMonth: currentMonth,
          billingYear: currentYear,
        },
      });

      if (existingRecord) {
        recordsSkipped++;
        continue;
      }

      // Get student scholarship if exists
      const scholarship = await prisma.studentScholarship.findUnique({
        where: { studentId: student.id },
      });

      // Calculate scholarship amount
      let scholarshipAmount = 0;
      if (scholarship) {
        const effectiveTuitionAmount = Number(defaultTuitionType.baseAmount);
        if (scholarship.scholarshipType === 'percentage') {
          scholarshipAmount = effectiveTuitionAmount * (Number(scholarship.scholarshipValue) / 100);
        } else if (scholarship.scholarshipType === 'fixed') {
          scholarshipAmount = Number(scholarship.scholarshipValue);
        }
      }

      // Determine taxable bill status
      const taxableBillStatus = scholarship?.taxableBillRequired ? 'required' : 'not_required';

      // Calculate final amount
      const effectiveTuitionAmount = Number(defaultTuitionType.baseAmount);
      const amountAfterDiscounts = effectiveTuitionAmount - scholarshipAmount;
      const finalAmount = amountAfterDiscounts; // No late fees for new records

      // Create billing record using domain entity
      const billingRecord = BillingRecord.create({
        id: randomUUID(),
        studentId: student.id,
        schoolYearId: activeSchoolYear.id,
        billingMonth: currentMonth,
        billingYear: currentYear,
        tuitionTypeSnapshot: {
          tuitionTypeId: defaultTuitionType.id,
          tuitionTypeName: defaultTuitionType.name,
          baseAmount: Number(defaultTuitionType.baseAmount),
          lateFeeType: defaultTuitionType.lateFeeType as 'fixed' | 'percentage',
          lateFeeValue: Number(defaultTuitionType.lateFeeValue),
        },
        effectiveTuitionAmount,
        scholarshipAmount,
        billStatus: taxableBillStatus,
        dueDay: tuitionConfig.dueDay,
        createdBy: 'system', // System user for initial setup
      });

      // Map to Prisma format
      const prismaData = {
        id: billingRecord.id,
        studentId: billingRecord.studentId,
        schoolYearId: billingRecord.schoolYearId,
        billingMonth: billingRecord.billingMonth,
        billingYear: billingRecord.billingYear,
        tuitionTypeSnapshot: billingRecord.tuitionTypeSnapshot as any,
        effectiveTuitionAmount: billingRecord.effectiveTuitionAmount,
        scholarshipAmount: billingRecord.scholarshipAmount,
        discountAdjustments: billingRecord.discountAdjustments as any,
        extraCharges: billingRecord.extraCharges as any,
        lateFeeAmount: billingRecord.lateFeeAmount,
        finalAmount: billingRecord.finalAmount,
        billStatus: billingRecord.billStatus,
        paymentStatus: billingRecord.paymentStatus,
        paidAmount: billingRecord.paidAmount,
        paidAt: billingRecord.paidAt,
        lockedAt: billingRecord.lockedAt,
        paymentMethod: billingRecord.paymentMethod,
        paymentNote: billingRecord.paymentNote,
        paymentGateway: billingRecord.paymentGateway,
        paymentTransactionId: billingRecord.paymentTransactionId,
        paymentGatewayStatus: billingRecord.paymentGatewayStatus,
        paymentWebhookReceivedAt: billingRecord.paymentWebhookReceivedAt,
        dueDate: billingRecord.dueDate,
        auditMetadata: billingRecord.auditMetadata as any,
        createdAt: billingRecord.createdAt,
        updatedAt: billingRecord.updatedAt,
      };

      await prisma.billingRecord.create({
        data: prismaData,
      });

      recordsCreated++;
    }

    console.log(`  ✅ Created ${recordsCreated} billing record(s), skipped ${recordsSkipped} (already exist)`);
  }

  console.log('\n✨ Billing system setup completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error setting up billing system:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


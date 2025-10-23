import type {
  ISchoolYearRepository,
  CreateSchoolYearData,
  UpdateSchoolYearData,
} from '../../../adapters_interface/repositories';
import type { SchoolYear, CurrentWeekInfo } from '../../../domain/entities';
import { SchoolYearMapper } from '../mappers'
import prisma from '../prisma.client';

export class SchoolYearRepository implements ISchoolYearRepository {
  constructor() {}

  async findById(id: string): Promise<SchoolYear | null> {
    const schoolYear = await prisma.schoolYear.findUnique({
      where: { id, deletedAt: null },
      include: {
        quarters: {
          where: { deletedAt: null },
          orderBy: { order: 'asc' },
        },
      },
    });

    return schoolYear ? SchoolYearMapper.toDomain(schoolYear) : null;
  }

  async findBySchoolId(schoolId: string): Promise<SchoolYear[]> {
    const schoolYears = await prisma.schoolYear.findMany({
      where: { schoolId, deletedAt: null },
      include: {
        quarters: {
          where: { deletedAt: null },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    return schoolYears.map(SchoolYearMapper.toDomain);
  }

  async findActiveBySchoolId(schoolId: string): Promise<SchoolYear | null> {
    const schoolYear = await prisma.schoolYear.findFirst({
      where: { schoolId, isActive: true, deletedAt: null },
      include: {
        quarters: {
          where: { deletedAt: null },
          orderBy: { order: 'asc' },
        },
      },
    });

    return schoolYear ? SchoolYearMapper.toDomain(schoolYear) : null;
  }

  async create(data: CreateSchoolYearData): Promise<SchoolYear> {
    // Check if name conflicts with existing non-deleted school years
    const existingSchoolYear = await prisma.schoolYear.findFirst({
      where: {
        name: data.name,
        schoolId: data.schoolId,
        deletedAt: null, // Only check non-deleted school years
      },
    });

    if (existingSchoolYear) {
      throw new Error(`Ya existe un año escolar con el nombre "${data.name}". Por favor, elige un nombre diferente.`);
    }

    let schoolYear;
    try {
      schoolYear = await prisma.schoolYear.create({
        data: {
          schoolId: data.schoolId,
          name: data.name,
          startDate: data.startDate,
          endDate: data.endDate,
          isActive: data.isActive ?? false,
          quarters: {
            create: data.quarters.map((q) => ({
              name: q.name,
              displayName: q.displayName,
              startDate: q.startDate,
              endDate: q.endDate,
              order: q.order,
              weeksCount: q.weeksCount ?? 9,
            })),
          },
        },
        include: {
          quarters: {
            orderBy: { order: 'asc' },
          },
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
        throw new Error(`Ya existe un año escolar con el nombre "${data.name}". Por favor, elige un nombre diferente.`);
      }
      throw error;
    }

    return SchoolYearMapper.toDomain(schoolYear);
  }

  async update(id: string, data: UpdateSchoolYearData): Promise<SchoolYear> {
    // Get the current school year to get schoolId
    const currentSchoolYear = await prisma.schoolYear.findUnique({
      where: { id },
      select: { schoolId: true },
    });

    if (!currentSchoolYear) {
      throw new Error('School year not found');
    }

    // Check if name conflicts with existing non-deleted school years (excluding current one)
    if (data.name !== undefined) {
      const existingSchoolYear = await prisma.schoolYear.findFirst({
        where: {
          name: data.name,
          schoolId: currentSchoolYear.schoolId,
          id: { not: id },
          deletedAt: null, // Only check non-deleted school years
        },
      });

      if (existingSchoolYear) {
        throw new Error(`Ya existe un año escolar con el nombre "${data.name}". Por favor, elige un nombre diferente.`);
      }
    }

    // Update school year
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.startDate !== undefined) updateData.startDate = data.startDate;
    if (data.endDate !== undefined) updateData.endDate = data.endDate;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    try {
      await prisma.schoolYear.update({
        where: { id },
        data: updateData,
      });
    } catch (error: any) {
      if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
        throw new Error(`Ya existe un año escolar con el nombre "${data.name}". Por favor, elige un nombre diferente.`);
      }
      throw error;
    }

    // Update quarters if provided
    if (data.quarters) {
      for (const quarter of data.quarters) {
        if (quarter.id) {
          // Update existing quarter
          const quarterUpdateData: any = {};
          if (quarter.name !== undefined) quarterUpdateData.name = quarter.name;
          if (quarter.displayName !== undefined) quarterUpdateData.displayName = quarter.displayName;
          if (quarter.startDate !== undefined) quarterUpdateData.startDate = quarter.startDate;
          if (quarter.endDate !== undefined) quarterUpdateData.endDate = quarter.endDate;
          if (quarter.order !== undefined) quarterUpdateData.order = quarter.order;
          if (quarter.weeksCount !== undefined) quarterUpdateData.weeksCount = quarter.weeksCount;

          await prisma.quarter.update({
            where: { id: quarter.id },
            data: quarterUpdateData,
          });
        }
      }
    }

    // Return updated school year
    const updatedSchoolYear = await prisma.schoolYear.findUnique({
      where: { id },
      include: {
        quarters: {
          where: { deletedAt: null },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!updatedSchoolYear) {
      throw new Error('School year not found after update');
    }

    return SchoolYearMapper.toDomain(updatedSchoolYear);
  }

  async delete(id: string): Promise<void> {
    await prisma.schoolYear.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async setActive(id: string, schoolId: string): Promise<SchoolYear> {
    // Deactivate all school years for this school
    await prisma.schoolYear.updateMany({
      where: { schoolId, deletedAt: null },
      data: { isActive: false },
    });

    // Activate the specified one
    const schoolYear = await prisma.schoolYear.update({
      where: { id },
      data: { isActive: true },
      include: {
        quarters: {
          where: { deletedAt: null },
          orderBy: { order: 'asc' },
        },
      },
    });

    return SchoolYearMapper.toDomain(schoolYear);
  }

  async getCurrentWeek(schoolId: string): Promise<CurrentWeekInfo | null> {
    const schoolYear = await this.findActiveBySchoolId(schoolId);
    
    if (!schoolYear || !schoolYear.quarters) {
      return null;
    }

    const now = new Date();
    
    // Check if we're within the school year
    if (now < schoolYear.startDate || now > schoolYear.endDate) {
      return {
        schoolYear,
        currentQuarter: null,
        currentWeek: null,
        weekStartDate: null,
        weekEndDate: null,
      };
    }

    // Find current quarter
    const currentQuarter = schoolYear.quarters.find(
      (q) => now >= q.startDate && now <= q.endDate
    );

    if (!currentQuarter) {
      return {
        schoolYear,
        currentQuarter: null,
        currentWeek: null,
        weekStartDate: null,
        weekEndDate: null,
      };
    }

    // Calculate current week within the quarter (1-9)
    const quarterStartTime = currentQuarter.startDate.getTime();
    const nowTime = now.getTime();
    const daysSinceQuarterStart = Math.floor((nowTime - quarterStartTime) / (1000 * 60 * 60 * 24));
    const currentWeek = Math.floor(daysSinceQuarterStart / 7) + 1;

    // Clamp to valid week range
    const validWeek = Math.max(1, Math.min(currentWeek, currentQuarter.weeksCount));

    // Calculate week boundaries
    const weekStartDay = (validWeek - 1) * 7;
    const weekStartDate = new Date(quarterStartTime + weekStartDay * 24 * 60 * 60 * 1000);
    const weekEndDate = new Date(weekStartDate.getTime() + 6 * 24 * 60 * 60 * 1000);

    return {
      schoolYear,
      currentQuarter,
      currentWeek: validWeek,
      weekStartDate,
      weekEndDate,
    };
  }
}


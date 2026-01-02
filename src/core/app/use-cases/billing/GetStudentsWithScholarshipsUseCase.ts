import prisma from '../../../frameworks/database/prisma.client';
import { GetStudentsWithScholarshipsInput } from '../../dtos';

// Helper function to normalize text: remove accents and convert to lowercase
function normalizeText(text: string): string {
  return text
    .normalize('NFD') // Decompose combined characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .toLowerCase()
    .trim();
}

export class GetStudentsWithScholarshipsUseCase {
  async execute(input: GetStudentsWithScholarshipsInput, schoolId: string): Promise<{
    students: any[];
    total: number;
    offset: number;
    limit: number;
  }> {
    const where: any = {
      schoolId,
      deletedAt: null,
    };

    // Get all students with their scholarships (we'll filter by search in JavaScript)
    const allStudents = await prisma.student.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        scholarship: true,
      },
    });

    // Apply search filter (case-insensitive and accent-insensitive)
    let studentsAfterSearch = allStudents;
    if (input.search) {
      const normalizedSearch = normalizeText(input.search);

      studentsAfterSearch = allStudents.filter((student) => {
        const firstName = normalizeText(student.user.firstName || '');
        const lastName = normalizeText(student.user.lastName || '');
        const email = normalizeText(student.user.email || '');
        const fullName = normalizeText(`${student.user.firstName} ${student.user.lastName}`);

        return (
          firstName.includes(normalizedSearch) ||
          lastName.includes(normalizedSearch) ||
          fullName.includes(normalizedSearch) ||
          email.includes(normalizedSearch)
        );
      });
    }

    // Get all tuition types
    const tuitionTypes = await prisma.tuitionType.findMany({
      where: { schoolId },
      orderBy: { displayOrder: 'asc' },
    });

    // Map students
    let filteredStudents = studentsAfterSearch.map(student => ({
      id: student.id,
      firstName: student.user?.firstName || '',
      lastName: student.user?.lastName || '',
      email: student.user?.email || '',
      scholarship: student.scholarship ? {
        id: student.scholarship.id,
        studentId: student.scholarship.studentId,
        tuitionTypeId: student.scholarship.tuitionTypeId,
        scholarshipType: student.scholarship.scholarshipType,
        scholarshipValue: student.scholarship.scholarshipValue ? Number(student.scholarship.scholarshipValue) : null,
        taxableBillRequired: student.scholarship.taxableBillRequired,
      } : null,
    }));

    // Apply tuition type filter
    if (input.tuitionTypeId && input.tuitionTypeId !== 'all') {
      filteredStudents = filteredStudents.filter(student => {
        const tuitionTypeId = student.scholarship?.tuitionTypeId || (tuitionTypes.length > 0 ? tuitionTypes[0].id : null);
        return tuitionTypeId === input.tuitionTypeId;
      });
    }

    // Apply scholarship filter
    if (input.hasScholarship && input.hasScholarship !== 'all') {
      filteredStudents = filteredStudents.filter(student => {
        const hasScholarship = student.scholarship &&
          student.scholarship.scholarshipType &&
          student.scholarship.scholarshipValue !== null &&
          student.scholarship.scholarshipValue > 0;
        return input.hasScholarship === 'yes' ? hasScholarship : !hasScholarship;
      });
    }

    // Apply sorting
    if (input.sortField) {
      filteredStudents.sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        const getTuitionAmount = (student: typeof filteredStudents[0]) => {
          const tuitionTypeId = student.scholarship?.tuitionTypeId || (tuitionTypes.length > 0 ? tuitionTypes[0].id : null);
          const type = tuitionTypes.find(t => t.id === tuitionTypeId);
          return type ? Number(type.baseAmount) : 0;
        };

        const getTotalAmount = (student: typeof filteredStudents[0]) => {
          const tuitionAmount = getTuitionAmount(student);
          const scholarship = student.scholarship;
          if (!scholarship || !scholarship.scholarshipType || scholarship.scholarshipValue === null || scholarship.scholarshipValue === 0) {
            return tuitionAmount;
          }
          if (scholarship.scholarshipType === 'percentage') {
            return tuitionAmount - (tuitionAmount * scholarship.scholarshipValue / 100);
          }
          return tuitionAmount - scholarship.scholarshipValue;
        };

        switch (input.sortField) {
          case 'name':
            aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
            bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
            break;
          case 'tuition':
            aValue = getTuitionAmount(a);
            bValue = getTuitionAmount(b);
            break;
          case 'total':
            aValue = getTotalAmount(a);
            bValue = getTotalAmount(b);
            break;
          case 'tuitionType':
            // Get tuition type names for sorting
            const aTypeId = a.scholarship?.tuitionTypeId || (tuitionTypes.length > 0 ? tuitionTypes[0].id : null);
            const bTypeId = b.scholarship?.tuitionTypeId || (tuitionTypes.length > 0 ? tuitionTypes[0].id : null);
            const aType = tuitionTypes.find(t => t.id === aTypeId);
            const bType = tuitionTypes.find(t => t.id === bTypeId);
            aValue = aType?.name?.toLowerCase() || '';
            bValue = bType?.name?.toLowerCase() || '';
            break;
          default:
            // If unknown field, don't sort
            aValue = 0;
            bValue = 0;
            break;
        }

        if (aValue < bValue) return input.sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return input.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Get total count after filtering
    const total = filteredStudents.length;

    // Apply pagination after all filtering
    const paginatedStudents = filteredStudents.slice(
      input.offset || 0,
      (input.offset || 0) + (input.limit || 10)
    );

    return {
      students: paginatedStudents,
      total,
      offset: input.offset || 0,
      limit: input.limit || 10,
    };
  }
}


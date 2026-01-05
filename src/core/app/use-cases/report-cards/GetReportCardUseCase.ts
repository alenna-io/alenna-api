import {
  IProjectionRepository,
  ISchoolYearRepository,
  IUserRepository,
  IProjectionPaceRepository,
  IMonthlyAssignmentsRepository,
  ISchoolMonthlyAssignmentTemplateRepository
} from '../../../adapters_interface/repositories';
import { RoleTypes } from '../../../domain/roles/RoleTypes';

export interface ReportCardSubjectData {
  subject: string;
  paces: Array<{
    id: string;
    code: string;
    grade: number | null;
    isCompleted: boolean;
    isFailed: boolean;
  }>;
  average: number | null; // Average of all PACE grades for this subject
  passedCount: number; // Count of passed PACEs (grade >= 80 and isCompleted)
}

export interface ReportCardMonthlyAssignment {
  id: string;
  name: string;
  grade: number | null;
  percentage: number; // Percentage weight for this assignment
}

export interface ReportCardQuarterData {
  quarter: string;
  subjects: ReportCardSubjectData[];
  monthlyAssignments: ReportCardMonthlyAssignment[];
  monthlyAssignmentAverage: number | null; // Average of all monthly assignment grades
  monthlyAssignmentPercentage: number; // Percentage that MAs represent (from QuarterGradePercentage)
  pacePercentage: number; // Percentage that PACEs represent (100 - MA%)
  overallAverage: number | null; // Average of all subject averages
  finalGrade: number | null; // (MA% × MA Average) + (PACE% × PACE Average)
  totalPassedPaces: number; // Total passed PACEs across all subjects
  academicProjectionCompleted: boolean; // All PACEs completed with non-failing grade
}

export interface ReportCardOutput {
  projectionId: string;
  studentId: string;
  studentName: string;
  schoolYear: string;
  quarters: {
    Q1: ReportCardQuarterData;
    Q2: ReportCardQuarterData;
    Q3: ReportCardQuarterData;
    Q4: ReportCardQuarterData;
  };
}

export class GetReportCardUseCase {
  constructor(
    private readonly projectionRepository: IProjectionRepository,
    private readonly schoolYearRepository: ISchoolYearRepository,
    private readonly userRepository: IUserRepository,
    private readonly projectionPaceRepository: IProjectionPaceRepository,
    private readonly monthlyAssignmentsRepository: IMonthlyAssignmentsRepository,
    private readonly schoolMonthlyAssignmentTemplateRepository: ISchoolMonthlyAssignmentTemplateRepository
  ) { }

  async execute(
    projectionId: string,
    studentId: string,
    userId?: string
  ): Promise<ReportCardOutput> {
    // 1. Verify projection exists and belongs to student
    const projection = await this.projectionRepository.findByIdWithStudent(projectionId, studentId);
    // const projection = await prisma.projection.findFirst({
    //   where: {
    //     id: projectionId,
    //     studentId,
    //     deletedAt: null,
    //   },
    //   include: {
    //     student: {
    //       include: {
    //         school: true,
    //         user: {
    //           select: {
    //             firstName: true,
    //             lastName: true,
    //           },
    //         },
    //       },
    //     },
    //     projectionCategories: {
    //       include: {
    //         category: true,
    //       },
    //     },
    //   },
    // });

    if (!projection) {
      throw new Error('Projection not found');
    }

    // Get the SchoolYear by name and schoolId
    const schoolYear = await this.schoolYearRepository.findByNameAndSchoolId(projection.student.schoolId, projection.schoolYear);
    // const schoolYear = await prisma.schoolYear.findFirst({
    //   where: {
    //     schoolId: projection.student.schoolId,
    //     name: projection.schoolYear,
    //     deletedAt: null,
    //   },
    //   include: {
    //     quarterGradePercentages: {
    //       where: { deletedAt: null },
    //     },
    //   },
    // });

    if (!schoolYear) {
      throw new Error('School year not found');
    }

    // 2. Verify permissions (similar to GetProjectionsByStudentIdUseCase)
    if (userId) {
      const user = await this.userRepository.findById(userId);
      // const user = await prisma.user.findUnique({
      //   where: { id: userId, deletedAt: null },
      //   select: {
      //     userRoles: {
      //       include: { role: true },
      //     },
      //     userStudents: {
      //       select: { studentId: true },
      //     },
      //     student: {
      //       select: { id: true },
      //     },
      //   },
      // });

      const hasParentRole = user?.roles.some(role => role.name === RoleTypes.PARENT);
      const hasTeacherOrAdminRole = user?.roles.some(role =>
        role.name === RoleTypes.TEACHER || role.name === RoleTypes.SCHOOL_ADMIN || role.name === RoleTypes.SUPERADMIN
      );
      const hasStudentRole = user?.roles.some(role => role.name === RoleTypes.STUDENT);

      // If user is ONLY a parent, verify they're linked to this student
      if (hasParentRole && !hasTeacherOrAdminRole) {
        const linkedStudentIds = new Set(user?.userStudents.map(us => us.studentId) || []);
        if (!linkedStudentIds.has(studentId)) {
          throw new Error('No tienes permiso para ver la boleta de este estudiante');
        }
      }

      // If user is ONLY a student, verify it's their own projection
      if (hasStudentRole && !hasTeacherOrAdminRole) {
        const ownStudentId = user?.student?.id;
        if (!ownStudentId || ownStudentId !== studentId) {
          throw new Error('No tienes permiso para ver la boleta de este estudiante');
        }
      }
    }

    // 3. Get all PACEs for this projection
    const projectionPaces = await this.projectionPaceRepository.findByProjectionId(projectionId);
    // const projectionPaces = await prisma.projectionPace.findMany({
    //   where: {
    //     projectionId,
    //     deletedAt: null,
    //   },
    //   include: {
    //     paceCatalog: {
    //       include: {
    //         subSubject: {
    //           include: {
    //             category: true,
    //           },
    //         },
    //       },
    //     },
    //   },
    // });

    // 4. Get all monthly assignments for this projection
    const monthlyAssignments = await this.monthlyAssignmentsRepository.findByProjectionId(projectionId);
    // const monthlyAssignments = await prisma.monthlyAssignment.findMany({
    //   where: {
    //     projectionId,
    //     deletedAt: null,
    //   },
    //   orderBy: [
    //     { quarter: 'asc' },
    //     { name: 'asc' },
    //   ],
    // });

    // 5. Get grade percentages for each quarter
    const gradePercentages = new Map<string, number>();
    schoolYear.quarterGradePercentages?.forEach(qgp => {
      gradePercentages.set(qgp.quarter, qgp.percentage);
    });

    // 6. Get school monthly assignment templates to know which assignments exist
    const schoolYearId = schoolYear.id;
    const templates = await this.schoolMonthlyAssignmentTemplateRepository.findBySchoolYearId(schoolYearId);
    // const templates = await prisma.schoolMonthlyAssignmentTemplate.findMany({
    //   where: {
    //     schoolYearId,
    //     deletedAt: null,
    //   },
    // });

    // 7. Extract projection categories if available
    const projectionCategoryNames = projection.projectionCategories
      ?.map(pc => pc.category.name)
      .sort((a, b) => {
        const pcA = projection.projectionCategories!.find(pc => pc.category.name === a);
        const pcB = projection.projectionCategories!.find(pc => pc.category.name === b);
        const orderA = pcA?.category.displayOrder || 999;
        const orderB = pcB?.category.displayOrder || 999;
        return orderA - orderB;
      }) || [];

    // 8. Organize data by quarter
    const quarters: {
      Q1: ReportCardQuarterData;
      Q2: ReportCardQuarterData;
      Q3: ReportCardQuarterData;
      Q4: ReportCardQuarterData;
    } = {
      Q1: this.buildQuarterData('Q1', projectionPaces, monthlyAssignments, templates, gradePercentages, projectionCategoryNames),
      Q2: this.buildQuarterData('Q2', projectionPaces, monthlyAssignments, templates, gradePercentages, projectionCategoryNames),
      Q3: this.buildQuarterData('Q3', projectionPaces, monthlyAssignments, templates, gradePercentages, projectionCategoryNames),
      Q4: this.buildQuarterData('Q4', projectionPaces, monthlyAssignments, templates, gradePercentages, projectionCategoryNames),
    };

    // Construct student full name from user
    const studentName = projection.student.user
      ? `${projection.student.user.firstName || ''} ${projection.student.user.lastName || ''}`.trim()
      : 'Estudiante';

    return {
      projectionId: projection.id,
      studentId: projection.studentId,
      studentName,
      schoolYear: projection.schoolYear,
      quarters,
    };
  }

  private buildQuarterData(
    quarter: string,
    projectionPaces: any[],
    monthlyAssignments: any[],
    templates: any[],
    gradePercentages: Map<string, number>,
    projectionCategories?: string[]
  ): ReportCardQuarterData {
    // Filter PACEs for this quarter
    const quarterPaces = projectionPaces.filter(pp => pp.quarter === quarter);

    // Filter monthly assignments for this quarter
    const quarterMAs = monthlyAssignments.filter(ma => ma.quarter === quarter);

    // Get templates for this quarter to know expected assignments
    const quarterTemplates = templates.filter(t => t.quarter === quarter);

    // Organize PACEs by category (group sub-subjects by category)
    const subjectsMap = new Map<string, ReportCardSubjectData>();

    quarterPaces.forEach(pp => {
      // Use category name instead of sub-subject name
      const categoryName = pp.paceCatalog.subSubject.category.name;

      if (!subjectsMap.has(categoryName)) {
        subjectsMap.set(categoryName, {
          subject: categoryName,
          paces: [],
          average: null,
          passedCount: 0,
        });
      }

      const subjectData = subjectsMap.get(categoryName)!;
      subjectData.paces.push({
        id: pp.id,
        code: pp.paceCatalog.code,
        grade: pp.grade,
        isCompleted: pp.isCompleted,
        isFailed: pp.isFailed,
      });
    });

    // If projection has categories, ensure they're all included even if empty
    if (projectionCategories && projectionCategories.length > 0) {
      projectionCategories.forEach(categoryName => {
        if (!subjectsMap.has(categoryName)) {
          subjectsMap.set(categoryName, {
            subject: categoryName,
            paces: [],
            average: null,
            passedCount: 0,
          });
        }
      });
    }

    // Default category order for sorting
    const categoryOrder = ['Math', 'English', 'Word Building', 'Science', 'Social Studies', 'Spanish', 'Electives'];
    const getCategoryOrder = (category: string): number => {
      const index = categoryOrder.indexOf(category);
      return index === -1 ? 999 : index;
    };

    // Calculate averages and counts for each subject
    const subjects: ReportCardSubjectData[] = Array.from(subjectsMap.values())
      .map(subject => {
        const grades = subject.paces
          .filter(p => p.grade !== null)
          .map(p => p.grade!);

        const average = grades.length > 0
          ? grades.reduce((sum, grade) => sum + grade, 0) / grades.length
          : null;

        const passedCount = subject.paces.filter(p =>
          p.grade !== null &&
          p.grade >= 80 &&
          p.isCompleted &&
          !p.isFailed
        ).length;

        return {
          ...subject,
          average: average !== null ? Math.round(average * 100) / 100 : null,
          passedCount,
        };
      })
      .sort((a, b) => getCategoryOrder(a.subject) - getCategoryOrder(b.subject));

    // Calculate monthly assignment average
    const maGrades = quarterMAs
      .filter(ma => ma.grade !== null)
      .map(ma => ma.grade!);

    const monthlyAssignmentAverage = maGrades.length > 0
      ? maGrades.reduce((sum, grade) => sum + grade, 0) / maGrades.length
      : null;

    // Build monthly assignments list with percentages
    // All assignments together represent the total MA percentage (not divided)
    const maPercentage = gradePercentages.get(quarter) || 0;

    const monthlyAssignmentsList: ReportCardMonthlyAssignment[] = quarterTemplates.map(template => {
      const assignment = quarterMAs.find(ma => ma.name === template.name);
      return {
        id: assignment?.id || template.id,
        name: template.name,
        grade: assignment?.grade ?? null,
        percentage: maPercentage, // Total percentage for all assignments combined
      };
    });

    // Calculate overall average (average of all subject averages)
    const subjectAverages = subjects
      .map(s => s.average)
      .filter((avg): avg is number => avg !== null);

    const overallAverage = subjectAverages.length > 0
      ? subjectAverages.reduce((sum, avg) => sum + avg, 0) / subjectAverages.length
      : null;

    // Calculate final grade
    // Final = (MA% × MA Average) + (PACE% × PACE Average)
    const pacePercentage = 100 - maPercentage;
    let finalGrade: number | null = null;

    if (monthlyAssignmentAverage !== null && overallAverage !== null) {
      finalGrade = (maPercentage / 100) * monthlyAssignmentAverage + (pacePercentage / 100) * overallAverage;
      finalGrade = Math.round(finalGrade * 100) / 100;
    } else if (monthlyAssignmentAverage !== null && maPercentage === 100) {
      finalGrade = monthlyAssignmentAverage;
    } else if (overallAverage !== null && pacePercentage === 100) {
      finalGrade = overallAverage;
    }

    // Calculate total passed PACEs
    const totalPassedPaces = subjects.reduce((sum, s) => sum + s.passedCount, 0);

    // Check if academic projection is completed
    // All PACEs must be completed with non-failing grade (grade >= 80)
    const allPacesCompleted = quarterPaces.every(pp =>
      pp.isCompleted &&
      pp.grade !== null &&
      pp.grade >= 80 &&
      !pp.isFailed
    );

    return {
      quarter,
      subjects,
      monthlyAssignments: monthlyAssignmentsList,
      monthlyAssignmentAverage: monthlyAssignmentAverage !== null
        ? Math.round(monthlyAssignmentAverage * 100) / 100
        : null,
      monthlyAssignmentPercentage: maPercentage,
      pacePercentage,
      overallAverage: overallAverage !== null ? Math.round(overallAverage * 100) / 100 : null,
      finalGrade,
      totalPassedPaces,
      academicProjectionCompleted: allPacesCompleted,
    };
  }
}


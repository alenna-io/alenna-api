import { IProjectionRepository } from '../../../adapters_interface/repositories';
import { IStudentRepository } from '../../../adapters_interface/repositories';
import { ProjectionDetailOutput, PaceOutput, GradeHistoryOutput, QuarterPacesOutput } from '../../dtos';
import { isElectivesCategory, formatElectiveDisplayName } from '../../../utils/elective-utils';

export class GetProjectionDetailUseCase {
  constructor(
    private projectionRepository: IProjectionRepository,
    private studentRepository: IStudentRepository
  ) { }

  async execute(id: string, studentId: string): Promise<ProjectionDetailOutput> {
    const projectionWithPaces = await this.projectionRepository.findByIdWithPaces(id, studentId);

    if (!projectionWithPaces) {
      throw new Error('Proyección no encontrada');
    }

    const { projection, projectionPaces, categories } = projectionWithPaces;

    // Fetch student information
    // We use empty schoolId since we're already filtering by studentId in projection query
    const student = await this.studentRepository.findById(studentId, '');

    if (!student) {
      throw new Error('Estudiante no encontrado');
    }

    // Get categories from projection (if available) or extract from paces
    const projectionCategoryNames = categories && categories.length > 0
      ? categories
        .map(c => ({ name: c.name, displayOrder: c.displayOrder }))
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map(c => c.name)
      : [];

    // If no categories tracked, extract from paces (backward compatibility)
    const categoryNamesFromPaces = new Set<string>();
    projectionPaces.forEach(pp => {
      const categoryName = pp.paceCatalog.subSubject.category.name;
      categoryNamesFromPaces.add(categoryName);
    });

    // Use projection categories if available, otherwise use categories from paces
    const categoryNames = projectionCategoryNames.length > 0
      ? projectionCategoryNames
      : Array.from(categoryNamesFromPaces).sort();

    // Collect all unique sub-subject names from projection paces
    // For electives, format as "Elective: [Name]"
    // For other categories, use sub-subject name directly
    const subSubjectDisplayNames = new Map<string, string>(); // subSubjectName -> displayName
    const subSubjectToCategory = new Map<string, string>(); // subSubjectName -> categoryName
    
    projectionPaces.forEach(pp => {
      const subSubjectName = pp.paceCatalog.subSubject.name;
      const categoryName = pp.paceCatalog.subSubject.category.name;
      subSubjectToCategory.set(subSubjectName, categoryName);
      
      if (isElectivesCategory(categoryName)) {
        subSubjectDisplayNames.set(subSubjectName, formatElectiveDisplayName(subSubjectName));
      } else {
        subSubjectDisplayNames.set(subSubjectName, subSubjectName);
      }
    });

    // Sort sub-subjects by display name for consistent ordering
    const sortedSubSubjects = Array.from(subSubjectDisplayNames.keys()).sort((a, b) => {
      const displayA = subSubjectDisplayNames.get(a) || a;
      const displayB = subSubjectDisplayNames.get(b) || b;
      return displayA.localeCompare(displayB);
    });

    // Initialize quarters structure with display names
    const quarters: {
      Q1: QuarterPacesOutput;
      Q2: QuarterPacesOutput;
      Q3: QuarterPacesOutput;
      Q4: QuarterPacesOutput;
    } = {
      Q1: this.initializeQuarter(sortedSubSubjects.map(name => subSubjectDisplayNames.get(name) || name)),
      Q2: this.initializeQuarter(sortedSubSubjects.map(name => subSubjectDisplayNames.get(name) || name)),
      Q3: this.initializeQuarter(sortedSubSubjects.map(name => subSubjectDisplayNames.get(name) || name)),
      Q4: this.initializeQuarter(sortedSubSubjects.map(name => subSubjectDisplayNames.get(name) || name)),
    };

    // Organize projection paces by quarter, display name, and week
    projectionPaces.forEach(pp => {
      const quarter = pp.quarter as 'Q1' | 'Q2' | 'Q3' | 'Q4';
      const subSubjectName = pp.paceCatalog.subSubject.name;
      const categoryName = pp.paceCatalog.subSubject.category.name;
      const displayName = subSubjectDisplayNames.get(subSubjectName) || subSubjectName;
      const weekIndex = pp.week - 1; // Convert week 1-9 to index 0-8

      const gradeHistory: GradeHistoryOutput[] = pp.gradeHistory.map(gh => ({
        id: gh.id,
        grade: gh.grade,
        date: gh.date.toISOString(),
        note: gh.note,
      }));

      const paceOutput: PaceOutput = {
        id: pp.id,
        paceCatalogId: pp.paceCatalogId,
        number: pp.paceCatalog.code,
        subject: displayName,
        category: categoryName,
        quarter: pp.quarter,
        week: pp.week,
        grade: pp.grade,
        isCompleted: pp.isCompleted,
        isFailed: pp.isFailed,
        isUnfinished: pp.isUnfinished,
        originalQuarter: pp.originalQuarter ?? undefined,
        originalWeek: pp.originalWeek ?? undefined,
        comments: pp.comments,
        gradeHistory,
        createdAt: pp.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: pp.updatedAt?.toISOString() || new Date().toISOString(),
      };

      // Add pace to its current quarter using display name
      if (quarters[quarter] && quarters[quarter][displayName]) {
        quarters[quarter][displayName][weekIndex] = paceOutput;
      }

      // If this is an unfinished pace with an originalQuarter, also add it to the original quarter
      // This creates a "copy" in Q1 (non-editable) while the actual pace is in Q2 (editable)
      if (pp.isUnfinished && pp.originalQuarter && pp.originalWeek) {
        const originalQuarter = pp.originalQuarter as 'Q1' | 'Q2' | 'Q3' | 'Q4';
        const originalWeekIndex = pp.originalWeek - 1; // Convert week 1-9 to index 0-8

        if (quarters[originalQuarter] && quarters[originalQuarter][displayName]) {
          // Create a copy of the paceOutput for the original quarter
          // This copy should be non-editable (marked as unfinished)
          const unfinishedCopy: PaceOutput = {
            ...paceOutput,
            quarter: originalQuarter,
            week: pp.originalWeek,
            isUnfinished: true,
            originalQuarter: originalQuarter,
            // Keep the same ID so frontend knows it's the same pace
          };

          // Only add if there's no pace already at this position in the original quarter
          if (!quarters[originalQuarter][displayName][originalWeekIndex]) {
            quarters[originalQuarter][displayName][originalWeekIndex] = unfinishedCopy;
          }
        }
      }
    });

    return {
      id: projection.id,
      studentId: projection.studentId,
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        fullName: student.fullName,
        age: student.age,
        currentLevel: student.currentLevel,
        certificationType: student.certificationType.name,
      },
      schoolYear: projection.schoolYear,
      startDate: projection.startDate.toISOString(),
      endDate: projection.endDate.toISOString(),
      isActive: projection.isActive,
      notes: projection.notes,
      createdAt: projection.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: projection.updatedAt?.toISOString() || new Date().toISOString(),
      categories: categoryNames,
      quarters,
    };
  }

  private initializeQuarter(subjectDisplayNames: string[]): QuarterPacesOutput {
    const quarter: QuarterPacesOutput = {};
    subjectDisplayNames.forEach(displayName => {
      quarter[displayName] = Array(9).fill(null); // 9 weeks per quarter
    });
    return quarter;
  }
}


import { IProjectionRepository } from '../../../adapters_interface/repositories';
import { IStudentRepository } from '../../../adapters_interface/repositories';
import { ProjectionDetailOutput, PaceOutput, GradeHistoryOutput, QuarterPacesOutput } from '../../dtos';

export class GetProjectionDetailUseCase {
  constructor(
    private projectionRepository: IProjectionRepository,
    private studentRepository: IStudentRepository
  ) {}

  async execute(id: string, studentId: string): Promise<ProjectionDetailOutput> {
    const projectionWithPaces = await this.projectionRepository.findByIdWithPaces(id, studentId);
    
    if (!projectionWithPaces) {
      throw new Error('Proyección no encontrada');
    }

    const { projection, projectionPaces } = projectionWithPaces;

    // Fetch student information
    // We use empty schoolId since we're already filtering by studentId in projection query
    const student = await this.studentRepository.findById(studentId, '');
    
    if (!student) {
      throw new Error('Estudiante no encontrado');
    }

    // Collect all unique sub-subject names from projection paces
    const subSubjectNames = new Set<string>();
    projectionPaces.forEach(pp => {
      const subSubjectName = pp.paceCatalog.subSubject.name;
      subSubjectNames.add(subSubjectName);
    });
    
    // Sort sub-subjects by name for consistent ordering
    const sortedSubSubjects = Array.from(subSubjectNames).sort();
    
    // Initialize quarters structure with actual sub-subject names
    const quarters: {
      Q1: QuarterPacesOutput;
      Q2: QuarterPacesOutput;
      Q3: QuarterPacesOutput;
      Q4: QuarterPacesOutput;
    } = {
      Q1: this.initializeQuarter(sortedSubSubjects),
      Q2: this.initializeQuarter(sortedSubSubjects),
      Q3: this.initializeQuarter(sortedSubSubjects),
      Q4: this.initializeQuarter(sortedSubSubjects),
    };

    // Organize projection paces by quarter, sub-subject name, and week
    projectionPaces.forEach(pp => {
      const quarter = pp.quarter as 'Q1' | 'Q2' | 'Q3' | 'Q4';
      const subSubjectName = pp.paceCatalog.subSubject.name;
      const weekIndex = pp.week - 1; // Convert week 1-9 to index 0-8

      if (quarters[quarter] && quarters[quarter][subSubjectName]) {
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
          subject: subSubjectName,
          category: pp.paceCatalog.subSubject.category.name,
          quarter: pp.quarter,
          week: pp.week,
          grade: pp.grade,
          isCompleted: pp.isCompleted,
          isFailed: pp.isFailed,
          comments: pp.comments,
          gradeHistory,
          createdAt: pp.createdAt?.toISOString() || new Date().toISOString(),
          updatedAt: pp.updatedAt?.toISOString() || new Date().toISOString(),
        };

        quarters[quarter][subSubjectName][weekIndex] = paceOutput;
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
      quarters,
    };
  }

  private initializeQuarter(categories: string[]): QuarterPacesOutput {
    const quarter: QuarterPacesOutput = {};
    categories.forEach(category => {
      quarter[category] = Array(9).fill(null); // 9 weeks per quarter
    });
    return quarter;
  }
}


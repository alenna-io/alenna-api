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
    const student = await this.studentRepository.findById(studentId, projection.schoolId);
    if (!student) {
      throw new Error('Estudiante no encontrado');
    }

    // Define all core categories
    const categories = ['Math', 'English', 'Science', 'Social Studies', 'Word Building', 'Spanish'];
    
    // Initialize quarters structure
    const quarters: {
      Q1: QuarterPacesOutput;
      Q2: QuarterPacesOutput;
      Q3: QuarterPacesOutput;
      Q4: QuarterPacesOutput;
    } = {
      Q1: this.initializeQuarter(categories),
      Q2: this.initializeQuarter(categories),
      Q3: this.initializeQuarter(categories),
      Q4: this.initializeQuarter(categories),
    };

    // Organize projection paces by quarter, category (subject), and week
    projectionPaces.forEach(pp => {
      const quarter = pp.quarter as 'Q1' | 'Q2' | 'Q3' | 'Q4';
      const categoryName = pp.paceCatalog.subSubject.category.name;
      const weekIndex = pp.week - 1; // Convert week 1-9 to index 0-8

      if (quarters[quarter] && quarters[quarter][categoryName]) {
        const gradeHistory: GradeHistoryOutput[] = pp.gradeHistory.map(gh => ({
          id: gh.id,
          grade: gh.grade,
          date: gh.date.toISOString(),
          note: gh.note,
        }));

        const paceOutput: PaceOutput = {
          id: pp.id,
          number: pp.paceCatalog.code,
          subject: categoryName,
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

        quarters[quarter][categoryName][weekIndex] = paceOutput;
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


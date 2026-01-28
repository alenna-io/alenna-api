import { IProjectionRepository, ISchoolYearRepository } from '../../../domain/interfaces/repositories';
import { InvalidEntityError, ObjectNotFoundError, DomainError } from '../../../domain/errors';
import { validateCuid } from '../../../domain/utils/validation';
import { Result, Ok, Err } from '../../../domain/utils/Result';
import { GetProjectionDetailsOutput } from '../../dtos/projections/GetProjectionDetailsOutput';

export class GetProjectionDetailsUseCase {
  constructor(
    private readonly projectionRepository: IProjectionRepository,
    private readonly schoolYearRepository: ISchoolYearRepository,
  ) { }

  async execute(projectionId: string): Promise<Result<GetProjectionDetailsOutput, DomainError>> {
    try {
      validateCuid(projectionId, 'Projection');

      const projection = await this.projectionRepository.findById(projectionId);

      if (!projection) {
        return Err(new ObjectNotFoundError('Projection', `Projection with ID ${projectionId} not found`));
      }

      const schoolYear = await this.schoolYearRepository.findById(projection.schoolYear);
      const schoolYearName = schoolYear?.name || projection.schoolYear;

      const output: GetProjectionDetailsOutput = {
        id: projection.id,
        studentId: projection.studentId,
        schoolId: projection.schoolId,
        schoolYear: projection.schoolYear,
        schoolYearName,
        status: projection.status,
        student: {
          id: projection.student.id,
          user: {
            id: projection.student.user.id,
            firstName: projection.student.user.firstName,
            lastName: projection.student.user.lastName,
          },
        },
        projectionPaces: projection.projectionPaces.map(pace => ({
          id: pace.id,
          projectionId: pace.projectionId,
          paceCatalogId: pace.paceCatalogId,
          quarter: pace.quarter,
          week: pace.week,
          grade: pace.grade,
          status: pace.status,
          originalQuarter: pace.originalQuarter,
          originalWeek: pace.originalWeek,
          paceCatalog: {
            id: pace.paceCatalog.id,
            code: pace.paceCatalog.code,
            name: pace.paceCatalog.name,
            orderIndex: pace.paceCatalog.orderIndex,
            subject: {
              id: pace.paceCatalog.subject.id,
              name: pace.paceCatalog.subject.name,
              category: {
                id: pace.paceCatalog.subject.category.id,
                name: pace.paceCatalog.subject.category.name,
                displayOrder: pace.paceCatalog.subject.category.displayOrder,
              },
            },
          },
          gradeHistory: pace.gradeHistory.map(history => ({
            id: history.id,
            grade: history.grade,
            date: history.date.toISOString(),
            note: history.note,
          })),
        })),
        dailyGoals: projection.dailyGoals.map(goal => ({
          id: goal.id,
          subject: goal.subject,
          quarter: goal.quarter,
          week: goal.week,
          dayOfWeek: goal.dayOfWeek,
          text: goal.text,
          isCompleted: goal.isCompleted,
          notes: goal.notes,
          notesCompleted: goal.notesCompleted,
        })),
        createdAt: projection.createdAt.toISOString(),
        updatedAt: projection.updatedAt.toISOString(),
      };

      return Ok(output);
    } catch (error) {
      if (error instanceof InvalidEntityError || error instanceof ObjectNotFoundError) {
        return Err(error as DomainError);
      }
      throw error;
    }
  }
}

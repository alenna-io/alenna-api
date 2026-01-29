import {
  IProjectionRepository,
  IStudentRepository,
  ISchoolRepository,
  ISchoolYearRepository,
  IProjectionPaceRepository,
  IPaceCatalogRepository,
  ISubjectRepository,
  ICategoryRepository,
} from '../../../domain/interfaces/repositories';
import { ObjectAlreadyExistsError, InvalidEntityError, ObjectNotFoundError, DomainError } from '../../../domain/errors';
import { GenerateProjectionInput } from '../../dtos/projections/GenerateProjectionInput';
import { ProjectionGenerator } from '../../../domain/algorithms/projection-generator';
import prisma from '../../../infrastructure/database/prisma.client';
import { PrismaTransaction } from '../../../infrastructure/database/PrismaTransaction';
import { Prisma, ProjectionPaceStatus } from '@prisma/client';
import { logger } from '../../../../utils/logger';
import { validateCuid, validateCuids } from '../../../domain/utils/validation';
import { Result, Ok, Err } from '../../../domain/utils/Result';

export class GenerateProjectionUseCase {
  constructor(
    private readonly projectionRepository: IProjectionRepository,
    private readonly studentRepository: IStudentRepository,
    private readonly schoolRepository: ISchoolRepository,
    private readonly schoolYearRepository: ISchoolYearRepository,
    private readonly projectionPaceRepository: IProjectionPaceRepository,
    private readonly paceCatalogRepository: IPaceCatalogRepository,
    private readonly subjectRepository: ISubjectRepository,
    private readonly categoryRepository: ICategoryRepository,
    private readonly projectionGenerator: ProjectionGenerator,
  ) { }

  async execute(input: GenerateProjectionInput): Promise<Result<Prisma.ProjectionGetPayload<{}>, DomainError>> {
    try {
      validateCuid(input.studentId, 'Student');
      validateCuid(input.schoolId, 'School');
      validateCuid(input.schoolYear, 'SchoolYear');

      if (!input.subjects || input.subjects.length === 0) {
        return Err(new InvalidEntityError(
          'Projection',
          'At least one subject is required to generate a projection'
        ));
      }

      const categoryIds = [...new Set(input.subjects.map(s => s.categoryId))];
      validateCuids(categoryIds, 'Category');

      const projection = await prisma.$transaction(async (tx) => {
        logger.info("Validating student, school and year...");
        await this.validateStudentSchoolYear(input, tx as PrismaTransaction);

        logger.info("Checking if projection already exists...");
        const existing =
          await this.projectionRepository.findActiveByStudent(
            input.studentId,
            input.schoolId,
            input.schoolYear,
            tx as PrismaTransaction
          );

        if (existing) {
          throw new ObjectAlreadyExistsError('Projection', 'A projection already exists for this student in this school year.');
        }

        logger.info("Validating pace boundaries...");
        const { paceCatalogMap, subjectDifficulties } = await this.getPaceCatalogAndSubjectDifficulties(input, tx as PrismaTransaction);
        logger.debug("Subject Difficulties", subjectDifficulties);

        logger.info("Creating empty projection...");
        const projection = await this.projectionRepository.create({
          studentId: input.studentId,
          schoolId: input.schoolId,
          schoolYear: input.schoolYear,
        }, tx as PrismaTransaction);

        logger.info("Generating projection pace distribution...");

        for (const subject of input.subjects) {
          subject.difficulty = subjectDifficulties[subject.categoryId];
        }

        const generated = this.projectionGenerator.generate(input);

        logger.info("Creating projection paces objects...");
        const projectionPacesData = generated.map(g => {
          const paceCatalog =
            paceCatalogMap.get(`${g.categoryId}:${g.paceCode}`);

          if (!paceCatalog) {
            throw new InvalidEntityError(
              'PaceCatalog',
              `Pace ${g.paceCode} not found for category ${g.categoryId}`
            );
          }

          return {
            id: crypto.randomUUID(),
            projectionId: projection.id,
            paceCatalogId: paceCatalog.id,
            quarter: g.quarter.toString(),
            week: g.week,
            status: ProjectionPaceStatus.PENDING,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        });

        logger.info("Persisting projection paces...");
        await this.projectionPaceRepository.createMany(projectionPacesData, tx as PrismaTransaction);

        return projection;
      });

      return Ok(projection);
    } catch (error) {
      if (error instanceof InvalidEntityError || error instanceof ObjectAlreadyExistsError || error instanceof ObjectNotFoundError) {
        return Err(error as DomainError);
      }
      throw error;
    }
  }

  private async validateStudentSchoolYear(input: GenerateProjectionInput, tx: PrismaTransaction) {
    const student = await this.studentRepository.findById(input.studentId, input.schoolId, tx as PrismaTransaction);
    if (!student) {
      throw new InvalidEntityError('Student', 'Student not found; cannot create projection.');
    }

    // Validate school
    const school = await this.schoolRepository.findById(input.schoolId, tx as PrismaTransaction);
    if (!school) {
      throw new InvalidEntityError('School', 'School not found; cannot create projection.');
    }

    // Validate student is in school
    if (student.schoolId !== input.schoolId) {
      throw new InvalidEntityError('Student', 'Student not found in this school; cannot create projection.');
    }

    // Validate school year
    const schoolYear = await this.schoolYearRepository.findById(input.schoolYear, input.schoolId, tx as PrismaTransaction);
    if (!schoolYear) {
      throw new InvalidEntityError('SchoolYear', 'School year not found; cannot create projection.');
    }

    // Validate school year is active
    if (schoolYear.status !== 'CURRENT_YEAR') {
      throw new InvalidEntityError('SchoolYear', 'School year is not active; cannot create projection.');
    }
  }

  private async getPaceCatalogAndSubjectDifficulties(
    input: GenerateProjectionInput,
    tx: PrismaTransaction
  ): Promise<{
    paceCatalogMap: Map<string, Prisma.PaceCatalogGetPayload<{}>>,
    subjectDifficulties: Record<string, number>
  }> {

    if (!input.subjects.length) {
      throw new InvalidEntityError(
        'Projection',
        'At least one subject is required to generate a projection'
      );
    }

    // ─────────────────────────────────────────────
    // 1. Validate categories
    // ─────────────────────────────────────────────
    const requestedCategoryIds = [
      ...new Set(input.subjects.map(s => s.categoryId)),
    ];

    const categories =
      await this.categoryRepository.findManyByIds(requestedCategoryIds, tx);

    if (categories.length !== requestedCategoryIds.length) {
      throw new InvalidEntityError(
        'Category',
        'One or more categories not found'
      );
    }

    // ─────────────────────────────────────────────
    // 2. Validate contiguous pace ranges (orderIndex-based)
    // ─────────────────────────────────────────────
    for (const subject of input.subjects) {
      await this.categoryRepository.assertContiguousPaceRange(
        subject.categoryId,
        subject.startPace,
        subject.endPace,
        tx
      );
    }

    // ─────────────────────────────────────────────
    // 3. Fetch all pace catalogs per subject range
    //    (orderIndex-driven, NOT numeric loops)
    // ─────────────────────────────────────────────
    const paceCatalogMap = new Map<string, Prisma.PaceCatalogGetPayload<{}>>();
    const requestedSubjectIds = new Set<string>();

    for (const subject of input.subjects) {
      const paces =
        await this.paceCatalogRepository.findByCategoryAndOrderRange(
          subject.categoryId,
          subject.startPace,
          subject.endPace,
          tx
        );

      if (!paces.length) {
        throw new InvalidEntityError(
          'PaceCatalog',
          `No paces found for subject ${subject.subjectId}`
        );
      }

      for (const pace of paces) {
        requestedSubjectIds.add(pace.subjectId);
        paceCatalogMap.set(
          `${pace.categoryId}:${pace.code}`,
          pace
        );
      }
    }

    if (!paceCatalogMap.size) {
      throw new InvalidEntityError(
        'PaceCatalog',
        'No pace catalogs found for requested ranges'
      );
    }

    // ─────────────────────────────────────────────
    // 4. Validate subjects and extract difficulties
    // ─────────────────────────────────────────────
    const subjectCategoryMap = new Map<string, Set<string>>();
    const subjects =
      await this.subjectRepository.findManyByIds(
        Array.from(requestedSubjectIds),
        tx
      );

    if (subjects.length !== requestedSubjectIds.size) {
      throw new InvalidEntityError(
        'Subject',
        'One or more subjects not found'
      );
    }

    for (const subject of subjects) {
      if (!subjectCategoryMap.has(subject.id)) {
        subjectCategoryMap.set(subject.id, new Set());
      }
      subjectCategoryMap.get(subject.id)!.add(subject.categoryId);
    }

    const subjectDifficulties: Record<string, number> =
      Object.fromEntries(
        subjects.map(s => [subjectCategoryMap.get(s.id)!.values().next().value, s.difficulty]) as [string, number][]
      );

    return {
      paceCatalogMap,
      subjectDifficulties,
    };
  }

}

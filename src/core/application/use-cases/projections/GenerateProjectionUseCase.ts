import {
  PrismaPaceCatalogRepository,
  PrismaProjectionPaceRepository,
  PrismaProjectionRepository,
  PrismaSchoolRepository,
  PrismaSchoolYearRepository,
  PrismaStudentRepository,
  PrismaSubjectRepository,
  PrismaCategoryRepository,
} from '../../../infrastructure/repositories';
import { ObjectAlreadyExistsError, InvalidEntityError } from '../../../domain/errors';
import { GenerateProjectionInput } from '../../dtos/projections/GenerateProjectionInput';
import { ProjectionGenerator } from '../../../domain/algorithms/projection-generator';
import prisma from '../../../infrastructure/database/prisma.client';
import { PrismaTransaction } from '../../../infrastructure/database/PrismaTransaction';
import { Prisma, ProjectionPaceStatus } from '@prisma/client';

export class GenerateProjectionUseCase {
  constructor(
    private readonly projectionRepository: PrismaProjectionRepository,
    private readonly studentRepository: PrismaStudentRepository,
    private readonly schoolRepository: PrismaSchoolRepository,
    private readonly schoolYearRepository: PrismaSchoolYearRepository,
    private readonly projectionPaceRepository: PrismaProjectionPaceRepository,
    private readonly paceCatalogRepository: PrismaPaceCatalogRepository,
    private readonly subjectRepository: PrismaSubjectRepository,
    private readonly categoryRepository: PrismaCategoryRepository,
    private readonly projectionGenerator: ProjectionGenerator,
  ) { }

  async execute(input: GenerateProjectionInput) {
    return prisma.$transaction(async (tx) => {
      // 1. Validate student / school / year
      console.log("Validating student, school and year...");
      await this.validateStudentSchoolYear(input, tx as PrismaTransaction);

      // 2. Ensure projection does not exist
      console.log("Checking if projection already exists...");
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

      // 3. Validate pace boundaries exist (DB validation)
      console.log("Validating pace boundaries...");
      const { paceCatalogMap, subjectDifficulties } = await this.getPaceCatalogAndSubjectDifficulties(input, tx as PrismaTransaction);
      console.log("Subject Difficulties");
      console.log(subjectDifficulties);

      // 4. Create projection
      console.log("Creating empty projection...");
      const projection = await this.projectionRepository.create({
        studentId: input.studentId,
        schoolId: input.schoolId,
        schoolYear: input.schoolYear,
      }, tx as PrismaTransaction);

      // 5. Generate logical paces (PURE DOMAIN)
      console.log("Generating projection pace distribution. No pace data persistence...");

      for (const subject of input.subjects) {
        subject.difficulty = subjectDifficulties[subject.categoryId];
      }

      // console.log("Input with difficulties");
      // console.log(input);

      const generated = this.projectionGenerator.generate(input);

      // console.log("Generated");
      // console.log(generated);

      // console.log("Pace Catalog Map");
      // console.log(Array.from(paceCatalogMap.keys()));

      // 6. Create ProjectionPace data for Prisma
      console.log("Creating projection paces objects...");
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


      // 7. Persist in bulk
      console.log("Persisting projection paces...");
      await this.projectionPaceRepository.createMany(projectionPacesData, tx as PrismaTransaction);

      return projection;
    });
  }

  private async validateStudentSchoolYear(input: GenerateProjectionInput, tx: PrismaTransaction) {
    const student = await this.studentRepository.findById(input.studentId, tx as PrismaTransaction);
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
    const schoolYear = await this.schoolYearRepository.findById(input.schoolYear, tx as PrismaTransaction);
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

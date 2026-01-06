import {
  PaceCatalogRepository,
  ProjectionPaceRepository,
  ProjectionRepository,
  SchoolRepository,
  SchoolYearRepository,
  StudentRepository,
  SubSubjectRepository,
} from '../../../../adapters_interface/repositories/v2';
import { SchoolYearStatusEnum } from '../../../../domain/entities/v2/SchoolYear';
import { ObjectAlreadyExistsError } from '../../../errors/v2/ObjectAlreadyExistsError';
import { InvalidEntityError } from '../../../errors/v2';
import { GenerateProjectionInput } from '../../../dtos/v2/projections/GenerateProjectionInput';
import { ProjectionGenerator } from '../../../../domain/services/ProjectionGenerator';
import { ProjectionPaceFactory } from '../../../../domain/factories/ProjectionPaceFactory';
import prisma from '../../../../frameworks/database/prisma.client';
import { PrismaTransaction } from '../../../../frameworks/database/PrismaTransaction';
import { PaceCatalog } from '../../../../domain/entities/v2/PaceCatalog';

export class GenerateProjectionUseCase {
  constructor(
    private readonly projectionRepository: ProjectionRepository,
    private readonly studentRepository: StudentRepository,
    private readonly schoolRepository: SchoolRepository,
    private readonly schoolYearRepository: SchoolYearRepository,
    private readonly projectionPaceRepository: ProjectionPaceRepository,
    private readonly paceCatalogRepository: PaceCatalogRepository,
    private readonly subSubjectRepository: SubSubjectRepository,
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
        subject.difficulty = subjectDifficulties[subject.subSubjectId];
      }

      console.log("Input with difficulties");
      console.log(input);

      const generated = this.projectionGenerator.generate(input);

      console.log("Generated");
      // console.log(generated);

      // 6. Create ProjectionPace entities
      console.log("Creating projection paces objects...");
      const projectionPaces = generated.map(g => {
        const paceCatalog =
          paceCatalogMap.get(`${g.subSubjectId}:${g.paceCode}`);

        if (!paceCatalog) {
          throw new InvalidEntityError(
            'PaceCatalog',
            `Pace ${g.paceCode} not found for sub-subject ${g.subSubjectId}`
          );
        }

        return ProjectionPaceFactory.create({
          projectionId: projection.id,
          paceCatalogId: paceCatalog.id,
          quarter: g.quarter,
          week: g.week,
        });
      });


      // 7. Persist in bulk
      console.log("Persisting projection paces...");
      await this.projectionPaceRepository.createMany(projectionPaces, tx as PrismaTransaction);

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
    if (schoolYear.status !== SchoolYearStatusEnum.CURRENT_YEAR) {
      throw new InvalidEntityError('SchoolYear', 'School year is not active; cannot create projection.');
    }
  }

  private async getPaceCatalogAndSubjectDifficulties(input: GenerateProjectionInput, tx: PrismaTransaction): Promise<{ paceCatalogMap: Map<string, PaceCatalog>, subjectDifficulties: Record<string, number> }> {
    const requestedCodesSet = new Set<string>();

    for (const subject of input.subjects) {
      const startPace = subject.startPace;
      const endPace = subject.endPace;
      for (let pace = startPace; pace <= endPace; pace++) {
        requestedCodesSet.add(pace.toString());
      }
    }

    const requestedSubSubjectIdsSet = new Set<string>();
    for (const subject of input.subjects) {
      requestedSubSubjectIdsSet.add(subject.subSubjectId);
    }

    if (!input.subjects.length) {
      throw new InvalidEntityError(
        'Projection',
        'At least one subject is required to generate a projection'
      );
    }

    const requestedSubSubjects = await this.subSubjectRepository.findManyByIds(Array.from(requestedSubSubjectIdsSet), tx as PrismaTransaction);

    if (!requestedSubSubjects || requestedSubSubjects.length !== requestedSubSubjectIdsSet.size) {
      throw new InvalidEntityError('SubSubject', 'One or more sub-subjects not found');
    }

    console.log("Requested Codes Set");
    console.log(requestedCodesSet);

    console.log("Requested Sub Subject IDs Set");
    console.log(requestedSubSubjectIdsSet);

    const paceCatalogMap =
      await this.paceCatalogRepository.findByCodesAndSubSubjects(
        Array.from(requestedCodesSet),
        Array.from(requestedSubSubjectIdsSet),
        tx as PrismaTransaction
      );

    console.log("Pace Catalog Map");
    console.log(paceCatalogMap);

    if (!paceCatalogMap.size) {
      throw new InvalidEntityError('PaceCatalog', 'No pace catalogs found for these subjects');
    }

    for (const subject of input.subjects) {
      if (!paceCatalogMap.has(`${subject.subSubjectId}:${subject.startPace}`)) {
        throw new InvalidEntityError('PaceCatalog', 'Invalid start pace');
      }
      if (!paceCatalogMap.has(`${subject.subSubjectId}:${subject.endPace}`)) {
        throw new InvalidEntityError('PaceCatalog', 'Invalid end pace');
      }
    }

    return {
      paceCatalogMap,
      subjectDifficulties: Object.fromEntries(requestedSubSubjects.map(s => [s.id, s.difficulty]) as [string, number][]),
    };
  }
}

to create a projection we need
1. endpoint to get current school data with school year (from current user)
2. endpoint to get enrolled students with no open projection yet by school id
3. endpoint to get all categories with subjects (done)
4. endpoint to get, from a selected subject, paces from current subject and next 2 levels e.g. Selected Math 1: get paces for Math 1, 2 and 3

1. Get current school data with school year (from current user)
Place in: ISchoolRepository
Returns school data
SchoolYear belongs to School (has schoolId foreign key)
User's schoolId comes from auth context
Method: findByIdWithCurrentSchoolYear(id: string, tx?: PrismaTransaction)

2. Get enrolled students with no open projection yet by school id
Place in: IStudentRepository
Queries students
Filters: enrolled status and no open projection
schoolId is a filter parameter
Method: findEnrolledWithoutOpenProjection(schoolId: string, tx?: PrismaTransaction)

3. Get all categories with subjects
Already done in: ICategoryRepository
Method: findAllWithSubjects(tx?: PrismaTransaction)

4. Get paces from current subject and next 2 levels
Place in: IPaceCatalogRepository
Queries paces
Logic: find current subject's level, get next 2 levels, find subjects in those levels (same category), get their paces
Method: findBySubjectAndNextLevels(subjectId: string, levelsCount: number, tx?: PrismaTransaction)
Note for #4: This may require coordination with ISubjectRepository to find subjects by level. Consider:
Option A: Add a helper in ISubjectRepository like findByCategoryAndLevels(categoryId: string, levelIds: string[], tx?: PrismaTransaction), then use it in the use case
Option B: Keep it in IPaceCatalogRepository and join through Subject in the query
Recommendation: Option B — keep the pace query in IPaceCatalogRepository and join through Subject, since the result is paces.
Summary:
ISchoolRepository — school + current school year
IStudentRepository — students without open projections
ICategoryRepository — already done
IPaceCatalogRepository — paces for subject + next 2 levels
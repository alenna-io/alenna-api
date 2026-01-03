export interface StudentTuitionAssignmentRepository {
  findByStudentId(
    studentId: string,
    schoolId: string
  ): Promise<StudentTuitionAssignment | null>;

  assign(
    assignment: StudentTuitionAssignment
  ): Promise<StudentTuitionAssignment>;

  changeTuitionType(
    assignmentId: string,
    tuitionTypeId: string,
    schoolId: string
  ): Promise<void>;
}

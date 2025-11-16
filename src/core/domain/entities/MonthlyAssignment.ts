export class MonthlyAssignment {
  constructor(
    public id: string,
    public projectionId: string,
    public name: string,
    public quarter: string,
    public grade: number | null,
    public createdAt: Date,
    public updatedAt: Date,
    public deletedAt?: Date
  ) {}

  // Update grade
  updateGrade(grade: number): void {
    if (grade < 0 || grade > 100) {
      throw new Error('Grade must be between 0 and 100');
    }
    this.grade = grade;
    this.updatedAt = new Date();
  }

  // Update name
  updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Assignment name cannot be empty');
    }
    this.name = name.trim();
    this.updatedAt = new Date();
  }

  // Soft delete
  delete(): void {
    this.deletedAt = new Date();
  }

  // Check if deleted
  isDeleted(): boolean {
    return !!this.deletedAt;
  }
}

export class MonthlyAssignmentGradeHistory {
  constructor(
    public id: string,
    public monthlyAssignmentId: string,
    public grade: number,
    public date: Date,
    public note: string | undefined,
    public createdAt: Date
  ) {}
}


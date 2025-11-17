// Domain Entity: DailyGoal
export class DailyGoal {
  constructor(
    public readonly id: string,
    public readonly projectionId: string,
    public readonly subject: string,
    public readonly quarter: string,
    public readonly week: number,
    public readonly dayOfWeek: number,
    public readonly text: string,
    public readonly isCompleted: boolean = false,
    public readonly notes?: string,
    public readonly notesCompleted: boolean = false,
    public readonly deletedAt?: Date,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date
  ) {}

  static create(props: {
    id: string;
    projectionId: string;
    subject: string;
    quarter: string;
    week: number;
    dayOfWeek: number;
    text: string;
    isCompleted?: boolean;
    notes?: string;
    notesCompleted?: boolean;
  }): DailyGoal {
    return new DailyGoal(
      props.id,
      props.projectionId,
      props.subject,
      props.quarter,
      props.week,
      props.dayOfWeek,
      props.text,
      props.isCompleted ?? false,
      props.notes,
      props.notesCompleted ?? false,
      undefined,
      new Date(),
      new Date()
    );
  }

  update(props: Partial<Omit<DailyGoal, 'id' | 'projectionId' | 'createdAt' | 'updatedAt'>>): DailyGoal {
    return new DailyGoal(
      this.id,
      this.projectionId,
      props.subject ?? this.subject,
      props.quarter ?? this.quarter,
      props.week ?? this.week,
      props.dayOfWeek ?? this.dayOfWeek,
      props.text ?? this.text,
      props.isCompleted ?? this.isCompleted,
      props.notes ?? this.notes,
      props.notesCompleted ?? this.notesCompleted,
      props.deletedAt ?? this.deletedAt,
      this.createdAt,
      new Date()
    );
  }

  markCompleted(): DailyGoal {
    return this.update({ isCompleted: true });
  }

  markIncomplete(): DailyGoal {
    return this.update({ isCompleted: false });
  }

  updateNotes(notes?: string, notesCompleted?: boolean): DailyGoal {
    return this.update({ notes, notesCompleted });
  }

  softDelete(): DailyGoal {
    return this.update({ deletedAt: new Date() });
  }

  get isDeleted(): boolean {
    return this.deletedAt !== undefined;
  }

  get isValidText(): boolean {
    if (!this.text.trim()) return true; // Empty is valid
    
    const trimmedText = this.text.trim();
    
    // Check for "ST" (Self Test) - case insensitive
    if (/^st$/i.test(trimmedText)) {
      return true;
    }
    
    // Check for "T" (Test) - case insensitive
    if (/^t$/i.test(trimmedText)) {
      return true;
    }
    
    // Check for range format (e.g., "45-46", "1-10")
    const rangeMatch = trimmedText.match(/^([1-9]\d{0,3})-([1-9]\d{0,3})$/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1]);
      const end = parseInt(rangeMatch[2]);
      return start >= 1 && end <= 1000 && start <= end;
    }
    
    // Check for single number (1-1000)
    const singleMatch = trimmedText.match(/^[1-9]\d{0,3}$/);
    if (singleMatch) {
      const num = parseInt(singleMatch[0]);
      return num >= 1 && num <= 1000;
    }
    
    return false;
  }

  calculatePages(): number {
    if (!this.text.trim()) return 0;

    const trimmedText = this.text.trim();

    // Check for "ST" (Self Test) - case insensitive
    if (/^st$/i.test(trimmedText)) {
      return 3;
    }

    // Check for "T" (Test) - case insensitive
    if (/^t$/i.test(trimmedText)) {
      return 1;
    }

    // Check for range format (e.g., "45-46", "1-10")
    const rangeMatch = trimmedText.match(/^([1-9]\d{0,3})-([1-9]\d{0,3})$/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1]);
      const end = parseInt(rangeMatch[2]);
      if (start >= 1 && end <= 1000 && start <= end) {
        return end - start + 1; // +1 because both start and end are included
      }
    }

    // Check for single number (1-1000)
    const singleMatch = trimmedText.match(/^[1-9]\d{0,3}$/);
    if (singleMatch) {
      const num = parseInt(singleMatch[0]);
      if (num >= 1 && num <= 1000) {
        return 1;
      }
    }

    return 0;
  }
}

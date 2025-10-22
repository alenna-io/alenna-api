// Domain Entity: NoteHistory
export class NoteHistory {
  constructor(
    public readonly id: string,
    public readonly dailyGoalId: string,
    public readonly text: string,
    public readonly completedDate: Date,
    public readonly createdAt?: Date
  ) {}

  static create(props: {
    id: string;
    dailyGoalId: string;
    text: string;
    completedDate?: Date;
  }): NoteHistory {
    return new NoteHistory(
      props.id,
      props.dailyGoalId,
      props.text,
      props.completedDate ?? new Date(),
      new Date()
    );
  }

  get isRecent(): boolean {
    const now = new Date();
    const diffInDays = (now.getTime() - this.completedDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffInDays <= 7; // Consider recent if completed within last 7 days
  }
}

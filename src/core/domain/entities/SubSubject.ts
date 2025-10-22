// Domain Entity: SubSubject
export class SubSubject {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly categoryId: string,
    public readonly levelId: string,
    public readonly difficulty: number = 3,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date
  ) {}

  static create(props: {
    id: string;
    name: string;
    categoryId: string;
    levelId: string;
    difficulty?: number;
  }): SubSubject {
    return new SubSubject(
      props.id,
      props.name,
      props.categoryId,
      props.levelId,
      props.difficulty ?? 3,
      new Date(),
      new Date()
    );
  }

  get difficultyLabel(): string {
    const labels = ['', 'Very Easy', 'Easy', 'Moderate', 'Difficult', 'Very Difficult'];
    return labels[this.difficulty] || 'Unknown';
  }
}


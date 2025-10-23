// Domain Entity: Level (L1-L12 or special levels)
export class Level {
  constructor(
    public readonly id: string,
    public readonly number: number | null,
    public readonly name: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date
  ) {}

  static create(props: {
    id: string;
    number?: number | null;
    name: string;
  }): Level {
    return new Level(
      props.id,
      props.number ?? null,
      props.name,
      new Date(),
      new Date()
    );
  }

  get isStandardLevel(): boolean {
    return this.number !== null && this.number >= 1 && this.number <= 12;
  }
}


export class Level {
  constructor(
    public readonly id: string,
    public readonly number: number | null,
    public readonly name: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) { }
}
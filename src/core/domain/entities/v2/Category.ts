export class Category {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | undefined,
    public readonly displayOrder: number = 0,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) { }
}
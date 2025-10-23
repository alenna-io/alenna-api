// Domain Entity: Category (Mega Subject)
export class Category {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | undefined,
    public readonly displayOrder: number = 0,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date
  ) {}

  static create(props: {
    id: string;
    name: string;
    description?: string;
    displayOrder?: number;
  }): Category {
    return new Category(
      props.id,
      props.name,
      props.description,
      props.displayOrder ?? 0,
      new Date(),
      new Date()
    );
  }
}


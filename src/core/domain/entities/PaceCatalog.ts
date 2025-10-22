// Domain Entity: PaceCatalog (Master PACE list)
export class PaceCatalog {
  constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly name: string,
    public readonly subSubjectId: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date
  ) {}

  static create(props: {
    id: string;
    code: string;
    name: string;
    subSubjectId: string;
  }): PaceCatalog {
    return new PaceCatalog(
      props.id,
      props.code,
      props.name,
      props.subSubjectId,
      new Date(),
      new Date()
    );
  }
}


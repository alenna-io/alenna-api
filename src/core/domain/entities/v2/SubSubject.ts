export class SubSubject {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly difficulty: number,
    public readonly categoryId: string,
    public readonly levelId: string,
  ) { }
}
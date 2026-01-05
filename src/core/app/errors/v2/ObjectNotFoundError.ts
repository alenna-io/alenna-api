export class ObejctNotFoundError extends Error {
  public readonly statusCode: number;

  constructor(objectName: string, message?: string) {
    super(message ?? `${objectName} is invalid`);
    this.name = 'ObjectNotFoundError';
    this.statusCode = 404; // HTTP Not Found
  }
}
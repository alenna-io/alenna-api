export class InvalidEntityError extends Error {
  public readonly statusCode: number;

  constructor(objectName: string, message?: string) {
    super(message ?? `${objectName} is invalid`);
    this.name = 'InvalidEntityError';
    this.statusCode = 400; // HTTP Bad Request
  }
}
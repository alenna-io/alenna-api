export class ObjectAlreadyExistsError extends Error {
  public readonly statusCode: number;

  constructor(objectName: string, message?: string) {
    super(message ?? `${objectName} already exists`);
    this.name = 'ObjectAlreadyExistsError';
    this.statusCode = 409; // HTTP Conflict
  }
}
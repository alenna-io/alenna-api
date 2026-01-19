export class InvalidEntityError extends Error {
  public readonly statusCode: number;

  constructor(objectName: string, message?: string) {
    super(message ?? `${objectName} is invalid`);
    this.name = 'InvalidEntityError';
    this.statusCode = 400; // HTTP Bad Request
  }
}

export class ObjectAlreadyExistsError extends Error {
  public readonly statusCode: number;

  constructor(objectName: string, message?: string) {
    super(message ?? `${objectName} already exists`);
    this.name = 'ObjectAlreadyExistsError';
    this.statusCode = 409; // HTTP Conflict
  }
}

export class ObjectNotFoundError extends Error {
  public readonly statusCode: number;

  constructor(objectName: string, message?: string) {
    super(message ?? `${objectName} not found`);
    this.name = 'ObjectNotFoundError';
    this.statusCode = 404; // HTTP Not Found
  }
}

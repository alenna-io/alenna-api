import { InvalidEntityError } from '../errors';

export function validateId(id: string, entityName: string): void {
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    throw new InvalidEntityError(
      entityName,
      `${entityName} ID is required and must be a non-empty string`
    );
  }
}

export function validateIds(ids: string[], entityName: string): void {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new InvalidEntityError(
      entityName,
      `At least one ${entityName} ID is required`
    );
  }

  ids.forEach((id, index) => {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new InvalidEntityError(
        entityName,
        `${entityName} ID at index ${index} is invalid`
      );
    }
  });
}

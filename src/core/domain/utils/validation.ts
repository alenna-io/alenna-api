import { InvalidEntityError } from '../errors';

// CUID regex: starts with 'c' followed by 24 alphanumeric characters (total 25)
// CUIDs are always lowercase, but we accept case-insensitive for flexibility
// Format: c + 24 lowercase alphanumeric characters
const CUID_REGEX = /^c[a-z0-9]{24}$/i;

// UUID regex: accepts any UUID version (8-4-4-4-12 hexadecimal characters with dashes)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Email regex (basic validation)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export function validateCuid(id: string, entityName: string): void {
  validateId(id, entityName);

  if (!CUID_REGEX.test(id)) {
    throw new InvalidEntityError(
      entityName,
      `${entityName} ID must be a valid CUID format`
    );
  }
}

export function validateCuids(ids: string[], entityName: string): void {
  validateIds(ids, entityName);

  ids.forEach((id, index) => {
    if (!CUID_REGEX.test(id)) {
      throw new InvalidEntityError(
        entityName,
        `${entityName} ID at index ${index} must be a valid CUID format`
      );
    }
  });
}

export function validateUuid(id: string, entityName: string): void {
  validateId(id, entityName);

  if (!UUID_REGEX.test(id)) {
    throw new InvalidEntityError(
      entityName,
      `${entityName} ID must be a valid UUID format`
    );
  }
}

export function validateUuids(ids: string[], entityName: string): void {
  validateIds(ids, entityName);

  ids.forEach((id, index) => {
    if (!UUID_REGEX.test(id)) {
      throw new InvalidEntityError(
        entityName,
        `${entityName} ID at index ${index} must be a valid UUID format`
      );
    }
  });
}

export function validateEmail(email: string, fieldName: string = 'Email'): void {
  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    throw new InvalidEntityError(
      fieldName,
      `${fieldName} is required and must be a non-empty string`
    );
  }

  if (!EMAIL_REGEX.test(email.trim())) {
    throw new InvalidEntityError(
      fieldName,
      `${fieldName} must be a valid email address`
    );
  }
}

export function validateNonEmptyString(value: string, fieldName: string): void {
  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    throw new InvalidEntityError(
      fieldName,
      `${fieldName} is required and must be a non-empty string`
    );
  }
}

export function validatePositiveInteger(value: number, fieldName: string): void {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new InvalidEntityError(
      fieldName,
      `${fieldName} must be a positive integer`
    );
  }
}

export function validateNonNegativeInteger(value: number, fieldName: string): void {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new InvalidEntityError(
      fieldName,
      `${fieldName} must be a non-negative integer`
    );
  }
}

export function validateRange(value: number, min: number, max: number, fieldName: string): void {
  if (typeof value !== 'number' || value < min || value > max) {
    throw new InvalidEntityError(
      fieldName,
      `${fieldName} must be between ${min} and ${max}`
    );
  }
}

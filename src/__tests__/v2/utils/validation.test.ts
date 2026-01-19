import { describe, it, expect } from 'vitest';
import {
  validateId,
  validateIds,
  validateCuid,
  validateCuids,
  validateUuid,
  validateUuids,
  validateEmail,
  validateNonEmptyString,
  validatePositiveInteger,
  validateNonNegativeInteger,
  validateRange,
} from '../../../core/domain/utils/validation';
import { InvalidEntityError } from '../../../core/domain/errors';

describe('Validation Utilities', () => {
  describe('validateId', () => {
    it('should pass for valid non-empty string', () => {
      expect(() => validateId('valid-id', 'Entity')).not.toThrow();
    });

    it('should throw for empty string', () => {
      expect(() => validateId('', 'Entity')).toThrow(InvalidEntityError);
      expect(() => validateId('', 'Entity')).toThrow('Entity ID is required and must be a non-empty string');
    });

    it('should throw for whitespace-only string', () => {
      expect(() => validateId('   ', 'Entity')).toThrow(InvalidEntityError);
    });

    it('should throw for null', () => {
      expect(() => validateId(null as any, 'Entity')).toThrow(InvalidEntityError);
    });

    it('should throw for undefined', () => {
      expect(() => validateId(undefined as any, 'Entity')).toThrow(InvalidEntityError);
    });

    it('should throw for non-string', () => {
      expect(() => validateId(123 as any, 'Entity')).toThrow(InvalidEntityError);
    });
  });

  describe('validateIds', () => {
    it('should pass for valid array of IDs', () => {
      expect(() => validateIds(['id1', 'id2', 'id3'], 'Entity')).not.toThrow();
    });

    it('should throw for empty array', () => {
      expect(() => validateIds([], 'Entity')).toThrow(InvalidEntityError);
      expect(() => validateIds([], 'Entity')).toThrow('At least one Entity ID is required');
    });

    it('should throw for non-array', () => {
      expect(() => validateIds('not-array' as any, 'Entity')).toThrow(InvalidEntityError);
    });

    it('should throw for array with empty string', () => {
      expect(() => validateIds(['id1', '', 'id3'], 'Entity')).toThrow(InvalidEntityError);
      expect(() => validateIds(['id1', '', 'id3'], 'Entity')).toThrow('Entity ID at index 1 is invalid');
    });

    it('should throw for array with whitespace-only string', () => {
      expect(() => validateIds(['id1', '   ', 'id3'], 'Entity')).toThrow(InvalidEntityError);
    });
  });

  describe('validateCuid', () => {
    it('should pass for valid CUID', () => {
      // Real CUID format: starts with 'c' + 24 lowercase alphanumeric (25 chars total)
      expect(() => validateCuid('clh1234567890abcdefghijkl', 'Entity')).not.toThrow();
      expect(() => validateCuid('cmjppw4if0001ib8czsdnyiud', 'Entity')).not.toThrow();
    });

    it('should throw for invalid CUID format', () => {
      expect(() => validateCuid('invalid-cuid', 'Entity')).toThrow(InvalidEntityError);
      expect(() => validateCuid('invalid-cuid', 'Entity')).toThrow('Entity ID must be a valid CUID format');
    });

    it('should throw for CUID that is too short', () => {
      expect(() => validateCuid('c123', 'Entity')).toThrow(InvalidEntityError);
    });

    it('should throw for CUID that is too long', () => {
      expect(() => validateCuid('clh1234567890abcdefghijklmnop', 'Entity')).toThrow(InvalidEntityError);
    });

    it('should pass for CUID with uppercase (case-insensitive)', () => {
      expect(() => validateCuid('CLH1234567890ABCDEFGHIJKL', 'Entity')).not.toThrow();
    });

    it('should throw for CUID that does not start with c', () => {
      expect(() => validateCuid('alh1234567890abcdefghijkl', 'Entity')).toThrow(InvalidEntityError);
    });

    it('should throw for empty string (inherited from validateId)', () => {
      expect(() => validateCuid('', 'Entity')).toThrow(InvalidEntityError);
    });
  });

  describe('validateCuids', () => {
    it('should pass for valid array of CUIDs', () => {
      expect(() => validateCuids(['clh1234567890abcdefghijkl', 'clh0987654321zyxwvutsrqpo'], 'Entity')).not.toThrow();
    });

    it('should throw for array with invalid CUID', () => {
      expect(() => validateCuids(['clh1234567890abcdefghijkl', 'invalid'], 'Entity')).toThrow(InvalidEntityError);
      expect(() => validateCuids(['clh1234567890abcdefghijkl', 'invalid'], 'Entity')).toThrow('Entity ID at index 1 must be a valid CUID format');
    });

    it('should throw for empty array (inherited from validateIds)', () => {
      expect(() => validateCuids([], 'Entity')).toThrow(InvalidEntityError);
    });
  });

  describe('validateUuid', () => {
    it('should pass for valid UUID v4', () => {
      expect(() => validateUuid('550e8400-e29b-41d4-a716-446655440000', 'Entity')).not.toThrow();
      expect(() => validateUuid('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'Entity')).not.toThrow();
    });

    it('should throw for invalid UUID format', () => {
      expect(() => validateUuid('not-a-uuid', 'Entity')).toThrow(InvalidEntityError);
      expect(() => validateUuid('not-a-uuid', 'Entity')).toThrow('Entity ID must be a valid UUID format');
    });

    it('should pass for UUID v1 (any version is valid)', () => {
      expect(() => validateUuid('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'Entity')).not.toThrow(); // v1 is valid format
    });

    it('should throw for UUID without dashes', () => {
      expect(() => validateUuid('550e8400e29b41d4a716446655440000', 'Entity')).toThrow(InvalidEntityError);
    });

    it('should throw for empty string (inherited from validateId)', () => {
      expect(() => validateUuid('', 'Entity')).toThrow(InvalidEntityError);
    });
  });

  describe('validateUuids', () => {
    it('should pass for valid array of UUIDs', () => {
      expect(() => validateUuids(['550e8400-e29b-41d4-a716-446655440000', '6ba7b810-9dad-11d1-80b4-00c04fd430c8'], 'Entity')).not.toThrow();
    });

    it('should throw for array with invalid UUID', () => {
      expect(() => validateUuids(['550e8400-e29b-41d4-a716-446655440000', 'invalid'], 'Entity')).toThrow(InvalidEntityError);
      expect(() => validateUuids(['550e8400-e29b-41d4-a716-446655440000', 'invalid'], 'Entity')).toThrow('Entity ID at index 1 must be a valid UUID format');
    });

    it('should throw for empty array (inherited from validateIds)', () => {
      expect(() => validateUuids([], 'Entity')).toThrow(InvalidEntityError);
    });
  });

  describe('validateEmail', () => {
    it('should pass for valid email', () => {
      expect(() => validateEmail('user@example.com', 'Email')).not.toThrow();
      expect(() => validateEmail('test.user+tag@example.co.uk', 'Email')).not.toThrow();
      expect(() => validateEmail('user123@test-domain.com', 'Email')).not.toThrow();
    });

    it('should throw for invalid email format', () => {
      expect(() => validateEmail('not-an-email', 'Email')).toThrow(InvalidEntityError);
      expect(() => validateEmail('not-an-email', 'Email')).toThrow('Email must be a valid email address');
    });

    it('should throw for email without @', () => {
      expect(() => validateEmail('userexample.com', 'Email')).toThrow(InvalidEntityError);
    });

    it('should throw for email without domain', () => {
      expect(() => validateEmail('user@', 'Email')).toThrow(InvalidEntityError);
    });

    it('should throw for empty string', () => {
      expect(() => validateEmail('', 'Email')).toThrow(InvalidEntityError);
      expect(() => validateEmail('', 'Email')).toThrow('Email is required and must be a non-empty string');
    });

    it('should use custom field name', () => {
      expect(() => validateEmail('invalid', 'UserEmail')).toThrow('UserEmail must be a valid email address');
    });

    it('should trim whitespace and validate', () => {
      expect(() => validateEmail('  user@example.com  ', 'Email')).not.toThrow();
    });
  });

  describe('validateNonEmptyString', () => {
    it('should pass for valid non-empty string', () => {
      expect(() => validateNonEmptyString('valid', 'Field')).not.toThrow();
    });

    it('should throw for empty string', () => {
      expect(() => validateNonEmptyString('', 'Field')).toThrow(InvalidEntityError);
      expect(() => validateNonEmptyString('', 'Field')).toThrow('Field is required and must be a non-empty string');
    });

    it('should throw for whitespace-only string', () => {
      expect(() => validateNonEmptyString('   ', 'Field')).toThrow(InvalidEntityError);
    });

    it('should throw for null', () => {
      expect(() => validateNonEmptyString(null as any, 'Field')).toThrow(InvalidEntityError);
    });

    it('should throw for undefined', () => {
      expect(() => validateNonEmptyString(undefined as any, 'Field')).toThrow(InvalidEntityError);
    });
  });

  describe('validatePositiveInteger', () => {
    it('should pass for positive integer', () => {
      expect(() => validatePositiveInteger(1, 'Field')).not.toThrow();
      expect(() => validatePositiveInteger(100, 'Field')).not.toThrow();
    });

    it('should throw for zero', () => {
      expect(() => validatePositiveInteger(0, 'Field')).toThrow(InvalidEntityError);
      expect(() => validatePositiveInteger(0, 'Field')).toThrow('Field must be a positive integer');
    });

    it('should throw for negative number', () => {
      expect(() => validatePositiveInteger(-1, 'Field')).toThrow(InvalidEntityError);
    });

    it('should throw for float', () => {
      expect(() => validatePositiveInteger(1.5, 'Field')).toThrow(InvalidEntityError);
    });

    it('should throw for non-number', () => {
      expect(() => validatePositiveInteger('1' as any, 'Field')).toThrow(InvalidEntityError);
    });
  });

  describe('validateNonNegativeInteger', () => {
    it('should pass for non-negative integer', () => {
      expect(() => validateNonNegativeInteger(0, 'Field')).not.toThrow();
      expect(() => validateNonNegativeInteger(1, 'Field')).not.toThrow();
      expect(() => validateNonNegativeInteger(100, 'Field')).not.toThrow();
    });

    it('should throw for negative number', () => {
      expect(() => validateNonNegativeInteger(-1, 'Field')).toThrow(InvalidEntityError);
      expect(() => validateNonNegativeInteger(-1, 'Field')).toThrow('Field must be a non-negative integer');
    });

    it('should throw for float', () => {
      expect(() => validateNonNegativeInteger(1.5, 'Field')).toThrow(InvalidEntityError);
    });

    it('should throw for non-number', () => {
      expect(() => validateNonNegativeInteger('0' as any, 'Field')).toThrow(InvalidEntityError);
    });
  });

  describe('validateRange', () => {
    it('should pass for value within range', () => {
      expect(() => validateRange(50, 0, 100, 'Field')).not.toThrow();
      expect(() => validateRange(0, 0, 100, 'Field')).not.toThrow();
      expect(() => validateRange(100, 0, 100, 'Field')).not.toThrow();
    });

    it('should throw for value below minimum', () => {
      expect(() => validateRange(-1, 0, 100, 'Field')).toThrow(InvalidEntityError);
      expect(() => validateRange(-1, 0, 100, 'Field')).toThrow('Field must be between 0 and 100');
    });

    it('should throw for value above maximum', () => {
      expect(() => validateRange(101, 0, 100, 'Field')).toThrow(InvalidEntityError);
      expect(() => validateRange(101, 0, 100, 'Field')).toThrow('Field must be between 0 and 100');
    });

    it('should throw for non-number', () => {
      expect(() => validateRange('50' as any, 0, 100, 'Field')).toThrow(InvalidEntityError);
    });

    it('should work with float values', () => {
      expect(() => validateRange(50.5, 0, 100, 'Field')).not.toThrow();
    });
  });
});

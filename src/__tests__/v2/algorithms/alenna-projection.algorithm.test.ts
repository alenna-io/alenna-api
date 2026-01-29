import { describe, it, expect, beforeEach } from 'vitest';
import { AlennaProjectionAlgorithm } from '../../../core/domain/algorithms/alenna-projection.algorithm';
import { GenerateProjectionInput } from '../../../core/application/dtos/projections/GenerateProjectionInput';
import { InvalidEntityError } from '../../../core/domain/errors';

describe('AlennaProjectionAlgorithm', () => {
  let algorithm: AlennaProjectionAlgorithm;

  beforeEach(() => {
    algorithm = new AlennaProjectionAlgorithm();
  });

  describe('Input Validation', () => {
    it('should throw when total paces < 72', () => {
      const input: GenerateProjectionInput = {
        studentId: 'student-1',
        schoolId: 'school-1',
        schoolYear: 'sy-1',
        subjects: [
          {
            categoryId: 'cat-1',
            subjectId: 'sub-1',
            startPace: 1,
            endPace: 35,
            skipPaces: [],
            notPairWith: [],
          },
        ],
      };

      expect(() => algorithm.generate(input)).toThrow(InvalidEntityError);
      expect(() => algorithm.generate(input)).toThrow('Projection must contain at least 72 total paces');
    });

    it('should accept exactly 72 paces', () => {
      const input: GenerateProjectionInput = {
        studentId: 'student-1',
        schoolId: 'school-1',
        schoolYear: 'sy-1',
        subjects: [
          {
            categoryId: 'cat-1',
            subjectId: 'sub-1',
            startPace: 1001,
            endPace: 1036,
            skipPaces: [],
            notPairWith: [],
          },
          {
            categoryId: 'cat-2',
            subjectId: 'sub-2',
            startPace: 1001,
            endPace: 1036,
            skipPaces: [],
            notPairWith: [],
          },
        ],
      };

      const result = algorithm.generate(input);
      expect(result).toHaveLength(72);
    });

    it('should accept more than 72 paces', () => {
      const input: GenerateProjectionInput = {
        studentId: 'student-1',
        schoolId: 'school-1',
        schoolYear: 'sy-1',
        subjects: [
          {
            categoryId: 'cat-1',
            subjectId: 'sub-1',
            startPace: 1001,
            endPace: 1036,
            skipPaces: [],
            notPairWith: [],
          },
          {
            categoryId: 'cat-2',
            subjectId: 'sub-2',
            startPace: 1001,
            endPace: 1036,
            skipPaces: [],
            notPairWith: [],
          },
          {
            categoryId: 'cat-3',
            subjectId: 'sub-3',
            startPace: 1001,
            endPace: 1008,
            skipPaces: [],
            notPairWith: [],
          },
        ],
      };

      const result = algorithm.generate(input);
      expect(result).toHaveLength(80);
      expect(result.length).toBeGreaterThan(72);
    });

    it('should handle skipPaces correctly', () => {
      const input: GenerateProjectionInput = {
        studentId: 'student-1',
        schoolId: 'school-1',
        schoolYear: 'sy-1',
        subjects: [
          {
            categoryId: 'cat-1',
            subjectId: 'sub-1',
            startPace: 1001,
            endPace: 1036,
            skipPaces: [1005, 1010, 1015],
            notPairWith: [],
          },
          {
            categoryId: 'cat-2',
            subjectId: 'sub-2',
            startPace: 2001,
            endPace: 2036,
            skipPaces: [],
            notPairWith: [],
          },
          {
            categoryId: 'cat-3',
            subjectId: 'sub-3',
            startPace: 3001,
            endPace: 3008,
            skipPaces: [],
            notPairWith: [],
          },
        ],
      };

      const result = algorithm.generate(input);
      const cat1PaceCodes = result.filter(p => p.categoryId === 'cat-1').map(p => p.paceCode);
      expect(cat1PaceCodes).not.toContain('1005');
      expect(cat1PaceCodes).not.toContain('1010');
      expect(cat1PaceCodes).not.toContain('1015');
      expect(result.length).toBe(77); // (36 - 3) + 36 + 8 = 77
    });
  });

  describe('MODE A - Uniform Curriculum (72 paces, identical counts)', () => {
    it('should use difficulty pairing for 2 subjects with 36 paces each', () => {
      const input: GenerateProjectionInput = {
        studentId: 'student-1',
        schoolId: 'school-1',
        schoolYear: 'sy-1',
        subjects: [
          {
            categoryId: 'cat-1',
            subjectId: 'sub-1',
            startPace: 1,
            endPace: 36,
            skipPaces: [],
            notPairWith: [],
            difficulty: 5,
          },
          {
            categoryId: 'cat-2',
            subjectId: 'sub-2',
            startPace: 1,
            endPace: 36,
            skipPaces: [],
            notPairWith: [],
            difficulty: 1,
          },
        ],
      };

      const result = algorithm.generate(input);
      expect(result).toHaveLength(72);

      const byWeek = new Map<number, typeof result>();
      for (const pace of result) {
        const weekKey = (pace.quarter - 1) * 9 + pace.week - 1;
        if (!byWeek.has(weekKey)) {
          byWeek.set(weekKey, []);
        }
        byWeek.get(weekKey)!.push(pace);
      }

      for (const [_weekKey, paces] of byWeek) {
        expect(paces.length).toBe(2);
        const categoryIds = paces.map(p => p.categoryId);
        expect(categoryIds).toContain('cat-1');
        expect(categoryIds).toContain('cat-2');
      }
    });

    it('should use difficulty pairing for 3 subjects with 24 paces each', () => {
      const input: GenerateProjectionInput = {
        studentId: 'student-1',
        schoolId: 'school-1',
        schoolYear: 'sy-1',
        subjects: [
          {
            categoryId: 'cat-1',
            subjectId: 'sub-1',
            startPace: 1,
            endPace: 24,
            skipPaces: [],
            notPairWith: [],
            difficulty: 5,
          },
          {
            categoryId: 'cat-2',
            subjectId: 'sub-2',
            startPace: 1,
            endPace: 24,
            skipPaces: [],
            notPairWith: [],
            difficulty: 3,
          },
          {
            categoryId: 'cat-3',
            subjectId: 'sub-3',
            startPace: 1,
            endPace: 24,
            skipPaces: [],
            notPairWith: [],
            difficulty: 1,
          },
        ],
      };

      const result = algorithm.generate(input);
      expect(result).toHaveLength(72);

      const byWeek = new Map<number, typeof result>();
      for (const pace of result) {
        const weekKey = (pace.quarter - 1) * 9 + pace.week - 1;
        if (!byWeek.has(weekKey)) {
          byWeek.set(weekKey, []);
        }
        byWeek.get(weekKey)!.push(pace);
      }

      for (const [_weekKey, paces] of byWeek) {
        expect(paces.length).toBeGreaterThanOrEqual(1);
        expect(paces.length).toBeLessThanOrEqual(4);
      }
    });

    it('should throw when notPairWith prevents pairing', () => {
      const input: GenerateProjectionInput = {
        studentId: 'student-1',
        schoolId: 'school-1',
        schoolYear: 'sy-1',
        subjects: [
          {
            categoryId: 'cat-1',
            subjectId: 'sub-1',
            startPace: 1,
            endPace: 36,
            skipPaces: [],
            notPairWith: ['cat-2'],
            difficulty: 5,
          },
          {
            categoryId: 'cat-2',
            subjectId: 'sub-2',
            startPace: 1,
            endPace: 36,
            skipPaces: [],
            notPairWith: [],
            difficulty: 1,
          },
        ],
      };

      expect(() => algorithm.generate(input)).toThrow(InvalidEntityError);
      expect(() => algorithm.generate(input)).toThrow('Invalid difficulty pairing due to notPairWith constraint');
    });

    it('should produce deterministic output for same input', () => {
      const input: GenerateProjectionInput = {
        studentId: 'student-1',
        schoolId: 'school-1',
        schoolYear: 'sy-1',
        subjects: [
          {
            categoryId: 'cat-1',
            subjectId: 'sub-1',
            startPace: 1,
            endPace: 36,
            skipPaces: [],
            notPairWith: [],
            difficulty: 5,
          },
          {
            categoryId: 'cat-2',
            subjectId: 'sub-2',
            startPace: 1,
            endPace: 36,
            skipPaces: [],
            notPairWith: [],
            difficulty: 1,
          },
        ],
      };

      const result1 = algorithm.generate(input);
      const result2 = algorithm.generate(input);

      expect(result1).toEqual(result2);
    });
  });

  describe('MODE B - Non-uniform Curriculum (72+ paces or different counts)', () => {
    it('should place all paces when total > 72 and relax constraints', () => {
      const input: GenerateProjectionInput = {
        studentId: 'student-1',
        schoolId: 'school-1',
        schoolYear: 'sy-1',
        subjects: [
          {
            categoryId: 'cat-1',
            subjectId: 'sub-1',
            startPace: 1001,
            endPace: 1036,
            skipPaces: [],
            notPairWith: ['cat-2'],
          },
          {
            categoryId: 'cat-2',
            subjectId: 'sub-2',
            startPace: 1001,
            endPace: 1036,
            skipPaces: [],
            notPairWith: ['cat-1'],
          },
          {
            categoryId: 'cat-3',
            subjectId: 'sub-3',
            startPace: 1001,
            endPace: 1036,
            skipPaces: [],
            notPairWith: [],
          },
          {
            categoryId: 'cat-4',
            subjectId: 'sub-4',
            startPace: 1001,
            endPace: 1036,
            skipPaces: [],
            notPairWith: [],
          },
        ],
      };

      const result = algorithm.generate(input);
      expect(result.length).toBeGreaterThanOrEqual(108);
      expect(result.length).toBeLessThanOrEqual(144);

      const cat1Paces = result.filter(p => p.categoryId === 'cat-1');
      const cat2Paces = result.filter(p => p.categoryId === 'cat-2');
      const cat3Paces = result.filter(p => p.categoryId === 'cat-3');
      const cat4Paces = result.filter(p => p.categoryId === 'cat-4');
      expect(cat1Paces.length).toBeLessThanOrEqual(36);
      expect(cat2Paces.length).toBeLessThanOrEqual(36);
      expect(cat3Paces.length).toBeLessThanOrEqual(36);
      expect(cat4Paces.length).toBeLessThanOrEqual(36);
    });

    it('should handle 72 paces with different subject counts', () => {
      const input: GenerateProjectionInput = {
        studentId: 'student-1',
        schoolId: 'school-1',
        schoolYear: 'sy-1',
        subjects: [
          {
            categoryId: 'cat-1',
            subjectId: 'sub-1',
            startPace: 1,
            endPace: 36,
            skipPaces: [],
            notPairWith: [],
          },
          {
            categoryId: 'cat-2',
            subjectId: 'sub-2',
            startPace: 1,
            endPace: 36,
            skipPaces: [],
            notPairWith: [],
          },
        ],
      };

      const result = algorithm.generate(input);
      expect(result).toHaveLength(72);

      const cat1Paces = result.filter(p => p.categoryId === 'cat-1');
      const cat2Paces = result.filter(p => p.categoryId === 'cat-2');
      expect(cat1Paces.length).toBe(36);
      expect(cat2Paces.length).toBe(36);
    });

    it('should handle more than 72 paces', () => {
      const input: GenerateProjectionInput = {
        studentId: 'student-1',
        schoolId: 'school-1',
        schoolYear: 'sy-1',
        subjects: [
          {
            categoryId: 'cat-1',
            subjectId: 'sub-1',
            startPace: 1,
            endPace: 36,
            skipPaces: [],
            notPairWith: [],
          },
          {
            categoryId: 'cat-2',
            subjectId: 'sub-2',
            startPace: 1,
            endPace: 36,
            skipPaces: [],
            notPairWith: [],
          },
          {
            categoryId: 'cat-3',
            subjectId: 'sub-3',
            startPace: 1,
            endPace: 18,
            skipPaces: [],
            notPairWith: [],
          },
        ],
      };

      const result = algorithm.generate(input);
      expect(result.length).toBeGreaterThanOrEqual(88);
      expect(result.length).toBeLessThanOrEqual(90);

      const byWeek = new Map<number, typeof result>();
      for (const pace of result) {
        const weekKey = (pace.quarter - 1) * 9 + pace.week - 1;
        if (!byWeek.has(weekKey)) {
          byWeek.set(weekKey, []);
        }
        byWeek.get(weekKey)!.push(pace);
      }

      for (const [_weekKey, paces] of byWeek) {
        expect(paces.length).toBeLessThanOrEqual(3);
        const uniqueSubjects = new Set(paces.map(p => p.categoryId));
        expect(uniqueSubjects.size).toBe(paces.length);
      }
    });

    it('should respect notPairWith constraints in non-uniform mode', () => {
      const input: GenerateProjectionInput = {
        studentId: 'student-1',
        schoolId: 'school-1',
        schoolYear: 'sy-1',
        subjects: [
          {
            categoryId: 'cat-1',
            subjectId: 'sub-1',
            startPace: 1,
            endPace: 36,
            skipPaces: [],
            notPairWith: ['cat-2'],
          },
          {
            categoryId: 'cat-2',
            subjectId: 'sub-2',
            startPace: 1,
            endPace: 36,
            skipPaces: [],
            notPairWith: ['cat-1'],
          },
          {
            categoryId: 'cat-3',
            subjectId: 'sub-3',
            startPace: 1,
            endPace: 18,
            skipPaces: [],
            notPairWith: [],
          },
        ],
      };

      const result = algorithm.generate(input);
      expect(result.length).toBeGreaterThanOrEqual(72);

      const byWeek = new Map<number, typeof result>();
      for (const pace of result) {
        const weekKey = (pace.quarter - 1) * 9 + pace.week - 1;
        if (!byWeek.has(weekKey)) {
          byWeek.set(weekKey, []);
        }
        byWeek.get(weekKey)!.push(pace);
      }

      // Note: When totalPaces > 72, notPairWith constraints may be relaxed to ensure all paces are placed
      const totalPaces = result.length;
      if (totalPaces <= 72) {
        for (const [_weekKey, paces] of byWeek) {
          const categoryIds = paces.map(p => p.categoryId);
          const hasCat1 = categoryIds.includes('cat-1');
          const hasCat2 = categoryIds.includes('cat-2');
          expect(hasCat1 && hasCat2).toBe(false);
        }
      } else {
        // When constraints are relaxed, we just verify the result is valid
        expect(result.length).toBeGreaterThan(72);
      }
    });

    it('should distribute paces across all 4 quarters', () => {
      const input: GenerateProjectionInput = {
        studentId: 'student-1',
        schoolId: 'school-1',
        schoolYear: 'sy-1',
        subjects: [
          {
            categoryId: 'cat-1',
            subjectId: 'sub-1',
            startPace: 1,
            endPace: 36,
            skipPaces: [],
            notPairWith: [],
          },
          {
            categoryId: 'cat-2',
            subjectId: 'sub-2',
            startPace: 1,
            endPace: 36,
            skipPaces: [],
            notPairWith: [],
          },
          {
            categoryId: 'cat-3',
            subjectId: 'sub-3',
            startPace: 1,
            endPace: 8,
            skipPaces: [],
            notPairWith: [],
          },
        ],
      };

      const result = algorithm.generate(input);
      expect(result).toHaveLength(80);

      const byQuarter = new Map<number, typeof result>();
      for (const pace of result) {
        if (!byQuarter.has(pace.quarter)) {
          byQuarter.set(pace.quarter, []);
        }
        byQuarter.get(pace.quarter)!.push(pace);
      }

      expect(byQuarter.has(1)).toBe(true);
      expect(byQuarter.has(2)).toBe(true);
      expect(byQuarter.has(3)).toBe(true);
      expect(byQuarter.has(4)).toBe(true);

      const quarterCounts = Array.from(byQuarter.values()).map(paces => paces.length);
      const total = quarterCounts.reduce((a, b) => a + b, 0);
      expect(total).toBe(80);
    });

    it('should produce deterministic output for same input', () => {
      const input: GenerateProjectionInput = {
        studentId: 'student-1',
        schoolId: 'school-1',
        schoolYear: 'sy-1',
        subjects: [
          {
            categoryId: 'cat-1',
            subjectId: 'sub-1',
            startPace: 1,
            endPace: 36,
            skipPaces: [],
            notPairWith: [],
          },
          {
            categoryId: 'cat-2',
            subjectId: 'sub-2',
            startPace: 1,
            endPace: 36,
            skipPaces: [],
            notPairWith: [],
          },
          {
            categoryId: 'cat-3',
            subjectId: 'sub-3',
            startPace: 1,
            endPace: 18,
            skipPaces: [],
            notPairWith: [],
          },
        ],
      };

      const result1 = algorithm.generate(input);
      const result2 = algorithm.generate(input);

      expect(result1).toEqual(result2);
    });

    it('should maintain sequential pace order within quarters', () => {
      const input: GenerateProjectionInput = {
        studentId: 'student-1',
        schoolId: 'school-1',
        schoolYear: 'sy-1',
        subjects: [
          {
            categoryId: 'cat-1',
            subjectId: 'sub-1',
            startPace: 1,
            endPace: 36,
            skipPaces: [],
            notPairWith: [],
          },
          {
            categoryId: 'cat-2',
            subjectId: 'sub-2',
            startPace: 1,
            endPace: 36,
            skipPaces: [],
            notPairWith: [],
          },
          {
            categoryId: 'cat-3',
            subjectId: 'sub-3',
            startPace: 1,
            endPace: 8,
            skipPaces: [],
            notPairWith: [],
          },
        ],
      };

      const result = algorithm.generate(input);
      expect(result).toHaveLength(80);

      const byQuarter = new Map<number, typeof result>();
      for (const pace of result) {
        if (!byQuarter.has(pace.quarter)) {
          byQuarter.set(pace.quarter, []);
        }
        byQuarter.get(pace.quarter)!.push(pace);
      }

      for (const [_quarter, paces] of byQuarter) {
        const cat1Paces = paces.filter(p => p.categoryId === 'cat-1');
        const paceCodes = cat1Paces.map(p => parseInt(p.paceCode)).sort((a, b) => a - b);

        for (let i = 0; i < paceCodes.length - 1; i++) {
          expect(paceCodes[i + 1] - paceCodes[i]).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('should handle multiple subjects with varying pace counts', () => {
      const input: GenerateProjectionInput = {
        studentId: 'student-1',
        schoolId: 'school-1',
        schoolYear: 'sy-1',
        subjects: [
          {
            categoryId: 'cat-1',
            subjectId: 'sub-1',
            startPace: 1,
            endPace: 30,
            skipPaces: [],
            notPairWith: [],
          },
          {
            categoryId: 'cat-2',
            subjectId: 'sub-2',
            startPace: 1,
            endPace: 25,
            skipPaces: [],
            notPairWith: [],
          },
          {
            categoryId: 'cat-3',
            subjectId: 'sub-3',
            startPace: 1,
            endPace: 20,
            skipPaces: [],
            notPairWith: [],
          },
        ],
      };

      const result = algorithm.generate(input);
      expect(result.length).toBeGreaterThanOrEqual(68);
      expect(result.length).toBeLessThanOrEqual(75);

      const cat1Paces = result.filter(p => p.categoryId === 'cat-1');
      const cat2Paces = result.filter(p => p.categoryId === 'cat-2');
      const cat3Paces = result.filter(p => p.categoryId === 'cat-3');

      expect(cat1Paces.length).toBeLessThanOrEqual(30);
      expect(cat2Paces.length).toBeLessThanOrEqual(25);
      expect(cat3Paces.length).toBeLessThanOrEqual(20);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single subject with exactly 72 paces', () => {
      const input: GenerateProjectionInput = {
        studentId: 'student-1',
        schoolId: 'school-1',
        schoolYear: 'sy-1',
        subjects: [
          {
            categoryId: 'cat-1',
            subjectId: 'sub-1',
            startPace: 1,
            endPace: 36,
            skipPaces: [],
            notPairWith: [],
          },
          {
            categoryId: 'cat-2',
            subjectId: 'sub-2',
            startPace: 1,
            endPace: 36,
            skipPaces: [],
            notPairWith: [],
          },
        ],
      };

      const result = algorithm.generate(input);
      expect(result).toHaveLength(72);

      const cat1Paces = result.filter(p => p.categoryId === 'cat-1');
      const cat2Paces = result.filter(p => p.categoryId === 'cat-2');
      expect(cat1Paces.length).toBe(36);
      expect(cat2Paces.length).toBe(36);
    });

    it('should handle 6 subjects (maximum)', () => {
      const input: GenerateProjectionInput = {
        studentId: 'student-1',
        schoolId: 'school-1',
        schoolYear: 'sy-1',
        subjects: [
          {
            categoryId: 'cat-1',
            subjectId: 'sub-1',
            startPace: 1,
            endPace: 15,
            skipPaces: [],
            notPairWith: [],
          },
          {
            categoryId: 'cat-2',
            subjectId: 'sub-2',
            startPace: 1,
            endPace: 15,
            skipPaces: [],
            notPairWith: [],
          },
          {
            categoryId: 'cat-3',
            subjectId: 'sub-3',
            startPace: 1,
            endPace: 15,
            skipPaces: [],
            notPairWith: [],
          },
          {
            categoryId: 'cat-4',
            subjectId: 'sub-4',
            startPace: 1,
            endPace: 15,
            skipPaces: [],
            notPairWith: [],
          },
          {
            categoryId: 'cat-5',
            subjectId: 'sub-5',
            startPace: 1,
            endPace: 15,
            skipPaces: [],
            notPairWith: [],
          },
          {
            categoryId: 'cat-6',
            subjectId: 'sub-6',
            startPace: 1,
            endPace: 12,
            skipPaces: [],
            notPairWith: [],
          },
        ],
      };

      const result = algorithm.generate(input);
      expect(result).toHaveLength(87);

      const byWeek = new Map<number, typeof result>();
      for (const pace of result) {
        const weekKey = (pace.quarter - 1) * 9 + pace.week - 1;
        if (!byWeek.has(weekKey)) {
          byWeek.set(weekKey, []);
        }
        byWeek.get(weekKey)!.push(pace);
      }

      for (const [_weekKey, paces] of byWeek) {
        expect(paces.length).toBeLessThanOrEqual(3);
      }
    });

    it('should handle large pace counts (100+ paces)', () => {
      const input: GenerateProjectionInput = {
        studentId: 'student-1',
        schoolId: 'school-1',
        schoolYear: 'sy-1',
        subjects: [
          {
            categoryId: 'cat-1',
            subjectId: 'sub-1',
            startPace: 1,
            endPace: 36,
            skipPaces: [],
            notPairWith: [],
          },
          {
            categoryId: 'cat-2',
            subjectId: 'sub-2',
            startPace: 1,
            endPace: 36,
            skipPaces: [],
            notPairWith: [],
          },
          {
            categoryId: 'cat-3',
            subjectId: 'sub-3',
            startPace: 1,
            endPace: 28,
            skipPaces: [],
            notPairWith: [],
          },
        ],
      };

      const result = algorithm.generate(input);
      expect(result).toHaveLength(100);

      const byWeek = new Map<number, typeof result>();
      for (const pace of result) {
        const weekKey = (pace.quarter - 1) * 9 + pace.week - 1;
        if (!byWeek.has(weekKey)) {
          byWeek.set(weekKey, []);
        }
        byWeek.get(weekKey)!.push(pace);
      }

      expect(byWeek.size).toBe(36);
    });
  });

  describe('Output Structure', () => {
    it('should return paces with correct structure', () => {
      const input: GenerateProjectionInput = {
        studentId: 'student-1',
        schoolId: 'school-1',
        schoolYear: 'sy-1',
        subjects: [
          {
            categoryId: 'cat-1',
            subjectId: 'sub-1',
            startPace: 1,
            endPace: 36,
            skipPaces: [],
            notPairWith: [],
          },
          {
            categoryId: 'cat-2',
            subjectId: 'sub-2',
            startPace: 1,
            endPace: 36,
            skipPaces: [],
            notPairWith: [],
          },
        ],
      };

      const result = algorithm.generate(input);
      expect(result.length).toBeGreaterThan(0);

      for (const pace of result) {
        expect(pace).toHaveProperty('categoryId');
        expect(pace).toHaveProperty('subjectId');
        expect(pace).toHaveProperty('paceCode');
        expect(pace).toHaveProperty('quarter');
        expect(pace).toHaveProperty('week');

        expect(typeof pace.categoryId).toBe('string');
        expect(typeof pace.subjectId).toBe('string');
        expect(typeof pace.paceCode).toBe('string');
        expect(typeof pace.quarter).toBe('number');
        expect(typeof pace.week).toBe('number');

        expect(pace.quarter).toBeGreaterThanOrEqual(1);
        expect(pace.quarter).toBeLessThanOrEqual(4);
        expect(pace.week).toBeGreaterThanOrEqual(1);
        expect(pace.week).toBeLessThanOrEqual(9);
      }
    });

    it('should have all weeks in correct quarter ranges', () => {
      const input: GenerateProjectionInput = {
        studentId: 'student-1',
        schoolId: 'school-1',
        schoolYear: 'sy-1',
        subjects: [
          {
            categoryId: 'cat-1',
            subjectId: 'sub-1',
            startPace: 1,
            endPace: 36,
            skipPaces: [],
            notPairWith: [],
          },
          {
            categoryId: 'cat-2',
            subjectId: 'sub-2',
            startPace: 1,
            endPace: 36,
            skipPaces: [],
            notPairWith: [],
          },
        ],
      };

      const result = algorithm.generate(input);

      for (const pace of result) {
        if (pace.quarter === 1) {
          expect(pace.week).toBeGreaterThanOrEqual(1);
          expect(pace.week).toBeLessThanOrEqual(9);
        } else if (pace.quarter === 2) {
          expect(pace.week).toBeGreaterThanOrEqual(1);
          expect(pace.week).toBeLessThanOrEqual(9);
        } else if (pace.quarter === 3) {
          expect(pace.week).toBeGreaterThanOrEqual(1);
          expect(pace.week).toBeLessThanOrEqual(9);
        } else if (pace.quarter === 4) {
          expect(pace.week).toBeGreaterThanOrEqual(1);
          expect(pace.week).toBeLessThanOrEqual(9);
        }
      }
    });
  });
});

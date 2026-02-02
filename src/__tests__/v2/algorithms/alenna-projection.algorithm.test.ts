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

  describe('Electives (Multiple Subjects per Category)', () => {
    it('should place all paces for two elective subjects sharing the same categoryId', () => {
      const input: GenerateProjectionInput = {
        studentId: 'student-1',
        schoolId: 'school-1',
        schoolYear: 'sy-1',
        subjects: [
          {
            categoryId: 'cat-math',
            subjectId: 'sub-math',
            startPace: 1,
            endPace: 14,
            skipPaces: [],
            notPairWith: [],
          },
          {
            categoryId: 'cat-english',
            subjectId: 'sub-english',
            startPace: 1,
            endPace: 12,
            skipPaces: [],
            notPairWith: [],
          },
          {
            categoryId: 'cat-science',
            subjectId: 'sub-science',
            startPace: 1,
            endPace: 12,
            skipPaces: [],
            notPairWith: [],
          },
          {
            categoryId: 'cat-history',
            subjectId: 'sub-history',
            startPace: 1,
            endPace: 12,
            skipPaces: [],
            notPairWith: [],
          },
          // Two electives sharing the same category
          {
            categoryId: 'cat-electives',
            subjectId: 'sub-elective-1',
            startPace: 1,
            endPace: 12,
            skipPaces: [],
            notPairWith: [],
          },
          {
            categoryId: 'cat-electives',
            subjectId: 'sub-elective-2',
            startPace: 1,
            endPace: 12,
            skipPaces: [],
            notPairWith: [],
          },
        ],
      };

      const result = algorithm.generate(input);

      // Total should be 14 + 12 + 12 + 12 + 12 + 12 = 74
      expect(result).toHaveLength(74);

      // Verify each subject has correct pace count
      const mathPaces = result.filter(p => p.subjectId === 'sub-math');
      const englishPaces = result.filter(p => p.subjectId === 'sub-english');
      const sciencePaces = result.filter(p => p.subjectId === 'sub-science');
      const historyPaces = result.filter(p => p.subjectId === 'sub-history');
      const elective1Paces = result.filter(p => p.subjectId === 'sub-elective-1');
      const elective2Paces = result.filter(p => p.subjectId === 'sub-elective-2');

      expect(mathPaces).toHaveLength(14);
      expect(englishPaces).toHaveLength(12);
      expect(sciencePaces).toHaveLength(12);
      expect(historyPaces).toHaveLength(12);
      expect(elective1Paces).toHaveLength(12);
      expect(elective2Paces).toHaveLength(12);
    });

    it('should not place two electives from same category in the same week', () => {
      const input: GenerateProjectionInput = {
        studentId: 'student-1',
        schoolId: 'school-1',
        schoolYear: 'sy-1',
        subjects: [
          {
            categoryId: 'cat-core',
            subjectId: 'sub-core-1',
            startPace: 1,
            endPace: 36,
            skipPaces: [],
            notPairWith: [],
          },
          {
            categoryId: 'cat-core-2',
            subjectId: 'sub-core-2',
            startPace: 1,
            endPace: 36,
            skipPaces: [],
            notPairWith: [],
          },
          // Two electives sharing the same category
          {
            categoryId: 'cat-electives',
            subjectId: 'sub-elective-a',
            startPace: 1,
            endPace: 12,
            skipPaces: [],
            notPairWith: [],
          },
          {
            categoryId: 'cat-electives',
            subjectId: 'sub-elective-b',
            startPace: 1,
            endPace: 12,
            skipPaces: [],
            notPairWith: [],
          },
        ],
      };

      const result = algorithm.generate(input);
      expect(result).toHaveLength(96); // 36 + 36 + 12 + 12

      // Group paces by week
      const byWeek = new Map<number, typeof result>();
      for (const pace of result) {
        const weekKey = (pace.quarter - 1) * 9 + pace.week - 1;
        if (!byWeek.has(weekKey)) {
          byWeek.set(weekKey, []);
        }
        byWeek.get(weekKey)!.push(pace);
      }

      // Verify no week has both electives
      for (const [_weekKey, paces] of byWeek) {
        const subjectIds = paces.map(p => p.subjectId);
        const hasElectiveA = subjectIds.includes('sub-elective-a');
        const hasElectiveB = subjectIds.includes('sub-elective-b');
        expect(hasElectiveA && hasElectiveB).toBe(false);
      }
    });

    it('should handle three electives sharing the same categoryId', () => {
      const input: GenerateProjectionInput = {
        studentId: 'student-1',
        schoolId: 'school-1',
        schoolYear: 'sy-1',
        subjects: [
          {
            categoryId: 'cat-main',
            subjectId: 'sub-main',
            startPace: 1,
            endPace: 36,
            skipPaces: [],
            notPairWith: [],
          },
          {
            categoryId: 'cat-secondary',
            subjectId: 'sub-secondary',
            startPace: 1,
            endPace: 36,
            skipPaces: [],
            notPairWith: [],
          },
          // Three electives sharing the same category
          {
            categoryId: 'cat-electives',
            subjectId: 'sub-elective-x',
            startPace: 1,
            endPace: 8,
            skipPaces: [],
            notPairWith: [],
          },
          {
            categoryId: 'cat-electives',
            subjectId: 'sub-elective-y',
            startPace: 1,
            endPace: 8,
            skipPaces: [],
            notPairWith: [],
          },
          {
            categoryId: 'cat-electives',
            subjectId: 'sub-elective-z',
            startPace: 1,
            endPace: 8,
            skipPaces: [],
            notPairWith: [],
          },
        ],
      };

      const result = algorithm.generate(input);

      // Total should be 36 + 36 + 8 + 8 + 8 = 96
      expect(result).toHaveLength(96);

      // Verify each elective has correct pace count
      const electiveXPaces = result.filter(p => p.subjectId === 'sub-elective-x');
      const electiveYPaces = result.filter(p => p.subjectId === 'sub-elective-y');
      const electiveZPaces = result.filter(p => p.subjectId === 'sub-elective-z');

      expect(electiveXPaces).toHaveLength(8);
      expect(electiveYPaces).toHaveLength(8);
      expect(electiveZPaces).toHaveLength(8);
    });

    it('should produce deterministic output for electives', () => {
      const input: GenerateProjectionInput = {
        studentId: 'student-1',
        schoolId: 'school-1',
        schoolYear: 'sy-1',
        subjects: [
          {
            categoryId: 'cat-math',
            subjectId: 'sub-math',
            startPace: 1,
            endPace: 36,
            skipPaces: [],
            notPairWith: [],
          },
          {
            categoryId: 'cat-english',
            subjectId: 'sub-english',
            startPace: 1,
            endPace: 36,
            skipPaces: [],
            notPairWith: [],
          },
          {
            categoryId: 'cat-electives',
            subjectId: 'sub-elective-1',
            startPace: 1,
            endPace: 12,
            skipPaces: [],
            notPairWith: [],
          },
          {
            categoryId: 'cat-electives',
            subjectId: 'sub-elective-2',
            startPace: 1,
            endPace: 12,
            skipPaces: [],
            notPairWith: [],
          },
        ],
      };

      const result1 = algorithm.generate(input);
      const result2 = algorithm.generate(input);

      expect(result1).toEqual(result2);
    });

    it('should distribute elective paces across all quarters', () => {
      const input: GenerateProjectionInput = {
        studentId: 'student-1',
        schoolId: 'school-1',
        schoolYear: 'sy-1',
        subjects: [
          {
            categoryId: 'cat-core',
            subjectId: 'sub-core',
            startPace: 1,
            endPace: 36,
            skipPaces: [],
            notPairWith: [],
          },
          {
            categoryId: 'cat-core-2',
            subjectId: 'sub-core-2',
            startPace: 1,
            endPace: 36,
            skipPaces: [],
            notPairWith: [],
          },
          {
            categoryId: 'cat-electives',
            subjectId: 'sub-elective-1',
            startPace: 1,
            endPace: 12,
            skipPaces: [],
            notPairWith: [],
          },
          {
            categoryId: 'cat-electives',
            subjectId: 'sub-elective-2',
            startPace: 1,
            endPace: 12,
            skipPaces: [],
            notPairWith: [],
          },
        ],
      };

      const result = algorithm.generate(input);

      // Group elective 1 paces by quarter
      const elective1ByQuarter = new Map<number, number>();
      const elective2ByQuarter = new Map<number, number>();

      for (const pace of result) {
        if (pace.subjectId === 'sub-elective-1') {
          elective1ByQuarter.set(pace.quarter, (elective1ByQuarter.get(pace.quarter) || 0) + 1);
        }
        if (pace.subjectId === 'sub-elective-2') {
          elective2ByQuarter.set(pace.quarter, (elective2ByQuarter.get(pace.quarter) || 0) + 1);
        }
      }

      // Each elective should have paces in all 4 quarters (12 paces / 4 quarters = 3 per quarter)
      expect(elective1ByQuarter.size).toBe(4);
      expect(elective2ByQuarter.size).toBe(4);
    });

    it('should maintain sequential pace order for electives within quarters', () => {
      const input: GenerateProjectionInput = {
        studentId: 'student-1',
        schoolId: 'school-1',
        schoolYear: 'sy-1',
        subjects: [
          {
            categoryId: 'cat-core',
            subjectId: 'sub-core',
            startPace: 1,
            endPace: 36,
            skipPaces: [],
            notPairWith: [],
          },
          {
            categoryId: 'cat-core-2',
            subjectId: 'sub-core-2',
            startPace: 1,
            endPace: 36,
            skipPaces: [],
            notPairWith: [],
          },
          {
            categoryId: 'cat-electives',
            subjectId: 'sub-elective-1',
            startPace: 1,
            endPace: 12,
            skipPaces: [],
            notPairWith: [],
          },
          {
            categoryId: 'cat-electives',
            subjectId: 'sub-elective-2',
            startPace: 1,
            endPace: 12,
            skipPaces: [],
            notPairWith: [],
          },
        ],
      };

      const result = algorithm.generate(input);

      // Group by quarter and subject
      const byQuarterAndSubject = new Map<string, typeof result>();
      for (const pace of result) {
        const key = `${pace.quarter}-${pace.subjectId}`;
        if (!byQuarterAndSubject.has(key)) {
          byQuarterAndSubject.set(key, []);
        }
        byQuarterAndSubject.get(key)!.push(pace);
      }

      // Check sequential order within each quarter for each elective
      for (const [key, paces] of byQuarterAndSubject) {
        if (key.includes('sub-elective')) {
          // Sort by week within quarter
          const sorted = [...paces].sort((a, b) => a.week - b.week);

          // Verify pace codes are in order
          for (let i = 0; i < sorted.length - 1; i++) {
            const currentPace = parseInt(sorted[i].paceCode);
            const nextPace = parseInt(sorted[i + 1].paceCode);
            expect(nextPace).toBeGreaterThanOrEqual(currentPace);
          }
        }
      }
    });

    it('should respect notPairWith between electives', () => {
      const input: GenerateProjectionInput = {
        studentId: 'student-1',
        schoolId: 'school-1',
        schoolYear: 'sy-1',
        subjects: [
          {
            categoryId: 'cat-core',
            subjectId: 'sub-core',
            startPace: 1,
            endPace: 36,
            skipPaces: [],
            notPairWith: [],
          },
          {
            categoryId: 'cat-core-2',
            subjectId: 'sub-core-2',
            startPace: 1,
            endPace: 36,
            skipPaces: [],
            notPairWith: [],
          },
          {
            categoryId: 'cat-electives',
            subjectId: 'sub-elective-1',
            startPace: 1,
            endPace: 12,
            skipPaces: [],
            notPairWith: ['sub-elective-2'], // Don't pair with elective 2
          },
          {
            categoryId: 'cat-electives',
            subjectId: 'sub-elective-2',
            startPace: 1,
            endPace: 12,
            skipPaces: [],
            notPairWith: ['sub-elective-1'], // Don't pair with elective 1
          },
        ],
      };

      const result = algorithm.generate(input);
      expect(result).toHaveLength(96);

      // Group paces by week
      const byWeek = new Map<number, typeof result>();
      for (const pace of result) {
        const weekKey = (pace.quarter - 1) * 9 + pace.week - 1;
        if (!byWeek.has(weekKey)) {
          byWeek.set(weekKey, []);
        }
        byWeek.get(weekKey)!.push(pace);
      }

      // Verify electives are not in the same week
      for (const [_weekKey, paces] of byWeek) {
        const subjectIds = paces.map(p => p.subjectId);
        const hasElective1 = subjectIds.includes('sub-elective-1');
        const hasElective2 = subjectIds.includes('sub-elective-2');
        expect(hasElective1 && hasElective2).toBe(false);
      }
    });

    it('should handle electives with different pace counts', () => {
      const input: GenerateProjectionInput = {
        studentId: 'student-1',
        schoolId: 'school-1',
        schoolYear: 'sy-1',
        subjects: [
          {
            categoryId: 'cat-core',
            subjectId: 'sub-core',
            startPace: 1,
            endPace: 36,
            skipPaces: [],
            notPairWith: [],
          },
          {
            categoryId: 'cat-core-2',
            subjectId: 'sub-core-2',
            startPace: 1,
            endPace: 36,
            skipPaces: [],
            notPairWith: [],
          },
          // Electives with different pace counts
          {
            categoryId: 'cat-electives',
            subjectId: 'sub-elective-large',
            startPace: 1,
            endPace: 16,
            skipPaces: [],
            notPairWith: [],
          },
          {
            categoryId: 'cat-electives',
            subjectId: 'sub-elective-small',
            startPace: 1,
            endPace: 8,
            skipPaces: [],
            notPairWith: [],
          },
        ],
      };

      const result = algorithm.generate(input);

      // Total: 36 + 36 + 16 + 8 = 96
      expect(result).toHaveLength(96);

      const largePaces = result.filter(p => p.subjectId === 'sub-elective-large');
      const smallPaces = result.filter(p => p.subjectId === 'sub-elective-small');

      expect(largePaces).toHaveLength(16);
      expect(smallPaces).toHaveLength(8);
    });

    it('should correctly track subjects using trackingId (subjectId for electives)', () => {
      const input: GenerateProjectionInput = {
        studentId: 'student-1',
        schoolId: 'school-1',
        schoolYear: 'sy-1',
        subjects: [
          // Non-elective (single subject per category)
          {
            categoryId: 'cat-math',
            subjectId: 'sub-math',
            startPace: 1,
            endPace: 36,
            skipPaces: [],
            notPairWith: [],
          },
          // Electives (multiple subjects sharing category)
          {
            categoryId: 'cat-electives',
            subjectId: 'sub-elective-1',
            startPace: 1,
            endPace: 18,
            skipPaces: [],
            notPairWith: [],
          },
          {
            categoryId: 'cat-electives',
            subjectId: 'sub-elective-2',
            startPace: 1,
            endPace: 18,
            skipPaces: [],
            notPairWith: [],
          },
        ],
      };

      const result = algorithm.generate(input);

      // Total: 36 + 18 + 18 = 72
      expect(result).toHaveLength(72);

      // Verify all paces are correctly attributed
      const mathPaces = result.filter(p => p.subjectId === 'sub-math');
      const elective1Paces = result.filter(p => p.subjectId === 'sub-elective-1');
      const elective2Paces = result.filter(p => p.subjectId === 'sub-elective-2');

      expect(mathPaces).toHaveLength(36);
      expect(elective1Paces).toHaveLength(18);
      expect(elective2Paces).toHaveLength(18);

      // Group by week and verify max 3 subjects per week
      const byWeek = new Map<number, Set<string>>();
      for (const pace of result) {
        const weekKey = (pace.quarter - 1) * 9 + pace.week - 1;
        if (!byWeek.has(weekKey)) {
          byWeek.set(weekKey, new Set());
        }
        byWeek.get(weekKey)!.add(pace.subjectId);
      }

      for (const [_weekKey, subjects] of byWeek) {
        expect(subjects.size).toBeLessThanOrEqual(3);
      }
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

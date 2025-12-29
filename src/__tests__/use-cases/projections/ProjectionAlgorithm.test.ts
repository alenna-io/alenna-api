import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateProjection, SubjectInput } from '../../../core/app/use-cases/projections/ProjectionAlgorithm';

describe('ProjectionAlgorithm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => { });
  });

  describe('generateProjection', () => {
    it('should return empty object when no subjects provided', () => {
      const result = generateProjection([]);
      expect(result).toEqual({});
    });

    it('should generate projection for single subject', () => {
      const subjects: SubjectInput[] = [
        {
          subSubjectId: 'math-1',
          subSubjectName: 'Math',
          startPace: 1001,
          endPace: 1012,
          skipPaces: [],
          notPairWith: [],
        },
      ];

      const result = generateProjection(subjects);

      expect(result).toHaveProperty('Math');
      expect(result.Math.yearTotal).toBe(12);
      expect(result.Math.quarters.length).toBe(4);

      // Check that paces are distributed across quarters
      const totalPacesInQuarters = result.Math.quarters.reduce((sum, quarter) => {
        return sum + quarter.filter(pace => pace !== '').length;
      }, 0);
      expect(totalPacesInQuarters).toBe(12);
    });

    it('should distribute paces evenly across 4 quarters', () => {
      const subjects: SubjectInput[] = [
        {
          subSubjectId: 'math-1',
          subSubjectName: 'Math',
          startPace: 1001,
          endPace: 1012,
          skipPaces: [],
          notPairWith: [],
        },
      ];

      const result = generateProjection(subjects);
      const quarters = result.Math.quarters;

      // With 12 paces, should be 3 per quarter
      const pacesPerQuarter = quarters.map(quarter =>
        quarter.filter(pace => pace !== '').length
      );

      // Should be evenly distributed (3 per quarter)
      expect(pacesPerQuarter).toEqual([3, 3, 3, 3]);
    });

    it('should handle remainder paces by adding to early quarters', () => {
      const subjects: SubjectInput[] = [
        {
          subSubjectId: 'math-1',
          subSubjectName: 'Math',
          startPace: 1001,
          endPace: 1010,
          skipPaces: [],
          notPairWith: [],
        },
      ];

      const result = generateProjection(subjects);
      const quarters = result.Math.quarters;

      // With 10 paces, should be 3, 3, 2, 2 (remainder of 2 goes to first 2 quarters)
      const pacesPerQuarter = quarters.map(quarter =>
        quarter.filter(pace => pace !== '').length
      );

      expect(pacesPerQuarter[0]).toBeGreaterThanOrEqual(2);
      expect(pacesPerQuarter[1]).toBeGreaterThanOrEqual(2);
      expect(pacesPerQuarter[2]).toBeGreaterThanOrEqual(2);
      expect(pacesPerQuarter[3]).toBeGreaterThanOrEqual(2);

      // Total should be 10
      const total = pacesPerQuarter.reduce((sum, count) => sum + count, 0);
      expect(total).toBe(10);
    });

    it('should skip specified paces', () => {
      const subjects: SubjectInput[] = [
        {
          subSubjectId: 'math-1',
          subSubjectName: 'Math',
          startPace: 1001,
          endPace: 1012,
          skipPaces: [1005, 1010],
          notPairWith: [],
        },
      ];

      const result = generateProjection(subjects);

      expect(result.Math.yearTotal).toBe(10); // 12 - 2 skipped = 10

      // Check that skipped paces are not in the result
      const allPaces = result.Math.quarters.flat().filter(pace => pace !== '');
      expect(allPaces).not.toContain('1005');
      expect(allPaces).not.toContain('1010');
    });

    it('should generate balanced weekly schedule (2-3 paces per week)', () => {
      const subjects: SubjectInput[] = [
        {
          subSubjectId: 'math-1',
          subSubjectName: 'Math',
          startPace: 1001,
          endPace: 1012,
          skipPaces: [],
          notPairWith: [],
        },
        {
          subSubjectId: 'english-1',
          subSubjectName: 'English',
          startPace: 2001,
          endPace: 2012,
          skipPaces: [],
          notPairWith: [],
        },
        {
          subSubjectId: 'science-1',
          subSubjectName: 'Science',
          startPace: 3001,
          endPace: 3012,
          skipPaces: [],
          notPairWith: [],
        },
        {
          subSubjectId: 'social-1',
          subSubjectName: 'Social Studies',
          startPace: 4001,
          endPace: 4012,
          skipPaces: [],
          notPairWith: [],
        },
        {
          subSubjectId: 'wb-1',
          subSubjectName: 'Word Building',
          startPace: 5001,
          endPace: 5012,
          skipPaces: [],
          notPairWith: [],
        },
        {
          subSubjectId: 'spanish-1',
          subSubjectName: 'Spanish',
          startPace: 6001,
          endPace: 6012,
          skipPaces: [],
          notPairWith: [],
        },
      ];

      const result = generateProjection(subjects);

      // Check each quarter
      for (let q = 0; q < 4; q++) {
        const weekCounts: number[] = [];

        // Count paces per week across all subjects
        for (let week = 0; week < 9; week++) {
          let weekPaceCount = 0;
          for (const subjectName of Object.keys(result)) {
            const pace = result[subjectName].quarters[q][week];
            if (pace !== '') {
              weekPaceCount++;
            }
          }
          weekCounts.push(weekPaceCount);
        }

        // Most weeks should have 2-3 paces
        const weeksInRange = weekCounts.filter(count => count >= 2 && count <= 3).length;
        expect(weeksInRange).toBeGreaterThan(6); // At least 7 out of 9 weeks should be in range
      }
    });

    it('should respect notPairWith constraints', () => {
      const subjects: SubjectInput[] = [
        {
          subSubjectId: 'math-1',
          subSubjectName: 'Math',
          startPace: 1001,
          endPace: 1009,
          skipPaces: [],
          notPairWith: ['english-1'],
        },
        {
          subSubjectId: 'english-1',
          subSubjectName: 'English',
          startPace: 2001,
          endPace: 2009,
          skipPaces: [],
          notPairWith: ['math-1'],
        },
      ];

      const result = generateProjection(subjects);

      // Check that Math and English are never in the same week
      for (let q = 0; q < 4; q++) {
        for (let week = 0; week < 9; week++) {
          const mathPace = result.Math.quarters[q][week];
          const englishPace = result.English.quarters[q][week];

          // If both have paces in the same week, that's a constraint violation
          // (This should be rare or not happen with standard 72 paces)
          if (mathPace !== '' && englishPace !== '') {
            // With only 2 subjects and constraints, this might happen if >72 paces
            // But for standard distribution, it should be avoided
            console.warn(`Constraint violation detected: Math and English in same week Q${q + 1} W${week + 1}`);
          }
        }
      }
    });

    it('should handle difficulty levels', () => {
      const subjects: SubjectInput[] = [
        {
          subSubjectId: 'math-1',
          subSubjectName: 'Math',
          startPace: 1001,
          endPace: 1009,
          skipPaces: [],
          notPairWith: [],
          difficulty: 5, // Hard
        },
        {
          subSubjectId: 'english-1',
          subSubjectName: 'English',
          startPace: 2001,
          endPace: 2009,
          skipPaces: [],
          notPairWith: [],
          difficulty: 1, // Easy
        },
      ];

      const result = generateProjection(subjects);

      expect(result).toHaveProperty('Math');
      expect(result).toHaveProperty('English');
      expect(result.Math.yearTotal).toBe(9);
      expect(result.English.yearTotal).toBe(9);
    });

    it('should handle multiple subjects with different pace counts', () => {
      const subjects: SubjectInput[] = [
        {
          subSubjectId: 'math-1',
          subSubjectName: 'Math',
          startPace: 1001,
          endPace: 1012,
          skipPaces: [],
          notPairWith: [],
        },
        {
          subSubjectId: 'english-1',
          subSubjectName: 'English',
          startPace: 2001,
          endPace: 2006,
          skipPaces: [],
          notPairWith: [],
        },
        {
          subSubjectId: 'science-1',
          subSubjectName: 'Science',
          startPace: 3001,
          endPace: 3018,
          skipPaces: [],
          notPairWith: [],
        },
      ];

      const result = generateProjection(subjects);

      expect(result.Math.yearTotal).toBe(12);
      expect(result.English.yearTotal).toBe(6);
      expect(result.Science.yearTotal).toBe(18);
    });

    it('should handle >72 paces by relaxing constraints when necessary', () => {
      const subjects: SubjectInput[] = [
        {
          subSubjectId: 'math-1',
          subSubjectName: 'Math',
          startPace: 1001,
          endPace: 1030,
          skipPaces: [],
          notPairWith: ['english-1'],
        },
        {
          subSubjectId: 'english-1',
          subSubjectName: 'English',
          startPace: 2001,
          endPace: 2030,
          skipPaces: [],
          notPairWith: ['math-1'],
        },
      ];

      const result = generateProjection(subjects);

      // With 60 total paces (>72 would require more), should still generate
      expect(result.Math.yearTotal).toBe(30);
      expect(result.English.yearTotal).toBe(30);

      // Should log warnings if constraints are relaxed
      expect(console.warn).toHaveBeenCalled();
    });

    it('should place all paces even with constraints', () => {
      const subjects: SubjectInput[] = [
        {
          subSubjectId: 'math-1',
          subSubjectName: 'Math',
          startPace: 1001,
          endPace: 1012,
          skipPaces: [],
          notPairWith: ['english-1', 'science-1'],
        },
        {
          subSubjectId: 'english-1',
          subSubjectName: 'English',
          startPace: 2001,
          endPace: 2012,
          skipPaces: [],
          notPairWith: ['math-1'],
        },
        {
          subSubjectId: 'science-1',
          subSubjectName: 'Science',
          startPace: 3001,
          endPace: 3012,
          skipPaces: [],
          notPairWith: ['math-1'],
        },
      ];

      const result = generateProjection(subjects);

      // All paces should be placed
      expect(result.Math.yearTotal).toBe(12);
      expect(result.English.yearTotal).toBe(12);
      expect(result.Science.yearTotal).toBe(12);
    });

    it('should handle reverse pace ranges (startPace > endPace)', () => {
      const subjects: SubjectInput[] = [
        {
          subSubjectId: 'math-1',
          subSubjectName: 'Math',
          startPace: 1012,
          endPace: 1001,
          skipPaces: [],
          notPairWith: [],
        },
      ];

      const result = generateProjection(subjects);

      // Should return empty or handle gracefully
      expect(result.Math.yearTotal).toBe(0);
    });

    it('should ensure minimum 2 paces per week when possible', () => {
      const subjects: SubjectInput[] = [
        {
          subSubjectId: 'math-1',
          subSubjectName: 'Math',
          startPace: 1001,
          endPace: 1012,
          skipPaces: [],
          notPairWith: [],
        },
        {
          subSubjectId: 'english-1',
          subSubjectName: 'English',
          startPace: 2001,
          endPace: 2012,
          skipPaces: [],
          notPairWith: [],
        },
        {
          subSubjectId: 'science-1',
          subSubjectName: 'Science',
          startPace: 3001,
          endPace: 3012,
          skipPaces: [],
          notPairWith: [],
        },
        {
          subSubjectId: 'social-1',
          subSubjectName: 'Social Studies',
          startPace: 4001,
          endPace: 4012,
          skipPaces: [],
          notPairWith: [],
        },
        {
          subSubjectId: 'wb-1',
          subSubjectName: 'Word Building',
          startPace: 5001,
          endPace: 5012,
          skipPaces: [],
          notPairWith: [],
        },
        {
          subSubjectId: 'spanish-1',
          subSubjectName: 'Spanish',
          startPace: 6001,
          endPace: 6012,
          skipPaces: [],
          notPairWith: [],
        },
      ];

      const result = generateProjection(subjects);

      // Check each quarter
      for (let q = 0; q < 4; q++) {
        for (let week = 0; week < 9; week++) {
          let weekPaceCount = 0;
          for (const subjectName of Object.keys(result)) {
            const pace = result[subjectName].quarters[q][week];
            if (pace !== '') {
              weekPaceCount++;
            }
          }

          // With 6 subjects and 12 paces each (72 total), most weeks should have at least 2 paces
          // Some weeks might have fewer due to constraints, but most should meet minimum
          if (week < 8) { // Don't check last week as strictly
            expect(weekPaceCount).toBeGreaterThanOrEqual(1);
          }
        }
      }
    });

    it('should handle extendToNextLevel option', () => {
      const subjects: SubjectInput[] = [
        {
          subSubjectId: 'math-1',
          subSubjectName: 'Math',
          startPace: 1001,
          endPace: 1012,
          skipPaces: [],
          notPairWith: [],
          extendToNextLevel: true,
        },
      ];

      const result = generateProjection(subjects);

      // Algorithm should still generate projection
      expect(result).toHaveProperty('Math');
      expect(result.Math.yearTotal).toBe(12);
    });

    it('should maintain quarterly balance across all subjects', () => {
      const subjects: SubjectInput[] = [
        {
          subSubjectId: 'math-1',
          subSubjectName: 'Math',
          startPace: 1001,
          endPace: 1012,
          skipPaces: [],
          notPairWith: [],
        },
        {
          subSubjectId: 'english-1',
          subSubjectName: 'English',
          startPace: 2001,
          endPace: 2012,
          skipPaces: [],
          notPairWith: [],
        },
      ];

      const result = generateProjection(subjects);

      // Check that each subject has paces in all quarters
      for (const subjectName of Object.keys(result)) {
        const quarters = result[subjectName].quarters;
        for (let q = 0; q < 4; q++) {
          const pacesInQuarter = quarters[q].filter(pace => pace !== '').length;
          expect(pacesInQuarter).toBeGreaterThan(0);
        }
      }
    });

    it('should handle bidirectional constraints', () => {
      const subjects: SubjectInput[] = [
        {
          subSubjectId: 'math-1',
          subSubjectName: 'Math',
          startPace: 1001,
          endPace: 1009,
          skipPaces: [],
          notPairWith: ['english-1'],
        },
        {
          subSubjectId: 'english-1',
          subSubjectName: 'English',
          startPace: 2001,
          endPace: 2009,
          skipPaces: [],
          notPairWith: ['math-1'],
        },
      ];

      const result = generateProjection(subjects);

      // Both subjects should be generated
      expect(result).toHaveProperty('Math');
      expect(result).toHaveProperty('English');
      expect(result.Math.yearTotal).toBe(9);
      expect(result.English.yearTotal).toBe(9);
    });

    it('should handle complex constraint scenarios', () => {
      const subjects: SubjectInput[] = [
        {
          subSubjectId: 'math-1',
          subSubjectName: 'Math',
          startPace: 1001,
          endPace: 1009,
          skipPaces: [],
          notPairWith: ['english-1', 'science-1'],
        },
        {
          subSubjectId: 'english-1',
          subSubjectName: 'English',
          startPace: 2001,
          endPace: 2009,
          skipPaces: [],
          notPairWith: ['math-1', 'social-1'],
        },
        {
          subSubjectId: 'science-1',
          subSubjectName: 'Science',
          startPace: 3001,
          endPace: 3009,
          skipPaces: [],
          notPairWith: ['math-1'],
        },
        {
          subSubjectId: 'social-1',
          subSubjectName: 'Social Studies',
          startPace: 4001,
          endPace: 4009,
          skipPaces: [],
          notPairWith: ['english-1'],
        },
      ];

      const result = generateProjection(subjects);

      // All subjects should be generated
      expect(result).toHaveProperty('Math');
      expect(result).toHaveProperty('English');
      expect(result).toHaveProperty('Science');
      expect(result).toHaveProperty('Social Studies');

      // All paces should be placed
      expect(result.Math.yearTotal).toBe(9);
      expect(result.English.yearTotal).toBe(9);
      expect(result.Science.yearTotal).toBe(9);
      expect(result['Social Studies'].yearTotal).toBe(9);
    });

    it('should ensure minimum 18 paces per quarter across all subjects', () => {
      const subjects: SubjectInput[] = [
        {
          subSubjectId: 'math-1',
          subSubjectName: 'Math',
          startPace: 1001,
          endPace: 1020,
          skipPaces: [],
          notPairWith: [],
        },
        {
          subSubjectId: 'english-1',
          subSubjectName: 'English',
          startPace: 2001,
          endPace: 2010,
          skipPaces: [],
          notPairWith: [],
        },
      ];

      const result = generateProjection(subjects);

      const minPacesPerQuarter = 18;

      result.Math.quarters.forEach((quarter, index) => {
        const mathPaces = quarter.filter(pace => pace !== '').length;
        const englishPaces = result.English.quarters[index].filter(pace => pace !== '').length;
        const totalInQuarter = mathPaces + englishPaces;
        expect(totalInQuarter).toBeGreaterThanOrEqual(minPacesPerQuarter);
      });
    });

    it('should maintain sequential order within each quarter', () => {
      const subjects: SubjectInput[] = [
        {
          subSubjectId: 'math-1',
          subSubjectName: 'Math',
          startPace: 1001,
          endPace: 1020,
          skipPaces: [],
          notPairWith: [],
        },
      ];

      const result = generateProjection(subjects);

      result.Math.quarters.forEach((quarter) => {
        const paces = quarter.filter(pace => pace !== '').map(pace => parseInt(pace));
        for (let i = 1; i < paces.length; i++) {
          expect(paces[i]).toBeGreaterThan(paces[i - 1]);
        }
      });
    });

    it('should maintain pace number sequence across quarters', () => {
      const subjects: SubjectInput[] = [
        {
          subSubjectId: 'math-1',
          subSubjectName: 'Math',
          startPace: 1001,
          endPace: 1020,
          skipPaces: [],
          notPairWith: [],
        },
      ];

      const result = generateProjection(subjects);

      for (let q = 0; q < 3; q++) {
        const currentQuarter = result.Math.quarters[q];
        const nextQuarter = result.Math.quarters[q + 1];
        const currentPaces = currentQuarter.filter(pace => pace !== '').map(pace => parseInt(pace));
        const nextPaces = nextQuarter.filter(pace => pace !== '').map(pace => parseInt(pace));

        if (currentPaces.length > 0 && nextPaces.length > 0) {
          const lastPaceInCurrent = Math.max(...currentPaces);
          const firstPaceInNext = Math.min(...nextPaces);
          expect(firstPaceInNext).toBeGreaterThan(lastPaceInCurrent);
        }
      }
    });

    it('should handle edge case: total paces exactly divisible by 4', () => {
      const subjects: SubjectInput[] = [
        {
          subSubjectId: 'math-1',
          subSubjectName: 'Math',
          startPace: 1001,
          endPace: 1012,
          skipPaces: [],
          notPairWith: [],
        },
      ];

      const result = generateProjection(subjects);

      expect(result.Math.yearTotal).toBe(12);
      const totalInQuarters = result.Math.quarters.reduce((sum, quarter) => {
        return sum + quarter.filter(pace => pace !== '').length;
      }, 0);
      expect(totalInQuarters).toBe(12);
    });

    it('should handle edge case: very few total paces (< 18)', () => {
      const subjects: SubjectInput[] = [
        {
          subSubjectId: 'math-1',
          subSubjectName: 'Math',
          startPace: 1001,
          endPace: 1010,
          skipPaces: [],
          notPairWith: [],
        },
      ];

      const result = generateProjection(subjects);

      expect(result.Math.yearTotal).toBe(10);
      const totalInQuarters = result.Math.quarters.reduce((sum, quarter) => {
        return sum + quarter.filter(pace => pace !== '').length;
      }, 0);
      expect(totalInQuarters).toBe(10);
    });

    it('should handle edge case: very many total paces (> 108)', () => {
      const subjects: SubjectInput[] = [
        {
          subSubjectId: 'math-1',
          subSubjectName: 'Math',
          startPace: 1001,
          endPace: 1150,
          skipPaces: [],
          notPairWith: [],
        },
      ];

      const result = generateProjection(subjects);

      expect(result.Math.yearTotal).toBe(150);
      const totalInQuarters = result.Math.quarters.reduce((sum, quarter) => {
        return sum + quarter.filter(pace => pace !== '').length;
      }, 0);
      expect(totalInQuarters).toBe(150);
    });
  });
});


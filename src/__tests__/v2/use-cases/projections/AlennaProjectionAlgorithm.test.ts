import { describe, it, expect } from 'vitest';
import { AlennaProjectionAlgorithm } from '../../../../core/domain/services/implementations/AlennaProjectionAlgorithm';
import { GenerateProjectionInput } from '../../../../core/app/dtos/projections/GenerateProjectionInput';

const makeSubject = (
  id: string,
  start: number,
  end: number,
  skipPaces: number[] = [],
  difficulty = 3
) => ({
  subSubjectId: id,
  startPace: start,
  endPace: end,
  skipPaces,
  difficulty,
  notPairWith: [],
});

const run = (input: GenerateProjectionInput) =>
  new AlennaProjectionAlgorithm().generate(input);

describe('AlennaProjectionAlgorithm', () => {
  it('generates all paces exactly once (no undefined)', () => {
    const input: GenerateProjectionInput = {
      studentId: 's1',
      schoolId: 'school1',
      schoolYear: 'sy1',
      subjects: [
        makeSubject('math', 1, 12),
        makeSubject('reading', 1, 12),
        makeSubject('science', 1, 12),
      ],
    };

    const result = run(input);

    expect(result.length).toBe(36);

    for (const pace of result) {
      expect(pace.paceCode).toBeDefined();
    }

    const seen = new Set(
      result.map(r => `${r.subSubjectId}:${r.paceCode}`)
    );

    expect(seen.size).toBe(36);
  });

  it('never assigns more than 3 subjects per week', () => {
    const input: GenerateProjectionInput = {
      studentId: 's1',
      schoolId: 'school1',
      schoolYear: 'sy1',
      subjects: [
        makeSubject('a', 1, 36),
        makeSubject('b', 1, 36),
        makeSubject('c', 1, 36),
        makeSubject('d', 1, 36),
      ],
    };

    const result = run(input);

    const weekBuckets = new Map<string, number>();

    for (const r of result) {
      const key = `${r.quarter}-${r.week}`;
      weekBuckets.set(key, (weekBuckets.get(key) ?? 0) + 1);
    }

    for (const count of weekBuckets.values()) {
      expect(count).toBeLessThanOrEqual(3);
    }
  });

  it('distributes uneven subject sizes correctly (18 vs 6)', () => {
    const input: GenerateProjectionInput = {
      studentId: 's1',
      schoolId: 'school1',
      schoolYear: 'sy1',
      subjects: [
        makeSubject('heavy', 1, 18),
        makeSubject('light', 1, 6),
      ],
    };

    const result = run(input);

    const heavy = result.filter(r => r.subSubjectId === 'heavy');
    const light = result.filter(r => r.subSubjectId === 'light');

    expect(heavy.length).toBe(18);
    expect(light.length).toBe(6);

    // Light subject should be spread (not clumped)
    const lightWeeks = new Set(
      light.map(r => `${r.quarter}-${r.week}`)
    );

    expect(lightWeeks.size).toBeGreaterThan(4);
  });

  it('supports > 72 total paces (108 paces scenario)', () => {
    const input: GenerateProjectionInput = {
      studentId: 's1',
      schoolId: 'school1',
      schoolYear: 'sy1',
      subjects: [
        makeSubject('s1', 1, 36),
        makeSubject('s2', 1, 36),
        makeSubject('s3', 1, 36),
      ],
    };

    const result = run(input);

    expect(result.length).toBe(108);

    const seen = new Set(
      result.map(r => `${r.subSubjectId}:${r.paceCode}`)
    );

    expect(seen.size).toBe(108);
  });

  it('assigns valid quarter/week ranges', () => {
    const input: GenerateProjectionInput = {
      studentId: 's1',
      schoolId: 'school1',
      schoolYear: 'sy1',
      subjects: [
        makeSubject('math', 1, 12),
      ],
    };

    const result = run(input);

    for (const r of result) {
      expect(['Q1', 'Q2', 'Q3', 'Q4']).toContain(r.quarter);
      expect(r.week).toBeGreaterThanOrEqual(1);
      expect(r.week).toBeLessThanOrEqual(9);
    }
  });
});

import { ProjectionGenerator, GeneratedProjectionPace } from '../ProjectionGenerator';
import { GenerateProjectionInput } from '../../../app/dtos/v2/projections/GenerateProjectionInput';
import { InvalidEntityError } from '../../../app/errors/v2';

const TOTAL_WEEKS = 36;
const WEEKS_PER_QUARTER = 9;
const MAX_SUBJECTS_PER_WEEK = 3;
const MIN_TOTAL_PACES = 72;

interface SubjectPlan {
  subSubjectId: string;
  difficulty: number;
  notPairWith: Set<string>;
  paces: string[];
}

interface WeekSlot {
  index: number;
  subjects: Set<string>;
  paces: GeneratedProjectionPace[];
}

export class AlennaProjectionAlgorithm implements ProjectionGenerator {

  generate(input: GenerateProjectionInput): GeneratedProjectionPace[] {
    const subjects = this.normalizeSubjects(input);
    const totalPaces = subjects.reduce((s, x) => s + x.paces.length, 0);

    if (totalPaces < MIN_TOTAL_PACES) {
      throw new InvalidEntityError(
        'Projection',
        'Projection must contain at least 72 total paces'
      );
    }

    const weeks = this.buildWeeks();

    const isUniform =
      totalPaces === 72 &&
      subjects.every(s => s.paces.length === subjects[0].paces.length);

    if (isUniform) {
      this.generateUniformByDifficulty(subjects, weeks);
    } else {
      this.generateByFrequency(subjects, weeks);
    }

    return weeks.flatMap(w => w.paces);
  }

  // ────────────────────────────────────────────────
  // Phase 1 — Subject normalization
  // ────────────────────────────────────────────────
  /**
   * Converts raw input subjects into normalized SubjectPlan objects.
   *
   * Responsibilities:
   * - Expands start/end pace ranges
   * - Applies skipPaces
   * - Assigns default difficulty
   * - Normalizes notPairWith into Sets
   *
   * @param input Projection generation input DTO
   * @returns Normalized subject plans
   */
  private normalizeSubjects(input: GenerateProjectionInput): SubjectPlan[] {
    return input.subjects.map(s => {
      const paces: string[] = [];

      for (let p = s.startPace; p <= s.endPace; p++) {
        if (!s.skipPaces?.includes(p)) {
          paces.push(String(p));
        }
      }

      return {
        subSubjectId: s.subSubjectId,
        difficulty: s.difficulty ?? 3,
        notPairWith: new Set(s.notPairWith ?? []),
        paces,
      };
    });
  }

  // ────────────────────────────────────────────────
  // Phase 2 — Week lattice
  // ────────────────────────────────────────────────
  /**
   * Creates the fixed 36-week lattice used by all strategies.
   */
  private buildWeeks(): WeekSlot[] {
    return Array.from({ length: TOTAL_WEEKS }, (_, i) => ({
      index: i,
      subjects: new Set(),
      paces: [],
    }));
  }

  // ────────────────────────────────────────────────
  // MODE A — Uniform curriculum (difficulty pairing)
  // ────────────────────────────────────────────────
  /**
   * Generates projections when:
   * - Total paces === 72
   * - All subjects have identical pace counts
   *
   * Strategy:
   * 1. Sort subjects by difficulty (desc)
   * 2. Pair hardest with easiest
   * 3. Rotate pairs across weeks
   *
   * Guarantees:
   * - Perfect quarter balance
   * - Difficulty-balanced workload
   * - No forbidden pairings
   */
  private generateUniformByDifficulty(
    subjects: SubjectPlan[],
    weeks: WeekSlot[]
  ): void {
    const sorted = [...subjects].sort((a, b) => b.difficulty - a.difficulty);
    const pairs: [SubjectPlan, SubjectPlan][] = [];

    while (sorted.length) {
      const high = sorted.shift()!;
      const low = sorted.pop()!;

      if (high.notPairWith.has(low.subSubjectId)) {
        throw new InvalidEntityError(
          'Projection',
          'Invalid difficulty pairing due to notPairWith constraint'
        );
      }

      pairs.push([high, low]);
    }

    const paceCount = pairs[0][0].paces.length;
    let weekIndex = 0;

    for (let p = 0; p < paceCount; p++) {
      for (const [a, b] of pairs) {
        const week = weeks[weekIndex++ % TOTAL_WEEKS];

        this.placePace(week, a, a.paces[p]);
        this.placePace(week, b, b.paces[p]);
      }
    }
  }

  // ────────────────────────────────────────────────
  // MODE B — Non-uniform curriculum (frequency-based)
  // ────────────────────────────────────────────────
  /**
   * Generates projections for non-uniform pace distributions.
   *
   * Strategy:
   * - Round-robin placement by subject frequency
   * - Enforces weekly limits and notPairWith
   *
   * Difficulty is intentionally ignored in this mode.
   */
  private generateByFrequency(
    subjects: SubjectPlan[],
    weeks: WeekSlot[]
  ): void {
    const cursors = subjects.map(s => ({ subject: s, index: 0 }));
    let weekIndex = 0;

    while (cursors.some(c => c.index < c.subject.paces.length)) {
      for (const cursor of cursors) {
        if (cursor.index >= cursor.subject.paces.length) continue;

        for (let tries = 0; tries < TOTAL_WEEKS; tries++) {
          const week = weeks[weekIndex % TOTAL_WEEKS];

          if (
            week.subjects.size < MAX_SUBJECTS_PER_WEEK &&
            !week.subjects.has(cursor.subject.subSubjectId) &&
            !this.violatesNotPair(cursor.subject, week.subjects)
          ) {
            this.placePace(
              week,
              cursor.subject,
              cursor.subject.paces[cursor.index++]
            );
            break;
          }

          weekIndex++;
        }
      }

      weekIndex++;
    }
  }

  // ────────────────────────────────────────────────
  // Helpers
  // ────────────────────────────────────────────────
  private placePace(
    week: WeekSlot,
    subject: SubjectPlan,
    paceCode: string
  ): void {
    week.subjects.add(subject.subSubjectId);
    week.paces.push({
      subSubjectId: subject.subSubjectId,
      paceCode,
      quarter: `Q${Math.floor(week.index / WEEKS_PER_QUARTER) + 1}` as any,
      week: (week.index % WEEKS_PER_QUARTER) + 1,
    });
  }

  /**
   * Validates notPairWith constraint for a subject.
   */
  private violatesNotPair(subject: SubjectPlan, existing: Set<string>): boolean {
    for (const other of existing) {
      if (subject.notPairWith.has(other)) return true;
    }
    return false;
  }
}

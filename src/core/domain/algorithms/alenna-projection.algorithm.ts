import { ProjectionGenerator, GeneratedProjectionPace } from './projection-generator';
import { GenerateProjectionInput } from '../../application/dtos/projections/GenerateProjectionInput';
import { InvalidEntityError } from '../errors';
import { logger } from '../../../utils/logger';

const TOTAL_WEEKS = 36;
const WEEKS_PER_QUARTER = 9;
const MAX_SUBJECTS_PER_WEEK = 3;
const MIN_TOTAL_PACES = 72;

interface SubjectPlan {
  categoryId: string;
  subjectId?: string;
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
    logger.debug("Normalizing subjects...");
    const subjects = this.normalizeSubjects(input);
    logger.debug("Getting total paces...");
    const totalPaces = subjects.reduce((s, x) => s + x.paces.length, 0);
    logger.debug("Total paces:", totalPaces);

    if (totalPaces < MIN_TOTAL_PACES) {
      throw new InvalidEntityError(
        'Projection',
        'Projection must contain at least 72 total paces'
      );
    }

    const pacesByQuarter = Array.from({ length: 4 }, (_, i) => Math.floor(totalPaces / 4) + (i < totalPaces % 4 ? 1 : 0));
    logger.debug("Paces by quarter", pacesByQuarter);

    logger.debug("Building weeks...");
    const weeks = this.buildWeeks();

    const isUniform =
      totalPaces === 72 &&
      subjects.every(s => s.paces.length === subjects[0].paces.length);

    if (isUniform) {
      logger.debug("Generating uniform by difficulty...");
      this.generateUniformByDifficulty(subjects, weeks);
    } else {
      logger.debug("Generating by frequency...");
      this.generateByFrequency2(subjects, weeks, totalPaces);
    }

    logger.debug("Returning generated projection...");
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
        categoryId: s.categoryId,
        subjectId: s.subjectId ?? '',
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

      if (high.notPairWith.has(low.categoryId)) {
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
    // console.log("Cursors");
    // console.log(cursors);
    let weekIndex = 0;

    while (cursors.some(c => c.index < c.subject.paces.length)) {
      for (const cursor of cursors) {
        if (cursor.index >= cursor.subject.paces.length) continue;

        for (let tries = 0; tries < TOTAL_WEEKS; tries++) {
          const week = weeks[weekIndex % TOTAL_WEEKS];

          if (
            week.subjects.size < MAX_SUBJECTS_PER_WEEK &&
            !week.subjects.has(cursor.subject.categoryId) &&
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

  private generateByFrequency2(
    subjects: SubjectPlan[],
    weeks: WeekSlot[],
    _totalPaces: number
  ) {
    const cursorsMap = new Map(subjects.map(s => [s.categoryId, { subject: s, index: 0 }]));

    // Calculate paces by quarter for each subject
    const pacesByQuarterBySubjectMap = new Map<string, number[]>();
    for (const subject of subjects) {
      const totalPacesBySubject = subject.paces.length;
      const pacesByQuarter = Array.from({ length: 4 }, (_, i) =>
        Math.floor(totalPacesBySubject / 4) + (i < totalPacesBySubject % 4 ? 1 : 0)
      );
      pacesByQuarterBySubjectMap.set(subject.categoryId, pacesByQuarter);
    }

    // Calculate week frequencies by quarter for each subject
    const weeklyQuarterFrequencyBySubjectMap = new Map<string, number[]>();
    for (const subject of subjects) {
      const pacesByQuarterBySubject = pacesByQuarterBySubjectMap.get(subject.categoryId);
      if (!pacesByQuarterBySubject) {
        throw new Error(`Paces by quarter by subject not found for subject: ${subject.categoryId}`);
      }

      const weekFrequenciesByQuarterBySubject = new Array(4).fill(0);
      for (let q = 0; q < 4; q++) {
        const pacesInQuarter = pacesByQuarterBySubject[q];
        if (pacesInQuarter > 0) {
          weekFrequenciesByQuarterBySubject[q] = Math.round(WEEKS_PER_QUARTER / pacesInQuarter);
        }
      }
      weeklyQuarterFrequencyBySubjectMap.set(subject.categoryId, weekFrequenciesByQuarterBySubject);
    }

    // Process each quarter separately
    for (let quarter = 0; quarter < 4; quarter++) {
      const quarterBaseWeek = quarter * WEEKS_PER_QUARTER;

      // Sort subjects by pace count in THIS quarter (descending), tie-break by total year pace count
      const subjectsForQuarter = [...subjects].sort((a, b) => {
        const pacesA = pacesByQuarterBySubjectMap.get(a.categoryId)?.[quarter] ?? 0;
        const pacesB = pacesByQuarterBySubjectMap.get(b.categoryId)?.[quarter] ?? 0;
        if (pacesA !== pacesB) {
          return pacesB - pacesA;
        }
        return b.paces.length - a.paces.length;
      });

      // Assign offsets based on sorted order (0, 1, 2, ...)
      // Only place subjects with >3 paces per quarter initially
      const subjectsToPlace = subjectsForQuarter.filter(s => {
        const pacesInQuarter = pacesByQuarterBySubjectMap.get(s.categoryId)?.[quarter] ?? 0;
        return pacesInQuarter > 3;
      });

      // Place paces for each subject in this quarter
      for (let offset = 0; offset < subjectsToPlace.length; offset++) {
        const subject = subjectsToPlace[offset];
        const pacesInQuarter = pacesByQuarterBySubjectMap.get(subject.categoryId)?.[quarter] ?? 0;
        const frequency = weeklyQuarterFrequencyBySubjectMap.get(subject.categoryId)?.[quarter] ?? 0;

        if (pacesInQuarter === 0 || frequency === 0) continue;

        const cursor = cursorsMap.get(subject.categoryId);
        if (!cursor) continue;

        // Place each pace in this quarter
        for (let paceIndex = 0; paceIndex < pacesInQuarter; paceIndex++) {
          const weekIndexWithinQuarter = offset + (paceIndex * frequency);

          // If calculated week exceeds quarter bounds, find alternative placement
          if (weekIndexWithinQuarter >= WEEKS_PER_QUARTER) {
            // Try to find any available week in this quarter
            let found = false;
            for (let attempt = 0; attempt < WEEKS_PER_QUARTER; attempt++) {
              const tryWeekIndex = quarterBaseWeek + attempt;
              if (tryWeekIndex >= TOTAL_WEEKS) break;

              const tryWeek = weeks[tryWeekIndex];
              if (
                tryWeek.subjects.size < MAX_SUBJECTS_PER_WEEK &&
                !tryWeek.subjects.has(subject.categoryId) &&
                !this.violatesNotPair(subject, tryWeek.subjects)
              ) {
                this.placePace(tryWeek, subject, cursor.subject.paces[cursor.index]);
                cursor.index++;
                found = true;
                break;
              }
            }
            if (!found) {
              cursor.index++;
            }
            continue;
          }

          const globalWeekIndex = quarterBaseWeek + weekIndexWithinQuarter;
          if (globalWeekIndex < 0 || globalWeekIndex >= TOTAL_WEEKS) {
            cursor.index++;
            continue;
          }

          const week = weeks[globalWeekIndex];

          // Check constraints
          if (
            week.subjects.size >= MAX_SUBJECTS_PER_WEEK ||
            week.subjects.has(subject.categoryId) ||
            this.violatesNotPair(subject, week.subjects)
          ) {
            // Try to find any available week in this quarter (search entire quarter)
            let found = false;
            for (let attempt = 0; attempt < WEEKS_PER_QUARTER; attempt++) {
              const tryWeekIndex = quarterBaseWeek + attempt;
              if (tryWeekIndex >= TOTAL_WEEKS) break;

              const tryWeek = weeks[tryWeekIndex];
              if (
                tryWeek.subjects.size < MAX_SUBJECTS_PER_WEEK &&
                !tryWeek.subjects.has(subject.categoryId) &&
                !this.violatesNotPair(subject, tryWeek.subjects)
              ) {
                this.placePace(tryWeek, subject, cursor.subject.paces[cursor.index]);
                cursor.index++;
                found = true;
                break;
              }
            }
            if (!found) {
              // If still not found, try any week in the quarter ignoring some constraints (last resort)
              for (let attempt = 0; attempt < WEEKS_PER_QUARTER; attempt++) {
                const tryWeekIndex = quarterBaseWeek + attempt;
                if (tryWeekIndex >= TOTAL_WEEKS) break;

                const tryWeek = weeks[tryWeekIndex];
                if (
                  tryWeek.subjects.size < MAX_SUBJECTS_PER_WEEK &&
                  !tryWeek.subjects.has(subject.categoryId)
                ) {
                  // Skip notPairWith check as last resort
                  this.placePace(tryWeek, subject, cursor.subject.paces[cursor.index]);
                  cursor.index++;
                  found = true;
                  break;
                }
              }
              if (!found) {
                cursor.index++;
              }
            }
          } else {
            this.placePace(week, subject, cursor.subject.paces[cursor.index]);
            cursor.index++;
          }
        }
      }

      // Place subjects with <=3 paces per quarter (remaining subjects)
      // They also need offsets based on their position in the sorted list
      const remainingSubjects = subjectsForQuarter.filter(s => {
        const pacesInQuarter = pacesByQuarterBySubjectMap.get(s.categoryId)?.[quarter] ?? 0;
        return pacesInQuarter > 0 && pacesInQuarter <= 3;
      });

      // Calculate starting offset for remaining subjects (after subjects with >3 paces)
      const startingOffset = subjectsToPlace.length;

      for (let offset = 0; offset < remainingSubjects.length; offset++) {
        const subject = remainingSubjects[offset];
        const pacesInQuarter = pacesByQuarterBySubjectMap.get(subject.categoryId)?.[quarter] ?? 0;
        const frequency = weeklyQuarterFrequencyBySubjectMap.get(subject.categoryId)?.[quarter] ?? 0;

        if (pacesInQuarter === 0 || frequency === 0) continue;

        const cursor = cursorsMap.get(subject.categoryId);
        if (!cursor) continue;

        // Use frequency-based placement with offset
        for (let paceIndex = 0; paceIndex < pacesInQuarter; paceIndex++) {
          const subjectOffset = startingOffset + offset;
          let weekIndexWithinQuarter = subjectOffset + (paceIndex * frequency);

          // If calculated week exceeds quarter bounds, find alternative placement
          if (weekIndexWithinQuarter >= WEEKS_PER_QUARTER) {
            // Try to find any available week in this quarter
            let found = false;
            for (let attempt = 0; attempt < WEEKS_PER_QUARTER; attempt++) {
              const tryWeekIndex = quarterBaseWeek + attempt;
              if (tryWeekIndex >= TOTAL_WEEKS) break;

              const tryWeek = weeks[tryWeekIndex];
              if (
                tryWeek.subjects.size < MAX_SUBJECTS_PER_WEEK &&
                !tryWeek.subjects.has(subject.categoryId) &&
                !this.violatesNotPair(subject, tryWeek.subjects)
              ) {
                this.placePace(tryWeek, subject, cursor.subject.paces[cursor.index]);
                cursor.index++;
                found = true;
                break;
              }
            }
            if (!found) {
              cursor.index++;
            }
            continue;
          }

          const globalWeekIndex = quarterBaseWeek + weekIndexWithinQuarter;
          if (globalWeekIndex < 0 || globalWeekIndex >= TOTAL_WEEKS) {
            cursor.index++;
            continue;
          }

          const week = weeks[globalWeekIndex];

          // Check constraints
          if (
            week.subjects.size >= MAX_SUBJECTS_PER_WEEK ||
            week.subjects.has(subject.categoryId) ||
            this.violatesNotPair(subject, week.subjects)
          ) {
            // Try to find next available week in this quarter
            let found = false;
            for (let attempt = weekIndexWithinQuarter + 1; attempt < WEEKS_PER_QUARTER; attempt++) {
              const tryWeekIndex = quarterBaseWeek + attempt;
              if (tryWeekIndex >= TOTAL_WEEKS) break;

              const tryWeek = weeks[tryWeekIndex];
              if (
                tryWeek.subjects.size < MAX_SUBJECTS_PER_WEEK &&
                !tryWeek.subjects.has(subject.categoryId) &&
                !this.violatesNotPair(subject, tryWeek.subjects)
              ) {
                this.placePace(tryWeek, subject, cursor.subject.paces[cursor.index]);
                cursor.index++;
                found = true;
                break;
              }
            }
            if (!found) {
              // Last resort: try any week in quarter ignoring notPairWith
              for (let attempt = 0; attempt < WEEKS_PER_QUARTER; attempt++) {
                const tryWeekIndex = quarterBaseWeek + attempt;
                if (tryWeekIndex >= TOTAL_WEEKS) break;

                const tryWeek = weeks[tryWeekIndex];
                if (
                  tryWeek.subjects.size < MAX_SUBJECTS_PER_WEEK &&
                  !tryWeek.subjects.has(subject.categoryId)
                ) {
                  this.placePace(tryWeek, subject, cursor.subject.paces[cursor.index]);
                  cursor.index++;
                  found = true;
                  break;
                }
              }
              if (!found) {
                cursor.index++;
              }
            }
          } else {
            this.placePace(week, subject, cursor.subject.paces[cursor.index]);
            cursor.index++;
          }
        }
      }
    }

    // Step 6: Redistribution - balance weeks with 0-1 paces by moving from weeks with 3+ paces
    this.redistributePaces(weeks, subjects);
  }

  private redistributePaces(weeks: WeekSlot[], subjects: SubjectPlan[]): void {
    // Analyze each quarter separately
    for (let quarter = 0; quarter < 4; quarter++) {
      const quarterStart = quarter * WEEKS_PER_QUARTER;
      const quarterEnd = quarterStart + WEEKS_PER_QUARTER;

      // Find weeks with 0-1 paces and weeks with 3+ paces
      const sparseWeeks: { week: WeekSlot; weekIndex: number }[] = [];
      const denseWeeks: { week: WeekSlot; weekIndex: number }[] = [];

      for (let i = 0; i < WEEKS_PER_QUARTER; i++) {
        const weekIndex = quarterStart + i;
        const week = weeks[weekIndex];
        const paceCount = week.paces.length;

        if (paceCount <= 1) {
          sparseWeeks.push({ week, weekIndex });
        } else if (paceCount >= 3) {
          denseWeeks.push({ week, weekIndex });
        }
      }

      // Sort sparse weeks by index (earliest first) and dense weeks by index (latest first)
      sparseWeeks.sort((a, b) => a.weekIndex - b.weekIndex);
      denseWeeks.sort((a, b) => b.weekIndex - a.weekIndex);

      // Redistribute: move paces from dense weeks to sparse weeks
      // Continue until no more moves are possible
      let moved = true;
      while (moved) {
        moved = false;

        for (const dense of denseWeeks) {
          if (dense.week.paces.length < 3) continue;

          // Try to move paces to sparse weeks
          for (const sparse of sparseWeeks) {
            if (dense.week.paces.length <= 2) break;
            if (sparse.week.paces.length >= 2) continue;

            // Find a pace we can move
            for (let i = dense.week.paces.length - 1; i >= 0; i--) {
              const pace = dense.week.paces[i];
              const subject = subjects.find(s => s.categoryId === pace.categoryId);

              if (!subject) continue;

              // Check if moving this pace to sparse week maintains sequential order
              // Get all paces of this subject in the quarter, sorted by pace code
              const subjectPaces: { pace: GeneratedProjectionPace; weekIndex: number }[] = [];
              for (let w = quarterStart; w < quarterEnd; w++) {
                const weekPaces = weeks[w].paces.filter(p =>
                  p.categoryId === subject.categoryId &&
                  !(w === dense.weekIndex && p.paceCode === pace.paceCode)
                );
                for (const p of weekPaces) {
                  subjectPaces.push({ pace: p, weekIndex: w });
                }
              }

              // Add the pace we're trying to move at the target week
              subjectPaces.push({ pace, weekIndex: sparse.weekIndex });

              // Sort by pace code
              subjectPaces.sort((a, b) => a.pace.paceCode.localeCompare(b.pace.paceCode));

              // Check if weeks are in order (each pace's week should be <= the next pace's week)
              let canMove = true;
              for (let j = 0; j < subjectPaces.length - 1; j++) {
                if (subjectPaces[j].weekIndex > subjectPaces[j + 1].weekIndex) {
                  canMove = false;
                  break;
                }
              }

              if (!canMove) continue;

              // Check if we can place this pace in the sparse week (constraints)
              if (
                sparse.week.subjects.size < MAX_SUBJECTS_PER_WEEK &&
                !sparse.week.subjects.has(subject.categoryId) &&
                !this.violatesNotPair(subject, sparse.week.subjects)
              ) {
                // Move the pace
                dense.week.paces.splice(i, 1);

                // Remove subject from dense week only if no other paces from this subject remain
                const hasOtherPaces = dense.week.paces.some(p => p.categoryId === subject.categoryId);
                if (!hasOtherPaces) {
                  dense.week.subjects.delete(subject.categoryId);
                }

                sparse.week.paces.push(pace);
                sparse.week.subjects.add(subject.categoryId);
                moved = true;

                // Update sparse/dense status
                if (dense.week.paces.length < 3) break;
                if (sparse.week.paces.length >= 2) break;
                break;
              }
            }
            if (moved) break;
          }
          if (moved) break;
        }

        // Re-evaluate sparse and dense weeks after moves
        if (moved) {
          sparseWeeks.length = 0;
          denseWeeks.length = 0;
          for (let i = 0; i < WEEKS_PER_QUARTER; i++) {
            const weekIndex = quarterStart + i;
            const week = weeks[weekIndex];
            const paceCount = week.paces.length;

            if (paceCount <= 1) {
              sparseWeeks.push({ week, weekIndex });
            } else if (paceCount >= 3) {
              denseWeeks.push({ week, weekIndex });
            }
          }
          sparseWeeks.sort((a, b) => a.weekIndex - b.weekIndex);
          denseWeeks.sort((a, b) => b.weekIndex - a.weekIndex);
        }
      }
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
    week.subjects.add(subject.categoryId);
    week.paces.push({
      categoryId: subject.categoryId,
      subjectId: subject.subjectId ?? '',
      paceCode,
      quarter: Math.floor(week.index / WEEKS_PER_QUARTER) + 1,
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

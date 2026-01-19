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

    // Validate max 36 paces per subject
    for (const subject of subjects) {
      if (subject.paces.length > 36) {
        throw new InvalidEntityError(
          'Projection',
          `Subject ${subject.categoryId} has ${subject.paces.length} paces, but maximum is 36`
        );
      }
    }

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
      subjects.length > 1 &&
      subjects.every(s => s.paces.length === subjects[0]!.paces.length);

    if (isUniform) {
      logger.debug("Generating uniform by difficulty...");
      this.generateUniformByDifficulty(subjects, weeks);
    } else {
      logger.debug("Generating by frequency...");
      this.generateByFrequency(subjects, weeks, totalPaces);
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
    const unpaired: SubjectPlan[] = [];

    while (sorted.length > 1) {
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

    if (sorted.length === 1) {
      unpaired.push(sorted[0]!);
    }

    const paceCount = subjects[0]!.paces.length;
    let weekIndex = 0;

    for (let p = 0; p < paceCount; p++) {
      for (const [a, b] of pairs) {
        const week = weeks[weekIndex++ % TOTAL_WEEKS];

        this.placePace(week, a, a.paces[p]);
        this.placePace(week, b, b.paces[p]);
      }

      for (const subject of unpaired) {
        const week = weeks[weekIndex++ % TOTAL_WEEKS];
        this.placePace(week, subject, subject.paces[p]);
      }
    }
  }

  // ────────────────────────────────────────────────
  // MODE B — Non-uniform curriculum (frequency-based)
  // ────────────────────────────────────────────────
  /**
   * Generates projections for non-uniform pace distributions.
   *
   * Applies when:
   * - Total paces >= 72 AND
   * - Either totalPaces > 72 OR subjects have different pace counts
   *
   * Strategy:
   * 1. Calculate per-subject pace distribution across 4 quarters
   * 2. Compute weekly frequency for each subject per quarter
   * 3. Place subjects with >3 paces/quarter first (offset-based)
   * 4. Place subjects with <=3 paces/quarter second (offset-based)
   * 5. Redistribute paces to balance sparse (0-1) and dense (3+) weeks
   *
   * Constraints enforced:
   * - Max 3 subjects per week (MAX_SUBJECTS_PER_WEEK)
   * - No duplicate subject in same week
   * - Respects notPairWith exclusions (with fallback)
   * - Maintains sequential pace order within quarters
   *
   * Guarantees:
   * - All paces are placed across 36 weeks
   * - Quarter balance optimized per subject
   * - Deterministic output for same input
   *
   * Note: Difficulty is intentionally ignored in this mode.
   */
  private generateByFrequency(
    subjects: SubjectPlan[],
    weeks: WeekSlot[],
    _totalPaces: number
  ) {
    logger.debug("Generating by frequency...");
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

    // Identify subjects with 28-36 paces (special case: use freq 1, offset 0)
    const highPaceSubjects = new Set<string>();
    for (const subject of subjects) {
      if (subject.paces.length >= 28 && subject.paces.length <= 36) {
        highPaceSubjects.add(subject.categoryId);
        logger.debug(`Subject ${subject.categoryId} has ${subject.paces.length} paces, using special handling (freq 1, offset 0)`);
      }
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
          // Special case: subjects with 28-36 paces use frequency 1
          if (highPaceSubjects.has(subject.categoryId)) {
            weekFrequenciesByQuarterBySubject[q] = 1;
          } else {
            weekFrequenciesByQuarterBySubject[q] = Math.round(WEEKS_PER_QUARTER / pacesInQuarter);
          }
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
      for (let index = 0; index < subjectsToPlace.length; index++) {
        const subject = subjectsToPlace[index];
        let offset = index % 3; // Cycles: 0, 1, 2, 0, 1, 2...
        const pacesInQuarter = pacesByQuarterBySubjectMap.get(subject.categoryId)?.[quarter] ?? 0;
        let frequency = weeklyQuarterFrequencyBySubjectMap.get(subject.categoryId)?.[quarter] ?? 0;

        // Special case: subjects with 28-36 paces use offset 0
        if (highPaceSubjects.has(subject.categoryId)) {
          offset = 0;
        }

        if (pacesInQuarter === 0 || frequency === 0) continue;

        const cursor = cursorsMap.get(subject.categoryId);
        if (!cursor) continue;

        // Place each pace in this quarter
        for (let paceIndex = 0; paceIndex < pacesInQuarter; paceIndex++) {
          const currentPaceCode = cursor.subject.paces[cursor.index];
          let weekIndexWithinQuarter = offset + (paceIndex * frequency);
          const isFirstPaceInQuarter = paceIndex === 0;

          logger.debug(`[Q${quarter + 1}] Placing ${subject.categoryId} pace ${currentPaceCode} (paceIndex=${paceIndex}, offset=${offset}, frequency=${frequency}, weekIndexWithinQuarter=${weekIndexWithinQuarter})`);

          // For the first pace, prioritize weeks 1 and 2 to ensure they have 2 paces each
          if (isFirstPaceInQuarter) {
            const week1Index = quarterBaseWeek;
            const week2Index = quarterBaseWeek + 1;
            const week1 = weeks[week1Index];
            const week2 = weeks[week2Index];

            // Try week 1 first if it has less than 2 paces
            if (week1 && week1.paces.length < 2 && !week1.subjects.has(subject.categoryId) && !this.violatesNotPair(subject, week1.subjects)) {
              logger.debug(`[Q${quarter + 1}] Prioritizing week 1 for first pace (has ${week1.paces.length} paces)`);
              weekIndexWithinQuarter = 0;
            }
            // Try week 2 if week 1 is full and week 2 has less than 2 paces
            else if (week2 && week2.paces.length < 2 && !week2.subjects.has(subject.categoryId) && !this.violatesNotPair(subject, week2.subjects)) {
              logger.debug(`[Q${quarter + 1}] Prioritizing week 2 for first pace (has ${week2.paces.length} paces)`);
              weekIndexWithinQuarter = 1;
            }
            // Otherwise use calculated offset
          }

          // If calculated week exceeds quarter bounds, use fallback strategy
          if (weekIndexWithinQuarter >= WEEKS_PER_QUARTER) {
            logger.debug(`[Q${quarter + 1}] Week index ${weekIndexWithinQuarter} exceeds quarter bounds, applying fallback strategy...`);

            // Attempt 1: Reduce frequency
            let newFrequency = Math.max(1, frequency - 1);
            let newWeekIndex = offset + (paceIndex * newFrequency);

            if (newWeekIndex < WEEKS_PER_QUARTER) {
              logger.debug(`[Q${quarter + 1}] Fallback 1: Reduced frequency from ${frequency} to ${newFrequency}`);
              weekIndexWithinQuarter = newWeekIndex;
              frequency = newFrequency;
            } else {
              // Attempt 2: Reduce offset
              let newOffset = Math.max(0, offset - 1);
              newWeekIndex = newOffset + (paceIndex * frequency);

              if (newWeekIndex < WEEKS_PER_QUARTER) {
                logger.debug(`[Q${quarter + 1}] Fallback 2: Reduced offset from ${offset} to ${newOffset}`);
                weekIndexWithinQuarter = newWeekIndex;
                offset = newOffset;
              } else {
                // Last resort: offset 0, frequency 1
                logger.debug(`[Q${quarter + 1}] Fallback 3: Using offset 0, frequency 1`);
                weekIndexWithinQuarter = paceIndex; // paceIndex * 1
                offset = 0;
                frequency = 1;
              }
            }
          }

          const globalWeekIndex = quarterBaseWeek + weekIndexWithinQuarter;
          if (globalWeekIndex < 0 || globalWeekIndex >= TOTAL_WEEKS) {
            cursor.index++;
            continue;
          }

          const week = weeks[globalWeekIndex];

          // Check if we can place here maintaining sequential order
          if (!this.canPlacePaceSequentially(week, subject, currentPaceCode, quarterBaseWeek, weeks, isFirstPaceInQuarter)) {
            logger.debug(`[Q${quarter + 1}] Cannot place ${subject.categoryId} ${currentPaceCode} in week ${globalWeekIndex + 1} (would violate sequential order), searching alternative...`);
            // Try to find any available week in this quarter (search entire quarter)
            let found = false;
            for (let attempt = 0; attempt < WEEKS_PER_QUARTER; attempt++) {
              const tryWeekIndex = quarterBaseWeek + attempt;
              if (tryWeekIndex >= TOTAL_WEEKS) break;

              const tryWeek = weeks[tryWeekIndex];
              if (
                tryWeek.subjects.size < MAX_SUBJECTS_PER_WEEK &&
                !tryWeek.subjects.has(subject.categoryId) &&
                !this.violatesNotPair(subject, tryWeek.subjects) &&
                this.canPlacePaceSequentially(tryWeek, subject, currentPaceCode, quarterBaseWeek, weeks, isFirstPaceInQuarter)
              ) {
                logger.debug(`[Q${quarter + 1}] Placing ${subject.categoryId} ${currentPaceCode} in week ${tryWeekIndex + 1} (alternative placement)`);
                this.placePace(tryWeek, subject, currentPaceCode);
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
                  !tryWeek.subjects.has(subject.categoryId) &&
                  this.canPlacePaceSequentially(tryWeek, subject, currentPaceCode, quarterBaseWeek, weeks, isFirstPaceInQuarter)
                ) {
                  // Skip notPairWith check as last resort
                  logger.debug(`[Q${quarter + 1}] Placing ${subject.categoryId} ${currentPaceCode} in week ${tryWeekIndex + 1} (last resort, ignoring notPairWith)`);
                  this.placePace(tryWeek, subject, currentPaceCode);
                  cursor.index++;
                  found = true;
                  break;
                }
              }
              if (!found) {
                logger.debug(`[Q${quarter + 1}] Could not place ${subject.categoryId} ${currentPaceCode}, skipping...`);
                cursor.index++;
              }
            }
          } else if (
            week.subjects.size >= MAX_SUBJECTS_PER_WEEK ||
            week.subjects.has(subject.categoryId) ||
            this.violatesNotPair(subject, week.subjects)
          ) {
            logger.debug(`[Q${quarter + 1}] Cannot place ${subject.categoryId} ${currentPaceCode} in week ${globalWeekIndex + 1} (constraints violated), searching alternative...`);
            // Try to find any available week in this quarter (search entire quarter)
            let found = false;
            for (let attempt = 0; attempt < WEEKS_PER_QUARTER; attempt++) {
              const tryWeekIndex = quarterBaseWeek + attempt;
              if (tryWeekIndex >= TOTAL_WEEKS) break;

              const tryWeek = weeks[tryWeekIndex];
              if (
                tryWeek.subjects.size < MAX_SUBJECTS_PER_WEEK &&
                !tryWeek.subjects.has(subject.categoryId) &&
                !this.violatesNotPair(subject, tryWeek.subjects) &&
                this.canPlacePaceSequentially(tryWeek, subject, currentPaceCode, quarterBaseWeek, weeks, isFirstPaceInQuarter)
              ) {
                logger.debug(`[Q${quarter + 1}] Placing ${subject.categoryId} ${currentPaceCode} in week ${tryWeekIndex + 1} (alternative placement)`);
                this.placePace(tryWeek, subject, currentPaceCode);
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
                  !tryWeek.subjects.has(subject.categoryId) &&
                  this.canPlacePaceSequentially(tryWeek, subject, currentPaceCode, quarterBaseWeek, weeks, isFirstPaceInQuarter)
                ) {
                  // Skip notPairWith check as last resort
                  logger.debug(`[Q${quarter + 1}] Placing ${subject.categoryId} ${currentPaceCode} in week ${tryWeekIndex + 1} (last resort, ignoring notPairWith)`);
                  this.placePace(tryWeek, subject, currentPaceCode);
                  cursor.index++;
                  found = true;
                  break;
                }
              }
              if (!found) {
                logger.debug(`[Q${quarter + 1}] Could not place ${subject.categoryId} ${currentPaceCode}, skipping...`);
                cursor.index++;
              }
            }
          } else {
            logger.debug(`[Q${quarter + 1}] Placing ${subject.categoryId} ${currentPaceCode} in week ${globalWeekIndex + 1} (calculated position)`);
            this.placePace(week, subject, currentPaceCode);
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

      // Calculate starting offset for remaining subjects (continues the cycle from subjects with >3 paces)
      const startingOffset = subjectsToPlace.length % 3;

      for (let index = 0; index < remainingSubjects.length; index++) {
        const subject = remainingSubjects[index];
        let offset = (startingOffset + index) % 3; // Continues the cycle: 0, 1, 2, 0, 1, 2...
        const pacesInQuarter = pacesByQuarterBySubjectMap.get(subject.categoryId)?.[quarter] ?? 0;
        let frequency = weeklyQuarterFrequencyBySubjectMap.get(subject.categoryId)?.[quarter] ?? 0;

        // Special case: subjects with 28-36 paces use offset 0
        if (highPaceSubjects.has(subject.categoryId)) {
          offset = 0;
        }

        if (pacesInQuarter === 0 || frequency === 0) continue;

        const cursor = cursorsMap.get(subject.categoryId);
        if (!cursor) continue;

        // Use frequency-based placement with offset
        for (let paceIndex = 0; paceIndex < pacesInQuarter; paceIndex++) {
          const currentPaceCode = cursor.subject.paces[cursor.index];
          const subjectOffset = startingOffset + offset;
          let weekIndexWithinQuarter = subjectOffset + (paceIndex * frequency);
          const isFirstPaceInQuarter = paceIndex === 0;

          logger.debug(`[Q${quarter + 1}] Placing ${subject.categoryId} pace ${currentPaceCode} (remaining subject, paceIndex=${paceIndex}, offset=${offset}, frequency=${frequency}, weekIndexWithinQuarter=${weekIndexWithinQuarter})`);

          // For the first pace, prioritize weeks 1 and 2 to ensure they have 2 paces each
          if (isFirstPaceInQuarter) {
            const week1Index = quarterBaseWeek;
            const week2Index = quarterBaseWeek + 1;
            const week1 = weeks[week1Index];
            const week2 = weeks[week2Index];

            // Try week 1 first if it has less than 2 paces
            if (week1 && week1.paces.length < 2 && !week1.subjects.has(subject.categoryId) && !this.violatesNotPair(subject, week1.subjects)) {
              logger.debug(`[Q${quarter + 1}] Prioritizing week 1 for first pace (has ${week1.paces.length} paces)`);
              weekIndexWithinQuarter = 0;
            }
            // Try week 2 if week 1 is full and week 2 has less than 2 paces
            else if (week2 && week2.paces.length < 2 && !week2.subjects.has(subject.categoryId) && !this.violatesNotPair(subject, week2.subjects)) {
              logger.debug(`[Q${quarter + 1}] Prioritizing week 2 for first pace (has ${week2.paces.length} paces)`);
              weekIndexWithinQuarter = 1;
            }
            // Otherwise use calculated offset
          }

          // If calculated week exceeds quarter bounds, use fallback strategy
          if (weekIndexWithinQuarter >= WEEKS_PER_QUARTER) {
            logger.debug(`[Q${quarter + 1}] Week index ${weekIndexWithinQuarter} exceeds quarter bounds, applying fallback strategy...`);

            // Attempt 1: Reduce frequency
            let newFrequency = Math.max(1, frequency - 1);
            let newWeekIndex = subjectOffset + (paceIndex * newFrequency);

            if (newWeekIndex < WEEKS_PER_QUARTER) {
              logger.debug(`[Q${quarter + 1}] Fallback 1: Reduced frequency from ${frequency} to ${newFrequency}`);
              weekIndexWithinQuarter = newWeekIndex;
              frequency = newFrequency;
            } else {
              // Attempt 2: Reduce offset
              let newOffset = Math.max(0, offset - 1);
              newWeekIndex = startingOffset + newOffset + (paceIndex * frequency);

              if (newWeekIndex < WEEKS_PER_QUARTER) {
                logger.debug(`[Q${quarter + 1}] Fallback 2: Reduced offset from ${offset} to ${newOffset}`);
                weekIndexWithinQuarter = newWeekIndex;
                offset = newOffset;
              } else {
                // Last resort: offset 0, frequency 1
                logger.debug(`[Q${quarter + 1}] Fallback 3: Using offset 0, frequency 1`);
                weekIndexWithinQuarter = paceIndex; // paceIndex * 1
                offset = 0;
                frequency = 1;
              }
            }
          }

          const globalWeekIndex = quarterBaseWeek + weekIndexWithinQuarter;
          if (globalWeekIndex < 0 || globalWeekIndex >= TOTAL_WEEKS) {
            cursor.index++;
            continue;
          }

          const week = weeks[globalWeekIndex];

          // Check if we can place here maintaining sequential order
          if (!this.canPlacePaceSequentially(week, subject, currentPaceCode, quarterBaseWeek, weeks, isFirstPaceInQuarter)) {
            logger.debug(`[Q${quarter + 1}] Cannot place ${subject.categoryId} ${currentPaceCode} in week ${globalWeekIndex + 1} (would violate sequential order), searching alternative...`);
            // Try to find next available week in this quarter
            let found = false;
            for (let attempt = weekIndexWithinQuarter + 1; attempt < WEEKS_PER_QUARTER; attempt++) {
              const tryWeekIndex = quarterBaseWeek + attempt;
              if (tryWeekIndex >= TOTAL_WEEKS) break;

              const tryWeek = weeks[tryWeekIndex];
              if (
                tryWeek.subjects.size < MAX_SUBJECTS_PER_WEEK &&
                !tryWeek.subjects.has(subject.categoryId) &&
                !this.violatesNotPair(subject, tryWeek.subjects) &&
                this.canPlacePaceSequentially(tryWeek, subject, currentPaceCode, quarterBaseWeek, weeks, isFirstPaceInQuarter)
              ) {
                logger.debug(`[Q${quarter + 1}] Placing ${subject.categoryId} ${currentPaceCode} in week ${tryWeekIndex + 1} (alternative placement)`);
                this.placePace(tryWeek, subject, currentPaceCode);
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
                  !tryWeek.subjects.has(subject.categoryId) &&
                  this.canPlacePaceSequentially(tryWeek, subject, currentPaceCode, quarterBaseWeek, weeks, isFirstPaceInQuarter)
                ) {
                  logger.debug(`[Q${quarter + 1}] Placing ${subject.categoryId} ${currentPaceCode} in week ${tryWeekIndex + 1} (last resort, ignoring notPairWith)`);
                  this.placePace(tryWeek, subject, currentPaceCode);
                  cursor.index++;
                  found = true;
                  break;
                }
              }
              if (!found) {
                logger.debug(`[Q${quarter + 1}] Could not place ${subject.categoryId} ${currentPaceCode}, skipping...`);
                cursor.index++;
              }
            }
          } else if (
            week.subjects.size >= MAX_SUBJECTS_PER_WEEK ||
            week.subjects.has(subject.categoryId) ||
            this.violatesNotPair(subject, week.subjects)
          ) {
            logger.debug(`[Q${quarter + 1}] Cannot place ${subject.categoryId} ${currentPaceCode} in week ${globalWeekIndex + 1} (constraints violated), searching alternative...`);
            // Try to find next available week in this quarter
            let found = false;
            for (let attempt = weekIndexWithinQuarter + 1; attempt < WEEKS_PER_QUARTER; attempt++) {
              const tryWeekIndex = quarterBaseWeek + attempt;
              if (tryWeekIndex >= TOTAL_WEEKS) break;

              const tryWeek = weeks[tryWeekIndex];
              if (
                tryWeek.subjects.size < MAX_SUBJECTS_PER_WEEK &&
                !tryWeek.subjects.has(subject.categoryId) &&
                !this.violatesNotPair(subject, tryWeek.subjects) &&
                this.canPlacePaceSequentially(tryWeek, subject, currentPaceCode, quarterBaseWeek, weeks, isFirstPaceInQuarter)
              ) {
                logger.debug(`[Q${quarter + 1}] Placing ${subject.categoryId} ${currentPaceCode} in week ${tryWeekIndex + 1} (alternative placement)`);
                this.placePace(tryWeek, subject, currentPaceCode);
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
                  !tryWeek.subjects.has(subject.categoryId) &&
                  this.canPlacePaceSequentially(tryWeek, subject, currentPaceCode, quarterBaseWeek, weeks, isFirstPaceInQuarter)
                ) {
                  logger.debug(`[Q${quarter + 1}] Placing ${subject.categoryId} ${currentPaceCode} in week ${tryWeekIndex + 1} (last resort, ignoring notPairWith)`);
                  this.placePace(tryWeek, subject, currentPaceCode);
                  cursor.index++;
                  found = true;
                  break;
                }
              }
              if (!found) {
                logger.debug(`[Q${quarter + 1}] Could not place ${subject.categoryId} ${currentPaceCode}, skipping...`);
                cursor.index++;
              }
            }
          } else {
            logger.debug(`[Q${quarter + 1}] Placing ${subject.categoryId} ${currentPaceCode} in week ${globalWeekIndex + 1} (calculated position)`);
            this.placePace(week, subject, currentPaceCode);
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

  /**
   * Checks if placing a pace in a week would maintain sequential order.
   * A pace can only be placed if:
   * 1. No later paces from the same subject are already in this week
   * 2. This week comes AFTER all weeks where earlier paces from this subject are already placed
   */
  private canPlacePaceSequentially(
    week: WeekSlot,
    subject: SubjectPlan,
    paceCode: string,
    quarterBaseWeek: number,
    weeks?: WeekSlot[],
    isFirstPaceInQuarter: boolean = false
  ): boolean {
    const currentPaceNum = parseInt(paceCode);

    // Check if this week already has a later pace from the same subject
    const existingPacesInWeek = week.paces.filter(p => p.categoryId === subject.categoryId);
    for (const existingPace of existingPacesInWeek) {
      const existingPaceNum = parseInt(existingPace.paceCode);
      if (existingPaceNum > currentPaceNum) {
        logger.debug(`Cannot place ${paceCode}: week ${week.index + 1} already has later pace ${existingPace.paceCode} from ${subject.categoryId}`);
        return false;
      }
    }

    // Find the latest week in this quarter where an earlier pace from this subject is already placed
    if (weeks) {
      const quarterEnd = quarterBaseWeek + WEEKS_PER_QUARTER;
      let latestWeekWithEarlierPace = -1;

      for (let w = quarterBaseWeek; w < quarterEnd && w < TOTAL_WEEKS; w++) {
        const checkWeek = weeks[w];
        if (!checkWeek) continue;

        const checkWeekPaces = checkWeek.paces.filter(p => p.categoryId === subject.categoryId);
        for (const checkPace of checkWeekPaces) {
          const checkPaceNum = parseInt(checkPace.paceCode);
          if (checkPaceNum < currentPaceNum) {
            latestWeekWithEarlierPace = Math.max(latestWeekWithEarlierPace, w);
          }
        }
      }

      // If there's an earlier pace placed, this pace must be placed AFTER that week
      if (latestWeekWithEarlierPace >= 0 && week.index <= latestWeekWithEarlierPace) {
        logger.debug(`Cannot place ${paceCode}: must be placed after week ${latestWeekWithEarlierPace + 1} (where earlier pace is placed), but trying to place in week ${week.index + 1}`);
        return false;
      }
    }

    return true;
  }
}

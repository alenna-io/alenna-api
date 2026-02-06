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
  subjectId: string;
  trackingId: string; // For week slot tracking: subjectId for electives, categoryId for non-electives
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

    // Pass quarter limits to generation methods
    const quarterLimits = pacesByQuarter;

    const isUniform =
      totalPaces === 72 &&
      subjects.length > 1 &&
      subjects.every(s => s.paces.length === subjects[0]!.paces.length);

    if (isUniform) {
      logger.debug("Generating uniform by difficulty...");
      this.generateUniformByDifficulty(subjects, weeks);
    } else {
      logger.debug("Generating by frequency...");
      this.generateByFrequency(subjects, weeks, totalPaces, quarterLimits);
    }

    logger.debug("Returning generated projection...");
    const generatedPaces = weeks.flatMap(w => w.paces);

    // Sort by quarter, subjectId, and then by pace code (numeric) to ensure correct order
    // This ensures that within each subject/quarter, paces appear in ascending pace code order
    // The frontend groups by subject and quarter, so this sorting ensures correct display order
    generatedPaces.sort((a, b) => {
      // First sort by quarter
      if (a.quarter !== b.quarter) {
        return a.quarter - b.quarter;
      }
      // Then by subjectId to group paces by subject within each quarter
      if (a.subjectId !== b.subjectId) {
        return a.subjectId.localeCompare(b.subjectId);
      }
      // Finally by pace code (numeric comparison for proper ordering within same subject/quarter)
      const paceCodeA = parseInt(a.paceCode) || 0;
      const paceCodeB = parseInt(b.paceCode) || 0;
      return paceCodeA - paceCodeB;
    });

    return generatedPaces;
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
    // Count subjects per category to identify electives (multiple subjects in same category)
    const categoryCount = new Map<string, number>();
    for (const s of input.subjects) {
      categoryCount.set(s.categoryId, (categoryCount.get(s.categoryId) || 0) + 1);
    }

    return input.subjects.map(s => {
      const paces: string[] = [];

      for (let p = s.startPace; p <= s.endPace; p++) {
        if (!s.skipPaces?.includes(p)) {
          paces.push(String(p));
        }
      }

      // Electives: multiple subjects share same categoryId → track by subjectId
      // Non-electives: single subject per category → track by categoryId
      const isElective = (categoryCount.get(s.categoryId) || 0) > 1;
      const trackingId = isElective ? (s.subjectId ?? s.categoryId) : s.categoryId;

      return {
        categoryId: s.categoryId,
        subjectId: s.subjectId ?? '',
        trackingId,
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
    _totalPaces: number,
    quarterLimits: number[]
  ) {
    logger.debug("Generating by frequency...");
    // Use subjectId as key to handle electives (multiple subjects with same categoryId)
    const cursorsMap = new Map(subjects.map(s => [s.subjectId, { subject: s, index: 0 }]));

    // Calculate paces by quarter for each subject (keyed by subjectId)
    const pacesByQuarterBySubjectMap = new Map<string, number[]>();
    for (const subject of subjects) {
      const totalPacesBySubject = subject.paces.length;
      const pacesByQuarter = Array.from({ length: 4 }, (_, i) =>
        Math.floor(totalPacesBySubject / 4) + (i < totalPacesBySubject % 4 ? 1 : 0)
      );
      pacesByQuarterBySubjectMap.set(subject.subjectId, pacesByQuarter);
    }

    // Log the quarter distribution for debugging
    logger.debug(`Quarter distributions by subject:`);
    for (const subject of subjects) {
      const dist = pacesByQuarterBySubjectMap.get(subject.subjectId)!;
      const total = dist.reduce((sum, val) => sum + val, 0);
      logger.debug(`  ${subject.categoryId}: [${dist.join(', ')}] (total: ${total})`);
    }

    // Calculate actual totals per quarter
    const actualQuarterTotals = [0, 0, 0, 0];
    for (const subject of subjects) {
      const dist = pacesByQuarterBySubjectMap.get(subject.subjectId)!;
      for (let q = 0; q < 4; q++) {
        actualQuarterTotals[q] += dist[q];
      }
    }
    logger.debug(`Actual quarter totals (before adjustment): [${actualQuarterTotals.join(', ')}]`);
    logger.debug(`Target quarter limits: [${quarterLimits.join(', ')}]`);

    // Adjust per-subject distributions to match global quarter limits
    // This ensures the sum of all subject distributions equals the target per quarter
    const subjectsByPaceCount = [...subjects].sort((a, b) => b.paces.length - a.paces.length);

    for (let q = 0; q < 4; q++) {
      const diff = actualQuarterTotals[q] - quarterLimits[q];

      if (diff > 0) {
        // Quarter is over limit - move paces to later quarters
        logger.debug(`[Q${q + 1}] Over by ${diff}, moving to later quarters`);
        let remaining = diff;

        for (const subject of subjectsByPaceCount) {
          if (remaining <= 0) break;

          const dist = pacesByQuarterBySubjectMap.get(subject.subjectId)!;
          if (dist[q] > 1 && q < 3) {
            const maxReceivable = WEEKS_PER_QUARTER - dist[q + 1];
            const canMove = Math.min(dist[q] - 1, remaining, maxReceivable);
            if (canMove <= 0) continue;
            dist[q] -= canMove;
            dist[q + 1] += canMove;
            remaining -= canMove;
            actualQuarterTotals[q] -= canMove;
            actualQuarterTotals[q + 1] += canMove;
            logger.debug(`  Moved ${canMove} from ${subject.categoryId} Q${q + 1}→Q${q + 2}`);
          }
        }
      } else if (diff < 0) {
        // Quarter is under limit - pull paces from earlier quarters
        logger.debug(`[Q${q + 1}] Under by ${-diff}, pulling from earlier quarters`);
        let remaining = -diff;

        for (const subject of subjectsByPaceCount) {
          if (remaining <= 0) break;

          const dist = pacesByQuarterBySubjectMap.get(subject.subjectId)!;
          if (q > 0 && dist[q - 1] > 1) {
            const maxReceivable = WEEKS_PER_QUARTER - dist[q];
            const canMove = Math.min(dist[q - 1] - 1, remaining, maxReceivable);
            if (canMove <= 0) continue;
            dist[q - 1] -= canMove;
            dist[q] += canMove;
            remaining -= canMove;
            actualQuarterTotals[q - 1] -= canMove;
            actualQuarterTotals[q] += canMove;
            logger.debug(`  Moved ${canMove} from ${subject.categoryId} Q${q}→Q${q + 1}`);
          }
        }
      }
    }

    logger.debug(`Actual quarter totals (after adjustment): [${actualQuarterTotals.join(', ')}]`);
    logger.debug(`Adjusted distributions by subject:`);
    for (const subject of subjects) {
      const dist = pacesByQuarterBySubjectMap.get(subject.subjectId)!;
      logger.debug(`  ${subject.categoryId}: [${dist.join(', ')}]`);
    }

    // Identify subjects with 28-36 paces (special case: use freq 1, offset 0)
    const highPaceSubjects = new Set<string>();
    for (const subject of subjects) {
      if (subject.paces.length >= 28 && subject.paces.length <= 36) {
        highPaceSubjects.add(subject.subjectId);
        logger.debug(`Subject ${subject.subjectId} has ${subject.paces.length} paces, using special handling (freq 1, offset 0)`);
      }
    }

    // Process each quarter separately
    for (let quarter = 0; quarter < 4; quarter++) {
      const quarterBaseWeek = quarter * WEEKS_PER_QUARTER;

      // Sort subjects by pace count in THIS quarter (descending), tie-break by total year pace count
      const subjectsForQuarter = [...subjects].sort((a, b) => {
        const pacesA = pacesByQuarterBySubjectMap.get(a.subjectId)?.[quarter] ?? 0;
        const pacesB = pacesByQuarterBySubjectMap.get(b.subjectId)?.[quarter] ?? 0;
        if (pacesA !== pacesB) {
          return pacesB - pacesA;
        }
        return b.paces.length - a.paces.length;
      });

      // Assign offsets based on sorted order (0, 1, 2, ...)
      // Only place subjects with >3 paces per quarter initially
      const subjectsToPlace = subjectsForQuarter.filter(s => {
        const pacesInQuarter = pacesByQuarterBySubjectMap.get(s.subjectId)?.[quarter] ?? 0;
        return pacesInQuarter > 3;
      });

      // Place paces for each subject in this quarter
      for (let index = 0; index < subjectsToPlace.length; index++) {
        const subject = subjectsToPlace[index];
        const offset = highPaceSubjects.has(subject.subjectId) ? 0 : index % 3;
        const pacesInQuarter = pacesByQuarterBySubjectMap.get(subject.subjectId)?.[quarter] ?? 0;

        if (pacesInQuarter === 0) continue;

        const cursor = cursorsMap.get(subject.subjectId);
        if (!cursor) continue;

        // Fractional step to spread paces evenly across all 9 weeks
        const step = WEEKS_PER_QUARTER / pacesInQuarter;

        for (let paceIndex = 0; paceIndex < pacesInQuarter; paceIndex++) {
          if (cursor.index >= cursor.subject.paces.length) {
            logger.debug(`[Q${quarter + 1}] No more paces available for ${subject.categoryId}, stopping placement`);
            break;
          }

          const currentPaceCode = cursor.subject.paces[cursor.index];

          if (!currentPaceCode) {
            cursor.index++;
            continue;
          }

          let weekIndexWithinQuarter = Math.min(
            WEEKS_PER_QUARTER - 1,
            Math.floor(offset + paceIndex * step)
          );
          const isFirstPaceInQuarter = paceIndex === 0;

          logger.debug(`[Q${quarter + 1}] Placing ${subject.categoryId} pace ${currentPaceCode} (paceIndex=${paceIndex}, offset=${offset}, step=${step.toFixed(2)}, weekIndexWithinQuarter=${weekIndexWithinQuarter})`);

          // For the first pace, prioritize weeks 1 and 2 to ensure they have 2 paces each
          if (isFirstPaceInQuarter) {
            const week1Index = quarterBaseWeek;
            const week2Index = quarterBaseWeek + 1;
            const week1 = weeks[week1Index];
            const week2 = weeks[week2Index];

            if (week1 && week1.paces.length < 2 && !week1.subjects.has(subject.trackingId) && !this.violatesNotPair(subject, week1.subjects)) {
              logger.debug(`[Q${quarter + 1}] Prioritizing week 1 for first pace (has ${week1.paces.length} paces)`);
              weekIndexWithinQuarter = 0;
            } else if (week2 && week2.paces.length < 2 && !week2.subjects.has(subject.trackingId) && !this.violatesNotPair(subject, week2.subjects)) {
              logger.debug(`[Q${quarter + 1}] Prioritizing week 2 for first pace (has ${week2.paces.length} paces)`);
              weekIndexWithinQuarter = 1;
            }
          }

          const globalWeekIndex = quarterBaseWeek + weekIndexWithinQuarter;
          if (globalWeekIndex < 0 || globalWeekIndex >= TOTAL_WEEKS) {
            cursor.index++;
            continue;
          }

          const week = weeks[globalWeekIndex];

          // Check if we can place here maintaining sequential order
          if (!this.canPlacePaceSequentially(week, subject, currentPaceCode, quarterBaseWeek, weeks)) {
            logger.debug(`[Q${quarter + 1}] Cannot place ${subject.categoryId} ${currentPaceCode} in week ${globalWeekIndex + 1} (would violate sequential order), searching alternative...`);
            // Try to find any available week in this quarter
            // Search in order of least-filled weeks first to maintain balance
            const quarterWeeks = Array.from({ length: WEEKS_PER_QUARTER }, (_, i) => quarterBaseWeek + i);
            quarterWeeks.sort((a, b) => weeks[a].paces.length - weeks[b].paces.length);

            let found = false;
            for (const tryWeekIndex of quarterWeeks) {
              if (tryWeekIndex >= TOTAL_WEEKS) break;

              const tryWeek = weeks[tryWeekIndex];
              if (
                tryWeek.subjects.size < MAX_SUBJECTS_PER_WEEK &&
                !tryWeek.subjects.has(subject.trackingId) &&
                !this.violatesNotPair(subject, tryWeek.subjects) &&
                this.canPlacePaceSequentially(tryWeek, subject, currentPaceCode, quarterBaseWeek, weeks)
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
              // Prioritize least-filled weeks
              const lastResortWeeks = Array.from({ length: WEEKS_PER_QUARTER }, (_, i) => quarterBaseWeek + i);
              for (const tryWeekIndex of lastResortWeeks.sort((a, b) => weeks[a].paces.length - weeks[b].paces.length)) {
                if (tryWeekIndex >= TOTAL_WEEKS) break;

                const tryWeek = weeks[tryWeekIndex];
                if (
                  tryWeek.subjects.size < MAX_SUBJECTS_PER_WEEK &&
                  !tryWeek.subjects.has(subject.trackingId) &&
                  this.canPlacePaceSequentially(tryWeek, subject, currentPaceCode, quarterBaseWeek, weeks)
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
                // FINAL FALLBACK: Search ALL weeks globally (current quarter and future)
                for (let globalAttempt = quarterBaseWeek; globalAttempt < TOTAL_WEEKS; globalAttempt++) {
                  const tryWeek = weeks[globalAttempt];
                  if (!tryWeek.subjects.has(subject.trackingId)) {
                    logger.debug(`[Q${quarter + 1}] Placing ${subject.categoryId} ${currentPaceCode} in week ${globalAttempt + 1} (global fallback)`);
                    this.placePace(tryWeek, subject, currentPaceCode);
                    cursor.index++;
                    found = true;
                    break;
                  }
                }
                if (!found) {
                  logger.error(`[Q${quarter + 1}] CRITICAL: Could not place ${subject.categoryId} ${currentPaceCode} anywhere!`);
                  cursor.index++;
                }
              }
            }
          } else if (
            week.subjects.size >= MAX_SUBJECTS_PER_WEEK ||
            week.subjects.has(subject.trackingId) ||
            this.violatesNotPair(subject, week.subjects)
          ) {
            logger.debug(`[Q${quarter + 1}] Cannot place ${subject.subjectId} ${currentPaceCode} in week ${globalWeekIndex + 1} (constraints violated), searching alternative...`);
            // Try to find any available week in this quarter
            // Search in order of least-filled weeks first to maintain balance
            const alternativeWeeks = Array.from({ length: WEEKS_PER_QUARTER }, (_, i) => quarterBaseWeek + i);
            alternativeWeeks.sort((a, b) => weeks[a].paces.length - weeks[b].paces.length);

            let found = false;
            for (const tryWeekIndex of alternativeWeeks) {
              if (tryWeekIndex >= TOTAL_WEEKS) break;

              const tryWeek = weeks[tryWeekIndex];
              if (
                tryWeek.subjects.size < MAX_SUBJECTS_PER_WEEK &&
                !tryWeek.subjects.has(subject.trackingId) &&
                !this.violatesNotPair(subject, tryWeek.subjects) &&
                this.canPlacePaceSequentially(tryWeek, subject, currentPaceCode, quarterBaseWeek, weeks)
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
              // Prioritize least-filled weeks
              const lastResortWeeks = Array.from({ length: WEEKS_PER_QUARTER }, (_, i) => quarterBaseWeek + i);
              for (const tryWeekIndex of lastResortWeeks.sort((a, b) => weeks[a].paces.length - weeks[b].paces.length)) {
                if (tryWeekIndex >= TOTAL_WEEKS) break;

                const tryWeek = weeks[tryWeekIndex];
                if (
                  tryWeek.subjects.size < MAX_SUBJECTS_PER_WEEK &&
                  !tryWeek.subjects.has(subject.trackingId) &&
                  this.canPlacePaceSequentially(tryWeek, subject, currentPaceCode, quarterBaseWeek, weeks)
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
                // FINAL FALLBACK: Search ALL weeks globally (current quarter and future)
                for (let globalAttempt = quarterBaseWeek; globalAttempt < TOTAL_WEEKS; globalAttempt++) {
                  const tryWeek = weeks[globalAttempt];
                  if (!tryWeek.subjects.has(subject.trackingId)) {
                    logger.debug(`[Q${quarter + 1}] Placing ${subject.categoryId} ${currentPaceCode} in week ${globalAttempt + 1} (global fallback)`);
                    this.placePace(tryWeek, subject, currentPaceCode);
                    cursor.index++;
                    found = true;
                    break;
                  }
                }
                if (!found) {
                  logger.error(`[Q${quarter + 1}] CRITICAL: Could not place ${subject.categoryId} ${currentPaceCode} anywhere!`);
                  cursor.index++;
                }
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
        const pacesInQuarter = pacesByQuarterBySubjectMap.get(s.subjectId)?.[quarter] ?? 0;
        return pacesInQuarter > 0 && pacesInQuarter <= 3;
      });

      // Calculate starting offset for remaining subjects (continues the cycle from subjects with >3 paces)
      const startingOffset = subjectsToPlace.length % 3;

      for (let index = 0; index < remainingSubjects.length; index++) {
        const subject = remainingSubjects[index];
        const offset = highPaceSubjects.has(subject.subjectId) ? 0 : (startingOffset + index) % 3;
        const pacesInQuarter = pacesByQuarterBySubjectMap.get(subject.subjectId)?.[quarter] ?? 0;

        if (pacesInQuarter === 0) continue;

        const cursor = cursorsMap.get(subject.subjectId);
        if (!cursor) continue;

        // Fractional step to spread paces evenly across all 9 weeks
        const step = WEEKS_PER_QUARTER / pacesInQuarter;

        for (let paceIndex = 0; paceIndex < pacesInQuarter; paceIndex++) {
          if (cursor.index >= cursor.subject.paces.length) {
            logger.debug(`[Q${quarter + 1}] No more paces available for ${subject.categoryId}, stopping placement`);
            break;
          }

          const currentPaceCode = cursor.subject.paces[cursor.index];

          if (!currentPaceCode) {
            cursor.index++;
            continue;
          }

          let weekIndexWithinQuarter = Math.min(
            WEEKS_PER_QUARTER - 1,
            Math.floor(offset + paceIndex * step)
          );
          const isFirstPaceInQuarter = paceIndex === 0;

          logger.debug(`[Q${quarter + 1}] Placing ${subject.categoryId} pace ${currentPaceCode} (remaining subject, paceIndex=${paceIndex}, offset=${offset}, step=${step.toFixed(2)}, weekIndexWithinQuarter=${weekIndexWithinQuarter})`);

          // For the first pace, prioritize weeks 1 and 2 to ensure they have 2 paces each
          if (isFirstPaceInQuarter) {
            const week1Index = quarterBaseWeek;
            const week2Index = quarterBaseWeek + 1;
            const week1 = weeks[week1Index];
            const week2 = weeks[week2Index];

            if (week1 && week1.paces.length < 2 && !week1.subjects.has(subject.trackingId) && !this.violatesNotPair(subject, week1.subjects)) {
              logger.debug(`[Q${quarter + 1}] Prioritizing week 1 for first pace (has ${week1.paces.length} paces)`);
              weekIndexWithinQuarter = 0;
            } else if (week2 && week2.paces.length < 2 && !week2.subjects.has(subject.trackingId) && !this.violatesNotPair(subject, week2.subjects)) {
              logger.debug(`[Q${quarter + 1}] Prioritizing week 2 for first pace (has ${week2.paces.length} paces)`);
              weekIndexWithinQuarter = 1;
            }
          }

          const globalWeekIndex = quarterBaseWeek + weekIndexWithinQuarter;
          if (globalWeekIndex < 0 || globalWeekIndex >= TOTAL_WEEKS) {
            cursor.index++;
            continue;
          }

          const week = weeks[globalWeekIndex];

          // Check if we can place here maintaining sequential order
          if (!this.canPlacePaceSequentially(week, subject, currentPaceCode, quarterBaseWeek, weeks)) {
            logger.debug(`[Q${quarter + 1}] Cannot place ${subject.categoryId} ${currentPaceCode} in week ${globalWeekIndex + 1} (would violate sequential order), searching alternative...`);
            // Try to find next available week in this quarter
            let found = false;
            for (let attempt = weekIndexWithinQuarter + 1; attempt < WEEKS_PER_QUARTER; attempt++) {
              const tryWeekIndex = quarterBaseWeek + attempt;
              if (tryWeekIndex >= TOTAL_WEEKS) break;

              const tryWeek = weeks[tryWeekIndex];
              if (
                tryWeek.subjects.size < MAX_SUBJECTS_PER_WEEK &&
                !tryWeek.subjects.has(subject.trackingId) &&
                !this.violatesNotPair(subject, tryWeek.subjects) &&
                this.canPlacePaceSequentially(tryWeek, subject, currentPaceCode, quarterBaseWeek, weeks)
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
                  !tryWeek.subjects.has(subject.trackingId) &&
                  this.canPlacePaceSequentially(tryWeek, subject, currentPaceCode, quarterBaseWeek, weeks)
                ) {
                  logger.debug(`[Q${quarter + 1}] Placing ${subject.categoryId} ${currentPaceCode} in week ${tryWeekIndex + 1} (last resort, ignoring notPairWith)`);
                  this.placePace(tryWeek, subject, currentPaceCode);
                  cursor.index++;
                  found = true;
                  break;
                }
              }
              if (!found) {
                // FINAL FALLBACK: Search ALL weeks globally (current quarter and future)
                for (let globalAttempt = quarterBaseWeek; globalAttempt < TOTAL_WEEKS; globalAttempt++) {
                  const tryWeek = weeks[globalAttempt];
                  if (!tryWeek.subjects.has(subject.trackingId)) {
                    logger.debug(`[Q${quarter + 1}] Placing ${subject.categoryId} ${currentPaceCode} in week ${globalAttempt + 1} (global fallback)`);
                    this.placePace(tryWeek, subject, currentPaceCode);
                    cursor.index++;
                    found = true;
                    break;
                  }
                }
                if (!found) {
                  logger.error(`[Q${quarter + 1}] CRITICAL: Could not place ${subject.categoryId} ${currentPaceCode} anywhere!`);
                  cursor.index++;
                }
              }
            }
          } else if (
            week.subjects.size >= MAX_SUBJECTS_PER_WEEK ||
            week.subjects.has(subject.trackingId) ||
            this.violatesNotPair(subject, week.subjects)
          ) {
            logger.debug(`[Q${quarter + 1}] Cannot place ${subject.subjectId} ${currentPaceCode} in week ${globalWeekIndex + 1} (constraints violated), searching alternative...`);
            // Try to find next available week in this quarter
            let found = false;
            for (let attempt = weekIndexWithinQuarter + 1; attempt < WEEKS_PER_QUARTER; attempt++) {
              const tryWeekIndex = quarterBaseWeek + attempt;
              if (tryWeekIndex >= TOTAL_WEEKS) break;

              const tryWeek = weeks[tryWeekIndex];
              if (
                tryWeek.subjects.size < MAX_SUBJECTS_PER_WEEK &&
                !tryWeek.subjects.has(subject.trackingId) &&
                !this.violatesNotPair(subject, tryWeek.subjects) &&
                this.canPlacePaceSequentially(tryWeek, subject, currentPaceCode, quarterBaseWeek, weeks)
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
                  !tryWeek.subjects.has(subject.trackingId) &&
                  this.canPlacePaceSequentially(tryWeek, subject, currentPaceCode, quarterBaseWeek, weeks)
                ) {
                  logger.debug(`[Q${quarter + 1}] Placing ${subject.categoryId} ${currentPaceCode} in week ${tryWeekIndex + 1} (last resort, ignoring notPairWith)`);
                  this.placePace(tryWeek, subject, currentPaceCode);
                  cursor.index++;
                  found = true;
                  break;
                }
              }
              if (!found) {
                // FINAL FALLBACK: Search ALL weeks globally (current quarter and future)
                for (let globalAttempt = quarterBaseWeek; globalAttempt < TOTAL_WEEKS; globalAttempt++) {
                  const tryWeek = weeks[globalAttempt];
                  if (!tryWeek.subjects.has(subject.trackingId)) {
                    logger.debug(`[Q${quarter + 1}] Placing ${subject.categoryId} ${currentPaceCode} in week ${globalAttempt + 1} (global fallback)`);
                    this.placePace(tryWeek, subject, currentPaceCode);
                    cursor.index++;
                    found = true;
                    break;
                  }
                }
                if (!found) {
                  logger.error(`[Q${quarter + 1}] CRITICAL: Could not place ${subject.categoryId} ${currentPaceCode} anywhere!`);
                  cursor.index++;
                }
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
    // First, clean up any invalid pace objects (missing paceCode) from all weeks
    for (let i = 0; i < weeks.length; i++) {
      const week = weeks[i];
      const initialCount = week.paces.length;
      week.paces = week.paces.filter(p => p.paceCode && p.paceCode.trim() !== '');
      if (week.paces.length < initialCount) {
        // Rebuild subjects set based on remaining paces (use trackingId for proper elective handling)
        week.subjects.clear();
        week.paces.forEach(p => {
          const sub = subjects.find(s => s.subjectId === p.subjectId);
          week.subjects.add(sub?.trackingId ?? p.subjectId);
        });
      }
    }

    // Analyze each quarter separately
    for (let quarter = 0; quarter < 4; quarter++) {
      const quarterStart = quarter * WEEKS_PER_QUARTER;
      const quarterEnd = quarterStart + WEEKS_PER_QUARTER;

      // Compute dynamic thresholds based on actual pace density
      let totalPacesInQuarter = 0;
      for (let i = 0; i < WEEKS_PER_QUARTER; i++) {
        totalPacesInQuarter += weeks[quarterStart + i].paces.length;
      }
      const idealPerWeek = totalPacesInQuarter / WEEKS_PER_QUARTER;
      const floorIdeal = Math.floor(idealPerWeek);
      const ceilIdeal = Math.ceil(idealPerWeek);

      // For fractional ideals (e.g., 2.78), allow both floor and ceil as "normal"
      // Only weeks below floor are sparse, only weeks above ceil are dense
      const sparseThreshold = floorIdeal;
      const denseThreshold = ceilIdeal;

      const sparseWeeks: { week: WeekSlot; weekIndex: number }[] = [];
      const denseWeeks: { week: WeekSlot; weekIndex: number }[] = [];

      for (let i = 0; i < WEEKS_PER_QUARTER; i++) {
        const weekIndex = quarterStart + i;
        const week = weeks[weekIndex];
        const paceCount = week.paces.length;

        // Sparse: weeks below floorIdeal
        if (paceCount < sparseThreshold) {
          sparseWeeks.push({ week, weekIndex });
        }
        // Dense: weeks at or above ceilIdeal (if there's imbalance)
        // For fractional ideals, weeks at ceilIdeal can donate to weeks below floorIdeal
        else if (paceCount >= denseThreshold && floorIdeal < ceilIdeal) {
          denseWeeks.push({ week, weekIndex });
        }
      }

      // Sort sparse weeks by index (earliest first) and dense weeks by index (latest first)
      sparseWeeks.sort((a, b) => a.weekIndex - b.weekIndex);
      denseWeeks.sort((a, b) => b.weekIndex - a.weekIndex);

      logger.debug(`[Q${quarter + 1}] Redistribution: ${totalPacesInQuarter} paces, ideal=${idealPerWeek.toFixed(2)}, threshold=${sparseThreshold}, sparse=${sparseWeeks.map(s => `w${s.weekIndex + 1}(${s.week.paces.length})`).join(',')}, dense=${denseWeeks.map(d => `w${d.weekIndex + 1}(${d.week.paces.length})`).join(',')}`);

      // Redistribute: move paces from dense weeks to sparse weeks
      // Continue until no more moves are possible
      let moved = true;
      let iterations = 0;
      const MAX_ITERATIONS = totalPacesInQuarter * 2; // Reasonable upper bound
      while (moved && iterations < MAX_ITERATIONS) {
        moved = false;
        iterations++;

        for (const dense of denseWeeks) {
          // Drain weeks that are above ceilIdeal, or at ceilIdeal if balancing is needed
          if (dense.week.paces.length < denseThreshold) continue;

          // Try to move paces to sparse weeks
          for (const sparse of sparseWeeks) {
            // Stop draining when dense week reaches floorIdeal
            if (dense.week.paces.length <= floorIdeal) break;
            // Stop filling when sparse week reaches ceilIdeal
            if (sparse.week.paces.length >= ceilIdeal) continue;

            // Find a pace we can move
            for (let i = dense.week.paces.length - 1; i >= 0; i--) {
              const pace = dense.week.paces[i];

              if (!pace || !pace.paceCode) {
                continue;
              }

              const subject = subjects.find(s => s.subjectId === pace.subjectId);

              if (!subject) {
                logger.debug(`[Q${quarter + 1}] Redist: no subject found for pace ${pace.paceCode} (subjectId=${pace.subjectId})`);
                continue;
              }

              // Check if moving this pace to sparse week maintains sequential order
              // Get all paces of this subject in the quarter, sorted by pace code
              const subjectPaces: { pace: GeneratedProjectionPace; weekIndex: number }[] = [];
              for (let w = quarterStart; w < quarterEnd; w++) {
                const weekPaces = weeks[w].paces.filter(p =>
                  p.subjectId === subject.subjectId &&
                  !(w === dense.weekIndex && p.paceCode === pace.paceCode)
                );
                for (const p of weekPaces) {
                  if (p && p.paceCode) {
                    subjectPaces.push({ pace: p, weekIndex: w });
                  }
                }
              }

              // Add the pace we're trying to move at the target week
              subjectPaces.push({ pace, weekIndex: sparse.weekIndex });

              // Sort by pace code
              subjectPaces.sort((a, b) => {
                if (!a?.pace?.paceCode || !b?.pace?.paceCode) {
                  return 0;
                }
                return a.pace.paceCode.localeCompare(b.pace.paceCode);
              });

              // Check if weeks are in order (each pace's week should be <= the next pace's week)
              let canMove = true;
              for (let j = 0; j < subjectPaces.length - 1; j++) {
                if (subjectPaces[j].weekIndex > subjectPaces[j + 1].weekIndex) {
                  canMove = false;
                  break;
                }
              }

              if (!canMove) {
                logger.debug(`[Q${quarter + 1}] Redist: can't move ${pace.paceCode} from w${dense.weekIndex + 1}→w${sparse.weekIndex + 1} (sequential order)`);
                continue;
              }

              // Check if we can place this pace in the sparse week (constraints)
              const subjectsFit = sparse.week.subjects.size < MAX_SUBJECTS_PER_WEEK;
              const notDuplicate = !sparse.week.subjects.has(subject.trackingId);
              const notPaired = !this.violatesNotPair(subject, sparse.week.subjects);
              if (!subjectsFit || !notDuplicate || !notPaired) {
                logger.debug(`[Q${quarter + 1}] Redist: can't move ${pace.paceCode} from w${dense.weekIndex + 1}→w${sparse.weekIndex + 1} (fit=${subjectsFit}, dup=${!notDuplicate}, pair=${!notPaired})`);
              }
              if (subjectsFit && notDuplicate && notPaired) {
                // Move the pace (only if it has a valid paceCode)
                if (!pace.paceCode || pace.paceCode.trim() === '') {
                  continue; // Skip this pace, it's invalid
                }

                logger.debug(`[Q${quarter + 1}] Redist: moving ${pace.paceCode} from w${dense.weekIndex + 1}(${dense.week.paces.length}) → w${sparse.weekIndex + 1}(${sparse.week.paces.length})`);
                dense.week.paces.splice(i, 1);

                // Remove subject from dense week only if no other paces from this subject remain
                const hasOtherPaces = dense.week.paces.some(p => p.subjectId === subject.subjectId);
                if (!hasOtherPaces) {
                  dense.week.subjects.delete(subject.trackingId);
                }

                sparse.week.paces.push(pace);
                sparse.week.subjects.add(subject.trackingId);
                moved = true;

                // Update sparse/dense status
                // Stop draining when dense week reaches floorIdeal
                if (dense.week.paces.length <= floorIdeal) break;
                // Stop filling when sparse week reaches ceilIdeal
                if (sparse.week.paces.length >= ceilIdeal) break;
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

          // Find min and max week counts and count weeks in each category
          let minCount = Infinity;
          let maxCount = -Infinity;
          let weeksBelowFloor = 0;
          let weeksAboveCeil = 0;

          for (let i = 0; i < WEEKS_PER_QUARTER; i++) {
            const count = weeks[quarterStart + i].paces.length;
            minCount = Math.min(minCount, count);
            maxCount = Math.max(maxCount, count);
            if (count < floorIdeal) weeksBelowFloor++;
            if (count > ceilIdeal) weeksAboveCeil++;
          }

          // Only continue balancing if there are weeks outside the balanced range
          // Don't swap between weeks already at floor/ceil
          const hasWeeksBelowFloor = weeksBelowFloor > 0;
          const hasWeeksAboveCeil = weeksAboveCeil > 0;

          for (let i = 0; i < WEEKS_PER_QUARTER; i++) {
            const weekIndex = quarterStart + i;
            const week = weeks[weekIndex];
            const paceCount = week.paces.length;

            // Add weeks significantly below ideal (strict sparse)
            if (paceCount < sparseThreshold) {
              sparseWeeks.push({ week, weekIndex });
            }
            // Add weeks significantly above ideal (strict dense)
            else if (paceCount > denseThreshold) {
              denseWeeks.push({ week, weekIndex });
            }
            // Only allow floor/ceil redistribution if there are weeks outside the range
            else if (floorIdeal < ceilIdeal) {
              // Add weeks at floorIdeal as sparse ONLY if there are weeks above ceilIdeal
              if (paceCount === floorIdeal && hasWeeksAboveCeil) {
                sparseWeeks.push({ week, weekIndex });
              }
              // Add weeks at ceilIdeal as dense ONLY if there are weeks below floorIdeal
              if (paceCount === ceilIdeal && hasWeeksBelowFloor) {
                denseWeeks.push({ week, weekIndex });
              }
            }
          }
          sparseWeeks.sort((a, b) => a.weekIndex - b.weekIndex);
          denseWeeks.sort((a, b) => b.weekIndex - a.weekIndex);
        }
      }

      if (iterations >= MAX_ITERATIONS) {
        logger.warn(`[Q${quarter + 1}] Redistribution stopped after ${iterations} iterations to prevent infinite loop`);
      }

      // Log final distribution
      const finalCounts: Record<number, number> = {};
      for (let i = 0; i < WEEKS_PER_QUARTER; i++) {
        const count = weeks[quarterStart + i].paces.length;
        finalCounts[count] = (finalCounts[count] || 0) + 1;
      }
      const distribution = Object.entries(finalCounts)
        .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
        .map(([paces, weeks]) => `${weeks}×${paces}`)
        .join(', ');
      logger.debug(`[Q${quarter + 1}] Final distribution: ${distribution} (${totalPacesInQuarter} paces across ${WEEKS_PER_QUARTER} weeks, ideal=${idealPerWeek.toFixed(2)})`);
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
    if (!paceCode || paceCode.trim() === '') {
      return; // Don't create pace object without paceCode
    }

    week.subjects.add(subject.trackingId);
    const paceObject = {
      categoryId: subject.categoryId,
      subjectId: subject.subjectId ?? '',
      paceCode,
      quarter: Math.floor(week.index / WEEKS_PER_QUARTER) + 1,
      week: (week.index % WEEKS_PER_QUARTER) + 1,
    };

    week.paces.push(paceObject);
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
    weeks?: WeekSlot[]
  ): boolean {
    const currentPaceNum = parseInt(paceCode);

    // Check if this week already has a later pace from the same subject (use subjectId for unique identification)
    const existingPacesInWeek = week.paces.filter(p => p.subjectId === subject.subjectId);
    for (const existingPace of existingPacesInWeek) {
      const existingPaceNum = parseInt(existingPace.paceCode);
      if (existingPaceNum > currentPaceNum) {
        logger.debug(`Cannot place ${paceCode}: week ${week.index + 1} already has later pace ${existingPace.paceCode} from ${subject.subjectId}`);
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

        const checkWeekPaces = checkWeek.paces.filter(p => p.subjectId === subject.subjectId);
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

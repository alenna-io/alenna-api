/**
 * Projection Algorithm - Balanced Distribution System
 * 
 * Based on the Python algorithm, this generates balanced academic year projections:
 * 1. Distributes paces evenly across 4 quarters
 * 2. Creates balanced weekly schedules (2-3 paces per week)
 * 3. Respects notPairWith constraints when possible
 * 4. Handles any number of paces (up to 108 for year and a half)
 * 
 * Key principles:
 * - Quarterly balance: Each subject's paces distributed evenly across quarters
 * - Weekly balance: 2-3 paces per week, balanced across subjects
 * - When >72 paces: Maintain ~2 paces/week base, then fill with easier subjects
 * - Pairing is for grouping, not forced during scheduling
 * 
 * IMPORTANT NOTE ON "NOT PAIR WITH" CONSTRAINTS:
 * - "Not pair with" constraints work best when there are ~72 total paces (standard year)
 *   and when paces are evenly distributed among subjects (12 paces each).
 * - With more than 72 paces or uneven distributions, strict constraint enforcement
 *   may make it impossible to place all paces without violating constraints.
 * - The algorithm will respect constraints when possible, but may need to relax them
 *   for weeks with >72 paces to ensure all paces are placed. A warning will be logged
 *   when constraints are relaxed due to high pace counts.
 */

export interface SubjectInput {
  subSubjectId: string;
  subSubjectName: string;
  startPace: number;
  endPace: number;
  skipPaces: number[];
  notPairWith: string[]; // Array of other subSubjectIds
  extendToNextLevel?: boolean;
  difficulty?: number; // 1-5, where 5 is hardest (default 3 if not provided)
}

interface SubjectWithPaces {
  subSubjectId: string;
  name: string;
  paces: number[];
  totalPaces: number;
  notPairWith: string[];
  difficulty: number;
}

interface QuarterFormat {
  [subjectName: string]: {
    quarters: string[][]; // 4 quarters, each with 9 weeks
    yearTotal: number;
  };
}

interface SubjectProgression {
  quarters: number[]; // Paces per quarter [Q1, Q2, Q3, Q4]
  yearTotal: number;
  subject: SubjectWithPaces;
}

/**
 * Calculate paces for a subject, excluding skipped paces
 */
function calculatePaces(subject: SubjectInput): number[] {
  const paces: number[] = [];
  if (subject.startPace <= subject.endPace) {
    for (let pace = subject.startPace; pace <= subject.endPace; pace++) {
      if (!subject.skipPaces.includes(pace)) {
        paces.push(pace);
      }
    }
  }
  return paces;
}

/**
 * Calculate quarterly distribution for each subject
 * Distributes paces evenly across 4 quarters, with remainder going to early quarters
 * Ensures minimum 18 paces per quarter across all subjects
 */
function calculateQuarterlyDistribution(
  subjects: SubjectInput[]
): Record<string, SubjectProgression> {
  const progressions: Record<string, SubjectProgression> = {};
  const quarters = 4;
  const MIN_PACES_PER_QUARTER = 18;

  // Step 1: Initial distribution per subject (existing logic)
  for (const subject of subjects) {
    const paces = calculatePaces(subject);
    const totalPaces = paces.length;
    const basePacesPerQuarter = Math.floor(totalPaces / quarters);
    const remainder = totalPaces % quarters;

    // Distribute paces evenly across quarters, adding remainder to early quarters
    const quarterDistribution: number[] = [];
    for (let q = 0; q < quarters; q++) {
      quarterDistribution.push(basePacesPerQuarter + (q < remainder ? 1 : 0));
    }

    progressions[subject.subSubjectName] = {
      quarters: quarterDistribution,
      yearTotal: totalPaces,
      subject: {
        subSubjectId: subject.subSubjectId,
        name: subject.subSubjectName,
        paces,
        totalPaces,
        notPairWith: subject.notPairWith || [],
        difficulty: subject.difficulty || 3, // Default to 3 if not provided
      },
    };
  }

  // Step 2: Calculate total paces per quarter across all subjects
  const totalPerQuarter: number[] = [0, 0, 0, 0];
  for (const progression of Object.values(progressions)) {
    for (let q = 0; q < quarters; q++) {
      totalPerQuarter[q] += progression.quarters[q];
    }
  }

  // Step 3: Redistribute if any quarter has < 18 paces
  const deficitQuarters: number[] = [];
  const excessQuarters: number[] = [];

  for (let q = 0; q < quarters; q++) {
    if (totalPerQuarter[q] < MIN_PACES_PER_QUARTER) {
      deficitQuarters.push(q);
    } else if (totalPerQuarter[q] > MIN_PACES_PER_QUARTER) {
      excessQuarters.push(q);
    }
  }

  // If there are deficit quarters, redistribute from excess quarters
  if (deficitQuarters.length > 0 && excessQuarters.length > 0) {
    // Sort deficit quarters by deficit amount (ascending - fix smallest deficits first)
    deficitQuarters.sort((a, b) => totalPerQuarter[a] - totalPerQuarter[b]);

    // Sort excess quarters by excess amount (descending - use quarters with most excess first)
    excessQuarters.sort((a, b) => totalPerQuarter[b] - totalPerQuarter[a]);

    // Redistribute paces from excess quarters to deficit quarters
    for (const deficitQ of deficitQuarters) {
      const deficit = MIN_PACES_PER_QUARTER - totalPerQuarter[deficitQ];

      for (let i = 0; i < deficit && excessQuarters.length > 0; i++) {
        // Find the best excess quarter to take from
        // Prefer quarters with most excess, and prefer moving from subjects with more paces in that quarter
        let bestExcessQ = excessQuarters[0];
        let bestSubjectName = '';
        let bestScore = -1;

        for (const excessQ of excessQuarters) {
          // Find subject with most paces in this excess quarter
          for (const [subjectName, progression] of Object.entries(progressions)) {
            if (progression.quarters[excessQ] > 0) {
              // Score: prefer subjects with more paces in excess quarter
              // Also consider total paces in that quarter (more total = better candidate)
              const score = progression.quarters[excessQ] * 100 + totalPerQuarter[excessQ];
              if (score > bestScore) {
                bestScore = score;
                bestExcessQ = excessQ;
                bestSubjectName = subjectName;
              }
            }
          }
        }

        if (bestSubjectName && progressions[bestSubjectName].quarters[bestExcessQ] > 0) {
          // Move 1 pace from bestExcessQ to deficitQ
          progressions[bestSubjectName].quarters[bestExcessQ]--;
          progressions[bestSubjectName].quarters[deficitQ]++;
          totalPerQuarter[bestExcessQ]--;
          totalPerQuarter[deficitQ]++;

          // Update excess/deficit lists
          if (totalPerQuarter[bestExcessQ] <= MIN_PACES_PER_QUARTER) {
            const index = excessQuarters.indexOf(bestExcessQ);
            if (index > -1) {
              excessQuarters.splice(index, 1);
            }
          }
        } else {
          // If we can't find a good candidate, try any excess quarter
          const excessQ = excessQuarters[0];
          let moved = false;

          for (const progression of Object.values(progressions)) {
            if (progression.quarters[excessQ] > 0) {
              progression.quarters[excessQ]--;
              progression.quarters[deficitQ]++;
              totalPerQuarter[excessQ]--;
              totalPerQuarter[deficitQ]++;
              moved = true;
              break;
            }
          }

          if (moved && totalPerQuarter[excessQ] <= MIN_PACES_PER_QUARTER) {
            const index = excessQuarters.indexOf(excessQ);
            if (index > -1) {
              excessQuarters.splice(index, 1);
            }
          }
        }
      }
    }
  }

  return progressions;
}

/**
 * Create a balanced weekly schedule for a quarter
 * Ensures 2-3 paces per week, balanced across subjects
 * Based on Python's create_balanced_schedule function
 */
/**
 * Calculate total difficulty for a week (sum of all subject difficulties)
 */
function calculateWeekDifficulty(
  schedule: string[],
  subjectProgressions: Record<string, SubjectProgression>
): number {
  return schedule.reduce((total, subjectName) => {
    const progression = subjectProgressions[subjectName];
    return total + (progression?.subject.difficulty || 3);
  }, 0);
}

/**
 * Check if adding a subject would make the week too hard
 * Avoid placing subjects with combined difficulty > 8 in the same week
 */
function wouldExceedDifficultyLimit(
  subjectName: string,
  schedule: string[],
  subjectProgressions: Record<string, SubjectProgression>,
  maxCombinedDifficulty: number = 8
): boolean {
  const progression = subjectProgressions[subjectName];
  if (!progression) return false;

  const currentDifficulty = calculateWeekDifficulty(schedule, subjectProgressions);
  const newDifficulty = currentDifficulty + progression.subject.difficulty;

  return newDifficulty > maxCombinedDifficulty;
}

function createBalancedSchedule(
  subjectProgressions: Record<string, SubjectProgression>,
  quarterNum: number,
  weeksByQuarter: number,
  notPairWithConstraints: Map<string, Set<string>>,
  totalYearPaces: number = 72 // Default to standard year (72 paces)
): Map<number, string[]> {
  const weeklySchedule = new Map<number, string[]>();
  const maxPacesPerWeek = 3;
  const minPacesPerWeek = 2;

  // Initialize all weeks
  for (let week = 1; week <= weeksByQuarter; week++) {
    weeklySchedule.set(week, []);
  }

  // Get all subjects and their paces for this quarter
  const subjectsData: Array<{ name: string; paces: number }> = [];
  for (const [subjectName, progression] of Object.entries(subjectProgressions)) {
    const pacesThisQuarter = progression.quarters[quarterNum - 1];
    if (pacesThisQuarter > 0) {
      subjectsData.push({ name: subjectName, paces: pacesThisQuarter });
    }
  }

  // Sort subjects by number of paces (highest first)
  const sortedSubjects = [...subjectsData].sort((a, b) => b.paces - a.paces);

  // First pass: distribute subjects with most paces first
  for (const { name: subjectName, paces: totalPaces } of sortedSubjects) {
    // Calculate optimal distribution for this subject
    let weeksToPlace: number[];

    if (totalPaces <= weeksByQuarter) {
      // Distribute evenly across weeks
      const step = weeksByQuarter / totalPaces;
      weeksToPlace = [];

      for (let paceNum = 0; paceNum < totalPaces; paceNum++) {
        const weekNum = Math.floor(paceNum * step) + 1;
        if (weekNum <= weeksByQuarter) {
          weeksToPlace.push(weekNum);
        }
      }

      // Remove duplicates and sort
      weeksToPlace = [...new Set(weeksToPlace)].sort((a, b) => a - b);

      // Fill any missing weeks
      while (weeksToPlace.length < totalPaces) {
        for (let week = 1; week <= weeksByQuarter; week++) {
          if (!weeksToPlace.includes(week) && weeksToPlace.length < totalPaces) {
            weeksToPlace.push(week);
            break;
          }
        }
      }

      weeksToPlace = weeksToPlace.slice(0, totalPaces).sort((a, b) => a - b);
    } else {
      // More paces than weeks - some weeks will have multiple
      weeksToPlace = Array.from({ length: weeksByQuarter }, (_, i) => i + 1);
      const extraPaces = totalPaces - weeksByQuarter;
      for (let i = 0; i < extraPaces; i++) {
        weeksToPlace.push((i % weeksByQuarter) + 1);
      }
      weeksToPlace = weeksToPlace.slice(0, totalPaces).sort((a, b) => a - b);
    }

    // Try to place subject in calculated weeks, but respect limits and constraints
    let pacesPlaced = 0;
    for (const week of weeksToPlace) {
      if (pacesPlaced >= totalPaces) {
        break;
      }

      const schedule = weeklySchedule.get(week);
      if (!schedule) continue;

      // Check if we can add this subject to this week
      // 1. Check max paces per week limit
      if (schedule.length >= maxPacesPerWeek) {
        continue;
      }

      // 2. Check notPairWith constraints
      const subjectConstraints = notPairWithConstraints.get(subjectName);
      if (subjectConstraints) {
        const hasConflict = schedule.some(scheduledSubject =>
          subjectConstraints.has(scheduledSubject)
        );
        if (hasConflict) {
          continue; // Skip this week due to constraint
        }
      }

      // 3. Check difficulty - avoid placing too many hard subjects together
      if (wouldExceedDifficultyLimit(subjectName, schedule, subjectProgressions)) {
        continue; // Skip this week - would be too hard
      }

      schedule.push(subjectName);
      pacesPlaced++;
    }

    // If we couldn't place all paces, find other weeks (respecting constraints)
    // Prioritize weeks with fewer paces to maintain balance
    while (pacesPlaced < totalPaces) {
      // Find week with fewest subjects that doesn't violate constraints
      // Prefer weeks with 2 paces (ideal), then 1, then 3, avoiding weeks with 4+
      let bestWeek: number | null = null;
      let bestWeekScore = Infinity; // Lower is better

      for (let week = 1; week <= weeksByQuarter; week++) {
        const schedule = weeklySchedule.get(week);
        if (!schedule) continue;

        // Check constraints first - must be respected
        const subjectConstraints = notPairWithConstraints.get(subjectName);
        if (subjectConstraints) {
          const hasConflict = schedule.some(scheduledSubject =>
            subjectConstraints.has(scheduledSubject)
          );
          if (hasConflict) {
            continue; // Skip due to constraint
          }
        }

        const currentPaceCount = schedule.length;

        // Prioritize: weeks with 2 paces (ideal), then 1, then 0, then 3, avoid 4+
        // Score: 0 paces = 0, 1 pace = 1, 2 paces = 2, 3 paces = 10, 4+ paces = 1000
        let weekScore: number;
        if (currentPaceCount === 0) {
          weekScore = 0; // Empty weeks (shouldn't happen after initial placement, but prioritize)
        } else if (currentPaceCount === 1) {
          weekScore = 1; // Weeks with 1 pace (prefer to fill to 2)
        } else if (currentPaceCount === 2) {
          weekScore = 2; // Weeks with 2 paces (ideal for adding a 3rd)
        } else if (currentPaceCount === 3) {
          weekScore = 10; // Weeks with 3 paces (only if necessary)
        } else {
          weekScore = 1000; // Weeks with 4+ paces (avoid if possible)
        }

        // Check difficulty - add penalty if it would exceed difficulty
        if (wouldExceedDifficultyLimit(subjectName, schedule, subjectProgressions)) {
          weekScore += 5; // Penalize, but don't exclude
        }

        if (weekScore < bestWeekScore) {
          bestWeekScore = weekScore;
          bestWeek = week;
        }
      }

      if (bestWeek !== null) {
        const schedule = weeklySchedule.get(bestWeek);
        if (schedule) {
          schedule.push(subjectName);
          pacesPlaced++;
        } else {
          break; // Shouldn't happen, but safety check
        }
      } else {
        // No valid week found - try to find any week that doesn't violate constraints
        // For >72 paces, we may need to relax constraints to place all paces
        let foundWeek = false;
        // Try weeks with fewer paces first
        const weeksByPaceCount = Array.from({ length: weeksByQuarter }, (_, i) => i + 1)
          .sort((a, b) => {
            const aCount = weeklySchedule.get(a)?.length || 0;
            const bCount = weeklySchedule.get(b)?.length || 0;
            return aCount - bCount;
          });

        for (const week of weeksByPaceCount) {
          const schedule = weeklySchedule.get(week);
          if (!schedule || schedule.includes(subjectName)) continue;

          // Check notPairWith constraints
          const subjectConstraints = notPairWithConstraints.get(subjectName);
          let hasConflict = false;
          if (subjectConstraints) {
            hasConflict = schedule.some(scheduledSubject =>
              subjectConstraints.has(scheduledSubject)
            );
          }

          // If >72 paces, allow constraint violations when necessary (with warning)
          // Otherwise, respect constraints strictly
          if (hasConflict) {
            if (totalYearPaces > 72) {
              // Allow violation for high pace counts, but log warning
              console.warn(
                `[Q${quarterNum}] Constraint relaxed: "${subjectName}" paired with restricted subject(s) in week ${week}. ` +
                `This occurs because total paces (${totalYearPaces}) > 72. ` +
                `"Not pair with" constraints work best with ~72 paces and even distribution.`
              );
              // Proceed with placement despite constraint violation
            } else {
              continue; // Skip - constraint violation not allowed for standard pace counts
            }
          }

          // Place it (even if it means exceeding difficulty, max paces, or constraints for >72 paces)
          schedule.push(subjectName);
          pacesPlaced++;
          foundWeek = true;
          break;
        }
        if (!foundWeek || pacesPlaced >= totalPaces) {
          break; // Can't place more
        }
      }
    }
  }

  // Second pass: place any remaining unplaced paces (respecting constraints when possible)
  // For >72 paces, constraints may be relaxed if necessary to place all paces
  // Prioritize weeks with fewer paces to maintain balance
  for (const { name: subjectName, paces: totalPaces } of sortedSubjects) {
    // Count how many times this subject appears in the quarter
    let pacesUsed = 0;
    for (let w = 1; w <= weeksByQuarter; w++) {
      const wSchedule = weeklySchedule.get(w);
      if (wSchedule?.includes(subjectName)) {
        pacesUsed++;
      }
    }

    const remaining = totalPaces - pacesUsed;
    if (remaining <= 0) continue; // All paces already placed

    // Try to place remaining paces in weeks that don't violate constraints
    // Sort weeks by current pace count (fewest first) to balance distribution
    const weeksByPaceCount = Array.from({ length: weeksByQuarter }, (_, i) => i + 1)
      .sort((a, b) => {
        const aCount = weeklySchedule.get(a)?.length || 0;
        const bCount = weeklySchedule.get(b)?.length || 0;
        return aCount - bCount;
      });

    for (let i = 0; i < remaining; i++) {
      let placed = false;
      // Try weeks with fewer paces first to maintain balance
      for (const week of weeksByPaceCount) {
        const schedule = weeklySchedule.get(week);
        if (!schedule || schedule.includes(subjectName)) continue;

        // Check notPairWith constraints
        const subjectConstraints = notPairWithConstraints.get(subjectName);
        let hasConflict = false;
        if (subjectConstraints) {
          hasConflict = schedule.some(scheduledSubject =>
            subjectConstraints.has(scheduledSubject)
          );
        }

        // If >72 paces, allow constraint violations when necessary (with warning)
        // Otherwise, respect constraints strictly
        if (hasConflict) {
          if (totalYearPaces > 72) {
            // Allow violation for high pace counts, but log warning
            console.warn(
              `[Q${quarterNum}] Constraint relaxed: "${subjectName}" paired with restricted subject(s) in week ${week}. ` +
              `This occurs because total paces (${totalYearPaces}) > 72. ` +
              `"Not pair with" constraints work best with ~72 paces and even distribution.`
            );
            // Proceed with placement despite constraint violation
          } else {
            continue; // Skip - constraint violation not allowed for standard pace counts
          }
        }

        // Place it (even if it exceeds max paces or difficulty)
        schedule.push(subjectName);
        placed = true;
        break;
      }
      if (!placed) {
        // If we can't place even with relaxed constraints, we skip this pace
        // This should be very rare
        console.warn(`Could not place all paces for ${subjectName} in quarter ${quarterNum}. ${remaining - i} paces remaining.`);
        break;
      }
    }
  }

  // Now ensure minimum 2 paces per week (but still respect constraints)
  const weeksByPaceCount = Array.from({ length: weeksByQuarter }, (_, i) => i + 1)
    .sort((a, b) => {
      const aSchedule = weeklySchedule.get(a) || [];
      const bSchedule = weeklySchedule.get(b) || [];
      return aSchedule.length - bSchedule.length;
    });

  for (const week of weeksByPaceCount) {
    const schedule = weeklySchedule.get(week);
    if (!schedule) continue;

    while (schedule.length < minPacesPerWeek) {
      // Find subject with most remaining paces that can be added
      // Prefer easier subjects when filling minimum requirements
      let bestSubject: string | null = null;
      let bestScore = -1;

      for (const { name: subjectName, paces: totalPaces } of sortedSubjects) {
        // Count how many times this subject appears in the quarter
        let pacesUsed = 0;
        for (let w = 1; w <= weeksByQuarter; w++) {
          const wSchedule = weeklySchedule.get(w);
          if (wSchedule?.includes(subjectName)) {
            pacesUsed++;
          }
        }

        const remaining = totalPaces - pacesUsed;
        if (remaining <= 0 || schedule.includes(subjectName)) {
          continue; // No remaining paces or already in this week
        }

        // Check constraints - STRICTLY enforce these
        const subjectConstraints = notPairWithConstraints.get(subjectName);
        if (subjectConstraints) {
          const hasConflict = schedule.some(scheduledSubject =>
            subjectConstraints.has(scheduledSubject)
          );
          if (hasConflict) {
            continue; // Skip due to constraint - never violate
          }
        }

        // Check difficulty - prefer easier subjects when filling minimum
        if (wouldExceedDifficultyLimit(subjectName, schedule, subjectProgressions)) {
          continue; // Skip - would be too hard
        }

        // Score: prioritize remaining paces, but prefer easier subjects
        const difficulty = subjectProgressions[subjectName]?.subject.difficulty || 3;
        // Higher score = better (more remaining, easier difficulty)
        const score = remaining * 100 - difficulty; // More remaining is better, lower difficulty is better

        if (score > bestScore) {
          bestScore = score;
          bestSubject = subjectName;
        }
      }

      if (bestSubject) {
        schedule.push(bestSubject);
      } else {
        // If no subject found respecting constraints, try without difficulty check
        // (but still STRICTLY respect notPairWith)
        for (const { name: subjectName, paces: totalPaces } of sortedSubjects) {
          if (schedule.includes(subjectName)) continue;

          let pacesUsed = 0;
          for (let w = 1; w <= weeksByQuarter; w++) {
            const wSchedule = weeklySchedule.get(w);
            if (wSchedule?.includes(subjectName)) {
              pacesUsed++;
            }
          }

          if (totalPaces - pacesUsed > 0) {
            const subjectConstraints = notPairWithConstraints.get(subjectName);
            if (subjectConstraints) {
              const hasConflict = schedule.some(scheduledSubject =>
                subjectConstraints.has(scheduledSubject)
              );
              if (hasConflict) {
                continue; // Never violate constraints
              }
            }
            schedule.push(subjectName);
            break;
          }
        }
        // If we can't fill minimum without violating constraints, that's okay
        // Constraints are more important than minimum requirement
        break; // Can't add more subjects
      }
    }
  }

  // Third pass: rebalance to improve weekly distribution while respecting constraints
  // Try to move subjects from weeks with 4+ paces to weeks with fewer paces
  const weeksWithManyPaces = Array.from({ length: weeksByQuarter }, (_, i) => i + 1)
    .filter(week => {
      const schedule = weeklySchedule.get(week);
      return schedule && schedule.length > 3; // 4+ paces
    })
    .sort((a, b) => {
      const aCount = weeklySchedule.get(a)?.length || 0;
      const bCount = weeklySchedule.get(b)?.length || 0;
      return bCount - aCount; // Most paces first
    });

  const weeksWithFewPaces = Array.from({ length: weeksByQuarter }, (_, i) => i + 1)
    .filter(week => {
      const schedule = weeklySchedule.get(week);
      return schedule && schedule.length < 2; // Less than 2 paces
    })
    .sort((a, b) => {
      const aCount = weeklySchedule.get(a)?.length || 0;
      const bCount = weeklySchedule.get(b)?.length || 0;
      return aCount - bCount; // Fewest paces first
    });

  // Try to move subjects from weeks with 4+ paces to weeks with fewer paces
  for (const fromWeek of weeksWithManyPaces) {
    const fromSchedule = weeklySchedule.get(fromWeek);
    if (!fromSchedule || fromSchedule.length <= 3) break; // Already balanced

    // Try to move each subject from this week
    for (let i = fromSchedule.length - 1; i >= 0; i--) {
      const subjectToMove = fromSchedule[i];

      // Find a week with fewer paces that can accept this subject
      for (const toWeek of weeksWithFewPaces) {
        const toSchedule = weeklySchedule.get(toWeek);
        if (!toSchedule || toSchedule.includes(subjectToMove)) continue;

        // Check constraints - respect when possible, but allow for >72 paces if needed
        const subjectConstraints = notPairWithConstraints.get(subjectToMove);
        let hasConflict = false;
        if (subjectConstraints) {
          hasConflict = toSchedule.some(scheduledSubject =>
            subjectConstraints.has(scheduledSubject)
          );
        }

        // If >72 paces and we're rebalancing, allow constraint violations if it improves distribution
        if (hasConflict && totalYearPaces > 72) {
          // Allow violation for rebalancing when over 72 paces
          // Don't log here to avoid spam - already logged during placement
        } else if (hasConflict) {
          continue; // Skip - constraint violation not allowed for standard pace counts
        }

        // Move the subject
        fromSchedule.splice(i, 1);
        toSchedule.push(subjectToMove);

        // Re-sort weeks lists based on new counts
        weeksWithFewPaces.sort((a, b) => {
          const aCount = weeklySchedule.get(a)?.length || 0;
          const bCount = weeklySchedule.get(b)?.length || 0;
          return aCount - bCount;
        });
        weeksWithManyPaces.sort((a, b) => {
          const aCount = weeklySchedule.get(a)?.length || 0;
          const bCount = weeklySchedule.get(b)?.length || 0;
          return bCount - aCount;
        });

        // Stop if this week now has acceptable pace count
        if (fromSchedule.length <= 3) {
          break;
        }
      }
    }
  }

  return weeklySchedule;
}

/**
 * Assign specific pace numbers to weeks based on the schedule
 */
function assignPacesToWeeks(
  subjectProgressions: Record<string, SubjectProgression>,
  quarters: number,
  weeksByQuarter: number,
  notPairWithConstraints: Map<string, Set<string>>
): QuarterFormat {
  const result: QuarterFormat = {};

  // Initialize result structure
  for (const [subjectName] of Object.entries(subjectProgressions)) {
    result[subjectName] = {
      quarters: [],
      yearTotal: 0,
    };
    for (let q = 0; q < quarters; q++) {
      result[subjectName].quarters.push(Array(weeksByQuarter).fill(''));
    }
  }

  // Track current pace index for each subject
  const paceIndices: Record<string, number> = {};
  for (const subjectName of Object.keys(subjectProgressions)) {
    paceIndices[subjectName] = 0;
  }

  // Calculate total paces for the year to determine if we should relax constraints
  const totalYearPaces = Object.values(subjectProgressions).reduce(
    (sum, progression) => sum + progression.yearTotal,
    0
  );

  // Process each quarter
  for (let quarterNum = 1; quarterNum <= quarters; quarterNum++) {
    const weeklySchedule = createBalancedSchedule(
      subjectProgressions,
      quarterNum,
      weeksByQuarter,
      notPairWithConstraints,
      totalYearPaces
    );

    // Assign paces to each week
    for (let weekNum = 1; weekNum <= weeksByQuarter; weekNum++) {
      const subjectsThisWeek = weeklySchedule.get(weekNum) || [];

      for (const subjectName of subjectsThisWeek) {
        const progression = subjectProgressions[subjectName];
        if (!progression) continue;

        const currentIndex = paceIndices[subjectName];
        const paces = progression.subject.paces;
        if (currentIndex < paces.length) {
          const pace = paces[currentIndex];
          result[subjectName].quarters[quarterNum - 1][weekNum - 1] = String(pace);
          paceIndices[subjectName]++;
          result[subjectName].yearTotal++;
        }
      }
    }
  }

  return result;
}

/**
 * Build notPairWith constraints map for efficient lookup
 * Makes constraints bidirectional: if A cannot pair with B, then B cannot pair with A
 */
function buildConstraintsMap(subjects: SubjectInput[]): Map<string, Set<string>> {
  const constraints = new Map<string, Set<string>>();

  // Create a map of subSubjectId -> subjectName
  const idToName = new Map<string, string>();
  for (const subject of subjects) {
    idToName.set(subject.subSubjectId, subject.subSubjectName);
  }

  // Build constraints map using subject names
  for (const subject of subjects) {
    const subjectName = subject.subSubjectName;
    const constraintSet = constraints.get(subjectName) || new Set<string>();

    for (const restrictedId of subject.notPairWith || []) {
      const restrictedName = idToName.get(restrictedId);
      if (restrictedName) {
        constraintSet.add(restrictedName);
        // Make bidirectional: if A cannot pair with B, then B cannot pair with A
        const reverseConstraintSet = constraints.get(restrictedName) || new Set<string>();
        reverseConstraintSet.add(subjectName);
        constraints.set(restrictedName, reverseConstraintSet);
      }
    }

    if (constraintSet.size > 0) {
      constraints.set(subjectName, constraintSet);
    }
  }

  return constraints;
}

/**
 * Main projection function with balanced distribution system
 */
export function generateProjection(subjects: SubjectInput[]): QuarterFormat {
  const quarters = 4;
  const weeksByQuarter = 9;

  if (subjects.length === 0) {
    return {};
  }

  // Step 1: Calculate quarterly distribution for each subject
  const subjectProgressions = calculateQuarterlyDistribution(subjects);

  // Step 2: Build constraints map for efficient lookup
  const notPairWithConstraints = buildConstraintsMap(subjects);

  // Step 3: Assign paces to weeks across all quarters with balanced scheduling
  const result = assignPacesToWeeks(
    subjectProgressions,
    quarters,
    weeksByQuarter,
    notPairWithConstraints
  );

  return result;
}

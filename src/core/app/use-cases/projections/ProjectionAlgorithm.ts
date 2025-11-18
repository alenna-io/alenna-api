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
 */
function calculateQuarterlyDistribution(
  subjects: SubjectInput[]
): Record<string, SubjectProgression> {
  const progressions: Record<string, SubjectProgression> = {};
  const quarters = 4;

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
  notPairWithConstraints: Map<string, Set<string>>
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
    while (pacesPlaced < totalPaces) {
      // Find week with fewest subjects that doesn't violate constraints
      let bestWeek: number | null = null;
      let minSubjects = Infinity;

      for (let week = 1; week <= weeksByQuarter; week++) {
        const schedule = weeklySchedule.get(week);
        if (!schedule) continue;

        if (schedule.length >= maxPacesPerWeek) {
          continue; // Week is full
        }

        // Check constraints
        const subjectConstraints = notPairWithConstraints.get(subjectName);
        if (subjectConstraints) {
          const hasConflict = schedule.some(scheduledSubject => 
            subjectConstraints.has(scheduledSubject)
          );
          if (hasConflict) {
            continue; // Skip due to constraint
          }
        }

        // Check difficulty
        if (wouldExceedDifficultyLimit(subjectName, schedule, subjectProgressions)) {
          continue; // Skip - would be too hard
        }

        if (schedule.length < minSubjects) {
          minSubjects = schedule.length;
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
        // No valid week found - place anyway (constraint violation, but better than missing paces)
        for (let week = 1; week <= weeksByQuarter; week++) {
          const schedule = weeklySchedule.get(week);
          if (schedule && schedule.length < maxPacesPerWeek && !schedule.includes(subjectName)) {
            schedule.push(subjectName);
            pacesPlaced++;
            break;
          }
        }
        if (pacesPlaced < totalPaces) {
          break; // Can't place more
        }
      }
    }
  }

  // Second pass: ensure minimum 2 paces per week
  // Sort weeks by number of paces (fewest first) to prioritize filling empty weeks
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

        // Check constraints
        const subjectConstraints = notPairWithConstraints.get(subjectName);
        if (subjectConstraints) {
          const hasConflict = schedule.some(scheduledSubject => 
            subjectConstraints.has(scheduledSubject)
          );
          if (hasConflict) {
            continue; // Skip due to constraint
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
        // (but still respect notPairWith)
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
                continue;
              }
            }
            schedule.push(subjectName);
            break;
          }
        }
        break; // Can't add more subjects
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

  // Process each quarter
  for (let quarterNum = 1; quarterNum <= quarters; quarterNum++) {
    const weeklySchedule = createBalancedSchedule(
      subjectProgressions,
      quarterNum,
      weeksByQuarter,
      notPairWithConstraints
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
    const constraintSet = new Set<string>();
    
    for (const restrictedId of subject.notPairWith || []) {
      const restrictedName = idToName.get(restrictedId);
      if (restrictedName) {
        constraintSet.add(restrictedName);
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

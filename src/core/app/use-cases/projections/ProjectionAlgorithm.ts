/**
 * Projection Algorithm - Dynamic Pairing System
 * 
 * This algorithm generates academic year projections with dynamic subject pairs based on:
 * - User-provided subjects (1-6 subjects)
 * - notPairWith constraints
 * - Difficulty levels (future enhancement)
 * 
 * Features:
 * - Dynamic pairing: Creates pairs based on constraints, not hardcoded rules
 * - Flexible rotation: Adapts week distribution based on number of pairs
 * - Handles any number of paces per subject
 * - Respects skipPaces and notPairWith constraints
 */

export interface SubjectInput {
  subSubjectId: string;
  subSubjectName: string;
  startPace: number;
  endPace: number;
  skipPaces: number[];
  notPairWith: string[]; // Array of other subSubjectIds
  extendToNextLevel?: boolean;
}

interface SubjectWithPaces {
  subSubjectId: string;
  name: string;
  paces: number[];
  totalPaces: number;
  notPairWith: string[];
}

interface SubjectPair {
  subject1: SubjectWithPaces;
  subject2: SubjectWithPaces;
}

interface QuarterFormat {
  [subjectName: string]: {
    quarters: string[][]; // 4 quarters, each with 9 weeks
    yearTotal: number;
  };
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
 * Create subject pairs dynamically based on notPairWith constraints
 * Uses a greedy algorithm to maximize pairing while respecting constraints
 */
function createDynamicPairs(subjects: SubjectInput[]): SubjectPair[] {
  const pairs: SubjectPair[] = [];
  const paired = new Set<string>();

  // Convert subjects to SubjectWithPaces
  const subjectsWithPaces: SubjectWithPaces[] = subjects.map(subject => {
    const paces = calculatePaces(subject);
    return {
      subSubjectId: subject.subSubjectId,
      name: subject.subSubjectName,
      paces,
      totalPaces: paces.length,
      notPairWith: subject.notPairWith || [],
    };
  });

  // Sort subjects by total paces (descending) to pair high-pace subjects first
  const sortedSubjects = [...subjectsWithPaces].sort((a, b) => b.totalPaces - a.totalPaces);

  // Try to pair each subject
  for (const subject1 of sortedSubjects) {
    if (paired.has(subject1.subSubjectId)) {
      continue; // Already paired
    }

    // Find the best partner for this subject
    let bestPartner: SubjectWithPaces | null = null;
    let bestScore = -1;

    for (const subject2 of sortedSubjects) {
      if (subject2.subSubjectId === subject1.subSubjectId) {
        continue; // Can't pair with itself
      }
      if (paired.has(subject2.subSubjectId)) {
        continue; // Already paired
      }

      // Check notPairWith constraints
      if (subject1.notPairWith.includes(subject2.subSubjectId)) {
        continue; // Constraint violation
      }
      if (subject2.notPairWith.includes(subject1.subSubjectId)) {
        continue; // Constraint violation
      }

      // Calculate compatibility score (prefer similar pace counts)
      const paceDifference = Math.abs(subject1.totalPaces - subject2.totalPaces);
      const score = 1000 - paceDifference; // Higher score = better match

      if (score > bestScore) {
        bestScore = score;
        bestPartner = subject2;
      }
    }

    // If we found a partner, create the pair
    if (bestPartner) {
      pairs.push({
        subject1,
        subject2: bestPartner,
      });
      paired.add(subject1.subSubjectId);
      paired.add(bestPartner.subSubjectId);
    }
  }

  // Handle unpaired subjects by creating single-subject "pairs"
  for (const subject of subjectsWithPaces) {
    if (!paired.has(subject.subSubjectId)) {
      // Create a dummy pair with just this subject
      // subject2 will be null, and we'll handle it during distribution
      pairs.push({
        subject1: subject,
        subject2: {
          subSubjectId: '',
          name: '',
          paces: [],
          totalPaces: 0,
          notPairWith: [],
        },
      });
      paired.add(subject.subSubjectId);
    }
  }

  return pairs;
}

/**
 * Calculate how many paces each subject should have per quarter
 */
function calculateQuarterlyDistribution(
  subjects: SubjectInput[]
): Record<string, number[]> {
  const distribution: Record<string, number[]> = {};
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

    distribution[subject.subSubjectName] = quarterDistribution;
  }

  return distribution;
}

/**
 * Create a balanced weekly schedule for a quarter
 * Ensures 2-3 paces per week when possible
 */
function createBalancedSchedule(
  pairs: SubjectPair[],
  quarterNum: number,
  quarterlyDistribution: Record<string, number[]>,
  weeksByQuarter: number
): Map<number, SubjectPair[]> {
  const weeklySchedule = new Map<number, SubjectPair[]>();
  
  // Initialize all weeks
  for (let week = 1; week <= weeksByQuarter; week++) {
    weeklySchedule.set(week, []);
  }

  // Calculate how many times each pair should appear this quarter
  const pairFrequency = new Map<SubjectPair, number>();
  for (const pair of pairs) {
    const subject1Paces = quarterlyDistribution[pair.subject1.name]?.[quarterNum - 1] || 0;
    const subject2Paces = pair.subject2.name ? (quarterlyDistribution[pair.subject2.name]?.[quarterNum - 1] || 0) : 0;
    // A pair appears as many times as needed for both subjects (they share weeks)
    const frequency = Math.max(subject1Paces, subject2Paces);
    pairFrequency.set(pair, frequency);
  }

  // Distribute pairs across weeks using round-robin with rotation
  let weekNum = 1;
  
  for (const [pair, frequency] of pairFrequency.entries()) {
    for (let i = 0; i < frequency; i++) {
      const schedule = weeklySchedule.get(weekNum);
      if (schedule) {
        schedule.push(pair);
      }
      
      // Move to next week in rotation based on number of pairs
      // If 3 pairs: rotate every 3 weeks (1,2,3,1,2,3...)
      // If 2 pairs: alternate weeks (1,2,1,2...)
      // If 1 pair: every week
      weekNum++;
      if (weekNum > weeksByQuarter) {
        weekNum = 1; // Wrap around if needed
      }
    }
  }

  return weeklySchedule;
}

/**
 * Assign specific pace numbers to weeks based on the schedule
 */
function assignPacesToWeeks(
  subjects: SubjectInput[],
  pairs: SubjectPair[],
  quarterlyDistribution: Record<string, number[]>,
  quarters: number,
  weeksByQuarter: number
): QuarterFormat {
  const result: QuarterFormat = {};
  
  // Initialize result structure
  for (const subject of subjects) {
    result[subject.subSubjectName] = {
      quarters: [],
      yearTotal: 0,
    };
    for (let q = 0; q < quarters; q++) {
      result[subject.subSubjectName].quarters.push(Array(weeksByQuarter).fill(''));
    }
  }

  // Track current pace index for each subject
  const paceIndices: Record<string, number> = {};
  const subjectPaces: Record<string, number[]> = {};
  for (const subject of subjects) {
    paceIndices[subject.subSubjectName] = 0;
    subjectPaces[subject.subSubjectName] = calculatePaces(subject);
  }

  // Process each quarter
  for (let quarterNum = 1; quarterNum <= quarters; quarterNum++) {
    const weeklySchedule = createBalancedSchedule(pairs, quarterNum, quarterlyDistribution, weeksByQuarter);

    // Assign paces to each week
    for (let weekNum = 1; weekNum <= weeksByQuarter; weekNum++) {
      const pairsThisWeek = weeklySchedule.get(weekNum) || [];

      for (const pair of pairsThisWeek) {
        // Assign pace to subject1
        const subject1Name = pair.subject1.name;
        if (paceIndices[subject1Name] < subjectPaces[subject1Name].length) {
          const pace = subjectPaces[subject1Name][paceIndices[subject1Name]];
          result[subject1Name].quarters[quarterNum - 1][weekNum - 1] = String(pace);
          paceIndices[subject1Name]++;
          result[subject1Name].yearTotal++;
        }

        // Assign pace to subject2 (if it exists)
        if (pair.subject2.name) {
          const subject2Name = pair.subject2.name;
          if (paceIndices[subject2Name] < subjectPaces[subject2Name].length) {
            const pace = subjectPaces[subject2Name][paceIndices[subject2Name]];
            result[subject2Name].quarters[quarterNum - 1][weekNum - 1] = String(pace);
            paceIndices[subject2Name]++;
            result[subject2Name].yearTotal++;
          }
        }
      }
    }
  }

  return result;
}

/**
 * Main projection function with dynamic pairing system
 */
export function generateProjection(subjects: SubjectInput[]): QuarterFormat {
  const quarters = 4;
  const weeksByQuarter = 9;

  if (subjects.length === 0) {
    return {};
  }

  // Step 1: Create dynamic pairs based on constraints
  const pairs = createDynamicPairs(subjects);

  // Step 2: Calculate quarterly distribution for each subject
  const quarterlyDistribution = calculateQuarterlyDistribution(subjects);

  // Step 3: Assign paces to weeks across all quarters
  const result = assignPacesToWeeks(subjects, pairs, quarterlyDistribution, quarters, weeksByQuarter);

  return result;
}

/**
 * Default Template Projection Algorithm
 * 
 * This algorithm is ONLY for default templates (L1-L8).
 * It uses fixed pairing and fixed rotation patterns to ensure
 * consistent, predictable projections every time.
 * 
 * Fixed Pairs:
 * - Pair 1: Math + Word Building
 * - Pair 2: English + Social Studies
 * - Pair 3: Science + Spanish
 * 
 * Fixed Rotation (3-week cycle):
 * - Pair 1: Weeks 1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34 (weeks where 3n-2, n=1,2,3...)
 * - Pair 2: Weeks 2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35 (weeks where 3n-1, n=1,2,3...)
 * - Pair 3: Weeks 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36 (weeks where 3n, n=1,2,3...)
 */

export interface DefaultTemplateSubjectInput {
  subSubjectId: string;
  subSubjectName: string;
  startPace: number;
  endPace: number;
  skipPaces?: number[];
}

interface QuarterFormat {
  [subjectName: string]: {
    quarters: string[][]; // 4 quarters, each with 9 weeks
    yearTotal: number;
  };
}

/**
 * Identify subject category from name
 */
function getSubjectCategory(subjectName: string): string {
  const name = subjectName.toLowerCase();
  
  if (name.includes('math')) {
    return 'math';
  }
  if (name.includes('word building') || name.includes('wordbuilding')) {
    return 'wordbuilding';
  }
  if (name.includes('english')) {
    return 'english';
  }
  if (name.includes('social studies')) {
    return 'socialstudies';
  }
  if (name.includes('science') && !name.includes('social')) {
    return 'science';
  }
  if (name.includes('spanish') || name.includes('español') || name.includes('espanol') || name.includes('ortografía')) {
    return 'spanish';
  }
  
  return 'other';
}

/**
 * Generate projection for default templates with fixed pairing and rotation
 */
export function generateDefaultTemplateProjection(subjects: DefaultTemplateSubjectInput[]): QuarterFormat {
  const quarters = 4;
  const weeksByQuarter = 9;
  const totalWeeks = quarters * weeksByQuarter; // 36 weeks

  // Initialize result structure
  const result: QuarterFormat = {};
  for (const subject of subjects) {
    result[subject.subSubjectName] = {
      quarters: [],
      yearTotal: 0,
    };
    for (let q = 0; q < quarters; q++) {
      result[subject.subSubjectName].quarters.push(Array(weeksByQuarter).fill(''));
    }
  }

  // Get paces for each subject (excluding skipped)
  const subjectPaces: Record<string, number[]> = {};
  for (const subject of subjects) {
    const paces: number[] = [];
    if (subject.startPace <= subject.endPace) {
      for (let pace = subject.startPace; pace <= subject.endPace; pace++) {
        if (!subject.skipPaces || !subject.skipPaces.includes(pace)) {
          paces.push(pace);
        }
      }
    }
    subjectPaces[subject.subSubjectName] = paces;
  }

  // Categorize subjects by type
  const subjectsByCategory: Record<string, DefaultTemplateSubjectInput> = {};
  for (const subject of subjects) {
    const category = getSubjectCategory(subject.subSubjectName);
    subjectsByCategory[category] = subject;
  }

  // Track current pace index for each subject
  const paceIndices: Record<string, number> = {};
  for (const subject of subjects) {
    paceIndices[subject.subSubjectName] = 0;
  }

  // Fixed pairs
  const pairs = [
    {
      name: 'Math-WordBuilding',
      subject1: subjectsByCategory['math'],
      subject2: subjectsByCategory['wordbuilding'],
    },
    {
      name: 'English-SocialStudies',
      subject1: subjectsByCategory['english'],
      subject2: subjectsByCategory['socialstudies'],
    },
    {
      name: 'Science-Spanish',
      subject1: subjectsByCategory['science'],
      subject2: subjectsByCategory['spanish'],
    },
  ];


  // Distribute paces using fixed 3-week rotation
  for (let globalWeek = 1; globalWeek <= totalWeeks; globalWeek++) {
    // Determine which quarter and week within quarter
    const quarterNum = Math.ceil(globalWeek / weeksByQuarter);
    const weekInQuarter = ((globalWeek - 1) % weeksByQuarter) + 1;

    // Determine which pair based on fixed pattern
    // Pair 1 (Math+WB): weeks where globalWeek % 3 === 1 (weeks 1, 4, 7, 10...)
    // Pair 2 (English+SS): weeks where globalWeek % 3 === 2 (weeks 2, 5, 8, 11...)
    // Pair 3 (Science+Spanish): weeks where globalWeek % 3 === 0 (weeks 3, 6, 9, 12...)
    let pairIndex: number;
    const remainder = globalWeek % 3;
    if (remainder === 1) {
      pairIndex = 0; // Math + Word Building
    } else if (remainder === 2) {
      pairIndex = 1; // English + Social Studies
    } else {
      pairIndex = 2; // Science + Spanish
    }

    const pair = pairs[pairIndex];
    if (!pair) continue;

    // Assign pace to subject 1
    if (pair.subject1) {
      const subject1Name = pair.subject1.subSubjectName;
      const paces = subjectPaces[subject1Name];
      if (paces && paceIndices[subject1Name] < paces.length) {
        const pace = paces[paceIndices[subject1Name]];
        result[subject1Name].quarters[quarterNum - 1][weekInQuarter - 1] = String(pace);
        paceIndices[subject1Name]++;
        result[subject1Name].yearTotal++;
      }
    }

    // Assign pace to subject 2
    if (pair.subject2) {
      const subject2Name = pair.subject2.subSubjectName;
      const paces = subjectPaces[subject2Name];
      if (paces && paceIndices[subject2Name] < paces.length) {
        const pace = paces[paceIndices[subject2Name]];
        result[subject2Name].quarters[quarterNum - 1][weekInQuarter - 1] = String(pace);
        paceIndices[subject2Name]++;
        result[subject2Name].yearTotal++;
      }
    }
  }

  return result;
}


import { ProjectionGenerator, GeneratedProjectionPace } from '../ProjectionGenerator';
import { GenerateProjectionInput } from '../../../app/dtos/v2/projections/GenerateProjectionInput';

interface SubjectPlan {
  subSubjectId: string;
  difficulty: number;
  paces: string[];          // ordered pace codes
  frequency: number;        // weeks per pace
  phaseOffset: number;      // staggering offset
}

interface WeekSlot {
  index: number;            // 0–35 (absolute week)
  subjects: Set<string>;   // subSubjectIds
}

const TOTAL_WEEKS = 36;
const MAX_SUBJECTS_PER_WEEK = 3;

export class AlennaProjectionAlgorithm implements ProjectionGenerator {
  generate(input: GenerateProjectionInput): GeneratedProjectionPace[] {
    const subjects = this.normalizeSubjects(input);
    this.assignPhaseOffsets(subjects);

    const weeks = this.placeSubjects(subjects);
    this.normalizeWeeks(weeks);

    const paceIndexes: Record<string, number> = {};
    for (const s of subjects) {
      paceIndexes[s.subSubjectId] = 0;
    }

    const result: GeneratedProjectionPace[] = [];

    for (const week of weeks) {
      for (const subSubjectId of week.subjects) {
        const subject = subjects.find(s => s.subSubjectId === subSubjectId)!;
        const paceIndex = paceIndexes[subSubjectId];

        if (paceIndex >= subject.paces.length) {
          continue; // HARD SAFETY GUARD
        }

        const paceCode = subject.paces[paceIndex];
        paceIndexes[subSubjectId]++;

        result.push({
          subSubjectId,
          paceCode,
          quarter: `Q${Math.floor(week.index / 9) + 1}` as any,
          week: (week.index % 9) + 1,
        });
      }
    }

    return result;
  }

  // ────────────────────────────────────────────────
  // Phase 1 — Normalize subjects
  // ────────────────────────────────────────────────
  private normalizeSubjects(input: GenerateProjectionInput): SubjectPlan[] {
    return input.subjects.map(subject => {
      const paces: string[] = [];

      for (let p = subject.startPace; p <= subject.endPace; p++) {
        if (!subject.skipPaces?.includes(p)) {
          paces.push(String(p));
        }
      }

      return {
        subSubjectId: subject.subSubjectId,
        difficulty: subject.difficulty ?? 3,
        paces,
        frequency: TOTAL_WEEKS / paces.length,
        phaseOffset: 0,
      };
    });
  }

  // ────────────────────────────────────────────────
  // Phase 2 — Phase offset assignment
  // ────────────────────────────────────────────────
  private assignPhaseOffsets(subjects: SubjectPlan[]): void {
    const frequencyGroups = new Map<number, SubjectPlan[]>();

    for (const s of subjects) {
      const key = Number(s.frequency.toFixed(4));
      frequencyGroups.set(key, [...(frequencyGroups.get(key) ?? []), s]);
    }

    for (const group of frequencyGroups.values()) {
      group.forEach((subject, index) => {
        subject.phaseOffset = (index * subject.frequency) / group.length;
      });
    }
  }

  // ────────────────────────────────────────────────
  // Phase 3 — Ideal week calculation
  // ────────────────────────────────────────────────
  private computeIdealWeeks(subject: SubjectPlan): number[] {
    const weeks: number[] = [];

    for (let i = 0; i < subject.paces.length; i++) {
      const week = Math.floor(i * subject.frequency + subject.phaseOffset);
      weeks.push(Math.min(TOTAL_WEEKS - 1, week));
    }

    return weeks;
  }

  // ────────────────────────────────────────────────
  // Phase 4 — Placement with collision resolution
  // ────────────────────────────────────────────────
  private placeSubjects(subjects: SubjectPlan[]): WeekSlot[] {
    const weeks: WeekSlot[] = Array.from({ length: TOTAL_WEEKS }, (_, i) => ({
      index: i,
      subjects: new Set(),
    }));

    for (const subject of subjects) {
      const idealWeeks = this.computeIdealWeeks(subject);

      for (const target of idealWeeks) {
        let placed = false;

        for (let delta = 0; delta < TOTAL_WEEKS && !placed; delta++) {
          for (const candidate of [target - delta, target + delta]) {
            if (candidate < 0 || candidate >= TOTAL_WEEKS) continue;

            const week = weeks[candidate];

            if (
              week.subjects.size < MAX_SUBJECTS_PER_WEEK &&
              !week.subjects.has(subject.subSubjectId)
            ) {
              week.subjects.add(subject.subSubjectId);
              placed = true;
              break;
            }
          }
        }
        // Guaranteed fallback (respecting max = 3)
        if (!placed) {
          for (const week of weeks) {
            if (
              week.subjects.size < 3 &&
              !week.subjects.has(subject.subSubjectId)
            ) {
              week.subjects.add(subject.subSubjectId);
              placed = true;
              break;
            }
          }
        }

      }
    }

    return weeks;
  }

  // ────────────────────────────────────────────────
  // Enhancement — Distribution normalization
  // ────────────────────────────────────────────────
  private normalizeWeeks(weeks: WeekSlot[]): void {
    const sparseWeeks = weeks.filter(w => w.subjects.size < 2);
    const heavyWeeks = weeks.filter(w => w.subjects.size > MAX_SUBJECTS_PER_WEEK);

    for (const weak of sparseWeeks) {
      const donor = heavyWeeks.shift();
      if (!donor) break;

      const subjectId = [...donor.subjects][0];
      donor.subjects.delete(subjectId);
      weak.subjects.add(subjectId);
    }
  }
}

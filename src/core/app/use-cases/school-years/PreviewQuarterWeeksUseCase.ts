import type { PreviewQuarterWeeksInput, PreviewQuarterWeekOutput } from '../../dtos';
import { generateSchoolWeeksForQuarter } from '../../../../utils';

export class PreviewQuarterWeeksUseCase {
  async execute(input: PreviewQuarterWeeksInput): Promise<PreviewQuarterWeekOutput[]> {
    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);

    const weeks = generateSchoolWeeksForQuarter({
      startDate,
      endDate,
      weeksCount: input.weeksCount,
      holidays: (input.holidays ?? []).map((h) => ({
        startDate: new Date(h.startDate),
        endDate: new Date(h.endDate),
      })),
    });

    return weeks.map((w, index): PreviewQuarterWeekOutput => ({
      weekNumber: index + 1,
      startDate: w.startDate.toISOString(),
      endDate: w.endDate.toISOString(),
    }));
  }
}

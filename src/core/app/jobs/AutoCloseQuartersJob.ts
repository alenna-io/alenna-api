import prisma from '../../frameworks/database/prisma.client';
import { CloseQuarterUseCase } from '../../app/use-cases/quarters/CloseQuarterUseCase';
import { logger } from '../../../utils/logger';

export class AutoCloseQuartersJob {
  private closeQuarterUseCase: CloseQuarterUseCase;

  constructor() {
    this.closeQuarterUseCase = new CloseQuarterUseCase();
  }

  async execute(): Promise<void> {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const quartersToClose = await prisma.quarter.findMany({
      where: {
        isClosed: false,
        endDate: {
          lte: sevenDaysAgo,
        },
        deletedAt: null,
      },
      include: {
        schoolYear: true,
      },
    });

    if (quartersToClose.length === 0) {
      logger.info('No quarters to close automatically');
      return;
    }

    logger.info(`Found ${quartersToClose.length} quarter(s) to close automatically`);

    for (const quarter of quartersToClose) {
      try {
        await this.closeQuarterUseCase.execute(
          quarter.id,
          quarter.schoolYear.schoolId
        );
        logger.info(`Automatically closed quarter ${quarter.name} for school year ${quarter.schoolYear.name}`);
      } catch (error) {
        logger.error(`Error closing quarter ${quarter.id}:`, error);
      }
    }
  }
}


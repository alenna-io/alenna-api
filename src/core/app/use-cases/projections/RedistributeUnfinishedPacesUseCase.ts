import prisma from '../../../frameworks/database/prisma.client';

export interface RedistributionResult {
  redistributedPaces: number;
  overflowPaces: Array<{
    projectionId: string;
    paceCatalogId: string;
    paceNumber: string;
    subject: string;
  }>;
}

export class RedistributeUnfinishedPacesUseCase {
  async execute(quarterId: string, schoolId: string): Promise<RedistributionResult> {
    const quarter = await prisma.quarter.findFirst({
      where: {
        id: quarterId,
        deletedAt: null,
      },
      include: {
        schoolYear: true,
      },
    });

    if (!quarter) {
      throw new Error('Quarter not found');
    }

    if (!quarter.isClosed) {
      throw new Error('Quarter must be closed before redistributing unfinished paces');
    }

    const closedQuarterName = quarter.name;
    const schoolYearName = quarter.schoolYear.name;

    const projections = await prisma.projection.findMany({
      where: {
        schoolYear: schoolYearName,
        deletedAt: null,
        student: {
          schoolId,
          deletedAt: null,
        },
      },
      include: {
        projectionPaces: {
          where: {
            deletedAt: null,
          },
          include: {
            paceCatalog: {
              include: {
                subSubject: {
                  include: {
                    category: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const overflowPaces: RedistributionResult['overflowPaces'] = [];
    let redistributedCount = 0;

    for (const projection of projections) {
      const unfinishedPaces = projection.projectionPaces.filter(
        pp => pp.quarter === closedQuarterName && pp.grade === null
      );

      if (unfinishedPaces.length === 0) continue;

      unfinishedPaces.sort((a, b) => {
        const paceNumA = parseInt(a.paceCatalog.code) || 0;
        const paceNumB = parseInt(b.paceCatalog.code) || 0;
        return paceNumA - paceNumB;
      });

      for (const unfinishedPace of unfinishedPaces) {
        const originalQuarterName = unfinishedPace.quarter;

        const nextQuarterName = this.getNextQuarter(closedQuarterName);
        if (!nextQuarterName) {
          // Mark as unfinished in original quarter since we can't move it
          await prisma.projectionPace.update({
            where: { id: unfinishedPace.id },
            data: {
              isUnfinished: true,
              originalQuarter: originalQuarterName,
              originalWeek: unfinishedPace.week,
            },
          });
          overflowPaces.push({
            projectionId: projection.id,
            paceCatalogId: unfinishedPace.paceCatalogId,
            paceNumber: unfinishedPace.paceCatalog.code,
            subject: unfinishedPace.paceCatalog.subSubject.name,
          });
          continue;
        }

        const nextQuarter = await prisma.quarter.findFirst({
          where: {
            schoolYearId: quarter.schoolYearId,
            name: nextQuarterName,
            deletedAt: null,
          },
        });

        if (!nextQuarter) {
          // Mark as unfinished in original quarter since we can't move it
          await prisma.projectionPace.update({
            where: { id: unfinishedPace.id },
            data: {
              isUnfinished: true,
              originalQuarter: originalQuarterName,
              originalWeek: unfinishedPace.week,
            },
          });
          overflowPaces.push({
            projectionId: projection.id,
            paceCatalogId: unfinishedPace.paceCatalogId,
            paceNumber: unfinishedPace.paceCatalog.code,
            subject: unfinishedPace.paceCatalog.subSubject.name,
          });
          continue;
        }

        // Strategy: 
        // 1. Store original week and quarter before moving
        // 2. Move the pace to Q2 (editable version)
        // 3. Mark as unfinished with originalQuarter and originalWeek
        // 4. Backend will show it in both Q1 (as unfinished, non-editable) and Q2 (as editable)

        const originalWeek = unfinishedPace.week;

        // First, mark the original as unfinished and store original quarter and week
        await prisma.projectionPace.update({
          where: { id: unfinishedPace.id },
          data: {
            isUnfinished: true,
            originalQuarter: originalQuarterName,
            originalWeek: originalWeek,
          },
        });

        // Now redistribute to Q2 - this will move the pace
        const redistributed = await this.redistributePace(
          unfinishedPace,
          projection.id,
          nextQuarterName,
          quarter.schoolYearId,
          projection.projectionPaces
        );

        if (redistributed) {
          redistributedCount++;
        } else {
          overflowPaces.push({
            projectionId: projection.id,
            paceCatalogId: unfinishedPace.paceCatalogId,
            paceNumber: unfinishedPace.paceCatalog.code,
            subject: unfinishedPace.paceCatalog.subSubject.name,
          });
        }
      }
    }

    return {
      redistributedPaces: redistributedCount,
      overflowPaces,
    };
  }

  private getNextQuarter(currentQuarter: string): string | null {
    const quarterMap: Record<string, string | null> = {
      Q1: 'Q2',
      Q2: 'Q3',
      Q3: 'Q4',
      Q4: null,
    };
    return quarterMap[currentQuarter] || null;
  }

  private async redistributePace(
    unfinishedPace: any,
    projectionId: string,
    targetQuarterName: string,
    schoolYearId: string,
    allProjectionPaces: any[]
  ): Promise<boolean> {
    const subjectName = unfinishedPace.paceCatalog.subSubject.name;
    const paceNumber = parseInt(unfinishedPace.paceCatalog.code) || 0;

    const targetQuarterPaces = allProjectionPaces.filter(
      pp => pp.quarter === targetQuarterName && pp.paceCatalog.subSubject.name === subjectName
    );

    targetQuarterPaces.sort((a, b) => {
      const paceNumA = parseInt(a.paceCatalog.code) || 0;
      const paceNumB = parseInt(b.paceCatalog.code) || 0;
      return paceNumA - paceNumB;
    });

    const targetQuarter = await prisma.quarter.findFirst({
      where: {
        schoolYearId,
        name: targetQuarterName,
        deletedAt: null,
      },
    });

    if (!targetQuarter) {
      return false;
    }

    const weeksInQuarter = targetQuarter.weeksCount;
    const occupiedWeeks = new Set(targetQuarterPaces.map(pp => pp.week));

    const unfinishedPaceCategoryId = unfinishedPace.paceCatalog.subSubject.category.id;

    // Find where this pace should be inserted to maintain sequential order
    const insertionIndex = targetQuarterPaces.findIndex(
      pp => (parseInt(pp.paceCatalog.code) || 0) > paceNumber
    );

    let targetWeek: number;
    if (insertionIndex === -1) {
      // No pace with higher number, place at the end
      targetWeek = Math.min(weeksInQuarter, Math.max(...Array.from(occupiedWeeks), 0) + 1);
    } else {
      // Found a pace with higher number - we need to insert before it
      const beforePace = targetQuarterPaces[insertionIndex];
      const beforePaceWeek = beforePace.week;

      // Try to place in the same week as the pace we should come before, or an earlier week
      // This maintains sequential order: if 1087 should go before 1088, and 1088 is in week 3,
      // we should try week 3 first, then week 2, then week 1
      targetWeek = beforePaceWeek;

      // Check if we can place in the same week (must be different category)
      const existingInSameWeek = targetQuarterPaces.find(
        pp => pp.week === beforePaceWeek &&
          pp.paceCatalog.subSubject.category.id === unfinishedPaceCategoryId
      );

      if (!existingInSameWeek && beforePaceWeek <= weeksInQuarter) {
        // Same week is available - place here
        targetWeek = beforePaceWeek;
      } else {
        // Same week is occupied, try earlier weeks to maintain order
        let foundWeek = false;
        for (let week = beforePaceWeek - 1; week >= 1; week--) {
          const existingInWeek = targetQuarterPaces.find(
            pp => pp.week === week &&
              pp.paceCatalog.subSubject.category.id === unfinishedPaceCategoryId
          );

          if (!existingInWeek) {
            targetWeek = week;
            foundWeek = true;
            break;
          }
        }

        if (!foundWeek) {
          // No earlier week available, we'll need to shift the beforePace to make room
          // This will be handled below
          targetWeek = beforePaceWeek;
        }
      }
    }

    if (targetWeek > weeksInQuarter) {
      targetWeek = weeksInQuarter;
    }

    // Check if target week is available for this subject's category
    const existingInTargetWeek = targetQuarterPaces.find(
      pp => pp.week === targetWeek &&
        pp.paceCatalog.subSubject.category.id === unfinishedPaceCategoryId
    );

    if (!existingInTargetWeek && targetWeek <= weeksInQuarter) {
      // Week is available, move the pace to Q2
      await prisma.projectionPace.update({
        where: { id: unfinishedPace.id },
        data: {
          quarter: targetQuarterName,
          week: targetWeek,
        },
      });
      return true;
    }

    // Target week is occupied - we need to shift the existing pace to make room
    if (insertionIndex !== -1 && occupiedWeeks.size < weeksInQuarter) {
      const beforePace = targetQuarterPaces[insertionIndex];

      // Shift the beforePace to a later week to make room
      let shiftWeek = targetWeek + 1;
      while (shiftWeek <= weeksInQuarter) {
        const existingInWeek = targetQuarterPaces.find(
          pp => pp.week === shiftWeek &&
            pp.paceCatalog.subSubject.category.id === beforePace.paceCatalog.subSubject.category.id
        );

        if (!existingInWeek) {
          // Move beforePace to this week
          await prisma.projectionPace.update({
            where: { id: beforePace.id },
            data: { week: shiftWeek },
          });

          // Now move the pace to Q2
          await prisma.projectionPace.update({
            where: { id: unfinishedPace.id },
            data: {
              quarter: targetQuarterName,
              week: targetWeek,
            },
          });
          return true;
        }
        shiftWeek++;
      }
    }

    // If we still can't place it, try finding any available week (fallback)
    if (occupiedWeeks.size < weeksInQuarter) {
      for (let week = 1; week <= weeksInQuarter; week++) {
        const existingInWeek = targetQuarterPaces.find(
          pp => pp.week === week &&
            pp.paceCatalog.subSubject.category.id === unfinishedPaceCategoryId
        );

        if (!existingInWeek) {
          await prisma.projectionPace.update({
            where: { id: unfinishedPace.id },
            data: {
              quarter: targetQuarterName,
              week: week,
            },
          });
          return true;
        }
      }
    }

    if (occupiedWeeks.size >= weeksInQuarter) {
      const lastOccupiedWeek = Math.max(...Array.from(occupiedWeeks), 0);
      const lastWeekPaces = targetQuarterPaces.filter(pp => pp.week === lastOccupiedWeek);

      if (lastWeekPaces.length === 0) {
        await prisma.projectionPace.update({
          where: { id: unfinishedPace.id },
          data: {
            quarter: targetQuarterName,
            week: lastOccupiedWeek,
          },
        });
        return true;
      }

      const highestPaceInLastWeek = lastWeekPaces.reduce((highest, current) => {
        const highestNum = parseInt(highest.paceCatalog.code) || 0;
        const currentNum = parseInt(current.paceCatalog.code) || 0;
        return currentNum > highestNum ? current : highest;
      });

      const nextNextQuarter = this.getNextQuarter(targetQuarterName);
      if (!nextNextQuarter) {
        return false;
      }

      const nextNextQuarterObj = await prisma.quarter.findFirst({
        where: {
          schoolYearId,
          name: nextNextQuarter,
          deletedAt: null,
        },
      });

      if (!nextNextQuarterObj) {
        return false;
      }

      const allPacesForProjection = await prisma.projectionPace.findMany({
        where: {
          projectionId,
          deletedAt: null,
        },
        include: {
          paceCatalog: {
            include: {
              subSubject: true,
            },
          },
        },
      });

      const redistributed = await this.redistributePace(
        highestPaceInLastWeek,
        projectionId,
        nextNextQuarter,
        schoolYearId,
        allPacesForProjection
      );

      if (redistributed) {
        await prisma.projectionPace.update({
          where: { id: unfinishedPace.id },
          data: {
            quarter: targetQuarterName,
            week: highestPaceInLastWeek.week,
          },
        });
        return true;
      }
    }

    return false;
  }
}


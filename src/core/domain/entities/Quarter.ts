import { QuarterHoliday, SchoolWeek, SchoolYear } from './';

export class Quarter {
  constructor(
    public readonly id: string,
    public readonly schoolYearId: string,
    public readonly name: string,
    public readonly displayName: string,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly order: number,
    public readonly weeksCount: number,
    public readonly isClosed: boolean,
    public readonly closedAt?: Date,
    public readonly closedBy?: string,
    public readonly deletedAt?: Date,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
    public readonly quarterHolidays?: QuarterHoliday[],
    public readonly schoolWeeks?: SchoolWeek[],
    public readonly SchoolYear?: SchoolYear,
  ) { }

  static create(props: {
    id: string;
    schoolYearId: string;
    name: string;
    displayName: string;
    startDate: Date;
    endDate: Date;
    order: number;
    weeksCount: number;
    isClosed: boolean;
    closedAt?: Date;
    closedBy?: string;
    deletedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
    quarterHolidays?: QuarterHoliday[];
    schoolWeeks?: SchoolWeek[];
    SchoolYear?: SchoolYear;
  }): Quarter {
    return new Quarter(
      props.id,
      props.schoolYearId,
      props.name,
      props.displayName,
      props.startDate,
      props.endDate,
      props.order,
      props.weeksCount,
      props.isClosed,
      props.closedAt,
      props.closedBy,
      props.deletedAt,
      props.createdAt,
      props.updatedAt,
      props.quarterHolidays,
      props.schoolWeeks,
      props.SchoolYear,
    );
  }

  // update(props: Partial<Pick<Quarter, 'name' | 'displayName' | 'startDate' | 'endDate' | 'order' | 'weeksCount' | 'isClosed' | 'closedAt' | 'closedBy' | 'deletedAt' | 'createdAt' | 'updatedAt' | 'quarterHolidays' | 'schoolWeeks' | 'SchoolYear'>>): Quarter {
  //   return new Quarter(
  //     this.id,
  //     this.schoolYearId,
  //     props.name ?? this.name,
  //     props.displayName ?? this.displayName,
  //     props.startDate ?? this.startDate,
  //     props.endDate ?? this.endDate,
  //     props.order ?? this.order,
  //     props.weeksCount ?? this.weeksCount,
  //     props.isClosed ?? this.isClosed,
  //     props.closedAt ?? this.closedAt,
  //     props.closedBy ?? this.closedBy,
  //     props.deletedAt ?? this.deletedAt,
  //     props.createdAt ?? this.createdAt,
  //     props.updatedAt ?? this.updatedAt,
  //     props.quarterHolidays ?? this.quarterHolidays,
  //     props.schoolWeeks ?? this.schoolWeeks,
  //     this.SchoolYear,
  //   );
  // }
}
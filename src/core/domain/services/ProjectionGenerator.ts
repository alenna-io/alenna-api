import { GenerateProjectionInput } from '../../app/dtos/v2/projections/GenerateProjectionInput';

export interface GeneratedProjectionPace {
  categoryId: string;
  subSubjectId: string;
  paceCode: string;
  quarter: number;
  week: number;
}

export interface ProjectionGenerator {
  generate(input: GenerateProjectionInput): GeneratedProjectionPace[]
}
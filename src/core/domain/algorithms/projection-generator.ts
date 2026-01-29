import { GenerateProjectionInput } from '../../application/dtos/projections/GenerateProjectionInput'

export interface GeneratedProjectionPace {
  categoryId: string;
  subjectId: string;
  paceCode: string;
  quarter: number;
  week: number;
}

export interface ProjectionGenerator {
  generate(input: GenerateProjectionInput): GeneratedProjectionPace[]
}

import {
  ProjectionPace
} from '../../domain/entities';

export interface IProjectionPaceRepository {
  findById(id: string): Promise<ProjectionPace | null>;
  findByProjectionId(projectionId: string): Promise<ProjectionPace[]>;
  create(projectionPace: ProjectionPace): Promise<ProjectionPace>;
  update(id: string, projectionPace: Partial<ProjectionPace>): Promise<ProjectionPace>;
  delete(id: string): Promise<void>;
}
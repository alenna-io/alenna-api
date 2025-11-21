import { User } from '../../domain/entities';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByClerkId(clerkId: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByEmailIncludingDeleted(email: string): Promise<User | null>; // Find user even if soft-deleted
  findBySchoolId(schoolId: string): Promise<User[]>;
  findAll(): Promise<User[]>;
  create(user: User, roleIds?: string[]): Promise<User>;
  update(id: string, user: Partial<User>): Promise<User>;
  deactivate(id: string): Promise<User>;
  reactivate(id: string): Promise<User>;
  delete(id: string): Promise<void>;
}


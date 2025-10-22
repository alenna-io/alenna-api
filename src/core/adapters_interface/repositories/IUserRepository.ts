import { User } from '../../domain/entities';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByClerkId(clerkId: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findBySchoolId(schoolId: string): Promise<User[]>;
  findAll(): Promise<User[]>;
  create(user: User, roleIds?: string[]): Promise<User>;
  update(id: string, user: Partial<User>): Promise<User>;
  delete(id: string): Promise<void>;
}


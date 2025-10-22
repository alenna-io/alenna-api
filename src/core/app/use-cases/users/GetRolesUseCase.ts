import { IRoleRepository } from '../../../adapters_interface/repositories';
import { Role } from '../../../domain/entities';

export class GetRolesUseCase {
  constructor(private roleRepository: IRoleRepository) {}

  async execute(): Promise<Role[]> {
    return this.roleRepository.findAll();
  }
}

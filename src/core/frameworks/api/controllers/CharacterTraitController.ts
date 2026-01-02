import { Request, Response } from 'express';
import { container } from '../../di/container';
import {
  CreateCharacterTraitDTO,
  UpdateCharacterTraitDTO,
  GetCharacterTraitsBySchoolYearDTO,
  GetCharacterTraitByMonthDTO,
} from '../../../app/dtos/CharacterTraitDTO';

export class CharacterTraitController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const schoolId = req.schoolId!;
      const validatedData = CreateCharacterTraitDTO.parse(req.body);
      const characterTrait = await container.createCharacterTraitUseCase.execute(validatedData, schoolId);

      res.status(201).json(characterTrait);
    } catch (error: any) {
      console.error('Error creating character trait:', error);
      res.status(400).json({ error: error.message || 'Failed to create character trait' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const validatedData = UpdateCharacterTraitDTO.parse(req.body);
      const characterTrait = await container.updateCharacterTraitUseCase.execute(id, validatedData);

      res.json(characterTrait);
    } catch (error: any) {
      console.error('Error updating character trait:', error);
      res.status(400).json({ error: error.message || 'Failed to update character trait' });
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = GetCharacterTraitsBySchoolYearDTO.parse(req.query);
      const characterTraits = await container.getCharacterTraitsBySchoolYearUseCase.execute(validatedData);

      res.json(characterTraits);
    } catch (error: any) {
      console.error('Error getting character traits:', error);
      res.status(500).json({ error: error.message || 'Failed to get character traits' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const characterTrait = await container.getCharacterTraitUseCase.execute(id);

      res.json(characterTrait);
    } catch (error: any) {
      console.error('Error getting character trait:', error);
      res.status(404).json({ error: error.message || 'Character trait not found' });
    }
  }

  async getByMonth(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = GetCharacterTraitByMonthDTO.parse(req.query);
      const characterTrait = await container.getCharacterTraitByMonthUseCase.execute(validatedData);

      if (!characterTrait) {
        res.status(404).json({ error: 'Character trait not found for this month' });
        return;
      }

      res.json(characterTrait);
    } catch (error: any) {
      console.error('Error getting character trait by month:', error);
      res.status(500).json({ error: error.message || 'Failed to get character trait by month' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await container.deleteCharacterTraitUseCase.execute(id);

      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting character trait:', error);
      res.status(400).json({ error: error.message || 'Failed to delete character trait' });
    }
  }
}


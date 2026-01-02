export interface CharacterTrait {
  id: string;
  schoolId: string;
  schoolYearId: string;
  month: number;
  characterTrait: string;
  verseText: string;
  verseReference: string;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}


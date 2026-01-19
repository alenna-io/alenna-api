import { Category } from "../../../../domain/entities/v2/Category";

export class CategoryMapper {
  static toDomain(raw: any): Category {
    return new Category(
      raw.id,
      raw.name,
      raw.description,
      raw.displayOrder,
    );
  }
}
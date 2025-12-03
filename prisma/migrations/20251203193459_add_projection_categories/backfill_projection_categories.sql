-- Backfill projection_categories for existing projections
-- This script populates the projection_categories table based on categories found in existing projection_paces

INSERT INTO projection_categories (id, projection_id, category_id, created_at, updated_at)
SELECT 
    gen_random_uuid() as id,
    pp.projection_id,
    ss.category_id,
    NOW() as created_at,
    NOW() as updated_at
FROM projection_paces pp
INNER JOIN pace_catalogs pc ON pp.pace_catalog_id = pc.id
INNER JOIN sub_subjects ss ON pc.sub_subject_id = ss.id
WHERE pp.deleted_at IS NULL
GROUP BY pp.projection_id, ss.category_id
ON CONFLICT (projection_id, category_id) DO NOTHING;


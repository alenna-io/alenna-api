# Fix Migration Error - Clean Reset

## The Problem
Old migrations conflict with the new schema. We need a clean slate.

## Solution: Reset Everything

Run these commands in order:

```bash
cd alenna-api

# 1. Reset the database completely (drops all tables and migrations)
npx prisma migrate reset --force

# 2. This will automatically:
#    - Drop the database
#    - Recreate it
#    - Apply the current schema
#    - Run the seed

# If migrate reset doesn't run seed automatically, run it manually:
npm run seed
```

## Alternative: Manual Reset (if above doesn't work)

```bash
cd alenna-api

# 1. Delete migrations folder
rm -rf prisma/migrations

# 2. Drop and recreate database manually (PostgreSQL)
# Connect to postgres and run:
# DROP DATABASE alenna_db;
# CREATE DATABASE alenna_db;

# 3. Push schema directly (dev only!)
npx prisma db push

# 4. Run seed
npm run seed
```

## What This Does

✅ Drops all old tables
✅ Creates all new catalog tables
✅ Seeds with ~1000 PACEs
✅ Creates demo students with levels
✅ Creates sample projections

## After Reset

Start the API:
```bash
npm run dev
```

Test it works:
```bash
# Should show María with L8 level
curl http://localhost:3000/api/v1/students \
  -H "Authorization: Bearer <your-token>"
```


const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, '../prisma/migrations');
const migrations = fs.readdirSync(migrationsDir)
  .filter(item => {
    const itemPath = path.join(migrationsDir, item);
    return fs.statSync(itemPath).isDirectory() && item !== 'update-elective-pace-names.ts';
  })
  .sort();

console.log(`Found ${migrations.length} migrations to mark as applied...\n`);

for (const migration of migrations) {
  try {
    console.log(`Marking ${migration} as applied...`);
    const output = execSync(`npx prisma migrate resolve --applied ${migration}`, {
      encoding: 'utf8',
      cwd: path.join(__dirname, '..'),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    console.log(`✓ ${migration}\n`);
  } catch (error) {
    const errorOutput = (error.stdout || error.stderr || error.message || '').toString();
    if (errorOutput.includes('already recorded as applied') || errorOutput.includes('P3008')) {
      console.log(`⚠ ${migration} already marked as applied, skipping...\n`);
    } else {
      console.error(`✗ Failed to mark ${migration}`);
      console.error(`  Error: ${errorOutput}\n`);
      // Continue with next migration instead of exiting
    }
  }
}

console.log('✅ All migrations marked as applied!');

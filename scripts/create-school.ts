import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';
import { createSchoolSetup, disconnect, SetupConfig } from './school-setup';

dotenv.config();

function parseArgs() {
  const args = process.argv.slice(2);
  const config: { schoolId?: string; configPath?: string } = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--school-id' && i + 1 < args.length) {
      config.schoolId = args[i + 1];
      i++;
    } else if (args[i] === '--config' && i + 1 < args.length) {
      config.configPath = args[i + 1];
      i++;
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
Usage: tsx scripts/create-school.ts [options]

Options:
  --config <path>     Path to configuration file (required)
  --school-id <id>   Existing school ID (optional, if not provided, school will be created from config)
  --help, -h          Show this help message

Examples:
  # Create everything from scratch
  tsx scripts/create-school.ts --config scripts/school-setup.config.json

  # Add to existing school
  tsx scripts/create-school.ts --school-id <school-id> --config scripts/school-setup.config.json
`);
      process.exit(0);
    }
  }

  return config;
}

function loadConfig(configPath: string, hasSchoolId: boolean): SetupConfig {
  try {
    const fullPath = join(process.cwd(), configPath);
    const fileContent = readFileSync(fullPath, 'utf-8');
    const config = JSON.parse(fileContent) as SetupConfig;

    if (!config.adminUser || !config.schoolYear || !config.quarters) {
      throw new Error('Config file must contain adminUser, schoolYear, and quarters');
    }

    if (!hasSchoolId && !config.school) {
      throw new Error('Config file must contain school config when schoolId is not provided');
    }

    return config;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('ENOENT')) {
        throw new Error(`Config file not found: ${configPath}`);
      }
      throw new Error(`Failed to load config: ${error.message}`);
    }
    throw error;
  }
}

async function main() {
  try {
    const args = parseArgs();

    if (!args.configPath) {
      console.error('❌ Error: --config is required');
      console.log('Use --help for usage information');
      process.exit(1);
    }

    const config = loadConfig(args.configPath, !!args.schoolId);

    await createSchoolSetup(args.schoolId, config);
  } catch (error) {
    console.error('❌ Setup failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await disconnect();
  }
}

main();

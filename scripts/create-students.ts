import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';
import { createStudents, disconnect, StudentsSetupConfig } from './students-setup';

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
Usage: tsx scripts/create-students.ts [options]

Options:
  --school-id <id>   School ID (required)
  --config <path>    Path to configuration file (required)
  --help, -h         Show this help message

Examples:
  tsx scripts/create-students.ts --school-id <school-id> --config scripts/students-setup.config.json
`);
      process.exit(0);
    }
  }

  return config;
}

function loadConfig(configPath: string): StudentsSetupConfig {
  try {
    const fullPath = join(process.cwd(), configPath);
    const fileContent = readFileSync(fullPath, 'utf-8');
    const config = JSON.parse(fileContent) as StudentsSetupConfig;

    if (!config.students || !Array.isArray(config.students) || config.students.length === 0) {
      throw new Error('Config file must contain a non-empty students array');
    }

    for (const student of config.students) {
      if (!student.email) {
        throw new Error('Each student must have an email');
      }
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

    if (!args.schoolId) {
      console.error('❌ Error: --school-id is required');
      console.log('Use --help for usage information');
      process.exit(1);
    }

    if (!args.configPath) {
      console.error('❌ Error: --config is required');
      console.log('Use --help for usage information');
      process.exit(1);
    }

    const config = loadConfig(args.configPath);

    await createStudents(args.schoolId, config);
  } catch (error) {
    console.error('❌ Setup failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await disconnect();
  }
}

main();

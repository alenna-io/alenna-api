import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';
import { createPaces, disconnect, PacesSetupConfig } from './paces-setup';

dotenv.config();

function parseArgs() {
  const args = process.argv.slice(2);
  const config: { configPath?: string } = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--config' && i + 1 < args.length) {
      config.configPath = args[i + 1];
      i++;
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
Usage: tsx scripts/create-paces.ts [options]

Options:
  --config <path>    Path to configuration file (required)
  --help, -h         Show this help message

Examples:
  tsx scripts/create-paces.ts --config scripts/paces-setup.config.json
`);
      process.exit(0);
    }
  }

  return config;
}

function loadConfig(configPath: string): PacesSetupConfig {
  try {
    const fullPath = join(process.cwd(), configPath);
    const fileContent = readFileSync(fullPath, 'utf-8');
    const config = JSON.parse(fileContent) as PacesSetupConfig;

    if (!config.subjects || !Array.isArray(config.subjects) || config.subjects.length === 0) {
      throw new Error('Config file must contain a non-empty subjects array');
    }

    for (const subject of config.subjects) {
      if (!subject.categoryName || !subject.subjectName || !subject.levelId) {
        throw new Error('Each subject must have categoryName, subjectName, and levelId');
      }
      if (!subject.paceCodes || !Array.isArray(subject.paceCodes) || subject.paceCodes.length === 0) {
        throw new Error('Each subject must have a non-empty paceCodes array');
      }
      if (typeof subject.orderIndex !== 'number') {
        throw new Error('Each subject must have an orderIndex number');
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

    if (!args.configPath) {
      console.error('❌ Error: --config is required');
      console.log('Use --help for usage information');
      process.exit(1);
    }

    const config = loadConfig(args.configPath);

    await createPaces(config);
  } catch (error) {
    console.error('❌ Setup failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await disconnect();
  }
}

main();

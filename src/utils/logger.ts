// Simple logger utility
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const colors = {
  info: '\x1b[36m',    // Cyan
  warn: '\x1b[33m',    // Yellow
  error: '\x1b[31m',   // Red
  debug: '\x1b[35m',   // Magenta
  reset: '\x1b[0m',
};

class Logger {
  private log(level: LogLevel, message: string, ...args: any[]) {
    const timestamp = new Date().toISOString();
    const color = colors[level];
    const reset = colors.reset;
    
    console.log(`${color}[${timestamp}] [${level.toUpperCase()}]${reset} ${message}`, ...args);
  }

  info(message: string, ...args: any[]) {
    this.log('info', message, ...args);
  }

  warn(message: string, ...args: any[]) {
    this.log('warn', message, ...args);
  }

  error(message: string, ...args: any[]) {
    this.log('error', message, ...args);
  }

  debug(message: string, ...args: any[]) {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, ...args);
    }
  }
}

export const logger = new Logger();


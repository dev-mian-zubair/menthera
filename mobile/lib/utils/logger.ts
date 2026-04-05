/**
 * Production-safe logger that only outputs in __DEV__ mode.
 * logger.error() always logs (even in production) for crash reporting,
 * but sanitizes arguments to avoid leaking sensitive data.
 */

const isDev = __DEV__;

function sanitizeArgs(args: any[]): any[] {
  return args.map((arg) => {
    if (typeof arg === 'string' && arg.length > 500) {
      return arg.substring(0, 500) + '...[truncated]';
    }
    if (arg instanceof Error) {
      return { name: arg.name, message: arg.message };
    }
    return arg;
  });
}

export const logger = {
  debug(...args: any[]) {
    if (isDev) console.log(...args);
  },
  info(...args: any[]) {
    if (isDev) console.log(...args);
  },
  warn(...args: any[]) {
    if (isDev) console.warn(...args);
  },
  error(...args: any[]) {
    // Always log errors, but sanitize in production
    if (isDev) {
      console.error(...args);
    } else {
      console.error(...sanitizeArgs(args));
    }
  },
};

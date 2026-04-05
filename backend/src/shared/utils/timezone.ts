/**
 * Timezone-aware usage reset utilities.
 *
 * The core idea: we calculate "first day of next month" in the user's local
 * timezone, then store it as a UTC ISO string. When checking whether to reset,
 * we compare the current time in the user's timezone against the local month
 * boundary - not against a UTC date.
 *
 * Fallback: if no timezone is stored, we default to UTC (existing behavior).
 */

const DEFAULT_TIMEZONE = 'UTC';

/**
 * Validate that a timezone string is a valid IANA timezone identifier.
 * e.g. "America/New_York", "Europe/London", "Asia/Tokyo"
 */
export function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the current date parts in a specific timezone.
 * Returns { year, month (0-indexed), day, hours, minutes } in the user's local time.
 */
function getDatePartsInTimezone(date: Date, timezone: string): { year: number; month: number; day: number } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });

  const parts = formatter.formatToParts(date);
  const year = parseInt(parts.find(p => p.type === 'year')!.value);
  const month = parseInt(parts.find(p => p.type === 'month')!.value) - 1; // 0-indexed
  const day = parseInt(parts.find(p => p.type === 'day')!.value);

  return { year, month, day };
}

/**
 * Get the first day of next month as an ISO string, calculated in the user's timezone.
 *
 * For a user in America/New_York on Jan 15:
 *  - "First of next month" = Feb 1 00:00:00 EST
 *  - Stored as Feb 1 05:00:00 UTC (ISO string)
 *
 * This means the reset triggers when it's midnight in *their* timezone.
 */
export function getFirstDayOfNextMonth(timezone?: string): string {
  const tz = timezone && isValidTimezone(timezone) ? timezone : DEFAULT_TIMEZONE;
  const now = new Date();
  const { year, month } = getDatePartsInTimezone(now, tz);

  // Create "first of next month midnight" in the user's timezone
  // We use Intl to find the UTC offset, then construct the correct UTC time
  const nextMonth = month + 1;
  const targetYear = nextMonth > 11 ? year + 1 : year;
  const targetMonth = nextMonth > 11 ? 0 : nextMonth;

  // Build a date string representing midnight on the 1st of next month in the user's TZ
  // Then convert to UTC via the timezone offset
  const localDateStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-01T00:00:00`;

  // Get the UTC equivalent of this local time
  const utcDate = localToUtc(localDateStr, tz);
  return utcDate.toISOString();
}

/**
 * Check if usage should be reset based on the stored resetDate and user timezone.
 *
 * Logic: determine the current month start in the user's timezone. If the
 * stored resetDate is at or before that point, usage needs resetting.
 */
export function shouldResetUsage(resetDate: string, timezone?: string): boolean {
  const tz = timezone && isValidTimezone(timezone) ? timezone : DEFAULT_TIMEZONE;
  const now = new Date();
  const { year, month } = getDatePartsInTimezone(now, tz);

  // Current month start in user's timezone, converted to UTC
  const currentMonthStartLocal = `${year}-${String(month + 1).padStart(2, '0')}-01T00:00:00`;
  const currentMonthStartUtc = localToUtc(currentMonthStartLocal, tz);

  const resetDateUtc = new Date(resetDate);

  // If the stored reset date is before or equal to the start of the current month
  // in the user's timezone, we need to reset
  return resetDateUtc <= currentMonthStartUtc;
}

/**
 * Convert a local time string (without TZ info) to a UTC Date,
 * accounting for the timezone offset at that specific date/time.
 *
 * This handles DST transitions correctly because Intl.DateTimeFormat
 * resolves the offset for the specific date, not the current offset.
 */
function localToUtc(localDateStr: string, timezone: string): Date {
  // Create a date in UTC first
  const utcGuess = new Date(localDateStr + 'Z');

  // Find the offset between UTC and the target timezone at this point in time
  // by formatting the UTC date in the target timezone and comparing
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(utcGuess);
  const localYear = parseInt(parts.find(p => p.type === 'year')!.value);
  const localMonth = parseInt(parts.find(p => p.type === 'month')!.value) - 1;
  const localDay = parseInt(parts.find(p => p.type === 'day')!.value);
  const localHour = parseInt(parts.find(p => p.type === 'hour')!.value);
  const localMinute = parseInt(parts.find(p => p.type === 'minute')!.value);

  // Calculate the offset in milliseconds
  const localAsUtc = new Date(Date.UTC(localYear, localMonth, localDay, localHour, localMinute, 0));
  const offsetMs = localAsUtc.getTime() - utcGuess.getTime();

  // The target local time in UTC = localDateStr parsed as UTC minus the offset
  const targetUtc = new Date(utcGuess.getTime() - offsetMs);
  return targetUtc;
}

// Converts between the UTC hour/day-of-week stored server-side (so the
// scheduler, running on a server with its own clock, has an unambiguous
// reference frame) and whatever timezone the viewing device reports.
// There's no per-account timezone setting since this is a single shared
// dashboard - "per user" here means "per device viewing it," computed
// fresh from the browser's own Intl/Date behavior each time.
//
// 2023-01-01 is a Sunday - used as a fixed reference date purely so
// getDay()/getUTCDay() line up with the 0=Sunday..6=Saturday convention
// used throughout (AgentDefinition.dayOfWeek).

export function utcToLocal(utcHour: number, utcDayOfWeek: number): { hour: number; dayOfWeek: number } {
  const d = new Date(Date.UTC(2023, 0, 1 + utcDayOfWeek, utcHour));
  return { hour: d.getHours(), dayOfWeek: d.getDay() };
}

export function localToUtc(localHour: number, localDayOfWeek: number): { hour: number; dayOfWeek: number } {
  const d = new Date(2023, 0, 1 + localDayOfWeek, localHour);
  return { hour: d.getUTCHours(), dayOfWeek: d.getUTCDay() };
}

export function utcHourToLocalHour(utcHour: number): number {
  return new Date(Date.UTC(2023, 0, 1, utcHour)).getHours();
}

export function localHourToUtcHour(localHour: number): number {
  return new Date(2023, 0, 1, localHour).getUTCHours();
}

export function deviceTimezoneLabel(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "local time";
  }
}

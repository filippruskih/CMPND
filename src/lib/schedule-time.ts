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

export function utcToLocal(
  utcHour: number,
  utcDayOfWeek: number,
  utcMinute = 0
): { hour: number; minute: number; dayOfWeek: number } {
  const d = new Date(Date.UTC(2023, 0, 1 + utcDayOfWeek, utcHour, utcMinute));
  return { hour: d.getHours(), minute: d.getMinutes(), dayOfWeek: d.getDay() };
}

export function localToUtc(
  localHour: number,
  localDayOfWeek: number,
  localMinute = 0
): { hour: number; minute: number; dayOfWeek: number } {
  const d = new Date(2023, 0, 1 + localDayOfWeek, localHour, localMinute);
  return { hour: d.getUTCHours(), minute: d.getUTCMinutes(), dayOfWeek: d.getUTCDay() };
}

export function utcHourToLocalHour(utcHour: number): number {
  return new Date(Date.UTC(2023, 0, 1, utcHour)).getHours();
}

export function localHourToUtcHour(localHour: number): number {
  return new Date(2023, 0, 1, localHour).getUTCHours();
}

export function utcTimeToLocalTime(utcHour: number, utcMinute: number): { hour: number; minute: number } {
  const d = new Date(Date.UTC(2023, 0, 1, utcHour, utcMinute));
  return { hour: d.getHours(), minute: d.getMinutes() };
}

export function localTimeToUtcTime(localHour: number, localMinute: number): { hour: number; minute: number } {
  const d = new Date(2023, 0, 1, localHour, localMinute);
  return { hour: d.getUTCHours(), minute: d.getUTCMinutes() };
}

export function deviceTimezoneLabel(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "local time";
  }
}

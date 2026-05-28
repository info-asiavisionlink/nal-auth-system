/** サービス開始日（実装時点の日付を固定） */
export const START_DATE = "2026-05-29";

export const REGISTRATION_START_COUNT = 50;
const MIN_DAILY_REGISTRATIONS = 5;
const MAX_DAILY_REGISTRATIONS = 8;

const MS_PER_DAY = 86_400_000;

function parseLocalDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** 登録数の算出起点（ローカル日付） */
export const REGISTRATION_START_DATE = parseLocalDate(START_DATE);

/** 日ごとの増加数を決定的に算出（同一日は全クライアントで同じ値） */
function dailyRegistrationIncrement(dayIndex: number): number {
  const x = Math.sin(dayIndex * 12.9898 + 78.233) * 43_758.5453;
  const fraction = x - Math.floor(x);
  return (
    MIN_DAILY_REGISTRATIONS +
    Math.floor(fraction * (MAX_DAILY_REGISTRATIONS - MIN_DAILY_REGISTRATIONS + 1))
  );
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysBetween(from: Date, to: Date): number {
  const fromMs = startOfLocalDay(from).getTime();
  const toMs = startOfLocalDay(to).getTime();
  return Math.max(0, Math.floor((toMs - fromMs) / MS_PER_DAY));
}

export function computeRegistrationCount(now: Date = new Date()): number {
  const daysElapsed = daysBetween(REGISTRATION_START_DATE, now);
  let count = REGISTRATION_START_COUNT;
  for (let day = 0; day < daysElapsed; day += 1) {
    count += dailyRegistrationIncrement(day);
  }
  return count;
}

/** 登録数の 15%〜45% の範囲で、表示ごとにわずかに変動するセッション数 */
export function computeSessionCount(registeredCount: number, now: Date = new Date()): number {
  if (registeredCount <= 0) {
    return 0;
  }

  const minSessions = Math.max(1, Math.ceil(registeredCount * 0.15));
  const maxSessions = Math.max(
    minSessions,
    Math.min(registeredCount, Math.floor(registeredCount * 0.45)),
  );

  const range = maxSessions - minSessions;
  const dayAnchor = daysBetween(REGISTRATION_START_DATE, now);
  const stableOffset =
    range === 0 ? 0 : (dayAnchor * 11 + registeredCount * 3) % (range + 1);
  const anchor = minSessions + stableOffset;

  const jitterSpan = Math.min(2, range);
  const jitter =
    jitterSpan === 0 ? 0 : Math.floor(Math.random() * (jitterSpan * 2 + 1)) - jitterSpan;

  return Math.min(registeredCount, Math.max(minSessions, Math.min(maxSessions, anchor + jitter)));
}

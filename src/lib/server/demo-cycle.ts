/**
 * Demo cycle = month number relative to season start.
 * Each cycle ends on the last Thursday of the month.
 */

export function getCurrentDemoCycle(seasonStart: Date): number {
	const now = new Date();
	return Math.max(1,
		(now.getFullYear() - seasonStart.getFullYear()) * 12
		+ (now.getMonth() - seasonStart.getMonth())
		+ 1
	);
}

export function getLastThursday(year: number, month: number): Date {
	// month is 0-indexed
	const lastDay = new Date(year, month + 1, 0);
	const dayOfWeek = lastDay.getDay();
	const diff = (dayOfWeek + 7 - 4) % 7; // 4 = Thursday
	return new Date(year, month + 1, -diff);
}

export function getNextDemoDay(): Date {
	const now = new Date();
	let year = now.getFullYear();
	let month = now.getMonth();

	// Get last Thursday of current month
	let demoDay = getLastThursday(year, month);

	// If it's already past, get next month's
	if (now > demoDay) {
		month++;
		if (month > 11) {
			month = 0;
			year++;
		}
		demoDay = getLastThursday(year, month);
	}

	return demoDay;
}

export function getDemoCycleRange(seasonStart: Date, cycle: number): { start: Date; end: Date } {
	const startMonth = seasonStart.getMonth() + (cycle - 1);
	const startYear = seasonStart.getFullYear() + Math.floor(startMonth / 12);
	const normalizedMonth = startMonth % 12;

	const start = cycle === 1
		? new Date(seasonStart)
		: new Date(startYear, normalizedMonth, 1);

	const end = getLastThursday(startYear, normalizedMonth);

	return { start, end };
}

export function daysUntilDemoDay(): number {
	const now = new Date();
	const demo = getNextDemoDay();
	return Math.max(0, Math.ceil((demo.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
}

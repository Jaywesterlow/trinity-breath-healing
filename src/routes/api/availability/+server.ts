/**
 * GET /api/availability?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * The slots already spoken for in a window. The planner asks on mount and
 * greys out what it gets back.
 *
 * This has to be a runtime endpoint rather than data baked into the page: the
 * landing page is prerendered, so anything computed at build time would be a
 * snapshot of availability at deploy time and wrong within the hour.
 *
 * Returns an empty list rather than an error when the database is not
 * configured. The planner then behaves exactly as it did before this feature
 * existed — every slot offered, the server still the only thing that decides —
 * instead of failing closed and showing a fully booked calendar.
 */
import { json, type RequestHandler } from '@sveltejs/kit';
import { isDatabaseConfigured } from '$lib/server/db';
import { takenSlots } from '$lib/server/bookings';

export const prerender = false;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Bounded so a crafted range cannot ask for a decade in one query. */
const MAX_DAYS = 120;

export const GET: RequestHandler = async ({ url, setHeaders }) => {
	const from = url.searchParams.get('from') ?? '';
	const to = url.searchParams.get('to') ?? '';
	if (!ISO_DATE.test(from) || !ISO_DATE.test(to) || to < from) {
		return json({ taken: [] }, { status: 400 });
	}

	const spanDays = (Date.parse(to) - Date.parse(from)) / 86_400_000;
	if (spanDays > MAX_DAYS) return json({ taken: [] }, { status: 400 });

	if (!isDatabaseConfigured()) return json({ taken: [] });

	try {
		const taken = await takenSlots(from, to);
		/* A short cache: availability changes when someone books, and a stale
		   answer for half a minute only means one visitor sees a slot that the
		   server will then refuse. Long enough to blunt a refresh loop. */
		setHeaders({ 'cache-control': 'public, max-age=0, s-maxage=30' });
		return json({ taken });
	} catch (error) {
		console.error('[availability] query failed:', error);
		/* Fail open, for the same reason as the unconfigured case above. */
		return json({ taken: [] });
	}
};

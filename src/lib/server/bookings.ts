/**
 * Reads and writes for booking_request.
 *
 * Kept apart from the routes so the rules live in one place: a slot is taken
 * when a live request holds it, a pending request stops being live once it
 * expires, and a rejection frees the slot immediately.
 */
import { db } from '$lib/server/db';

/** How long the practitioner has to answer before the slot frees itself. */
export const PENDING_TTL_HOURS = 48;

export interface TakenSlot {
	datum: string;
	start: string;
}

/** Postgres `time` comes back as "HH:MM:SS"; the schedule speaks "HH:MM". */
const hhmm = (time: string) => time.slice(0, 5);

/**
 * Slots that are spoken for between two dates, inclusive.
 *
 * "Live" means approved, or pending and not yet expired. An unanswered request
 * from three days ago does not keep a slot off the calendar — that is the whole
 * point of expires_at, and reading it here means there is no sweeper job whose
 * failure would silently strand slots.
 */
export async function takenSlots(fromIso: string, toIso: string): Promise<TakenSlot[]> {
	const rows = await db()<{ slot_date: Date; slot_start: string }[]>`
		select slot_date, slot_start
		from booking_request
		where slot_date between ${fromIso} and ${toIso}
		  and (status = 'approved' or (status = 'pending' and expires_at > now()))
	`;
	return rows.map((row) => ({
		/* node-postgres hands back a Date for `date`; format it locally rather
		   than via toISOString(), which would shift it a day for anyone east of
		   UTC — exactly the bug schedule.ts avoids by staying on wall-clock. */
		datum: [
			row.slot_date.getFullYear(),
			String(row.slot_date.getMonth() + 1).padStart(2, '0'),
			String(row.slot_date.getDate()).padStart(2, '0')
		].join('-'),
		start: hhmm(row.slot_start)
	}));
}

export type ReserveResult =
	| { ok: true; id: string }
	| { ok: false; reason: 'taken' }
	| { ok: false; reason: 'error'; detail: string };

/**
 * Claim a slot, pending the practitioner's answer.
 *
 * Concurrency is handled by the partial unique index rather than a
 * check-then-insert: two requests arriving in the same millisecond both pass
 * any "is it free?" query, and only the constraint can actually decide. A
 * 23505 back means the other one won.
 */
export async function reserveSlot(
	slot: { datum: string; start: string; end: string },
	tokenHash: string
): Promise<ReserveResult> {
	const expires = new Date(Date.now() + PENDING_TTL_HOURS * 60 * 60 * 1000);
	try {
		const [row] = await db()<{ id: string }[]>`
			insert into booking_request (slot_date, slot_start, slot_end, token_hash, expires_at)
			values (${slot.datum}, ${slot.start}, ${slot.end}, ${tokenHash}, ${expires})
			returning id
		`;
		return row ? { ok: true, id: row.id } : { ok: false, reason: 'error', detail: 'no row' };
	} catch (error) {
		const code = (error as { code?: string }).code;
		if (code === '23505') return { ok: false, reason: 'taken' };
		return { ok: false, reason: 'error', detail: String(error) };
	}
}

export type Decision = 'approved' | 'rejected';

export type DecideResult =
	| { ok: true; changed: true }
	/* Already answered — she clicked twice, or an e-mail client prefetched.
	   Not an error: the caller shows "this was already handled" rather than
	   sending the visitor a second contradictory e-mail. */
	| { ok: true; changed: false; status: string }
	| { ok: false; reason: 'unknown' | 'expired' };

/**
 * Record the practitioner's answer, once.
 *
 * The `status = 'pending'` guard in the WHERE clause is what makes this
 * idempotent: a second click updates nothing and returns changed: false, so
 * approving twice cannot send two invitations.
 */
export async function decide(tokenHash: string, decision: Decision): Promise<DecideResult> {
	const [updated] = await db()<{ id: string }[]>`
		update booking_request
		set status = ${decision}, decided_at = now()
		where token_hash = ${tokenHash}
		  and status = 'pending'
		  and expires_at > now()
		returning id
	`;
	if (updated) return { ok: true, changed: true };

	const [existing] = await db()<{ status: string; expired: boolean }[]>`
		select status, expires_at <= now() as expired
		from booking_request
		where token_hash = ${tokenHash}
	`;
	if (!existing) return { ok: false, reason: 'unknown' };
	if (existing.status === 'pending' && existing.expired) return { ok: false, reason: 'expired' };
	return { ok: true, changed: false, status: existing.status };
}

/** Status of one request, for rendering the decision page before she acts. */
export async function statusOf(tokenHash: string): Promise<string | null> {
	const [row] = await db()<{ status: string }[]>`
		select status from booking_request where token_hash = ${tokenHash}
	`;
	return row?.status ?? null;
}

/**
 * The availability endpoint is the planner's only source of "already taken".
 * Its failure mode is pinned here: an unreachable store answers 503 with an
 * explicit unavailable flag, never a 200 with an empty list — the planner
 * would read that as "everything is free".
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/server/db', () => ({ isDatabaseConfigured: vi.fn() }));
vi.mock('$lib/server/bookings', () => ({ takenSlots: vi.fn() }));

import { GET } from '../../src/routes/api/availability/+server';
import { isDatabaseConfigured } from '$lib/server/db';
import { takenSlots } from '$lib/server/bookings';

const configured = vi.mocked(isDatabaseConfigured);
const taken = vi.mocked(takenSlots);

function call(url: string) {
	const headers: Record<string, string> = {};
	const event = {
		url: new URL(url),
		setHeaders: (h: Record<string, string>) => Object.assign(headers, h)
	};
	return { event, headers };
}

describe('GET /api/availability', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('answers the taken slots, shortly cached, when the store answers', async () => {
		configured.mockReturnValue(true);
		taken.mockResolvedValue([{ datum: '2026-11-25', start: '19:00' }]);
		const { event, headers } = call('https://x.test/api/availability?from=2026-11-01&to=2026-11-30');
		const res = await GET(event as never);
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ taken: [{ datum: '2026-11-25', start: '19:00' }] });
		expect(headers['cache-control']).toContain('s-maxage=30');
	});

	it('answers 503 unavailable, uncached, when the store is not configured', async () => {
		configured.mockReturnValue(false);
		const { event } = call('https://x.test/api/availability?from=2026-11-01&to=2026-11-30');
		const res = await GET(event as never);
		expect(res.status).toBe(503);
		expect(await res.json()).toEqual({ taken: null, unavailable: true });
		expect(res.headers.get('cache-control')).toBe('no-store');
		expect(taken).not.toHaveBeenCalled();
	});

	it('answers 503 unavailable, uncached, when the query fails', async () => {
		configured.mockReturnValue(true);
		taken.mockRejectedValue(new Error('connection refused'));
		const { event } = call('https://x.test/api/availability?from=2026-11-01&to=2026-11-30');
		const res = await GET(event as never);
		expect(res.status).toBe(503);
		expect(await res.json()).toEqual({ taken: null, unavailable: true });
		expect(res.headers.get('cache-control')).toBe('no-store');
	});

	it('still rejects a malformed range with 400', async () => {
		configured.mockReturnValue(true);
		const { event } = call('https://x.test/api/availability?from=1-11-2026&to=2026-11-30');
		const res = await GET(event as never);
		expect(res.status).toBe(400);
	});
});

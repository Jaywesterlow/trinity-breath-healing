-- Booking requests: the memory that lets a slot grey out the moment someone
-- asks for it, and reopen the moment the practitioner declines.
--
-- DELIBERATELY HOLDS NO PERSONAL DATA.
--
-- A booking carries a name, an e-mail and often a description of what the
-- person is struggling with. That last one is health data — a bijzonder
-- persoonsgegeven under Art. 9 AVG — and storing it would mean this database
-- becomes a processor of special-category data, with the contract, the
-- retention policy and the breach exposure that implies.
--
-- None of it is needed here. All this table has to answer is "is 14:00 on the
-- 3rd still free?". So the person's details travel inside the signed token in
-- the approval link and in the e-mail to the practitioner, and never land in a
-- row. What is stored is a date, two times, and a word.

create table if not exists booking_request (
	id uuid primary key default gen_random_uuid(),

	-- Local wall-clock, matching src/lib/booking/schedule.ts. The practice and
	-- everyone booking it are in Europe/Amsterdam, so a date here is the date
	-- she writes in her diary. Storing timestamptz would invite a UTC
	-- round-trip and an off-by-one every time the clocks change.
	slot_date date not null,
	slot_start time not null,
	slot_end time not null,

	status text not null default 'pending'
		check (status in ('pending', 'approved', 'rejected')),

	-- SHA-256 of the approval token. Storing the hash rather than the token
	-- means a leaked database still cannot approve anything.
	token_hash text not null unique,

	created_at timestamptz not null default now(),
	-- A request nobody answers stops holding the slot hostage. Read at query
	-- time rather than swept by a job: there is no cron to forget to run, and
	-- an expired row is simply not counted as taken.
	expires_at timestamptz not null,
	decided_at timestamptz
);

-- One live claim per slot. Partial, so a rejected request does not keep the
-- slot blocked forever — and so the same slot can be requested again after a
-- decline. This is the constraint that makes double-booking impossible even
-- if two requests arrive in the same millisecond; the second insert fails.
create unique index if not exists booking_request_slot_live
	on booking_request (slot_date, slot_start)
	where status in ('pending', 'approved');

-- The availability endpoint asks "what is taken between these two dates".
create index if not exists booking_request_date_status
	on booking_request (slot_date, status);

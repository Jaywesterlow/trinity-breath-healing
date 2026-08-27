/**
 * Shared facts for the three legal pages.
 *
 * `LAST_UPDATED` is deliberately a hand-maintained constant and not the build
 * date: a legal document's date has to mean "the text changed", not "the site
 * redeployed". Bump it when the wording changes and only then.
 */
export const LEGAL_LAST_UPDATED = '2026-08-21';

/**
 * Free cancellation window, in hours.
 *
 * Provisional at 24 — the practitioner has not set it yet, and this is the
 * number the e-mails quote to visitors. It lives here rather than in the copy
 * so that changing it changes the acknowledgement, the confirmation and the
 * algemene voorwaarden together, instead of leaving the e-mails promising
 * something the terms do not.
 */
export const CANCELLATION_HOURS = 24;

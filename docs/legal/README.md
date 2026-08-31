# Processor paperwork

The site sends personal data to three processors. `/privacyverklaring` names
them, and AVG art. 28 requires an agreement behind each name. This directory is
where those documents live locally; the PDFs are gitignored, this file is not.

The category matters here: the contact form and the booking flow carry
**klachten**, which is health data under AVG art. 9. That is why the booking
table stores none of it, and why the paperwork is worth actually holding rather
than assuming.

| Processor | What it handles | Document | Status |
|---|---|---|---|
| **Resend** | Outgoing e-mail: contact form, booking request, approval and rejection | `resend-dpa.pdf` | Executed on sign-up — Resend's dashboard states the attached DPA "is considered fully executed once you sign up". No counter-signature to chase. |
| **Supabase** | `booking_request` — dates, times, status, token hashes. **No personal data.** | `supabase-dpa.pdf` | View-only in the dashboard, i.e. incorporated by their terms rather than separately signed. |
| **Vercel** | Hosting; request logs | — | Covered by Vercel's own DPA in their terms. |

Also worth keeping when the vendor offers them, since they answer the questions
a beroepsvereniging or a client asks without needing a lawyer:

- `resend-soc2.pdf`, `supabase-soc2.pdf` — independent audit of the processor
- `supabase-tia.pdf` — Transfer Impact Assessment, the international-transfer question
- `resend-pentest.pdf` — Letter of Attestation

## Open

- **Confirm the Supabase project's region is in the EU.** Resend was very nearly
  set up in Tokyo by an auto-picked default, and the same trap exists here. A
  processor outside the EEA turns a paperwork question into a transfer question.

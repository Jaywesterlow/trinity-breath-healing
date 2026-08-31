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
| **Resend** | Outgoing e-mail: contact form, booking request, approval and rejection | `resend-dpa.pdf` | Executed on sign-up — the dashboard states the attached DPA "is considered fully executed once you sign up". DocuSign-countersigned copy held. |
| **Supabase** | `booking_request` — dates, times, status, token hashes. **No personal data.** | `supabase-dpa.pdf` | View-only in the dashboard, i.e. incorporated by their terms rather than separately signed. Version 1, 1 August 2026. |
| **Vercel** | Hosting; request logs | — | Covered by Vercel's own DPA in their terms. |

## What the documents actually say

Read 31-08 rather than filed unread, and one line of `/privacyverklaring` was
wrong because of it.

**Every one of these three is a non-EU company, and the privacy statement said
only "Europese Unie".** Storage region and corporate reach are different
questions, and the second one was missing:

- **Resend** is *Plus Five Five, Inc.*, San Francisco. Its DPA §6.1 is explicit:
  "Company's primary processing operations take place in the United States, and
  the transfer of Customer's Personal Data to the United States is necessary for
  the provision of the Services."
- **Supabase** contracts as *Supabase Pte. Ltd* (Singapore); the TIA covers
  transfer to *Supabase Inc*, Delaware. DPA §6.1 does honour a chosen region for
  storage and primary processing — ours is **eu-west-1 (Ireland)**, confirmed
  in the dashboard.
- Both rely on **EU SCCs, Commission Decision 2021/914, Module Two**.

`/privacyverklaring` now carries a fourth column ("Toegang van buiten de EU")
and a section naming the modelcontractbepalingen as the safeguard. AVG art.
13(1)(f) asks for exactly that, and a health practice is the wrong place to be
approximately right about it.

**Supabase's DPA defines health data as "Sensitive Data"** and puts the notice
and explicit-consent burden on the customer. This is the clause that justifies
the booking table holding no name, e-mail or klachten — that design choice is
now load-bearing rather than tidy, and should not be relaxed.

`supabase-tia.pdf` is their FISA 702 / Schrems II analysis. Worth keeping: it is
the document that answers "what about American surveillance law" if a client or
her beroepsvereniging ever asks.

Also worth keeping when the vendor offers them, since they answer the questions
a beroepsvereniging or a client asks without needing a lawyer:

- `resend-soc2.pdf`, `supabase-soc2.pdf` — independent audit of the processor
- `supabase-tia.pdf` — Transfer Impact Assessment, the international-transfer question
- `resend-pentest.pdf` — Letter of Attestation

## Open

- **Confirm the Supabase project's region is in the EU.** Resend was very nearly
  set up in Tokyo by an auto-picked default, and the same trap exists here. A
  processor outside the EEA turns a paperwork question into a transfer question.

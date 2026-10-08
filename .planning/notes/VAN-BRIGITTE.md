# What is still needed from Brigitte

One list, because the open questions were spread over six sections of `TODO.md`
and nobody could tell from it what was actually blocking what. Written
2026-09-22. `TODO.md` §1 stays the long record with the history; this is the
short version, ordered by what it holds up.

**How to read the "blocks" column.** "Live" means the site shows red bracketed
text to real visitors right now. "Hidden" means a page exists but is kept out of
Google until it is filled. "Missing" means the page cannot be built at all yet.

---

## 1. Red on the live site — the most urgent

These render as red placeholder text on pages that are indexed today. Anyone,
including a prospective client, sees them. `npm run audit:placeholders` lists
them.

| What | Where it shows | Blocks |
|---|---|---|
| The price per session | `/algemene-voorwaarden`, article on fees | Live |
| When and how people pay | Same article | Live |
| Whether the practice charges btw | Same article | Live |
| The cancellation window, and what is charged for a late cancellation | `/algemene-voorwaarden`, cancellation article | Live |
| Where a client goes with a complaint she cannot resolve herself | `/algemene-voorwaarden`, article 10 | Live |
| Confirmation of the contraindication list | `/disclaimer` | Live |
| Which e-mail provider she uses, in which country, and whether data leaves the EU | `/privacyverklaring`, processor table | Live |
| How long she keeps treatment notes | `/privacyverklaring` | Live |

Notes on three of these:

- **Cancellation** is provisionally 24 hours in the code and she confirmed that
  number on 2026-08-29. What is still missing is the charge for a late one.
- **Payment** is answered in part: after the treatment, by invoice, Tikkie, iDEAL
  or cash. She asked what the transaction costs are before committing to Tikkie
  and iDEAL, and that answer is owed to her, not by her.
- **The complaints route** is really the CAT question below. It cannot be
  written until she is a member.

## 2. Blocking a page that is finished but hidden

`/over-mij` is built and noindexed. It stays out of Google until these three are
filled, because a page about who you are trusting with your body cannot open
with brackets.

| What | Shape | Blocks |
|---|---|---|
| Her story | Two or three paragraphs, her own words: what happened, what brought her to this work | Hidden |
| What a first session is actually like | What happens from walking in to walking out, in plain language | Hidden |
| Beroepsvereniging | Whether she has registered with CAT, and since when | Hidden + live |

**CAT is worth doing properly.** Membership is not a logo. It puts her under the
Wkkgz, with GAT as the state-recognised complaints body and a liability
insurance attached. That is the answer to the complaints clause in section 1, it
belongs on `/over-mij` as a trust signal, and it may set the retention period in
the privacy statement. One registration closes three open items.

## 3. Blocking pages that do not exist yet

| What | Shape | Blocks |
|---|---|---|
| Reviews | Three to five clients willing to write a few sentences, first name enough, with their permission to publish. Google reviews also work, then the page points at those | `/reviews` missing |
| Questions clients keep asking her | Five questions with her answer, the way she would explain it out loud | `/artikelen` missing |

The second one is worth more than it looks. The questions people ask her in the
room are the questions people type into Google and ask ChatGPT. Each answered
question is a page that can be found and quoted.

## 4. Images

Nothing here is blocking, and this is where the most value is left on the table.
The site currently runs on one hand-drawn illustration and a line-art portrait.

### 4a. The moodboard — what the pictures should feel like

Not a brief, just what she likes. Ten to fifteen images is plenty.

- Pictures she finds beautiful, from anywhere. Pinterest saves, Instagram saves,
  a photographed page from a book. They do not have to be about healing or
  breathwork.
- A few she actively dislikes, if any come to mind. Knowing what to avoid is
  worth as much as knowing what to aim for.
- Colours she associates with her practice, if she has a feeling about it.
- Whether people should appear in the pictures at all, or whether she prefers
  landscape, plants, texture and light.

What this is for: the site's illustrations are generated, and a moodboard is
what keeps them one family instead of seven unrelated pictures. The watercolour
hero on the `claude/hero-aquarel` branch and its prompt in
`.planning/notes/hero-aquarel.md` are the current style anchor; her moodboard
either confirms it or replaces it.

### 4b. Photographs only she can supply

| What | Why it cannot be generated |
|---|---|
| A portrait of her, any recent one, phone camera is fine | A health site that shows an invented face of its practitioner is lying about the one thing visitors are checking |
| The room she works in, if she wants to show it | Same reason, and it answers "where am I going" better than any drawing |

**A rule worth writing down.** Generated images are fine for decoration:
landscapes, plants, abstract washes. They are never used to depict her, a
client, or a treatment taking place. On a health site that crosses from
illustration into misrepresentation, and it is exactly the kind of thing that
costs trust when noticed.

## 5. Small, and only confirmation

| What | Why |
|---|---|
| Spinal Touch module 2: March 2025 or March 2026? | The certificate photo was not legible. The site currently says 2026 |
| Any other socials besides Instagram | Not blocking. The footer fills the row with Instagram, WhatsApp and e-mail |

---

## A message she can actually answer

Short, in her language, one thing per line. Not everything at once: sections 1
and 2 first, the rest when those come back.

```text
Hoi tante Brigitte,

De site staat en de meeste pagina's zijn af. Er zijn nog een paar dingen die
alleen jij kunt invullen. Stuur ze gerust als losse berichtjes of als
spraakbericht, ik zet het zelf in de goede vorm.

Het meest urgent, want dit staat nu als rode tekst op de site:
1. Wat kost een sessie?
2. Ben je btw-plichtig?
3. Als iemand te laat afzegt, bereken je dan iets? Zo ja, hoeveel?
4. Ik stuur je de lijst met contra-indicaties apart. Klopt die, en mist er iets?
5. Welke e-mail gebruik je voor de praktijk, en weet je of dat bedrijf in
   Europa zit?
6. Hoe lang bewaar je aantekeningen van een behandeling?

Voor de pagina "Over mij", die nu nog verborgen is:
7. Jouw verhaal, twee of drie alinea's in je eigen woorden: wat er gebeurde en
   wat je bij dit werk bracht.
8. Hoe een eerste sessie eruitziet, van binnenkomen tot weggaan.
9. Ben je al ingeschreven bij CAT?

En als je toekomt:
10. Drie tot vijf cliënten die een paar zinnen over hun ervaring willen
    schrijven. Voornaam is genoeg, wel met hun toestemming.
11. Vijf vragen die cliënten je steeds stellen, met jouw antwoord erbij.
12. Een foto van jezelf. Een recente van je telefoon is prima.
13. Tien tot vijftien afbeeldingen die je mooi vindt, waarvan dan ook.
    Pinterest, Instagram, een foto van een bladzijde uit een boek. Ze hoeven
    niets met ademwerk te maken te hebben. Ik gebruik ze om de stijl van de
    tekeningen op de site op jou af te stemmen.

Nog één vraag van mij aan jou: klopt maart 2026 voor Spinal Touch module 2?
Op de foto van het certificaat kon ik het jaartal niet lezen.

Liefs, Jay
```

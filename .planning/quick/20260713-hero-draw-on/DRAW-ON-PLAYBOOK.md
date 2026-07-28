# Draw-on playbook — how to make any line-art icon draw itself

_Written 2026-07-14. **Supersedes `FIX-PLAN.md` in this same folder, which is stale** — its
whole diagnosis (masks too thin, 5.8–12.7 stroke widths) has since been fixed. Read this
file, not that one._

This is the single reference for the draw-on animation: how it works, what's already wired
up, what still needs doing, and the one blocker you'll hit first.

---

## The generator: `drawtrace.py`

**It exists, and it must be rescued into the repo before anything else.** It currently lives
only in a Claude scratch dir, which is temp and gets wiped:

```
C:\Users\jaywe\AppData\Local\Temp\claude\C--Users-jaywe-...-rework\
    d32fa00c-1b8f-41b6-9c78-bf22937aadbd\scratchpad\drawtrace.py
```

Copy it to `.planning/quick/20260713-hero-draw-on/trace/drawtrace.py` and commit it. The
five older scripts in that folder (`trace.py`, `linetrace.py`, `emit_svg.py`, `classify.py`,
`preview.py`) are the *previous* centerline-only approach and cannot emit a `<mask>` — they
are superseded by this one file.

```
python drawtrace.py in.png out.svg --color "#FFFBF5" [--animate] [--order y|len]
                    [--duration 2.2] [--klass ...] [--slice]
```

### 🔑 `--animate` is the whole ballgame

- **With `--animate`** → emits fill **+ mask** → the image can draw itself.
- **Without it** → emits fill **only** → the image can *never* animate.

**This single flag is why half the images don't animate.** The portraits and Verdieping were
generated with it. The teacups, De sessie, heart and sprout were generated without it. They
don't need a new pipeline — they need a re-run with the flag on.

### Two tuning knobs, and the bugs they cause

Both current trace defects trace back to thresholds in this script, not to bad code:

- **`ink = alpha > 0.4` (line ~52) + contours at `alpha 0.5`.** Anything painted fainter
  than ~40–50% opacity is discarded outright. **This is why Verdieping's pale background
  treeline vanished completely.** Lower the threshold for art with faint passages.
- **`MIN_AREA` (line ~100)** culls small contours. **This is why Verdieping's leaves came out
  as disconnected fragments** — the small leaf outlines fall under the cull. Lower it for
  finely detailed art.

Tune per-image; don't change the defaults globally.

### Ground truth PNGs

Recoverable from git — the sources were deleted in `a74eb55`, but the blobs are still there:

```bash
git show a74eb55^:static/images/card-verdieping-bg.png > <scratch>/card-verdieping-bg.png
git show a74eb55^:static/images/card-kennismaking.png  > <scratch>/card-kennismaking.png
git show a74eb55^:static/images/card-sessie.png        > <scratch>/card-sessie.png
git show a74eb55^:static/images/heart.png              > <scratch>/heart.png
git show a74eb55^:static/images/sprout.png             > <scratch>/sprout.png
```

Extract to a scratch dir. **Do not re-add the PNGs to the repo** — dropping the raster
payload was the entire point of `a74eb55`.

---

## How the animation works

Two layers in one SVG. The **fill** is the real artwork (variable-width brush strokes, the
thing the reader actually sees). The **mask** is a skeleton of uniform-width strokes that
gates *when* the fill becomes visible. Animating `stroke-dashoffset` on the mask's strokes
from 1 → 0 wipes the mask open, and the artwork appears to draw itself.

```svg
<svg class="lt lt-draw-host" viewBox="0 0 1641 895" fill="none" aria-hidden="true">
  <defs>
    <mask id="dm79407">
      <g class="lt-draw" stroke="#fff" stroke-linecap="round" stroke-linejoin="round">
        <path pathLength="1" stroke-width="24" d="..."/>   <!-- one per skeleton stroke -->
      </g>
    </mask>
  </defs>
  <path fill="#696857" mask="url(#dm79407)" d="..."/>      <!-- the real artwork -->
</svg>
```

Non-negotiable details:

- **`class="lt-draw"` on the `<g>` inside the mask.** `DrawOn.svelte`'s CSS targets
  `.lt-draw path`. Wrong class → no animation, silently.
- **`pathLength="1"` on every mask path.** Normalises every path to one dash regardless of
  its true length, so a single `stroke-dashoffset: 1 → 0` keyframe drives all of them.
- **Mask stroke must be at least as thick as the ink it reveals.** A skeleton runs down the
  *middle* of a brushstroke; any ink wider than the mask stroke is clipped permanently —
  not just during the animation. Overshooting is free (a mask wider than the fill reveals
  nothing extra), so bias generously. Current working values are 17–135 units. **This was
  the original bug and it is fixed — don't reintroduce it by tuning the masks tight.**
- **`stroke-linecap`/`stroke-linejoin: round`** or joins notch the reveal.
- **A filled path cannot be drawn on.** Fill-only SVGs (no mask) will never animate.

## What `DrawOn.svelte` already handles — don't rebuild it

`src/lib/components/ui/DrawOn.svelte` takes a raw SVG string and:

- **Uniquifies every `id`** per instance via `$props.id()`. The About portraits are inlined
  twice (desktop + mobile markup, both in the DOM, one hidden by media query) and would
  otherwise collide on `<mask id>`, cross-wiring one portrait's art to the other's mask.
  **This bug is fixed. Do not "fix" it again.**
- **Arms from JS, not CSS.** No-JS / crawler / prerendered HTML → no dash offset → fully
  drawn art. JS present → `armed` hides the strokes, IntersectionObserver sets `drawn` on
  entry. Failure mode is "no animation", never "blank box". Keep it that way — it's an SEO
  requirement, the initial HTML must contain finished art.
- **Bails on `prefers-reduced-motion`**, in both the script and the CSS.
- **`display: contents`**, so the inlined `<svg>` lands in exactly the box the `<img>` used.

Consuming it is two lines:

```svelte
import artSvg from '$lib/images/whatever.svg?raw';
<DrawOn svg={artSvg} class="some-positioning-class" />
```

Note the `?raw` — the SVG must be inlined as text. A `<img src="...svg">` can never
animate, because its internals aren't in the document.

---

## Current wiring

| Image | File | How it renders now | Animated? |
|---|---|---|---|
| About portrait 1 | `src/lib/images/about-portrait-1.svg` | `OverMij.svelte` → `DrawOn` | ✅ |
| About portrait 2 | `src/lib/images/about-portrait-2.svg` | `OverMij.svelte` → `DrawOn` | ✅ |
| Verdieping card | `src/lib/images/card-verdieping-bg.svg` | `WerkwijzeCard` **outline** → `artSvg` → `DrawOn` | ✅ |
| Kennismaking (teacups) | `static/images/card-kennismaking.svg` | `WerkwijzeCard` **filled** → `imgSrc` → plain `<img>` | ❌ |
| De sessie (seated woman) | `static/images/card-sessie.svg` | `WerkwijzeCard` **filled** → `imgSrc` → plain `<img>` | ❌ |
| Heart | `static/images/heart.svg` | `AboutStat` → `iconSrc` → plain `<img>` | ❌ |
| Sprout | `static/images/sprout.svg` | `AboutStat` → `iconSrc` → plain `<img>` | ❌ |
| Infinity | `static/images/infinity.png` | `AboutStat` → plain `<img>` | ❌ (still a PNG — **not in scope**) |

`WerkwijzeCard.svelte` only accepts `artSvg` on the **outline** variant. Kennismaking and
De sessie are **filled** variants, which hard-code a plain `<img src={imgSrc}>` into the
`.wcard__img` slot. Same for `AboutStat.svelte` and `iconSrc`. Both components need a
`DrawOn` path adding before their images can animate — **the SVG being correct is necessary
but not sufficient.**

---

## The work, in order

### 1. Rescue `drawtrace.py` into the repo
It only exists in a temp scratch dir that gets wiped. Copy it in and commit it **first**, or
you may lose the tool mid-task and be back to square one.

### 2. Fix Verdieping (`card-verdieping-bg.svg`) — worst offender
Already wired to `DrawOn`; no component change needed. The **trace** is what's degraded.
Against `card-verdieping-bg.png`: leaf outlines have disintegrated into disconnected dashes,
branch lines are broken instead of continuous, and the faint background treeline behind the
main tree is **missing entirely**.

Both defects are threshold bugs, not code bugs — see the two tuning knobs above. Lower the
alpha threshold (recovers the pale treeline) and `MIN_AREA` (recovers the small leaves), then
re-run with `--animate`.

### 3. Kennismaking (teacups) — re-trace **and** rewire
- **Trace:** re-run **with `--animate`** (it's fill-only today, hence no animation). The cups
  themselves are faithful, but the steam is wrong — the original has two long curling wisps;
  the current has one fragmented curl and one truncated stub. Likely the same `MIN_AREA` /
  alpha cull as Verdieping, since the steam is thin and pale.
- **Wiring:** `WerkwijzeCard`'s **filled** variant must accept `artSvg` and route it through
  `DrawOn`. Today it hard-codes a plain `<img src={imgSrc}>`.

### 4. De sessie (seated woman) — re-trace with `--animate`, then rewire
⚠️ **The missing face is NOT a bug.** She has her back turned. That is the intended design.
Do not "fix" it, do not add facial features. The trace is faithful.

It's fill-only, so: re-run with `--animate`, then the same `WerkwijzeCard` filled-variant
change as Kennismaking (one change covers both cards).

### 5. Heart + sprout — re-trace with `--animate`, add `DrawOn` to `AboutStat`
Both trace faithfully and need no threshold tuning — they are simply **fill-only**, so they
cannot animate. Re-run both with `--animate`, then give `AboutStat.svelte` a `DrawOn` path
alongside its current plain-`<img>` `iconSrc`.

Only heart and sprout. **Leave infinity alone** — it's still a PNG and is out of scope.

---

## Out of scope — do not touch

- **The Diensten / services section** (`card-mahatma-healing.svg`, `card-goldhealing.svg`,
  `card-spinal-touch.svg`). That section is **unfinished and buggy**. Its images trace fine,
  but nothing there should be animated or repaired until the section itself is built.
- **The infinity icon.** Still a PNG. Not being animated.
- The logo (`static/trinity-logo.svg` + `NavLogo.svelte`) — already verified good.
- Slice 1 / Tailwind / shadcn work.

## Verification

Rasterise each fixed SVG with the draw-on forced to its finished state (strip
`stroke-dashoffset`, or just set it to 0) and diff against the restored PNG. The repo has
Playwright + headless Chromium; use it. Check desktop (1440×900) and mobile (390).

Then check in the **running site**, not just standalone — some bugs (id collisions,
positioning) only appear once the SVG is in a real document alongside its twin:

- strokes animate on scroll-in, dashoffset lands at 0, art is **complete at rest**
- `prefers-reduced-motion` skips the animation and shows finished art
- no-JS path shows finished art (view source: initial HTML must contain the drawn art)

Gates: `npm run test`, `npm run check` (0 errors).

**Green tests ≠ correct render — look at the page.** This project has already shipped a bug
where unit tests, `svelte-check`, and the build were all green while the site was visibly
broken.

## Commits

**Do not commit.** Report back — commits need the user's explicit sign-off, with the message
proposed up front in Conventional Commits format.

---

## The source PNGs are NOT lost — recover them from git history

Added 2026-07-28. Two separate sessions concluded the source artwork was gone and that the
traces therefore could not be regenerated. That is wrong, and it blocked real work twice.

`a74eb55 feat(images): vectorise the line art` deleted the source PNGs from `static/images/`
when the SVGs replaced them. Deleted from the working tree is not deleted from history. Every
one is still reachable, byte for byte:

```sh
mkdir -p /tmp/orig
git cat-file -p 7b4b6156a7ce11391240a22b43f1e870bb4b50c5 > /tmp/orig/card-kennismaking.png   # 1000x1084
git cat-file -p 99befda60e0213c3873e5dec1d343d19187c73f8 > /tmp/orig/card-sessie.png          # 1000x1084
git cat-file -p 0dc4e326174ec50a3f04c28b56e792688183d54e > /tmp/orig/card-verdieping-bg.png   # 1641x895
git cat-file -p 709ea9d81177066c24b1259d77a8ec0fc9f447d8 > /tmp/orig/about-portrait-1.png     # 1060x1580
git cat-file -p 9bb6bbad8782c689d8767569c9d9831695db8e86 > /tmp/orig/about-portrait-2.png     # 265x395
git cat-file -p 56e046aa65d84e95738b78ce1cf455448eebbc30 > /tmp/orig/about-icon-heart.jpg
git cat-file -p d058ffe9a5e3530f7d9ed05f4fc8a25bd9822f76 > /tmp/orig/about-icon-sprout.jpg
```

Confirmed genuine: each PNG's pixel dimensions match its SVG's `viewBox` exactly.

To find any other deleted binary later, don't trust the working tree:

```sh
git rev-list --all --objects | grep -Ei '\.(png|jpg|webp)$' | while read sha path; do
  echo "$(git cat-file -s "$sha") $sha $path"
done | sort -rn | head -30
```

They are deliberately not re-committed — the repo does not need 1.5 MB of raster source in the
tree when one command recovers it. This section is the substitute for that, so record any new
SHA here rather than relying on someone thinking to look.

## Known quality gap in the current traces

Compared against the recovered originals on 2026-07-28, the traces are visibly cruder:

- stroke weight is heavier and varies along a line, where the original is an even hairline
- every intersection carries a small diamond-shaped blob
- lines that pass behind other objects come out fragmented rather than continuous
- one steam wisp in the teacups is broken outright
- the Verdieping canopy has a spurious closed contour, and detached leaf fragments sit
  unconnected at the far left

The visible artwork is the compound **fill** path, not the mask strokes — so this is fill-trace
quality, and re-running `drawtrace.py` with tuned thresholds is what would move it.

Worth considering before retracing: the draw-on only needs the *mask* strokes to be
approximate. The fill could instead be the original raster, masked by the traced strokes,
which would be pixel-exact to the artwork and keep the animation. The Verdieping PNG is 890 KB
raw but renders at roughly 400 px wide, so a resized WebP would likely be smaller than the
87 KB SVG it replaces.

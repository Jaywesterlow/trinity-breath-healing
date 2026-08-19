# Research — why the Werkwijze pan stutters

Date: **2026-07-25**
Status: **findings only, nothing implemented**

Supersedes the performance reasoning in `RESEARCH-werkwijze-scroll.md`. The pin architecture
in that document is correct; how the pan is *driven* is not.

---

## The cause

The pan is driven by a JavaScript `scroll` listener. That is janky by construction, not by
degree, and no amount of tuning the handler fixes it.

Scrolling is performed by the **compositor thread**. The `scroll` event is delivered to the
**main thread** asynchronously, after the compositor has already moved the page. Firefox's
own performance docs state it plainly: the visual scroll position is updated in the
compositor and is visible to the user *before* the scroll event is fired on the main thread,
so the main thread is typically a frame behind. Anything positioned from that event lands
late.

In this section that means:

- `.werkwijze__sticky` is pinned by the compositor. It is always exactly right.
- The card track's `translateX` is computed on the main thread from a stale scroll position.
  It is always at least one frame late.

So the cards are perpetually offset against a frame that is perfectly still.

### Why this matches the reported symptom exactly

The lag is a function of scroll *velocity*, and the error the eye sees is the change in that
lag frame to frame:

| moment | velocity | visible result |
|---|---|---|
| section enters view | accelerating | error growing → judder |
| pan starts / fling begins | sharp acceleration | error jumps → worst judder |
| mid-pan, steady scroll | roughly constant | error constant → **looks smooth** |
| end of pan / fling decays | decelerating | error shrinking → judder returns |

A constant lag is invisible. A *changing* lag is what reads as stutter. That is why it is bad
at both ends, better in the middle, and identical in both scroll directions.

### It is not main-thread work

Measured phase by phase at 6× CPU throttle, paint per frame:

| phase | ms/frame |
|---|---|
| ordinary scrolling elsewhere on the page | 3.50 |
| entry | 2.68 |
| **the pan itself** | **0.76 – 0.94** |
| exit | 2.57 |

The pan is the cheapest thing on the page and entry/exit are cheaper than ordinary scrolling.
There is no work problem to find here. The problem is *timing*, and the earlier fixes in this
branch — caching the layout read, dropping the per-frame custom property, scoping the
compositing layer — each removed real waste but could never address it. They were treating a
synchronisation defect as a throughput defect.

## The fix: drive the pan from CSS, not from JS

CSS scroll-driven animations exist for precisely this problem. A `view-timeline` on the tall
pin, with the track's transform bound to it, runs **on the compositor**, in lockstep with
scrolling, with the main thread uninvolved. Chrome's own case study demonstrates the CSS
version staying smooth while a deliberately main-thread-hogging script runs, where the
classic JS version collapses.

The canonical shape (Bramus Van Damme's reference demo, adapted from Cameron Knight):

```css
@keyframes werkwijze-pan {
  to { transform: translate3d(calc(-1 * var(--travel)), 0, 0); }
}

.werkwijze__pin {          /* the tall spacer */
  view-timeline-name: --werkwijze-pin;
  view-timeline-axis: block;
}

.werkwijze__sticky { position: sticky; top: 0; height: 100svh; }

.werkwijze__cards {        /* the track */
  animation: werkwijze-pan linear forwards;
  animation-timeline: --werkwijze-pin;
  animation-range: contain 0% contain 100%;
  will-change: transform;
}
```

`--travel` stays a JS measurement, but it is written **once** on mount and on resize — never
per frame. All the per-frame work disappears: no scroll listener, no `getBoundingClientRect`,
no inline style writes, no `progress` state.

### Support, and what the fallback has to be

| engine | status (July 2026) |
|---|---|
| Chrome / Edge | 115+, composited |
| Safari | 26+ has the feature; **threaded** only from 26.4 — 26.0–26.3 run it on the main thread and will still judder |
| Firefox | still behind `layout.css.scroll-driven-animations.enabled` as of 152 |

Roughly 84% global support. `@supports (animation-timeline: view())` gates it.

**The fallback should not be the current JS pin.** Keeping it means keeping the stutter for
everyone who lands on the fallback. The honest fallback is the native `overflow-x: auto`
snap slider already in the file for `data-scroll-mode="native"` — a plain swipeable carousel,
smooth because the browser scrolls it natively. Worse effect, no jank.

**Open question for the owner:** which phone and browser is this being tested on? If it is an
iPhone below Safari 26.4, the CSS route will help less than expected, and there is a second
consideration below.

## Second-order: `position: sticky` on iOS

Independent of how the pan is driven, iOS Safari has long-standing sticky bugs during
momentum scrolling — sticky elements trailing the scroll by a few pixels and snapping back,
and reacting badly to sudden direction changes. `window.scrollY` has also been reported to
stop updating during fast flings on iOS.

If the test device is an iPhone, some residual judder may be the sticky element itself and
not the pan at all. Worth confirming the device before assuming the CSS switch is a complete
fix.

---

## Everything else wrong with this section

Found while auditing. Ordered by severity.

### 1. Landscape and short viewports are broken — confirmed

At 844×390 the pinned content is **577px tall inside a 390px sticky box**, a 187px overflow.
Screenshotted: the heading is cut off at the top, the cards run off the bottom, and two cards
sit side by side because the centring maths assumes a portrait-width viewport.

The mobile gate is `(max-width: 1023.98px)`, which a landscape phone satisfies. The pin should
also require enough height to hold its content — or the breakpoint should be reconsidered.

### 2. The clip sits on the wrong element

`.werkwijze` carries `overflow-x: clip`. It works (verified: the sticky does pin, top 0 → 0).
But the reference pattern puts the clip on the **sticky wrapper**, which never moves, and
leaves the section `overflow: visible`. The section is also the element most likely to be
"tidied" back to `overflow: hidden` by someone later, which silently kills sticky. Moving the
clip to `.werkwijze__sticky` removes that trap entirely.

### 3. Card images have no dimensions or decode hints

`<img>` for the card art carries no `width`, `height`, `decoding` or `loading`. The CSS fixes
the box so layout shift is unlikely, but intrinsic dimensions in the markup are the guard
against CLS, and `decoding="async"` keeps the decode off the critical path. Free wins on a
project whose stated primary metric is Core Web Vitals.

### 4. `-webkit-overflow-scrolling: touch` is dead

No-op on modern iOS, and meaningless once the track stops being a scroll container. Remove.

### 5. `gap` and `padding-inline` resolve against different bases

`padding-inline: calc((100% - 17.625rem) / 2)` resolves against the flex container's content
box; `gap: max(..., calc((100vw - 17.625rem) / 2 + ...))` resolves against the viewport. An
existing comment records that this mismatch already caused one bug. They should share one
basis, and the card width should be a token rather than `17.625rem` repeated in both.

### 6. `update()` freezes progress instead of clamping it

`if (!near) return;` leaves `progress` at its last value when the section goes out of
proximity, rather than resolving to 0 or 1. Harmless today because the margin is a full
viewport, but it is a state machine that can be left mid-way. Moot if the CSS route lands.

### 7. Dead code

`WerkwijzeCard` still imports `DrawOn` and branches on `artSvg`, which nothing passes any
more. Keep the branch only if the draw-on restoration is genuinely next; otherwise it is a
path no test covers.

### 8. A stale comment — mine

The comment above `<ul class="werkwijze__cards">` still explains that descendants are "three
inlined SVG traces totalling ~490 `<path>` elements". They are `<img>` elements now. The
reasoning it records is still correct in general, but the specifics are wrong.

---

## Sources

- [Scroll-linked effects — Firefox Source Docs](https://firefox-source-docs.mozilla.org/performance/scroll-linked_effects.html)
- [A case study on scroll-driven animations performance — Chrome for Developers](https://developer.chrome.com/blog/scroll-animation-performance-case-study)
- [Animate elements on scroll with scroll-driven animations — Chrome for Developers](https://developer.chrome.com/docs/css-ui/scroll-driven-animations)
- [Horizontal scrolling section with view-timeline — scroll-driven-animations.style](https://scroll-driven-animations.style/demos/horizontal-section/css/)
- [A practical introduction to scroll-driven animations — Codrops](https://tympanus.net/codrops/2024/01/17/a-practical-introduction-to-scroll-driven-animations-with-css-scroll-and-view/)
- [Scroll-driven animations — Web platform features explorer](https://web-platform-dx.github.io/web-features-explorer/features/scroll-driven-animations/)
- [Scroll event flicker on position:sticky in Safari iOS — ampproject/amphtml#18469](https://github.com/ampproject/amphtml/issues/18469)
- [Avoid non-composited animations — Lighthouse](https://developer.chrome.com/docs/lighthouse/performance/non-composited-animations)

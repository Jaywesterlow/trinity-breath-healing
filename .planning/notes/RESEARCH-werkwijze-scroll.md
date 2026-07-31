# Research — Werkwijze mobile horizontal scroll

Date: **2026-07-25**
Status: **proposal, not implemented**

## The bug

On mobile, a flick past the Werkwijze section carries the viewport straight through it.
The cards barely move.

## Why the current code cannot be patched into working

`Werkwijze.svelte` implements a **scroll lock**: on a trigger crossing it sets
`phase = 'locked'`, attaches `wheel` / `touchstart` / `touchmove` / `keydown` listeners,
calls `preventDefault()` on each, and drives `cardsEl.scrollLeft` by hand. Vertical scroll
is frozen via `body { overflow: hidden }` plus an `html.werkwijze-locked` class.

That works on a mouse wheel. It cannot work for a touch fling, for a reason that is not a
bug in our code:

- On iOS, `preventDefault()` only suppresses scrolling **while the finger is down**. Once
  `touchend` fires, the momentum ("fling") animation belongs to the OS compositor. There is
  no event left to cancel — `preventDefault()` on `touchend` is documented as having no
  effect on scrolling.
- Since iOS 15, `preventDefault()` on `touchmove` is itself unreliable for blocking page
  scroll.
- `body { overflow: hidden }` does not stop a fling that is **already in flight**, and on iOS
  it is a weak lock generally (the reliable form needs `position: fixed` + scroll-offset
  restore, which introduces its own jump).

So the failure is structural: the lock engages *mid-fling*, and the fling it is trying to
stop is no longer cancellable. Adding more handlers, timers, or `overscroll-behavior` on top
would grow the file without fixing the cause.

## Proposed architecture: sticky pin + tall spacer

Stop fighting the scroll. Map it instead.

1. The section gets a deliberately **tall** height — one viewport plus the horizontal
   distance the card track needs to travel.
2. An inner wrapper is `position: sticky; top: 0; height: 100vh`. It visually holds still
   while the page scrolls through the tall section.
3. Scroll progress through the pin (0 → 1) maps to the track's `translateX` (0 → -maxOffset).

Native scroll is never blocked, never cancelled, never re-implemented. A fling does exactly
what the user expects: it advances progress faster. Momentum stops being an adversary.

This is the standard horizontal-scroll-section pattern (what GSAP ScrollTrigger's `pin`
does), and it is what the NN/G scrolljacking critique explicitly exempts: scroll distance
stays 1:1 with finger travel, so the gesture keeps its normal weight.

### Implementation

Preferred, no JS:

```css
@supports (animation-timeline: scroll()) {
  .werkwijze__track {
    animation: werkwijze-pan linear both;
    animation-timeline: scroll(root block);
    animation-range: contain;
  }
}
```

Fallback for browsers without scroll-driven animations (Firefox stable still has it behind
`layout.css.scroll-driven-animations.enabled` as of 152 / June 2026; global support ~84%):
one `scroll` listener, rAF-throttled, that reads the pin's `getBoundingClientRect()` and
writes a single `--progress` custom property. The CSS is identical in both paths — only the
source of `--progress` differs.

### What this deletes

`onWheel`, `onTouchStart`, `onTouchMove`, `onKeydown`, `applyDelta`, `engageLock`,
`releaseLock`, `releaseLockListeners`, `checkTriggerCrossing`, `onTriggerScroll`, the
four-state `phase` machine, the `body.overflow` hijack and the `html.werkwijze-locked`
class. Roughly 230 lines of imperative scroll code collapse to a height rule, a sticky
rule, and one progress value.

### Behaviour notes

- The vertical scrollbar keeps advancing while the cards pan. Correct: the page really is
  scrolling. Keyboard, screen readers, and browser find-in-page all keep working, which the
  lock had to special-case.
- Reduced motion / desktop: skip the tall height and the sticky entirely, fall back to the
  existing static row (desktop) and native snap slider (mobile). Same gate as today.
- No-JS: the CSS-only path still animates; if neither path runs, the track stays a native
  `overflow-x: auto` snap slider. Every card remains in the initial HTML either way, so
  prerendered output and crawlers are unaffected.

## Sources

- [Handling Events — Safari Web Content Guide (Apple)](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/HandlingEvents/HandlingEvents.html)
- [How to prevent scrolling the page on iOS Safari 15 — Pqina](https://pqina.nl/blog/how-to-prevent-scrolling-the-page-on-ios-safari/)
- [preventDefault on touchmove not preventing scrolling on iOS — React #20999](https://github.com/facebook/react/issues/20999)
- [Scrolljacking 101 — NN/G](https://www.nngroup.com/articles/scrolljacking-101/)
- [Ditch the Carousel: Creating a Horizontal Scroll Effect](https://medium.com/@lucas.eckman/ditch-the-carousel-creating-a-horizontal-scroll-effect-7a36c0f1c456)
- [CSS scroll-driven animations — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations)
- [Scroll-driven animations — Web platform features explorer](https://web-platform-dx.github.io/web-features-explorer/features/scroll-driven-animations/)

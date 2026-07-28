# Breadcrumbs

Durable lessons worth carrying to other projects. Not a changelog and not a task list — those
live in `HANDOFF.md` and `.planning/notes/KNOWN-ISSUES.md`.

**Inclusion test:** would this have saved hours if I had known it at the start, on a *different*
project? If it is specific to Trinity, it does not belong here.

Each entry: what was decided, why, and how to spot the same situation again.

Last updated **2026-07-27**.

---

## Motion & animation

### Never drive a scroll-linked effect from a JS scroll listener

**The single most expensive lesson of the project.** A section pinned on scroll juddered, and
three rounds of optimisation did nothing, because all three treated it as a throughput problem.

Scrolling runs on the **compositor thread**. The `scroll` event reaches the **main thread** a
frame later. Anything positioned from that event is positioned from a stale offset, while
compositor-owned things around it (a `position: sticky` frame) are exactly right.

The signature is diagnostic: **a constant lag is invisible; a changing lag is what the eye reads
as stutter.** So it judders on entry, on fling, and on the run-out, and looks fine mid-scroll at
steady speed. If a user describes exactly that pattern, stop optimising and change the mechanism.

Profiling confirmed it was never work: the pan cost 0.8ms of paint per frame against 3.5ms for
ordinary scrolling elsewhere on the same page. It was the cheapest thing on the page and still
stuttered.

**Use CSS scroll-driven animations.** A `view-timeline` on the pinned element with the transform
bound to it over `animation-range: contain 0% contain 100%` runs on the compositor and cannot
drift. For a subject taller than the scrollport, `contain` spans exactly the period it covers
the viewport — which is exactly when a `sticky` child is stuck, so the two align with no shared
measurement and nothing to keep in sync.

Support in mid-2026: Chrome/Edge 115+, Safari 26+ (threaded only from 26.4), Firefox still
flagged. **The fallback must not be the JS version** — that hands the stutter to whoever lands
on it. Fall back to something natively smooth, e.g. a normal scroll-snap carousel.

### You cannot block a touch fling

On iOS, `preventDefault` only suppresses scrolling **while the finger is down**. Once `touchend`
fires the momentum belongs to the OS compositor and there is no event left to cancel. Any design
that says "freeze the page and drive it myself" is structurally broken on touch, regardless of
how well it works on a mouse wheel.

The way out is to stop fighting scroll and **map it**: make the section taller than the viewport,
stick its content, and derive progress from how far it has scrolled through. Momentum stops being
an adversary and becomes the input.

### Above the fold and below the fold need opposite techniques

Both aim at the same guarantee: **content must never be left hidden if the script fails.**

- **Below the fold:** arm the hidden state *from JavaScript*. The server-rendered HTML always
  shows finished content, so the failure mode is "no animation" rather than "no content". Safe
  because the element is offscreen at the moment it is armed.
- **Above the fold: invert it.** That reasoning collapses — the hero is painted long before
  hydration on a phone, so arming it afterwards shows the content, blanks it, and fades it back
  in. Use a **pure CSS** animation, in force from the first frame. `animation-fill-mode: backwards`
  is what makes it work for delayed elements: it applies the keyframe's start state *during* the
  delay, so an element with a 400ms delay is hidden from frame zero rather than visible until its
  turn.

A JS-armed reveal must also **bail if the element is already in view when armed**, or a
fast-hydrating page flashes it anyway.

### An opacity-0 entrance delays LCP by exactly its delay

Chrome does not count an element as painted while its opacity is 0. So a fade-in on the LCP
element adds its delay straight onto Largest Contentful Paint.

Practical rule: **start the cascade with the element being measured.** A 0ms delay on the heading
costs nothing; a 300ms delay costs 300ms.

When a deliberate wait is wanted anyway (e.g. holding text until an illustration has drawn),
**overlap the two rather than sequencing them.** Starting at the halfway point of the first
animation halved the LCP cost and the sequencing still read correctly — the drawing was visibly
still going when the text began. Waiting for a preceding animation to *finish* is almost always
more delay than the effect needs. State the residual cost in the code and put a field check in
the handoff; don't bury it.

### Draw-on line art: the fault is usually overlap, not order

A traced "self-drawing" illustration looked like it appeared all at once rather than being
drawn. The notes blamed stroke order. The order was fine — strokes were already sorted
top-to-bottom. The fault was the **ratio**: 367 strokes staggered across 1.21s while each took
~1s to draw, so hundreds were in flight at any instant and the whole image resolved together.

The number that matters is **how many strokes are mid-draw at once** —
`strokes x stroke_duration / total_duration`. Around 10% reads as a pen moving through the
drawing. Most of them at once reads as a fade.

Related: **spatial clustering does not recover objects in line art.** Union-find over dilated
stroke bounding boxes was tried and abandoned — a long curved stroke's bounding box covers much
of the canvas, so boxes overlap across unrelated objects. Results swung from 18 clusters to 1
across a 0.5% change in the dilation constant. There is no stable object scale to find that way.
Fix the pacing instead; it is one number and it generalises.

### Fade and movement want opposite curves

Running both off one keyframe with an expo ease made an entrance read as a **fly-in** rather than
a fade. An expo ease-out is ~80% done in its first quarter, so the *movement* is what you notice.

Split them into two animations:

- **fade** — long and dominant (~1300ms), gentle curve, still visibly working a second in
- **rise** — short and subordinate (~10px), hard ease-out, settled by ~700ms and out of the way

### Nominal duration is not perceived duration

A 250ms transition on `cubic-bezier(0.16, 1, 0.3, 1)` reads as a snap, because that curve has
travelled ~80% within its first quarter — effectively over in ~100ms. If a user says "too fast"
about something that is already long, suspect the **curve**, not the number. Motion spread across
the middle (`cubic-bezier(0.4, 0, 0.2, 1)`) reads as deliberate; front-loaded motion reads as
instant however long it nominally lasts.

### `<details>`: open animates in CSS, close cannot

The instant `open` is removed, the UA stops rendering the panel — there is nothing left on screen
to collapse. `transition-behavior: allow-discrete` on `content-visibility` is *supposed* to hold
it visible, and does in Chromium, but is not honoured everywhere; where it isn't, the panel simply
vanishes.

**Reliable pattern:** intercept the click, set a `data-closing` attribute that collapses the panel
**while `open` is still set** (so it is still rendered), and drop `open` only once the transition
ends. Back `transitionend` with a timeout — it never fires if the transition doesn't start.

To animate the height at all, make the `<details>` a two-row grid and transition
`grid-template-rows` between `0fr` and `1fr`. Do **not** transition `block-size: auto`: that needs
`interpolate-size: allow-keywords`, still Chromium-only in mid-2026.

### A grid `auto` track absorbs free space — use `min-content`

With `grid-template-rows: auto 0fr`, the summary row visibly **dropped 65px and sprang back** on
every open: mid-transition the content row could not yet hold the answer, and the `auto` track
swallowed the difference. Measured: the row peaked at 129px against its natural 64px.
`min-content` does not absorb and held it steady. Any time a row that should be fixed is moving,
suspect `auto`.

### Animating a transform can break a *different* transition on the same element

Applying a reveal (transform) to an element that owns a `grid-template-rows` disclosure left the
disclosure unable to run its close. Animating transform promotes the element to its own
compositing layer for the animation's duration, and that promotion was enough. Fix was `distance:
0` — fade only, no transform — on that specific element.

Generalises to: **before adding an animation to an element, check what animations it already
owns.**

### Prefer Web Animations over inline `style.transition`

`transition` is a single property. Setting it inline **replaces** whatever transition the element
already had — which is how a generic reveal action silently broke a component's own disclosure
animation. `element.animate()` composites separately and clobbers nothing.

### Clean up inline styles after an animation

A leftover `transform` makes the element a **containing block for any `fixed` or `sticky`
descendant**, so a stray one silently breaks sticky positioning elsewhere in the tree. Remove
every inline style on finish, and back the cleanup with a timeout.

---

## Layout traps

### `overflow: hidden` on an ancestor kills `position: sticky`

It makes the ancestor a scroll container, so the sticky element sticks relative to a box that
never scrolls — i.e. does nothing. Use **`overflow-x: clip`**, which clips identically without
creating a scroll container. This looks like a pointless distinction and is not; comment it, or
someone will "simplify" it back.

### The clip must never live on the element being transformed

An element's overflow clip is part of the element, so translating it drags the clip along: the
window slides away as a rigid unit, the first item exits, and the rest stay clipped forever.
Put the clip on a **static ancestor**.

Worse, this passes every geometry assertion — `getBoundingClientRect` knows nothing about
ancestor clipping, so items measure as "in the viewport" the entire time they are invisible. Test
it **structurally** (assert the transformed element's computed `overflow` is `visible`), not
positionally.

### `scrollWidth - clientWidth` only works on a scroll container

Once an element stops being one, it reports 0 — so any re-measure after the mode change silently
collapses the value to nothing, typically on resize or rotation. Measure geometry that is true in
both states, e.g. the offset delta between the first and last child.

### Gate a viewport-dependent layout on height too, not just width

A landscape phone satisfies `max-width: 1023.98px` and then puts 577px of content into a 390px
sticky box — heading cropped, content spilling. If a layout pins content into a viewport-sized
box, **height is a condition**, not an afterthought.

---

## Assets & build

### Generated SVG must be valid XML — the HTML parser hides that it isn't

Seven of eight generated trace files were missing `</mask>`. Inlined into a page, the HTML parser
silently repairs it, so it was invisible indefinitely. Referenced as `<img src>` or a CSS `url()`,
a strict XML parse fails and renders **nothing** — with no error beyond a zero intrinsic size.

**Validate generated SVG as XML in the generator**, and fix the generator, not just its output.

### Inline SVG is not automatically the right call

A `<mask>` built from hundreds of stroked paths is live DOM the browser must rasterise into an
alpha surface every time that element's layer is re-rastered — punishing on the one part of a page
that moves during scroll. As an `<img>` it rasterises once and the pan becomes a texture move.
Switching three of them also removed **129 KB from the prerendered HTML**.

Inline only buys something when the paths must be **individually animated or styled from the host
page's CSS**. Otherwise `<img>` is cheaper on every axis.

### Svelte prunes CSS it cannot statically match

Rules keyed on an attribute set imperatively (`data-closing`) were **silently dropped from the
build** — the behaviour reverted with nothing in the source to explain why. Wrap the dynamic part
in `:global(...)`.

**Check:** after adding any rule that depends on a runtime-set attribute or class, grep the built
stylesheet to confirm it survived. This passes type check, lint and build.

---

## Method

### Measure before changing — then check the measurement measures the right thing

Three "fixes" in a row failed because the problem was misclassified as throughput when it was
timing. Phase profiling (bucketing trace events by animation phase, normalised **per frame**)
settled it in one run.

Equally important: a measurement that appears to confirm success is worth more scrutiny than one
that fails. An A/B of an LCP change came back as "no difference" — because first paint in that
container was ~13s and swamped the 2.86s effect entirely. **That noise was not evidence the change
was harmless**, and reporting it as such would have been worse than reporting nothing.

Know what your environment cannot measure, and say so plainly instead of implying you checked.

### Pixel-diff to prove a change is visually inert

Twice, a change that "shouldn't" alter appearance needed proof: swapping inline SVG for `<img>`,
and adding a wrapper element for an animation delay. Screenshot before and after, diff per pixel,
report the count. **Zero differing pixels** is an answer; "should be fine" is not.

When a diff is non-zero, look at *where*: differences confined to stroke edges are antialiasing
from a different rasterisation path; a displacement shows up as doubled or shifted silhouettes.

### Tests must assert the mechanism, not just the outcome

Three separate bugs here passed build, type check, lint and every existing assertion:

- clipped-but-positioned elements (geometry passes, nothing visible)
- pruned CSS (the rule is simply absent)
- a summary row that jumped and returned (final state is correct)

For each, the test that catches it asserts **structure or intermediate state**: computed
`overflow`, distinct intermediate heights during a transition, a single distinct value for a row
that must not move.

### Don't put a slow verification loop inside a delegated task

A subagent spent 85 minutes and 244 tool calls because its spec required Playwright verification
on every iteration, and each round meant a full build + preview + browser cycle. The work itself
was minutes.

- Give delegated tasks **fast** checks (type check, lint, unit) and keep slow end-to-end
  verification for the orchestrator, once.
- A subagent's report is **input, not verdict** — one reported a task blocked on Playwright that
  turned out to be a browser-version mismatch in the container, not a code problem.
- Don't idle-poll a running agent. Either let it finish or take the work over.

### Delegate by size, not by principle

A one-word copy change or a two-line CSS fix costs more to delegate than to do. Delicate debugging
where the orchestrator already holds the context is usually faster inline. Everything larger:
delegate, with an exact contract — file paths, names, what to leave alone, what to run, and an
instruction not to commit.

### When a user says "it's still wrong", believe them over your own green checks

Several times a change was verifiably correct in this container and wrong on the user's device:
`content-visibility: allow-discrete` honoured here and not there; GPU raster costs invisible to a
headless browser. Environment parity is an assumption, and it is usually the wrong one.

### A dash-hidden SVG stroke needs margin, not exactness

The standard draw-on trick is `pathLength="1"` + `stroke-dasharray: 1` + `stroke-dashoffset: 1`,
animated to offset 0. One dasharray value means *dash 1, gap 1*, so offset 1 parks the gap
exactly over the path — the hidden state is correct to the last unit and has **no tolerance**.

Engines scale that pattern from `pathLength` back to the path's real length in user units, and
that division rounds. WebKit's rounding leaves a sub-pixel sliver of dash on the path; Chromium's
happens to land the other way. A sliver is invisible on its own — except these strokes are
`stroke-linecap="round"`, and a round cap paints a **full-width dot at each end of any dash,
however short**. At mask stroke widths up to 22px that is a visible speck per stroke: a scatter
across one card, an entire tree canopy on another.

Fix is `stroke-dasharray: 1 1.1` — an explicit gap 10% longer than the path. The path sits clear
of the pattern by a margin orders of magnitude larger than the rounding error, and at offset 0 the
dash still covers it exactly, so the finished drawing is byte-identical.

Generalises: **any hidden state defined by exact geometric cancellation is one rounding mode away
from leaking.** Give it slack. Cheap insurance here was also arming with `stroke-opacity: 0` and
restoring it on draw, so the pre-draw frame is blank independent of dash maths entirely.

### To debug a transient state, freeze it — don't try to catch it

The bug lived in the frame *before* an animation starts, which is unscreenshottable by hand: by
the time you scroll to it and capture, it has drawn. A three-line temporary in the component
(`const FREEZE_UNDRAWN = true; if (FREEZE_UNDRAWN) return;`) held the armed state open
indefinitely, pushed to the preview, and made the frame available to inspect at leisure on a real
device. Commit it as its own `temp:` commit so reverting is one command.

### Only Chromium is installed in this container

Playwright is available and screenshots work, but `/opt/pw-browsers` has chromium only — no
WebKit, no Firefox, and `playwright install` is off-limits here. So a WebKit-specific rendering
bug **cannot** be reproduced locally at all. When a visual bug doesn't reproduce, rule this out
before doubting the report: the user's phone is the only WebKit available.

### A draw-on animation has two independent knobs: order and pacing

Both were wrong on the traced card art, and each produces a different complaint.

**Order** decides whether it reads as drawing or as printing. A top-to-bottom sort is a
scanline — a horizontal band of progress sweeping down, filling in whatever it passes — and on
a tree it draws every leaf *before* the branch it hangs from. The fix is a greedy
nearest-neighbour walk from an anchor: the pen finishes what it is next to before moving on.

That also quietly solves the object-grouping problem that bbox clustering failed at. **The
strokes of one object are each other's nearest neighbours**, so leaves, cups and limbs complete
as units without the script ever deciding where an object ends. Pick the anchor as the point the
subject grows from — trunk base, foot of the near cup — and the order becomes narrative for
free: the tree grows and the path then unwinds away from its base.

**Pacing** decides whether it reads as a pen. Equal duration per stroke is wrong whenever stroke
lengths vary: on the tree, 51% of strokes are under 30px but carry 13% of the ink, so half the
animation was spent on stipple while an 894px line was rushed through in the same 0.26s. Make
duration and start time proportional to length — constant pen speed — with a floor, because a
2px stroke with a 22px round cap is still a visible mark and needs a beat to arrive.

### Render a filmstrip before shipping an animation

Eight frames of the same SVG side by side, each with `getAnimations()` paused at a different
`currentTime`, is a few lines of Playwright and shows the whole timeline at a glance. It caught
the leaves-before-branches ordering instantly — something no still frame and no amount of
reading `--t` values would have surfaced. Cheaper than a deploy cycle, and reviewable by the
user without waiting for one.

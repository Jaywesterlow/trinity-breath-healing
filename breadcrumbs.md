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

### What makes an animation feel fast is concurrency, not duration

Measured the hero against the card art after "it takes too long to draw":

| | strokes | total | drawing at once |
|---|---|---|---|
| hero | 372 | 2.86s | **84** |
| tree (constant pen speed) | 367 | 3.40s | **10** |

Nearly the same wall-clock, opposite feel. With ~10 strokes moving you watch a point crawl around
the drawing and you are *waiting*; with ~84 the image resolves everywhere at once and is legible
long before it finishes. Slightly messy mid-draw is the price, and it was the right price here.

Concurrency ≈ `n × mean duration ÷ total`. So the lever is **per-stroke duration**, not the
timeline. Lengthening each stroke and packing the start times *shortens the perceived wait*,
which is the opposite of the intuition.

Corollary worth keeping: **the physically accurate option lost.** Constant pen speed is how a
real hand works and it produced the worse animation. Fidelity to the mechanism is not the goal;
the goal is what the mechanism looks like to somebody who is not waiting for it.

One trap when tying duration to stroke length at high concurrency: real lengths in these traces
span 447x (2px to 894px). Proportional duration hands the longest stroke ~10s. The hero's own
durations span only ~3x — so map length through a sqrt and a clamp, not proportionally.

### An animated SVG <mask> re-rasterises the whole element every frame

The single most expensive thing in the draw-on work, and it was invisible until traced. Chrome
trace, RasterTask summed over a 2.4s draw at 397x217 CSS px on a DPR-3 viewport:

| | raster |
|---|---|
| animated `<mask>` | 770 ms |
| `<clipPath>` instead | 320 ms |
| no mask at all | 170 ms |

A mask is an alpha-compositing pass, and its contents change on every frame, so the entire
masked element is re-rasterised at 60Hz. Nothing about the *contents* mattered: a 195-subpath
compound fill, a flat rect and a raster `<image>` under the mask were all within noise. Neither
did concurrency (713 ms at 5 strokes in flight, 888 ms at 40 — a 16x range for 25%),
`shape-rendering: optimizeSpeed`, `contain: paint`, or `isolation`. `mask-type: alpha` and layer
promotion bought under 15% each. **Halving the element's CSS size halved the cost** — that is the
tell: raster-area bound, not geometry bound.

The escape, when the artwork is one flat colour: `artwork ∩ strokes` is the same set of pixels as
`strokes ∩ artwork`. So paint the strokes in the artwork's own colour and clip them to its
outline. A clipPath is a static geometric intersection — rasterised once. Does not work for
artwork that is a photo or a gradient; strokes cannot take the colour of a photograph.

Caveat found by pixel-diffing: **Chrome antialiases a clip edge less generously than a mask
edge.** On artwork with sub-pixel-thin detail at display size, the finest lines come out lighter.
One trace was pixel-identical, the other lost 1.8% of pixels along contours.

### Measure the thing, not a proxy for the thing

Three rounds were wasted counting dropped frames from `requestAnimationFrame` deltas. The
numbers were bimodal run to run (1, 4, 8, 31 for one variant) and led to a confident wrong
conclusion — that concurrency drove the cost — which produced a whole commit's worth of tuning
that measured, afterwards, as a 25% effect on a 16x input change.

- rAF deltas measure **scheduler luck**, not work. A double-rAF "wait for paint" is worse: it
  pins every result at exactly one vsync and reports 33ms for everything including an empty page.
- CDP `Tracing` with `disabled-by-default-devtools.timeline`, summing `RasterTask`, is
  deterministic, repeatable, and names the actual phase.
- A 100x improvement is almost always a bug in the harness. The first clipPath measurement came
  back at 7ms against 811ms; the throwaway converter had hidden the strokes. The real number was
  320ms. **Verify a suspiciously good result renders what you think it renders.**

### Adjacency is not always the story

Nearest-neighbour draw order works because the strokes of one object are each other's nearest
neighbours — but it only knows proximity, not meaning. On the teacups the steam curls physically
touch the cup rims, so the pen drew them on the way past and the tea steamed before the cup
existed.

The fix is an explicit escape hatch, not a smarter metric: name a region, pull those strokes out
before ordering, append them after. Two regions, twelve strokes.

Resisting the heuristic was the right call and it is worth recording why. Endpoint-proximity
clustering put all 80 strokes in one component — correctly, they do touch. A "tall and thin
bounding box" test would separate them, but only with a threshold tuned against this one image,
which is exactly what killed bbox clustering earlier in the project. **With eight hand-drawn
assets, naming the exception is cheaper and more honest than a rule that has to be re-tuned per
asset.** Automation earns its keep at a scale this project does not have.

### Prove a refactor is behaviour-preserving with the artefacts, not by reading it

Extracting the shared `order_by` touched the code path for three files. Regenerating the two
that were not meant to change, with their existing arguments, and diffing byte-for-byte took one
command and settled it. Same trick as the geometry hash that guards every re-pace: the output is
the assertion.

### Greedy nearest-neighbour splits lines; greedy *edge* does not

NN ordering fixed the scanline but introduced a subtler artefact: one visual line drawn in two
instalments, half early and half much later. Cause is that NN is myopic — at a junction where
several strokes meet it takes one and walks away, and the rest wait until the walk happens back
past them. Classic greedy-TSP return trips.

Greedy *edge* construction fixes it structurally. Sort every possible join between two stroke
endpoints by length; commit the shortest first, subject to each endpoint being used once and no
premature cycle (Kruskal's rule applied to a path). **Two strokes that continue each other have a
join of nearly zero length, so it sits at the very front of that list and is committed before
anything else can claim either end.** Continuations end up consecutive by construction rather
than by luck. Cost is one sort of ~4n²/2 candidates — 268k for 367 strokes, trivial offline.

### Build the metric before the fix

Three separate ordering complaints were diagnosed by eye and two of the three fixes missed. The
turn came from writing one number: pairs of strokes whose endpoints are within 15px — lines that
continue each other — separated by more than 0.3s in the timeline. That immediately showed
greedy NN splitting 70 of 238 continuations on one image.

Two lessons about the metric itself:

- **The first version was wrong.** Counting *all* touching pairs said 76 of 80 were "bad" — in
  dense line art every stroke touches several others and they cannot all be consecutive. The
  useful version counts strokes with **no** neighbour drawn nearby in time (orphans), not all
  pairs that are far apart.
- **The metric is a guide, not the goal.** One image's orphan count went 2 → 4 while its
  filmstrip clearly improved. Ship on the filmstrip; use the number to find what to look at.

### Dumping the order as text found what the filmstrip could not

The steam bug was invisible in an 8-frame strip — both curls were partly drawn in every frame,
which looked plausible. Printing the deferred strokes as `t=1.26s RIGHT / t=1.27s LEFT /
t=1.31s RIGHT` made the interleave obvious in one glance. **When an animation looks wrong but
sampled frames look fine, print the schedule.**

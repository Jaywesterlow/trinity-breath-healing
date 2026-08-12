# MorphModal

A near-fullscreen detail modal that grows out of a clicked element (a card,
thumbnail, list row) and shrinks back into it on close — box-morph, content
fade, backdrop fade, staggered nav-button reveal, and touch swipe-to-navigate,
all via the Web Animations API. No external dependencies beyond Svelte 5
(runes) — every CSS custom property the original had (Trinity Breath &
Healing's Behandelingen service modal) was resolved to a literal value on
extraction, so this is safe to drop into any Svelte 5 + Tailwind (or plain
CSS) project without silently breaking on a `var()` that doesn't exist there.

## Files

- `MorphModal.svelte` — markup + CSS only. Deliberately dumb: it owns no
  behaviour, just renders whatever `activeIndex`/`items` say and forwards
  every interaction (click, pointerdown, cancel) to the props it's given.
- `morph-modal-engine.svelte.ts` — `MorphModalEngine`, a plain class (Svelte
  5 `$state` fields) owning every animation and interaction: open, close,
  Prev/Next, swipe, Esc, backdrop click. Construct one per usage site via
  `createMorphModalEngine(options)`.

## Usage

```svelte
<script lang="ts">
	import { onDestroy } from 'svelte';
	import MorphModal, { type MorphModalItem } from '$lib/components/library/morph-modal/MorphModal.svelte';
	import { createMorphModalEngine } from '$lib/components/library/morph-modal/morph-modal-engine.svelte';

	const items: MorphModalItem[] = [
		{ id: 'a', title: 'Item A', description: '…', image: '/a.svg', tags: ['x', 'y'], tagsLabel: 'Includes' },
		{ id: 'b', title: 'Item B', description: '…', image: '/b.svg' }
	];

	let cardEls: (HTMLElement | null)[] = $state([]);

	const modal = createMorphModalEngine({
		itemCount: items.length,
		getOriginEl: (i) => cardEls[i] ?? null
	});

	onDestroy(() => modal.destroy());
</script>

{#each items as item, i (item.id)}
	<button bind:this={cardEls[i]} onclick={() => cardEls[i] && modal.open(cardEls[i], i)}>
		{item.title}
	</button>
{/each}

<MorphModal
	{items}
	activeIndex={modal.index}
	bind:dialogRef={modal.dialogEl}
	bind:contentRef={modal.contentEl}
	bind:backdropRef={modal.backdropEl}
	onPrev={() => modal.prev()}
	onNext={() => modal.next()}
	onClose={() => modal.close()}
	onCancel={(e) => modal.onCancel(e)}
	onBackdropClick={(e) => modal.onBackdropClick(e)}
	onContentPointerDown={(e) => modal.onContentPointerDown(e)}
	onContentClickCapture={(e) => modal.onContentClickCapture(e)}
/>
```

## `MorphModalItem`

| Field | Required | Notes |
|---|---|---|
| `id` | yes | Unique key; also anchors the title's `aria-labelledby`. |
| `title` | yes | |
| `description` | yes | |
| `image` | yes (nullable) | Pass `null` + `number` for a numbered-item fallback (no artwork yet). |
| `number` | no | Only rendered when `image` is `null`. |
| `tags` | no | Short bullet list (symptoms, features, specs). Omit to skip the block. |
| `tagsLabel` | no | Heading above `tags`, e.g. "Includes". |
| `href` / `ctaLabel` | no | Omit both to skip the CTA link entirely. |

## `MorphModalEngineOptions`

| Field | Required | Notes |
|---|---|---|
| `itemCount` | yes | Prev/Next/swipe wrap at this bound. |
| `getOriginEl` | yes | `(index) => element \| null` — what the modal morphs from/to. |
| `originFaceSelector` | no | CSS selector(s), queried inside the origin element, for a "face" that fades out on open and back in on close (e.g. an icon + label inside a card). Omit to skip this beat entirely. |
| `onIndexChange` | no | `(index) => void` — fires on open/Prev/Next/swipe; wire it to keep an underlying carousel or list selection in sync. |

## Known constraints / things to check when reusing

- **CSS class names are load-bearing.** `MorphModalEngine`'s internal
  `#navEls()` queries `.morph-modal__close, .morph-modal__nav` off the
  dialog to drive the staggered fade — if you rename these classes in
  `MorphModal.svelte`, update that selector too.
- **Colors/fonts/spacing are literal values**, not tokens — search for
  `/* was var(--` comments in `MorphModal.svelte`'s `<style>` block to find
  and swap every one for your own design system.
- **English-only strings live in props with English defaults**
  (`closeLabel`/`prevLabel`/`nextLabel`, "Learn more" for `ctaLabel`) —
  override per usage; there's no i18n system built in.
- **Reduced motion** is handled (`prefers-reduced-motion: reduce` skips
  every WAAPI call and jumps straight to the end state) — don't remove the
  `reduced` branches in `open()`/`close()`/`#step()` without re-adding an
  equivalent.
- **Requires a real DOM origin element** — `getOriginEl` returning `null`
  falls back to a plain fade-in-place instead of a morph, which still works
  but loses the "grows out of the thing you clicked" effect.
- Verified via a standalone Playwright harness on extraction (open, Next/
  Prev with wrap, backdrop fade in/out, close, reopen from a different
  origin — checking specifically for the composite-animation-stack leak the
  original project hit — backdrop click, and Esc). No automated test suite
  ships in this folder; re-verify similarly if you make non-trivial changes.

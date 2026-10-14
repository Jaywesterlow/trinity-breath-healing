<script lang="ts">
	/**
	 * The three steps along a line that draws itself as you scroll (library
	 * 23, without the pin: the line runs down the column and the page keeps
	 * moving). Each step brightens as the line reaches it. The copy is the live
	 * Werkwijze section's, each body under the title it describes.
	 */
	import { STEPS } from './content';
</script>

<section class="way" id="werkwijze" aria-labelledby="way-heading">
	<div class="frame">
		<header class="way__header" data-lines>
			<span class="eyebrow">Werkwijze</span>
			<h2 id="way-heading">
				<span class="line"><span>Rustig, persoonlijk en op jouw tempo.</span></span>
			</h2>
		</header>

		<div class="way__body" data-draw>
			<svg class="way__line" viewBox="0 0 24 1000" preserveAspectRatio="none" aria-hidden="true">
				<path d="M12,0 C12,180 4,260 12,340 C20,420 20,560 12,660 C4,760 12,880 12,1000" />
			</svg>
			<ol class="way__steps">
				{#each STEPS as step, i (step.title)}
					<li class="way__step" data-milestone>
						<span class="way__num" aria-hidden="true">{i + 1}</span>
						<h3>{step.title}</h3>
						<p>{step.body}</p>
					</li>
				{/each}
			</ol>
		</div>
	</div>
</section>

<style>
	.way {
		padding-block: var(--d-s7);
	}
	.way__header {
		text-align: center;
		max-width: 40ch;
		margin-inline: auto;
	}
	.way__body {
		position: relative;
		max-width: 40rem;
		margin: var(--d-s6) auto 0;
		padding-left: 3.5rem;
	}
	.way__line {
		position: absolute;
		left: 0.25rem;
		top: 0;
		width: 1.5rem;
		height: 100%;
		overflow: visible;
	}
	.way__line path {
		fill: none;
		stroke: var(--d-water);
		stroke-width: 2;
		stroke-linecap: round;
		vector-effect: non-scaling-stroke;
	}
	.way__steps {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--d-s6);
	}
	.way__step {
		position: relative;
	}
	.way__num {
		position: absolute;
		left: -3.5rem;
		top: 0.1em;
		width: 2rem;
		height: 2rem;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: var(--d-sand);
		border: 2px solid var(--d-water);
		color: var(--d-deep);
		font-size: var(--d-fs-eyebrow);
		font-weight: 700;
	}
	.way__step p {
		margin-top: var(--d-s1);
		color: var(--d-ink-soft);
		max-width: 46ch;
	}
</style>

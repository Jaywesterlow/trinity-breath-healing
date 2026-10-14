<script lang="ts">
	/**
	 * The three steps along a line down the middle of the screen. The line
	 * draws itself as you scroll (library 23, no pin) and each step appears
	 * the moment the line reaches it: both run on one scrubbed timeline, so
	 * scrolling back undraws them in the same order. Steps alternate sides
	 * of the line on desktop and sit to its right on a phone. The copy is the
	 * live Werkwijze section's, each body under the title it describes.
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
				<path d="M12,0 C12,160 6,240 12,330 C18,420 18,560 12,660 C6,760 12,880 12,1000" />
			</svg>
			<ol class="way__steps">
				{#each STEPS as step, i (step.title)}
					<li class="way__step" data-milestone>
						<span class="way__num" aria-hidden="true">{i + 1}</span>
						<div class="way__card">
							<h3>{step.title}</h3>
							<p>{step.body}</p>
						</div>
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
		max-width: 56rem;
		margin: var(--d-s6) auto 0;
		padding-block: var(--d-s2);
	}
	.way__line {
		position: absolute;
		left: 0.9rem;
		top: 0;
		width: 1.5rem;
		height: 100%;
		overflow: visible;
	}
	.way__line path {
		fill: none;
		stroke: var(--d-gold);
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
		display: grid;
		grid-template-columns: 3.5rem 1fr;
		align-items: start;
	}
	.way__num {
		width: 2.5rem;
		height: 2.5rem;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: var(--d-sand);
		border: 2px solid var(--d-gold);
		color: var(--d-ink);
		font-family: var(--d-font-body);
		font-size: var(--d-fs-body);
		font-weight: 700;
		margin-left: 0.4rem;
	}
	.way__card {
		padding: var(--d-s3) var(--d-s4);
		background: var(--d-paper);
		border: 1px solid var(--d-line);
		border-radius: var(--d-radius);
	}
	.way__card p {
		margin-top: var(--d-s1);
		color: var(--d-ink-soft);
		max-width: 46ch;
	}

	@media (min-width: 900px) {
		.way__line {
			left: 50%;
			margin-left: -0.75rem;
		}
		.way__step {
			grid-template-columns: 1fr 5rem 1fr;
		}
		.way__num {
			grid-column: 2;
			grid-row: 1;
			justify-self: center;
			margin-left: 0;
		}
		.way__card {
			grid-row: 1;
		}
		.way__step:nth-child(odd) .way__card {
			grid-column: 1;
			text-align: right;
		}
		.way__step:nth-child(odd) .way__card p {
			margin-left: auto;
		}
		.way__step:nth-child(even) .way__card {
			grid-column: 3;
		}
	}
</style>

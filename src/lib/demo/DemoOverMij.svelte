<script lang="ts">
	/**
	 * Over mij on the deep water band: her words (the live about intro), two
	 * figures from BRAND.stats, and a photo that wipes open from the right
	 * (library 12). The photo is a generated stand-in in her kind of light and
	 * clothing, no face; her own portrait replaces it before anything goes
	 * live, which is what the sector's E-E-A-T asks for.
	 */
	import hands from './images/hands.jpg?enhanced';
	import { ABOUT_INTRO } from '$lib/content/about';
	import { BRAND } from '$lib/constants/brand';
</script>

<section class="about" id="over-mij" aria-labelledby="about-heading">
	<div class="frame about__grid">
		<div class="about__text" data-lines>
			<span class="eyebrow eyebrow--dark">Over mij</span>
			<h2 id="about-heading">
				<span class="line"><span>Vanuit eigen ervaring</span></span>
				<span class="line"><span>weet ik wat jij doormaakt.</span></span>
			</h2>
			<p class="about__body">{ABOUT_INTRO}</p>
			<dl class="about__stats">
				<div>
					<dt>jaar ervaring</dt>
					<dd>{BRAND.stats.yearsExperience}</dd>
				</div>
				<div>
					<dt>klachten verholpen</dt>
					<dd>{BRAND.stats.clientsHelped}</dd>
				</div>
			</dl>
			<a class="pill pill--light" href="/over-mij">Lees meer over mij</a>
		</div>

		<div class="about__media">
			<div class="about__photo" data-reveal-img data-dir="left">
				<enhanced:img
					src={hands}
					alt="Iemand zit rustig op een houten stoel in zandkleurig linnen, de handen open in de schoot, zacht licht van een raam links"
					sizes="(min-width: 1024px) 40vw, 100vw"
					loading="lazy"
				/>
			</div>
		</div>
	</div>
</section>

<style>
	.about {
		background: var(--d-deep);
		color: var(--d-on-dark);
		padding-block: var(--d-s7);
	}
	.about__grid {
		display: grid;
		gap: var(--d-s5);
		align-items: center;
	}
	.about__body {
		margin-top: var(--d-s3);
		font-size: var(--d-fs-lead);
		max-width: 46ch;
	}
	.about__stats {
		display: flex;
		gap: var(--d-s5);
		margin: var(--d-s4) 0;
		padding-top: var(--d-s3);
		border-top: 1px solid var(--d-line-dark);
	}
	.about__stats div {
		display: flex;
		flex-direction: column-reverse;
	}
	.about__stats dd {
		margin: 0;
		font-family: var(--d-font-display);
		font-size: var(--d-fs-stat);
		font-weight: 700;
		line-height: 1;
		font-variant-numeric: tabular-nums;
	}
	.about__stats dt {
		margin-top: var(--d-s1);
		color: var(--d-on-dark-soft);
		font-size: var(--d-fs-eyebrow);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		font-weight: 700;
	}
	.about__photo {
		border-radius: var(--d-radius);
		overflow: hidden;
		aspect-ratio: 4 / 5;
		background: var(--d-ink);
	}
	.about__photo :global(img) {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		transform-origin: center;
	}
	@media (min-width: 1024px) {
		.about__grid {
			grid-template-columns: 7fr 5fr;
			gap: var(--d-s6);
		}
	}
</style>

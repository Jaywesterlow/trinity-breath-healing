// `?w=…&enhanced` imports: the same Picture as `?enhanced`, with the widths chosen by
// hand. enhanced-img only declares the bare `*?enhanced` form, which a query with
// directives in front of `enhanced` does not match.
declare module '*&enhanced' {
	import type { Picture } from 'vite-imagetools';

	const value: Picture;
	export default value;
}

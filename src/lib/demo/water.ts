/**
 * The water: a WebGL quad that refracts one still photograph through two
 * layers of drifting noise, so the surface actually flows. The page's scroll
 * is added to the flow's phase, so scrolling pushes the water along with it
 * and stopping lets it settle back into its own slow drift (the signature
 * moment of the demo's motion concept).
 *
 * Costs: one draw call per frame on a 2D texture, no geometry. Started only
 * after the window has loaded and the main thread is idle, so it never sits
 * on the LCP path; the <img> under it is the LCP element and stays in place
 * if WebGL is missing. Paused while the hero is off screen or the tab is
 * hidden. Not started at all under prefers-reduced-motion: the still photo is
 * the complete page then.
 */

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
	vUv = aPos * 0.5 + 0.5;
	gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
precision mediump float;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform vec2 uTexRes;
uniform float uTime;
uniform float uScroll;
varying vec2 vUv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	f = f * f * (3.0 - 2.0 * f);
	return mix(
		mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
		mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
		f.y
	);
}
float fbm(vec2 p) {
	float v = 0.0;
	float a = 0.5;
	for (int k = 0; k < 4; k++) {
		v += a * noise(p);
		p = p * 2.03 + vec2(17.3, 9.1);
		a *= 0.5;
	}
	return v;
}

void main() {
	/* cover-fit the texture into the canvas, like object-fit: cover */
	vec2 uv = vUv;
	uv.y = 1.0 - uv.y;
	float ra = uRes.x / uRes.y;
	float ta = uTexRes.x / uTexRes.y;
	vec2 s = vec2(1.0);
	if (ra > ta) { s.y = ta / ra; } else { s.x = ra / ta; }
	uv = (uv - 0.5) * s + 0.5;

	/* the flow: a slow drift of its own, plus the scroll */
	float t = uTime * 0.07 + uScroll * 0.55;
	vec2 flow = vec2(t * 0.35, -t * 0.12);
	float n1 = fbm(uv * 3.0 + flow);
	float n2 = fbm(uv * 5.0 - flow * 0.7 + vec2(3.1, 1.7));
	vec2 d = vec2(n1 - 0.5, n2 - 0.5) * 0.011;

	vec3 c = texture2D(uTex, uv + d).rgb;
	/* a faint moving glint where the ripples catch the light */
	float sp = smoothstep(0.64, 0.82, fbm(uv * 8.0 + flow * 1.6));
	c += sp * 0.06;
	gl_FragColor = vec4(c, 1.0);
}`;

export interface WaterHandle {
	stop(): void;
}

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
	const sh = gl.createShader(type);
	if (!sh) return null;
	gl.shaderSource(sh, src);
	gl.compileShader(sh);
	if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
		gl.deleteShader(sh);
		return null;
	}
	return sh;
}

/**
 * Starts the water on `canvas` with the photo at `src`. Resolves to a handle,
 * or null when WebGL is unavailable, in which case the <img> underneath is the
 * hero and nothing else happens. `onFirstFrame` fires once the first frame is
 * on the canvas, so the caller can fade it in over the still.
 */
export function startWater(
	canvas: HTMLCanvasElement,
	src: string,
	onFirstFrame: () => void
): WaterHandle | null {
	const gl = canvas.getContext('webgl', {
		alpha: false,
		antialias: false,
		powerPreference: 'low-power'
	});
	if (!gl) return null;

	const vs = compile(gl, gl.VERTEX_SHADER, VERT);
	const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
	if (!vs || !fs) return null;
	const prog = gl.createProgram();
	if (!prog) return null;
	gl.attachShader(prog, vs);
	gl.attachShader(prog, fs);
	gl.linkProgram(prog);
	if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
	gl.useProgram(prog);

	const buf = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buf);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
	const aPos = gl.getAttribLocation(prog, 'aPos');
	gl.enableVertexAttribArray(aPos);
	gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

	const uRes = gl.getUniformLocation(prog, 'uRes');
	const uTexRes = gl.getUniformLocation(prog, 'uTexRes');
	const uTime = gl.getUniformLocation(prog, 'uTime');
	const uScroll = gl.getUniformLocation(prog, 'uScroll');

	const tex = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, tex);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

	let raf = 0;
	let running = false;
	let loaded = false;
	let first = true;
	let texW = 1;
	let texH = 1;
	const t0 = performance.now();

	function resize(): void {
		const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
		const r = canvas.getBoundingClientRect();
		const w = Math.max(1, Math.round(r.width * dpr));
		const h = Math.max(1, Math.round(r.height * dpr));
		if (canvas.width !== w || canvas.height !== h) {
			canvas.width = w;
			canvas.height = h;
			gl!.viewport(0, 0, w, h);
		}
	}

	function frame(now: number): void {
		if (!running) return;
		raf = requestAnimationFrame(frame);
		if (!loaded) return;
		resize();
		gl!.uniform2f(uRes, canvas.width, canvas.height);
		gl!.uniform2f(uTexRes, texW, texH);
		gl!.uniform1f(uTime, (now - t0) / 1000);
		gl!.uniform1f(uScroll, window.scrollY / Math.max(1, window.innerHeight));
		gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
		if (first) {
			first = false;
			onFirstFrame();
		}
	}

	function start(): void {
		if (running) return;
		running = true;
		raf = requestAnimationFrame(frame);
	}
	function pause(): void {
		running = false;
		cancelAnimationFrame(raf);
	}

	const img = new Image();
	img.decoding = 'async';
	img.onload = () => {
		texW = img.naturalWidth;
		texH = img.naturalHeight;
		gl.bindTexture(gl.TEXTURE_2D, tex);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
		loaded = true;
	};
	img.src = src;

	// Only draw while the hero is on screen and the tab is visible.
	const io =
		typeof IntersectionObserver === 'function'
			? new IntersectionObserver(
					(entries) => {
						for (const e of entries) {
							if (e.isIntersecting && !document.hidden) start();
							else pause();
						}
					},
					{ threshold: 0 }
				)
			: null;
	io?.observe(canvas);
	if (!io) start();
	function onVisibility(): void {
		if (document.hidden) pause();
		else start();
	}
	document.addEventListener('visibilitychange', onVisibility);

	return {
		stop() {
			pause();
			io?.disconnect();
			document.removeEventListener('visibilitychange', onVisibility);
			const ext = gl.getExtension('WEBGL_lose_context');
			ext?.loseContext();
		}
	};
}

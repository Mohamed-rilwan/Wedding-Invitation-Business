/* =====================================================================
   Flowing WebGL gradient backdrop
   Inspired by Liam Egan (shubniggurath) - domain-warped fbm noise.
   Pure WebGL1, no dependencies. Blue ⇄ green themes, pointer-reactive.
   ===================================================================== */
(function () {
  const canvas = document.getElementById('gl');
  const gl = canvas.getContext('webgl', { antialias: true, alpha: false, powerPreference: 'high-performance' });

  // Painted CSS gradient whenever the shader can't run - never a flat, dull canvas.
  function paintFallback() {
    const theme = document.documentElement.getAttribute('data-theme');
    const gradients = {
      green:    'radial-gradient(120% 100% at 30% 20%,#1c7a54,#0b3d2e 55%,#04180f)',
      rosegold: 'radial-gradient(120% 100% at 30% 20%,#a85a68,#552832 55%,#2a1418)',
      midnight: 'radial-gradient(120% 100% at 30% 20%,#5c3a86,#2f1c47 55%,#150c24)',
    };
    canvas.style.background = gradients[theme]
      || 'radial-gradient(120% 100% at 30% 20%,#0f7fb8,#013a5d 55%,#001a2e)';
  }
  window.addEventListener('themechange', () => {
    if (canvas.style.background) paintFallback();
  });

  if (!gl) { paintFallback(); return; }

  const vert = `
    attribute vec2 p;
    void main(){ gl_Position = vec4(p, 0.0, 1.0); }
  `;

  // some mobile GPUs have no highp in fragment shaders - asking for it kills the compile
  const hp = gl.getShaderPrecisionFormat &&
             gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
  const PRECISION = (hp && hp.precision > 0) ? 'highp' : 'mediump';

  const frag = `
    precision ${PRECISION} float;
    uniform vec2  u_res;
    uniform float u_time;
    uniform vec2  u_mouse;
    uniform float u_green;   // 0 = blue theme, 1 = green theme
    uniform float u_theme;   // 0 = blue/green mix, 1 = rosegold, 2 = midnight

    // --- 2D simplex noise (Ashima / Stefan Gustavson) ---
    vec3 mod289(vec3 x){ return x - floor(x*(1.0/289.0))*289.0; }
    vec2 mod289(vec2 x){ return x - floor(x*(1.0/289.0))*289.0; }
    vec3 permute(vec3 x){ return mod289(((x*34.0)+1.0)*x); }
    float snoise(vec2 v){
      const vec4 C = vec4(0.211324865405187,0.366025403784439,
                         -0.577350269189626,0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy));
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 pp = permute( permute( i.y + vec3(0.0, i1.y, 1.0))
                                + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                              dot(x12.zw,x12.zw)), 0.0);
      m = m*m; m = m*m;
      vec3 x = 2.0 * fract(pp * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    // fractal brownian motion
    float fbm(vec2 p){
      float s = 0.0, a = 0.5;
      for(int i=0;i<6;i++){
        s += a * snoise(p);
        p *= 2.02;
        a *= 0.5;
      }
      return s;
    }

    void main(){
      vec2 uv = gl_FragCoord.xy / u_res.xy;
      vec2 p  = (gl_FragCoord.xy - 0.5*u_res.xy) / min(u_res.x,u_res.y);

      float t = u_time * 0.06;
      vec2 m  = (u_mouse - 0.5) * 0.6;

      // domain warping - the silky, liquid movement
      vec2 q = vec2(fbm(p*1.6 + t + m), fbm(p*1.6 - t*0.8 - m));
      vec2 r = vec2(fbm(p*1.6 + 1.7*q + vec2(1.7,9.2) + 0.15*t),
                    fbm(p*1.6 + 1.7*q + vec2(8.3,2.8) - 0.12*t));
      float f = fbm(p*1.6 + 2.2*r);

      // deep navy -> mid blue -> light Oyster blue palette
      vec3 cDeep  = vec3(0.004,0.086,0.157);   // navy-900
      vec3 cMid   = vec3(0.004,0.227,0.365);   // Oyster deep blue
      vec3 cTeal  = vec3(0.043,0.400,0.596);   // mid blue
      vec3 cLite  = vec3(0.059,0.596,0.831);   // Oyster light blue
      vec3 cLiteS = vec3(0.482,0.792,0.933);   // soft sky highlight

      // green theme palette (emerald + gold)
      vec3 gDeep  = vec3(0.016,0.094,0.059);
      vec3 gMid   = vec3(0.043,0.204,0.145);
      vec3 gTeal  = vec3(0.086,0.286,0.235);
      vec3 gLite  = vec3(0.847,0.700,0.353);   // gold veins
      vec3 gLiteS = vec3(0.906,0.804,0.576);

      // blend palettes by theme
      cDeep  = mix(cDeep,  gDeep,  u_green);
      cMid   = mix(cMid,   gMid,   u_green);
      cTeal  = mix(cTeal,  gTeal,  u_green);
      cLite  = mix(cLite,  gLite,  u_green);
      cLiteS = mix(cLiteS, gLiteS, u_green);

      // rose gold palette (blush + rose gold)
      vec3 rDeep  = vec3(0.165,0.078,0.094);
      vec3 rMid   = vec3(0.227,0.109,0.133);
      vec3 rTeal  = vec3(0.333,0.157,0.196);
      vec3 rLite  = vec3(0.878,0.659,0.459);
      vec3 rLiteS = vec3(0.941,0.788,0.639);

      // midnight plum palette (deep purple + gold)
      vec3 mDeep  = vec3(0.082,0.047,0.141);
      vec3 mMid   = vec3(0.125,0.075,0.184);
      vec3 mTeal  = vec3(0.184,0.109,0.278);
      vec3 mLite  = vec3(0.847,0.698,0.353);
      vec3 mLiteS = vec3(0.906,0.804,0.576);

      // u_theme picks the whole palette outright - these styles never blend live
      float isRose = step(0.5, u_theme) * step(u_theme, 1.5);
      float isMid  = step(1.5, u_theme);
      cDeep  = mix(mix(cDeep,  rDeep,  isRose), mDeep,  isMid);
      cMid   = mix(mix(cMid,   rMid,   isRose), mMid,   isMid);
      cTeal  = mix(mix(cTeal,  rTeal,  isRose), mTeal,  isMid);
      cLite  = mix(mix(cLite,  rLite,  isRose), mLite,  isMid);
      cLiteS = mix(mix(cLiteS, rLiteS, isRose), mLiteS, isMid);

      vec3 col = mix(cDeep, cMid, clamp(f*0.5+0.5,0.0,1.0));
      col = mix(col, cTeal, clamp(length(q)*0.9,0.0,1.0));
      // highlight veins where warp field peaks
      float lite = smoothstep(0.55, 1.05, f + 0.35*length(r));
      col = mix(col, cLite, lite*0.6);
      col += cLiteS * pow(lite,3.0) * 0.35;

      // soft central glow behind content
      float glow = smoothstep(1.0, 0.05, length(p));
      vec3 glowCol = mix(vec3(0.05,0.10,0.14), vec3(0.05,0.10,0.08), u_green);
      glowCol = mix(mix(glowCol, vec3(0.14,0.06,0.07), isRose), vec3(0.09,0.05,0.13), isMid);
      col += glowCol * glow;

      // gentle vignette
      col *= 1.0 - 0.35*length(p*0.75);

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn(gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  const vs = compile(gl.VERTEX_SHADER, vert);
  const fs = compile(gl.FRAGMENT_SHADER, frag);
  if (!vs || !fs) { paintFallback(); return; }

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn(gl.getProgramInfoLog(prog));
    paintFallback();
    return;
  }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uRes   = gl.getUniformLocation(prog, 'u_res');
  const uTime  = gl.getUniformLocation(prog, 'u_time');
  const uMouse = gl.getUniformLocation(prog, 'u_mouse');
  const uGreen = gl.getUniformLocation(prog, 'u_green');
  const uTheme = gl.getUniformLocation(prog, 'u_theme');

  // 0 = blue/green mix, 1 = rosegold, 2 = midnight - matches the CSS data-theme values
  function themeIndex() {
    const t = document.documentElement.getAttribute('data-theme');
    if (t === 'rosegold') return 1;
    if (t === 'midnight') return 2;
    return 0;
  }
  let green = document.documentElement.getAttribute('data-theme') === 'green' ? 1 : 0;
  let theme = themeIndex();

  const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
  function pointer(x, y) {
    mouse.tx = x / window.innerWidth;
    mouse.ty = 1.0 - y / window.innerHeight;
  }
  window.addEventListener('pointermove', (e) => pointer(e.clientX, e.clientY), { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (e.touches[0]) pointer(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  const DPR = Math.min(window.devicePixelRatio || 1, 1.75);
  function resize() {
    const w = Math.floor(window.innerWidth * DPR);
    const h = Math.floor(window.innerHeight * DPR);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  }
  window.addEventListener('resize', resize);
  resize();

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const start = performance.now();
  let running = true;
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) requestAnimationFrame(loop);
  });

  // a lost context (common when a phone backgrounds the tab) would freeze on a dead frame
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    running = false;
    paintFallback();
  });

  function loop(now) {
    if (!running) return;
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;
    const target = document.documentElement.getAttribute('data-theme') === 'green' ? 1 : 0;
    green += (target - green) * 0.06;
    theme = themeIndex();
    const t = reduced ? 0 : (now - start) * 0.001;
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, t);
    gl.uniform2f(uMouse, mouse.x, mouse.y);
    gl.uniform1f(uGreen, green);
    gl.uniform1f(uTheme, theme);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!reduced) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  if (reduced) requestAnimationFrame(loop); // draw one static frame

  // repaint once on theme change for reduced-motion users
  window.addEventListener('themechange', () => {
    if (reduced) {
      green = document.documentElement.getAttribute('data-theme') === 'green' ? 1 : 0;
      theme = themeIndex();
      requestAnimationFrame(loop);
    }
  });
})();

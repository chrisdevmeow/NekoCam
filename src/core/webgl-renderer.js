// ============================================================
// NEKOCAM – src/core/webgl-renderer.js
// WebGL2 renderer – full pipeline with shader loading
// ============================================================

let gl = null;
let canvas = null;
let video = null;
let program = null;
let renderCallback = null;
let animationId = null;
let isRunning = false;

// ---- Shader cache ----
let currentVertexShader = null;
let currentFragmentShader = null;

// ---- Init ----
export function initRenderer(canvasElement, videoElement) {
    canvas = canvasElement;
    video = videoElement || document.getElementById('video');

    gl = canvas.getContext('webgl2', {
        alpha: false,
        antialias: false,
        premultipliedAlpha: false,
    });

    if (!gl) {
        throw new Error('WebGL2 not supported');
    }

    resizeCanvas();
    setupGeometry();
    setupTexture();

    // Load default shaders
    loadDefaultShaders();

    console.log('[WebGL] Renderer ready');
}

// ---- Resize ----
export function resizeCanvas() {
    if (!canvas) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = rect.width * dpr;
    const h = rect.height * dpr;
    if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        if (gl) gl.viewport(0, 0, w, h);
    }
}

// ---- Setup geometry ----
function setupGeometry() {
    const vertices = new Float32Array([
        -1, -1,  0, 0,
         1, -1,  1, 0,
        -1,  1,  0, 1,
         1,  1,  1, 1,
    ]);
    const indices = new Uint16Array([0,1,2, 2,1,3]);

    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.vbo = vbo;
    gl.ibo = ibo;
    gl.vertexCount = indices.length;
}

// ---- Setup texture ----
function setupTexture() {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texture = tex;
}

// ---- Load default shaders ----
function loadDefaultShaders() {
    // Vertex shader (fixed)
    const vsSource = `#version 300 es
        in vec2 a_position;
        in vec2 a_texCoord;
        out vec2 v_texCoord;
        void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
            v_texCoord = a_texCoord;
        }
    `;

    // Fragment shader – passthrough (no effect)
    const fsSource = `#version 300 es
        precision highp float;
        uniform sampler2D u_texture;
        in vec2 v_texCoord;
        out vec4 fragColor;
        void main() {
            fragColor = texture(u_texture, v_texCoord);
        }
    `;

    compileShaders(vsSource, fsSource);
}

// ---- Compile shaders ----
function compileShaders(vsSource, fsSource) {
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, vsSource);
    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
        console.error('[WebGL] VS error:', gl.getShaderInfoLog(vs));
        return;
    }

    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fsSource);
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
        console.error('[WebGL] FS error:', gl.getShaderInfoLog(fs));
        return;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.error('[WebGL] Program link error:', gl.getProgramInfoLog(prog));
        return;
    }

    if (program) gl.deleteProgram(program);
    program = prog;
    gl.useProgram(program);

    // Set attributes
    gl.a_position = gl.getAttribLocation(program, 'a_position');
    gl.a_texCoord = gl.getAttribLocation(program, 'a_texCoord');
    gl.u_texture = gl.getUniformLocation(program, 'u_texture');

    const stride = 4 * 4;
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.vbo);
    gl.enableVertexAttribArray(gl.a_position);
    gl.vertexAttribPointer(gl.a_position, 2, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(gl.a_texCoord);
    gl.vertexAttribPointer(gl.a_texCoord, 2, gl.FLOAT, false, stride, 2 * 4);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.ibo);

    console.log('[WebGL] Shaders compiled');
}

// ---- Load effect from shaders/ folder ----
export function loadEffect(effectId) {
    if (!gl) return;

    const shaderPath = `../shaders/${effectId}.glsl`;
    fetch(shaderPath)
        .then(res => {
            if (!res.ok) throw new Error(`Shader not found: ${effectId}`);
            return res.text();
        })
        .then(source => {
            // Wrap with version and main
            const fullSource = `#version 300 es
                precision highp float;
                uniform sampler2D u_texture;
                uniform float u_intensity;
                in vec2 v_texCoord;
                out vec4 fragColor;

                ${source}

                void main() {
                    vec4 color = texture(u_texture, v_texCoord);
                    fragColor = applyEffect(color, u_intensity);
                }
            `;
            compileShaders(vertexShaderSource, fullSource);
        })
        .catch(err => {
            console.error(`[WebGL] Failed to load effect ${effectId}:`, err);
            // Fallback to passthrough
            loadDefaultShaders();
        });
}

// ---- Update video texture ----
function updateTexture() {
    if (!video || !gl || !gl.texture) return;
    gl.bindTexture(gl.TEXTURE_2D, gl.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
}

// ---- Set render callback ----
export function setRenderCallback(callback) {
    renderCallback = callback;
}

// ---- Render loop ----
function renderLoop() {
    if (!isRunning) return;
    resizeCanvas();
    updateTexture();

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, gl.texture);
    gl.uniform1i(gl.u_texture, 0);

    gl.drawElements(gl.TRIANGLES, gl.vertexCount, gl.UNSIGNED_SHORT, 0);

    if (renderCallback) renderCallback(gl);

    animationId = requestAnimationFrame(renderLoop);
}

// ---- Start / Stop ----
export function startRenderer() {
    if (isRunning) return;
    isRunning = true;
    renderLoop();
}

export function stopRenderer() {
    isRunning = false;
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

// ---- Getters ----
export function getGL() { return gl; }
export function getCanvas() { return canvas; }

// ---- Destroy ----
export function destroyRenderer() {
    stopRenderer();
    if (gl) {
        gl.deleteTexture(gl.texture);
        gl.deleteBuffer(gl.vbo);
        gl.deleteBuffer(gl.ibo);
        gl.deleteProgram(program);
    }
    gl = null;
    canvas = null;
}
